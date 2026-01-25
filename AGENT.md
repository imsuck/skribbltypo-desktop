# Skribbltypo Desktop Agent Guide

This file provides context and guidelines for AI agents working on the Skribbltypo Desktop project.

## Project Overview

Skribbltypo Desktop is an Electron-based desktop client for skribbl.io. It integrates the "skribbltypo" plugin, fetched from the web, to enhance the user experience.

## Tech Stack

- **Framework**: Electron
- **Bundler**: Vite (via `vite-plugin-electron`)
- **Language**: TypeScript
- **Package Manager**: Yarn

## Project Structure

- `src/main.ts`: Entry point for the Electron main process. Handles window creation and IPC.
- `src/preload.ts`: Bridges the main process and the renderer process securely.
- `src/game-observer.ts`: Contains logic for monitoring the skribbl.io game state.
- `src/script-manager.ts`: Handles the injection and management of the skribbltypo scripts.
- `src/logger.ts`: Centralized logging utility with colored levels.
- `src/css/`: Frontend styling.

## Important Commands

- `yarn start`: Launch the app in development mode with hot reload.
- `yarn build`: Compile TypeScript and bundle with Vite.
- `yarn app:dir`: Build and package into a directory for local testing.
- `yarn app:release`: Build and package the application for production (AppImage/NSIS).

## Development Guidelines

- **Modules**: Always use ESM (`import`/`export`).
- **TypeScript**: Maintain strict typing. Avoid `any` where possible.
- **Logging**: Use the logger in `src/logger.ts` instead of `console.log` for consistent formatting.
- **Filesystem**: Be cautious with paths; use `path.join` and `import.meta.url` correctly for Electron.

## Logging

_Adapted from_: https://github.com/toobeeh/skribbltypo#logging
Thorough logging is essential for debugging, especially when the application is already released.
In general, adding logging right during development is favorable, but at the very least when it comes to debugging and logging is added to debug a specific issue, the logging should be meaningful so that it can be used for future debugging and be kept in the codebase.
Errors should be logged for illegal states where a recovery is not possible; warnings in states that do not necessarily lead to user experience issues; information for any action that is executed/initiated by a feature or service; and debug to dump data for low-level debugging.

## What NOT to do

- **No `console.log`**: Avoid standard console logging. Use the custom logger in `src/logger.ts`.
- **No CommonJS**: Do not use `require()`. This project is ESM only.
- **No `any`**: Avoid using the `any` type in TypeScript. Be explicit with types.
- **No direct Renderer-Main communication**: Do not bypass `preload.ts` when communicating between the renderer and main processes.
- **No hardcoded secrets**: Never hardcode API keys or sensitive session data.
- **No script modification without warning**: Do not change the existing build scripts in `package.json` unless explicitly asked.

## LLM Context

When assisting with this project:

- Prioritize security in `preload.ts` and IPC communications.
- Ensure Vite configurations in `vite.config.ts` are respected during builds.
- Refer to `package.json` for current dependency versions.
