// 抽屉点击规则的判定常量与纯函数 —— 抽成独立 ESM 模块，好让 node 测试直接
// 引入（client 侧是 esbuild 打进 bundle 的，测试里没有 DOM 可用）。

/**
 * 抽屉本体（宿主自带抽屉的版本，DSH 0.2.2 起）：AppFrame 内部结构变了——
 * 宽 < 768 时宿主自己把侧边栏列拉成抽屉，并在第一个网格位置插入一个
 * `drawerMask`（点它关闭抽屉的全屏遮罩）。所以「第一个子元素」不再等于侧边栏，
 * 只能按列名找：CSS Module 的哈希前缀每次构建都变，后缀 `_sidebarCol` 稳定。
 * @type {string}
 */
export const DRAWER_COLUMN_SELECTOR = '[data-mobile-nav="frame"] > [class$="_sidebarCol"]'

/**
 * 抽屉本体的旧口径：没有自带抽屉的宿主里，第一个网格子元素就是侧边栏列。
 * @type {string}
 */
export const LEGACY_DRAWER_SELECTOR = '[data-mobile-nav="frame"] > :first-child'

/**
 * 当前页面的抽屉根节点：优先按列名找（新宿主），找不到再退回第一个子元素
 * （老宿主）。两代结构都在用，不能只留一条选择器。
 * @param {Document | Element | null} [root] - 查询根，默认当前 document。
 * @returns {Element | null} 抽屉根节点。
 */
export function findDrawer(root) {
  const scope = root ?? (typeof document === 'undefined' ? null : document)
  if (scope === null || typeof scope.querySelector !== 'function') return null
  return scope.querySelector(DRAWER_COLUMN_SELECTOR) ?? scope.querySelector(LEGACY_DRAWER_SELECTOR)
}

/**
 * 宿主是否自带移动端抽屉（0.2.2 起）。自带时网格改写、抽屉定位、点外部关闭
 * 全部交给宿主，插件再插手就是两套抽屉打架。
 * @param {Element | null} frame - AppFrame 元素。
 * @returns {boolean}
 */
export function hasNativeDrawer(frame) {
  if (frame == null || typeof frame.hasAttribute !== 'function') return false
  return frame.hasAttribute('data-sidebar-drawer')
}

/** 抽屉开关（会话头部那颗按钮）——点它不该被"点抽屉外就关"二次触发。 */
export const TOGGLE_SELECTOR = '[data-mobile-nav="toggle"]'

/**
 * 命中即视为导航的行：点它们要把屏幕让给刚打开的内容，所以顺带关抽屉。
 *
 * 类名现状（2026-08，侧边栏 qDHVXG_* / YDXeBa_* 这一代）：
 * - `YDXeBa_sessionRow`  会话行 —— 命中 [class*="sessionRow"]
 * - `YDXeBa_projectRow`  工作区行 —— **故意不收**：实测它是折叠/展开开关
 *   （aria-expanded 来回翻，会话列表显隐），不是导航。收进来会让每次展开
 *   工作区都把抽屉关掉（issue #72）。
 * 旧一代侧边栏的 `_searchResultWorkspace_` / `_searchResultRow_` 保留，兼容
 * 尚未升级的宿主。
 *
 * @type {string}
 */
export const NAV_TARGETS = [
  'button[data-dsh-taskboard-entry]',
  'button[data-dsh-ssh-entry]',
  // 抽屉底部的 "文件" 入口打开的是 dsh-web-ui 的 explorer 面板，它的 z-index
  // (55) 低于展开的抽屉 (600)，且在抽屉 DOM 之外：抽屉不关就会盖住面板，点
  // 面板里的行又会被"点抽屉外就关"吃掉。所以按导航处理，一起关掉。
  '[data-mobile-nav="files"]',
  '[class*="sessionRow"]',
  '[class*="newSession"]',
  '[class*="searchResultWorkspace"]',
  '[class*="searchResultRow"]',
].join(', ')

/**
 * 行内操作按钮（会话行的 kebab：重命名 / 删除）——点开的是菜单不是内容，
 * 不能按导航处理，否则抽屉一关，刚弹出的菜单跟着没了。
 * @type {string}
 */
export const NAV_EXCLUDE = '[class*="sessionRow"] button'

/**
 * 浮层（portal 到 body 的下拉菜单 / 弹窗）。
 *
 * 抽屉里的控件（工作区区块的"视图选项"、"添加工作区"，会话行的 kebab…）
 * 弹出的菜单在 DOM 上属于 body，不在抽屉里。"点抽屉外就关"因此会把菜单项
 * 的第一下点击吃掉：抽屉先滑走 → 菜单随侧边栏卸载 → 菜单项的 onClick 永远
 * 不执行。手机上表现就是工作区相关菜单"点了没反应"（issue #72）。
 *
 * 落在浮层内的点击一律豁免，交给浮层自己收尾。
 *
 * @type {string}
 */
export const OVERLAY_SELECTOR = [
  '[role="menu"]',
  '[role="listbox"]',
  '[role="dialog"]',
  '[role="tooltip"]',
  '[data-radix-popper-content-wrapper]',
].join(', ')

/**
 * 抽屉内一次点击是否算导航（应关抽屉）。命中 NAV_EXCLUDE 的行内按钮不算。
 * @param {Element | null | undefined} target - 点击目标。
 * @returns {Element | null} 命中的导航行，未命中返回 null。
 */
export function navTargetFor(target) {
  if (target == null || typeof target.closest !== 'function') return null
  if (target.closest(NAV_EXCLUDE) !== null) return null
  return target.closest(NAV_TARGETS)
}

/**
 * 一次点击是否落在浮层内（浮层自己会关闭，不该由抽屉规则接管）。
 * @param {Element | null | undefined} target - 点击目标。
 * @returns {boolean}
 */
export function isOverlayTap(target) {
  if (target == null || typeof target.closest !== 'function') return false
  return target.closest(OVERLAY_SELECTOR) !== null
}
