# Pattern Puzzle

Desktop app: **Tauri 2** + **React** + **Claude** (Anthropic API).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/) (WebView2, Visual Studio Build Tools)

## Setup

```powershell
cd "C:\Pattern puzzle"
npm install
copy .env.example .env
# Edit .env and set ANTHROPIC_API_KEY from https://console.anthropic.com/
```

If the build complains about missing icons, add a square PNG (e.g. `app-icon.png`) and run:

```powershell
npm run tauri icon app-icon.png
```

## Run

```powershell
npm run tauri dev
```

## Build installer

```powershell
npm run tauri build
```

Output: `src-tauri\target\release\bundle\`

## Notes

- Claude calls run in Rust (`ask_claude` command); the API key is read from `.env`, not from the UI.
- Actions: **New puzzle**, **Get hint**, **Check answer**.
