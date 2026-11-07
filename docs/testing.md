---
description: "dsh-pocket 的行为验证记录：每次验证的环境绑定、产物哈希、逐项读数与未覆盖项。"
kind: "package-reference"
---

# 行为验证记录

本页回答一个问题：**每个结论各自被什么证据支持、怎么复现。**
**没跑过的结论不写成本页的结论**；失败、未覆盖与受阻项如实保留。
读数必须绑定产物哈希：重建浏览器产物之后旧读数不再是结论。

生成：`node tools/testing/record.mjs dsh-pocket --title "<行为>" [--run <证据 json>] [--instance <test-instance.json>]`

## 1、Optional Session log export（2026-11-02，产物 `4acf1aee`）

### 环境与产物绑定

| 项 | 值 |
|---|---|
| 日期 | 2026-11-02T21:30:16+08:00 |
| 插件 | dsh-pocket@2.12.0（HEAD 20da9bb，工作树 9 项未提交） |
| 宿主 | npm @deepseek-ai/dsh@0.2.2-alpha.2；回归测试使用 Cordis 4.0.1 与浏览器模块替身 |
| DSH_HOME | `C:/02-codespace/DeepSeek/.scratch/harness-tests/pocket-optional-export-0.2.2-alpha.2-nwxv90` |
| 端口 / URL | 51403 / `http://127.0.0.1:51403/` |
| Node | v24.12.0 |
| 浏览器产物 | `client/client.js`，131781 字节，SHA256 `4acf1aeef63fc559bd6af6047214d0dc8add4b6db951cf4c4555907bacb2931c` |
| 证据文件 | `.scratch/test-system/runs/2026-11-02-212736-dsh-pocket.json` |

### 车道结果

| 车道 | 状态 | 退出码 | 耗时 |
|---|---|---|---|
| unit | failed | 1 | 9.6s |

### 逐项读数

- `npm run build:client` 通过，产物随源码更新。
- `node --test --test-timeout=15000 test/optional-session-log.test.js test/mobile-nav.test.js test/icon-compat.test.js test/locales.test.js`：26 项通过。
- `optional-session-log.test.js` 执行浏览器产物，使用真实 Cordis 检查缺少服务时插件仍为 ACTIVE，设置入口仍注册；服务到达后按钮可调用下载，无会话时禁用；卸载服务后下载入口隐藏，文件入口保留；重新提供服务后恢复入口并通知订阅者。
- 完整 unit 车道有 4 项失败，均在未修改的 `test/tunnel-args.test.js`：Windows 无法直接执行无扩展名的 shebang 测试文件，子进程报 `ENOENT`。

### 本节未覆盖

- 隔离实例已安装本地插件并在配置中禁用 `session-log-download`；浏览器访问只返回认证要求，启动器未能取得认证 URL，未验证真实页面的插件启动及按钮交互。
- 未验证手机真机、视口矩阵、主题与实际日志 ZIP 下载；组件行为结论来自上述产物测试。

---
## 2、手机端会话列表不显示也点不动（DSH 0.2.2-alpha.3 宿主自带抽屉）（2026-11-07，产物 `b3165134` / host `06796bc6`）

### 环境与产物绑定

| 项 | 值 |
|---|---|
| 日期 | 2026-11-07T14:13:05+08:00 |
| 插件 | dsh-pocket@2.12.2（HEAD c9cdd68，工作树 5 项未提交） |
| 宿主 | @deepseek-ai/dsh@0.2.2-alpha.3（隔离实例；桌面端 ArcuchiHarness 的 `dsh-desktop-runtime` 同为 0.2.2-alpha.3） |
| DSH_HOME | `C:\02-codespace\DeepSeek\.scratch\harness-tests\pocket-mobile-list-0.2.2-alpha.3-z8whjg` |
| 端口 / URL | 49221 / `http://127.0.0.1:49221/?token=***` |
| Node | v24.12.0 |
| lib/index.js | 21969 字节，SHA256 `06796bc6d7fcda2ae978e8f8ae86b53f594ca41fede1116d601bbd43218a8476` |
| client/client.js（浏览器产物） | 133852 字节，SHA256 `b3165134c41b6559ce690eea62af5003ef7f39826439d98d5f40555d330ff4f8` |
| 证据文件 | `.scratch/test-system/runs/2026-11-07-141300-dsh-pocket.json` |

