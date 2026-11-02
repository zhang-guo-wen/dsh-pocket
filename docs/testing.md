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
