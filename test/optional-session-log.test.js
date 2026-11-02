import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { Context } from '@deepseek-ai/cordis'

// Exercise the shipped bundle with Cordis service arrival and disposal.
// DOM effects are excluded; slot components render to inspectable element trees.
function loadClient() {
  let plugin
  const stores = []
  const react = { createElement: (type, props, ...children) => ({ type, props, children }) }
  const modules = {
    react,
    '@deepseek-ai/dsh-client-ui-primitives': {},
    '@deepseek-ai/dsh-client-store': {
      createSnapshotStore(initial) {
        let state = initial
        const listeners = new Set()
        const store = {
          getSnapshot: () => state,
          subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
          set(next) { state = next; for (const listener of listeners) listener() },
        }
        stores.push(store)
        return store
      },
    },
  }
  runInNewContext(readFileSync(new URL('../client/client.js', import.meta.url), 'utf8'), {
    window: {
      location: { href: 'http://localhost/?dsh-layout=mobile' },
      matchMedia: () => ({ matches: true }),
      __ModuleLoader__: { load: ({ factory }) => {
        plugin = factory((name) => {
          assert.ok(name in modules, `Unexpected browser dependency: ${name}`)
          return modules[name]
        })
      } },
    },
    document: { body: { setAttribute() {} }, querySelector: () => null },
    URL,
  })
  return { plugin, stores }
}

test('phone access activates without log export and tracks service availability', async (t) => {
  const { plugin, stores } = loadClient()
  assert.ok(!plugin.inject.includes('sessionLogDownload'))
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(!manifest.dsh.client.inject.includes('@deepseek-ai/dsh-session-log-export'))
  const ctx = new Context()
  t.after(() => ctx.fiber.dispose())
  const slots = new Map()
  ctx.provide('slots', {
    inject: (_name, register) => register(),
    register: (options, component) => { slots.set(options.id, { options, component }); return () => slots.delete(options.id) },
  })
  ctx.provide('connection', { rpc: { call() {} } })
  ctx.provide('layout', { toggleSidebar() {} })
  ctx.provide('locale', { bind: () => (key) => key })
  const fiber = ctx.plugin({
    inject: plugin.inject,
    apply(scope) {
      plugin.apply(new Proxy(scope, {
        get(target, key) {
          // Optional-service effects run on their real injected Cordis scope.
          if (key === 'effect') return () => () => {}
          return Reflect.get(target, key)
        },
      }))
    },
  })
  await fiber
  assert.equal(fiber.state, 2, 'the phone plugin must be active without log export')
  assert.ok(slots.has('pocket'), 'phone settings must remain registered')
  const footer = slots.get('mobile-nav-session-log')
  assert.ok(footer)
  const store = footer.options.inject().hooks.sessionLogDownload
  const whenDownloadAvailable = () => new Promise((resolve) => {
    const stop = store.subscribe(() => {
      if (store.getSnapshot().download !== undefined) { stop(); resolve() }
    })
  })
  assert.equal(stores.length, 1)
  let notifications = 0
  const unsubscribe = store.subscribe(() => notifications++)
  t.after(unsubscribe)
  const render = (...sessions) => footer.component({
    useSessions: (select) => select({ current: sessions.length ? sessions[0] : 'session-test' }),
    useSessionLogDownload: (select) => select(store.getSnapshot()),
    toggleSidebar() {},
    t: (key) => key,
  }).children.filter(Boolean)

  assert.equal(render().length, 1)
  assert.equal(render()[0].props['data-mobile-nav'], 'explorer')

  const downloaded = []
  const mountExport = () => ctx.plugin((scope) => {
    scope.provide('sessionLogDownload', { download: (id) => downloaded.push(id) })
  })
  const available = whenDownloadAvailable()
  const provider = mountExport()
  await provider
  await available
  assert.equal(render().length, 2)
  const button = render()[1]
  assert.equal(button.props.disabled, false)
  button.props.onClick()
  assert.deepEqual(downloaded, ['session-test'])
  const emptySessionButton = render(undefined)[1]
  assert.equal(emptySessionButton.props.disabled, true)
  emptySessionButton.props.onClick()
  assert.deepEqual(downloaded, ['session-test'])

  await provider.dispose()
  assert.equal(store.getSnapshot().download, undefined)
  assert.equal(render().length, 1, 'only log download disappears when its provider unloads')
  assert.equal(fiber.state, 2)
  const availableAgain = whenDownloadAvailable()
  const replacement = mountExport()
  await replacement
  await availableAgain
  assert.equal(render().length, 2, 'log download returns when the service returns')
  assert.equal(notifications, 3)
  await replacement.dispose()
})
