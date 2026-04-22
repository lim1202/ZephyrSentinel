# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mutation Watcher is a website/API change monitoring and notification system designed for GitHub Actions. It monitors webpages, APIs, and RSS feeds, detects changes via hash comparison, and sends notifications through DingTalk, Telegram, Slack, or webhooks.

## Commands

```bash
npm run build        # Build with tsup (outputs to dist/)
npm run dev          # Run CLI directly with tsx
npm start            # Run compiled CLI
npm test             # Run vitest in watch mode
npm run test:run     # Run vitest once
npm run lint          # Biome lint check
npm run lint:fix      # Biome lint with auto-fix
npm run format        # Biome format
npm run typecheck     # TypeScript type check
```

## Architecture

### Core Flow

The `Engine` class ([src/core/engine.ts](src/core/engine.ts)) orchestrates the monitoring flow:

1. **Load Config** → Zod-validated YAML config via `loadConfig()` in [src/config/loader.ts](src/config/loader.ts)
2. **Create Monitors** → Factory creates `WebpageMonitor`, `ApiMonitor`, or `RssMonitor` based on `target.type`
3. **Run Checks** → Concurrency-controlled execution via `p-limit`
4. **Detect Changes** → `ChangeDetector` compares current hash against stored hash
5. **Store State** → `GitStorage` or `LocalStorage` persists state
6. **Send Notifications** → All enabled notifiers receive `NotificationPayload`

### Monitors ([src/monitors/](src/monitors/))

- `BaseMonitor` ([base.ts](src/monitors/base.ts)) - Abstract base with common logic
- `WebpageMonitor` - Fetches HTML, optionally applies CSS selector filtering
- `ApiMonitor` - Fetches JSON, optionally extracts via JSONPath
- `RssMonitor` - Parses RSS/Atom feeds, tracks items

Each monitor returns `MonitorResult` with content, hash, duration, and optional metadata.

### Notifiers ([src/notifiers/](src/notifiers/))

- `BaseNotifier` ([base.ts](src/notifiers/base.ts)) - Abstract base with `formatTitle()`/`formatBody()` helpers
- `DingTalkNotifier`, `TelegramNotifier`, `SlackNotifier`, `WebhookNotifier`

Notifiers receive `NotificationPayload` and return `NotificationResult`.

### Storage ([src/storage/](src/storage/))

- `GitStorage` - Commits state to a dedicated branch (designed for GitHub Actions)
- `LocalStorage` - Filesystem-based state

State shape: `{ targets: { [targetId]: TargetState }, updatedAt: string }`

### Configuration Schema ([src/config/schema.ts](src/config/schema.ts))

All config validated via Zod. Key types:
- `Config` - Full config with `targets[]`, `notifications`, `storage`, `global`
- `TargetConfig` - Per-target settings (url, type, alertOn, http, etc.)
- `NotificationsConfig` - Channel-specific configs

### CLI ([src/cli.ts](src/cli.ts))

Commands: `run`, `test`, `validate`, `status`. Uses `commander.js`.

## Configuration

Config file: `monitor.yaml` (or custom via `-c, --config`).

Environment variables supported via `${VAR_NAME}` syntax in YAML values.

Key config locations:
- Targets: `config.targets[]`
- Global settings: `config.global` (timeout, concurrency, failFast, dryRun)
- Storage: `config.storage.type` ("git" or "local")
