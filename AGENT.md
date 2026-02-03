# Skribbltypo Desktop Agent Guide

This file provides context and guidelines for AI agents working on the Skribbltypo Desktop project.

## Project Overview

Skribbltypo Desktop is an Electron-based desktop client for [skribbl.io](https://skribbl.io). It loads the game in a BrowserWindow and integrates the "skribbltypo" plugin (fetched from [toobeeh/skribbltypo](https://github.com/toobeeh/skribbltypo)) to enhance the experience. Features include Discord Rich Presence, join-lobby-via-clipboard (F4), and native notifications.

## Tech Stack

- **Runtime**: Electron
- **Bundler**: Vite (via `vite-plugin-electron`)
- **Language**: TypeScript
- **Package Manager**: Yarn

## Project Structure

| Path                     | Role                                                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main.ts`            | Electron main process: window creation, IPC handlers, menu, Discord RPC wiring, script-manager and CSS injection on `did-finish-load`.                                                                        |
| `src/preload.ts`         | Preload script (CJS). Exposes a minimal API via `contextBridge` as `window.electronAPI`. Listens for `INTERCEPTED_DATA` / `GAME_LOADED` from the page and parses Socket.IO payloads via `utils/socket-io.js`. |
| `src/game-observer.ts`   | Injected into the skribbl.io page (IIFE). Observes DOM (e.g. overlay), game events, and F4; posts `INTERCEPTED_DATA` / `GAME_LOADED` and calls `electronAPI` for presence, notifications, join-lobby.         |
| `src/script-manager.ts`  | Fetches and caches skribbltypo script from GitHub releases; provides bundle for injection and update popup logic.                                                                                             |
| `src/discord-rpc.ts`     | Discord RPC client; uses `utils/hashing.js` to avoid redundant `setActivity` calls.                                                                                                                           |
| `src/menu.ts`            | Builds the app menu (Join game from clipboard/URL, Update script, etc.) and wires actions to `mainWindow` and `ScriptManager`.                                                                                |
| `src/logger.ts`          | Centralized logger with levels (e.g. info, warn, error, debug).                                                                                                                                               |
| `src/css/style.css`      | Injected into the loaded page (raw CSS).                                                                                                                                                                      |
| `src/utils/hashing.ts`   | `hashObject()` for stable JSON hashing (e.g. deduplicating Discord presence updates).                                                                                                                         |
| `src/utils/socket-io.ts` | Parses Engine.IO / Socket.IO packet format; used in preload to interpret intercepted messages.                                                                                                                |

**Build output (Vite → `dist/`):**

- `main.js` — ESM, main process entry.
- `preload.js` — CJS (required by Electron for preload).
- `game-observer.js` — IIFE, injected into the renderer.

## Important Commands

- `yarn start` — Development with hot reload.
- `yarn build` — Compile and bundle (output in `dist/`).
- `yarn app:dir` — Build and package into a directory (no installer).
- `yarn app:release` — Build and produce installers (e.g. AppImage on Linux, NSIS on Windows).

## Development Guidelines

- **Modules**: ESM only (`import`/`export`). Use `.js` extensions in relative imports (e.g. `./script-manager.js`) so resolution works at runtime.
- **TypeScript**: Prefer strict typing; avoid `any` where possible.
- **Logging**: Use `src/logger.ts` in main/preload/Node code. The injected `game-observer` runs in the page context where `console.debug` may be used for dev; avoid `console.log` in main/preload in favor of the logger.
- **Paths**: Use `path.join` and `import.meta`/`path.dirname(import.meta.dirname)` appropriately for Electron and Vite (e.g. in `script-manager.ts` for `dist/game-observer.js`).
- **Security**: All renderer–main communication must go through `preload.ts` via `contextBridge`; no `nodeIntegration` in the window.

## Logging

_Adapted from_: https://github.com/toobeeh/skribbltypo#logging
Thorough logging is essential for debugging, especially when the application is already released.
In general, adding logging right during development is favorable, but at the very least when it comes to debugging and logging is added to debug a specific issue, the logging should be meaningful so that it can be used for future debugging and be kept in the codebase.
Errors should be logged for illegal states where a recovery is not possible; warnings in states that do not necessarily lead to user experience issues; information for any action that is executed/initiated by a feature or service; and debug to dump data for low-level debugging.

## What NOT to do

- **No `console.log` in main/preload**: Use the logger in `src/logger.ts` instead.
- **No CommonJS in source**: No `require()`; ESM only. (Preload is compiled to CJS by Vite by design.)
- **No `any`**: Prefer explicit types; type IPC payloads and API surfaces (e.g. `IElectronAPI` in preload).
- **No direct renderer–main communication**: Do not bypass `preload.ts` or expose Node/Electron APIs beyond what is exposed on `electronAPI`.
- **No hardcoded secrets**: No API keys or sensitive session data in repo.
- **No build script changes**: Do not modify `package.json` scripts or Vite/electron-builder config unless explicitly asked.
- **No breaking preload contract**: The renderer (and `game-observer`) depend on `window.electronAPI`; avoid renaming or removing exposed methods without updating all call sites.

## LLM Context

When assisting with this project:

- Preserve security in `preload.ts` and IPC: minimal API, no raw `ipcRenderer` or Node globals in the page.
- Respect `vite.config.ts`: multiple Electron entries (main, preload, game-observer) with different formats (ESM, CJS, IIFE).
- Check `package.json` for dependency versions and build/output layout (e.g. `release/`, `dist/`).
- If touching Discord RPC, keep the hashing-based deduplication in `discord-rpc.ts` so presence is not spammed.
- Join-lobby and script-update behavior are wired in `main.ts` (IPC) and `menu.ts`; keep menu and IPC in sync.
