# ZephyrSentinel

[![Test](https://github.com/lim1202/ZephyrSentinel/actions/workflows/test.yml/badge.svg)](https://github.com/lim1202/ZephyrSentinel/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A website/API change monitoring and notification system designed for GitHub Actions. Monitor changes on websites, APIs, and RSS feeds, and get notified through multiple channels.

## Features

- **Multiple Monitor Types**: Webpage, API (JSON), RSS/Atom feeds
- **Change Detection**: Hash-based comparison with detailed diff output
- **Notification Channels**: DingTalk, Telegram, Slack, Webhook
- **GitHub Actions Ready**: Designed for serverless execution on GitHub Actions
- **Git State Storage**: State persisted in your repository
- **Configurable**: YAML configuration with environment variable support
- **Type-Safe**: Full TypeScript support with Zod validation

## Quick Start

### 1. Create Configuration

Create a `zephyr-sentinel.yaml` file in your repository:

```yaml
version: "1.0"

targets:
  - id: "github-releases"
    name: "Node.js Releases"
    url: "https://api.github.com/repos/nodejs/node/releases/latest"
    type: "api"
    jsonPath: "$.tag_name"
    enabled: true

notifications:
  dingtalk:
    enabled: true
    webhook: "${DINGTALK_WEBHOOK}"
    secret: "${DINGTALK_SECRET}"
    msgType: "markdown"

storage:
  type: "git"
  git:
    path: "state"
```

### 2. Set Up GitHub Secrets

Add your notification credentials as repository secrets:

- `DINGTALK_WEBHOOK` - Your DingTalk webhook URL
- `DINGTALK_SECRET` - Your DingTalk signing secret

### 3. Create Workflow

Create `.github/workflows/monitor.yml`:

```yaml
name: Monitor

on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:

permissions:
  contents: write

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run build

      - name: Run monitoring
        env:
          DINGTALK_WEBHOOK: ${{ secrets.DINGTALK_WEBHOOK }}
          DINGTALK_SECRET: ${{ secrets.DINGTALK_SECRET }}
        run: node dist/cli.js run

      - name: Commit state
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A state/
          git diff --quiet --staged || git commit -m "chore: update state [skip ci]"
          git push
```

## Configuration Reference

### Global Settings

```yaml
global:
  timezone: "UTC"        # Timezone for timestamps
  timeout: 30000         # Default HTTP timeout (ms)
  concurrency: 5         # Number of concurrent checks
  failFast: false        # Stop on first error
  dryRun: false          # Run without saving/sending
```

### Monitor Types

#### Webpage Monitor

Monitor HTML content with CSS selector support:

```yaml
targets:
  - id: "my-website"
    name: "My Website"
    url: "https://example.com/page"
    type: "webpage"
    selector: ".main-content"      # CSS selector (optional)
    excludeSelectors:              # Elements to exclude (optional)
      - ".ads"
      - "footer"
    ignoreWhitespace: false        # Normalize whitespace (optional)
    enabled: true
```

#### API Monitor

Monitor JSON API responses with JSONPath support:

```yaml
targets:
  - id: "api-endpoint"
    name: "API Monitor"
    url: "https://api.example.com/data"
    type: "api"
    jsonPath: "$.data.version"     # Extract specific field (optional)
    http:
      headers:
        Authorization: "Bearer ${API_TOKEN}"
    enabled: true
```

#### RSS Monitor

Monitor RSS/Atom feeds:

```yaml
targets:
  - id: "my-rss"
    name: "RSS Feed"
    url: "https://example.com/feed.xml"
    type: "rss"
    maxItems: 10                   # Limit items to track (optional)
    enabled: true
```

### Notification Channels

#### DingTalk

```yaml
notifications:
  dingtalk:
    enabled: true
    webhook: "${DINGTALK_WEBHOOK}"
    secret: "${DINGTALK_SECRET}"   # For signature verification
    msgType: "markdown"            # text, markdown, or actionCard
    atAll: false                   # @all members
    atMobiles:                     # @specific phones
      - "13800138000"
```

#### Telegram

```yaml
notifications:
  telegram:
    enabled: true
    botToken: "${TELEGRAM_BOT_TOKEN}"
    chatId: "${TELEGRAM_CHAT_ID}"
    parseMode: "HTML"              # HTML, Markdown, or MarkdownV2
```

#### Slack

```yaml
notifications:
  slack:
    enabled: true
    webhook: "${SLACK_WEBHOOK}"
    channel: "#alerts"             # Optional override
    username: "ZephyrSentinel"     # Optional bot name
    iconEmoji: ":bell:"            # Optional icon
```

#### Webhook

```yaml
notifications:
  webhook:
    enabled: true
    url: "https://your-server.com/webhook"
    method: "POST"
    headers:
      Authorization: "Bearer ${WEBHOOK_TOKEN}"
```

### Storage Configuration

```yaml
storage:
  type: "git"          # git or local
  git:
    branch: "state"    # Branch for state (not used in GitHub Actions)
    path: "state"      # Directory path
    commitMessage: "chore: update state [skip ci]"
```

### Alert Configuration

Control when notifications are sent:

```yaml
targets:
  - id: "example"
    # ... other config ...
    alertOn:
      change: true      # Alert on content change
      error: true       # Alert on check failure
      recovery: true    # Alert when recovered from error
```

## CLI Commands

```bash
# Run monitoring checks
npx zephyr-sentinel run

# Run for specific target
npx zephyr-sentinel run --target my-website

# Dry run (no state save, no notifications)
npx zephyr-sentinel run --dry-run

# Test notification channels
npx zephyr-sentinel test
npx zephyr-sentinel test dingtalk

# Validate configuration
npx zephyr-sentinel validate

# Show monitoring status
npx zephyr-sentinel status
```

## Programmatic Usage

```typescript
import { Engine, loadConfig } from "zephyr-sentinel";

// Load configuration
const config = await loadConfig();

// Create and run engine
const engine = new Engine();
const summary = await engine.run();

console.log(`Checked ${summary.totalTargets} targets`);
console.log(`Changes detected: ${summary.changed}`);
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

## Project Structure

```
ZephyrSentinel/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── index.ts            # Library entry point
│   ├── core/
│   │   ├── engine.ts       # Monitoring engine
│   │   ├── detector.ts     # Change detection
│   │   └── result-handler.ts
│   ├── monitors/
│   │   ├── base.ts         # Base monitor class
│   │   ├── webpage.monitor.ts
│   │   ├── api.monitor.ts
│   │   └── rss.monitor.ts
│   ├── notifiers/
│   │   ├── base.ts         # Base notifier class
│   │   ├── dingtalk.notifier.ts
│   │   ├── telegram.notifier.ts
│   │   ├── slack.notifier.ts
│   │   └── webhook.notifier.ts
│   ├── storage/
│   │   ├── base.ts         # Storage interface
│   │   └── git.storage.ts  # Git storage
│   ├── config/
│   │   ├── schema.ts       # Zod schemas
│   │   └── loader.ts       # Config loader
│   └── utils/
│       ├── http.ts         # HTTP utilities
│       ├── hash.ts         # Hash utilities
│       ├── diff.ts         # Diff utilities
│       └── logger.ts       # Logging
├── tests/
├── examples/
└── docs/
```

## Extending

### Custom Monitor

```typescript
import { BaseMonitor, type MonitorResult } from "zephyr-sentinel";

class CustomMonitor extends BaseMonitor {
  get type() {
    return "custom";
  }

  async check(): Promise<MonitorResult> {
    // Implement your monitoring logic
    const content = await fetchContent(this.url);
    const hash = hashContent(content);

    return this.createSuccessResult(content, hash, duration);
  }
}
```

### Custom Notifier

```typescript
import { BaseNotifier, type NotificationPayload, type NotificationResult } from "zephyr-sentinel";

class CustomNotifier extends BaseNotifier<MyConfig> {
  get channel() {
    return "custom" as const;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // Implement your notification logic
    const title = this.formatTitle(payload);
    const body = this.formatBody(payload);

    // Send to your service...

    return this.createSuccessResult(duration);
  }
}
```

## License

MIT