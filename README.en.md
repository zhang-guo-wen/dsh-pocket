---
description: "Put DeepSeek Harness in your pocket: scan a QR code and use the DSH on your computer from your phone, live"
kind: "plugin-readme"
---

# DSH Pocket

English | [中文](<README.md>)

## Background

**Scan once, use your desktop DSH from anywhere.**

On the way home you want to see how far the agent got; away from the desk you want it to keep working. This plugin adds a **Phone access** page to Settings: scan the LAN QR code, or open a public tunnel, and the phone shows the very same interface, live.

## Screenshots

**The phone shows the desktop interface**, with streamed output in step.

![The DSH interface on a phone](<docs/interface.jpg>)

## Install

```sh
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-pocket
```

Restart `dsh web`, then open **Settings → Phone access**. Public links carry an 8-character random password by default; do not hand the QR code to anyone else.

## Features

1. **LAN QR code**: on the same Wi-Fi, scan the code on the settings page and you are in; the local IP is detected for you (WSL picks the Windows adapter).
2. **Public tunnel**: **Enable public access** starts a cloudflared tunnel so 4G works from anywhere; an optional named tunnel keeps a fixed domain.
3. **Passwords you control**: public and LAN passwords can both be set to your own 8–64 characters; the phone stays signed in after the first entry.
4. **Live sync**: WebSocket passthrough, so output scrolling on the desktop scrolls on the phone, with automatic reconnection.
5. **Phone layout**: a drawer layout on narrow screens, full-width conversations, safe-area padding and touch-sized controls.
6. **No dependencies**: one npm package and one settings page — no account and no server of your own.

Note: all traffic goes through your own computer; in public mode, check what the tunnel and password expose.