### 车道结果

| 车道 | 状态 | 退出码 | 耗时 |
|---|---|---|---|
| unit | failed | 1 | 12.0s |

失败项与本次改动无关：`test/tunnel-args.test.js` 4 项在 Windows 上 spawn 无扩展名的 cloudflared 桩时报 `ENOENT`（与第 1 节记录的既有失败相同）。改动相关的 35 项断言全通过（`test/mobile-nav.test.js`、`layout-mode`、`icon-compat`、`locales`）。

### 逐项读数

- **复现（修复前产物）**：390×890、deviceScaleFactor=3 的手机视口下渲染整页空白，只有左上角那颗抽屉图标；DOM 里 `会话A / 测试会话一` 都在。量到的 frame 网格是 `400px 0px 0px`（居中列 `x=400, width=0`），抽屉被推到 `x=-280`。
- **根因**：宿主 0.2.2 起自己带手机抽屉（`viewport < 768` ⇒ frame 加 `data-sidebar-drawer`、第一个网格子元素变成 `drawerMask`、inline 写 `grid-template-columns: 0px minmax(0,1fr) minmax(0,0px)`）。插件的 `grid-template-columns: minmax(0,1fr) 0 0 !important` 与 `> :nth-child(2)` 是按「窄屏下第一个子元素＝侧边栏」写的旧结构，结果遮罩被当成抽屉、主内容列落进 0px 轨：会话列表有数据却看不到，页面上也没有任何可点的东西。
- **修复后 @390×890**：frame 网格 `0px 390px 0px`，主内容列 `0×0 390×890` 占满；点可见的「打开侧边栏」⇒ `data-sidebar-collapsed=false`、侧边栏 `0,0,280,890`；会话行 `[8,346,264,32]`、`visibility: visible`、`elementFromPoint` 命中行本身；点「会话A」⇒ 主区切到该会话（`会话A 对话 轨迹 … 处理失败`）且抽屉自动收起。
- **视口矩阵**：360 / 390 / 430 / 600 / 767（宿主自带抽屉路径）与 768 / 900 / 1023（旧结构路径）都满足：抽屉 280 宽打开、行可点、点击后导航且抽屉关闭；1024 起 `body[data-dsh-pocket-layout=desktop]`，插件移动端效果整体不挂。
- **对照组**：同一实例加 `dsh-layout=desktop`（插件不注入任何移动样式，只用宿主自带抽屉）在 500×890 下抽屉与行同样正常，说明问题来自插件与宿主结构的冲突，不是宿主抽屉本身。
- **旧规则回放**：把修复前的四条 CSS 重新注入（546×890）可复现「左侧 280px 抽屉、主内容被推到视口外」，与用户截图同一形态。
- 截图：`.scratch/pocket-mobile-probe/shots-accept2/w390-1-main.png`（主界面）、`w390-2-drawer.png`（抽屉列出会话）、`w390-3-after-row.png`（点行后）、`shots-old/old-546-open.png`（修复前形态）。

### 本节未覆盖

- 未在用户日常实例（`~/.arcuchi`，其中 `dsh-pocket` 当前是 disabled 状态）与手机真机上验证；未接隧道（cloudflare）链路，只在 127.0.0.1 上验收。
- 未覆盖深色主题、`prefers-reduced-motion`、软键盘与安全区（`env(safe-area-inset-top)` 在桌面 Chromium 上恒为 0）。
- 未验证「宿主自带抽屉」下插件自己的遮罩被隐藏后的观感是否与宿主遮罩完全一致（只量到点击链路正常）。
- 用户实例里同时装了 ui-beautify / task-list / whiteboard 等插件，本记录只在「仅装 pocket」的隔离实例上验证。

---
