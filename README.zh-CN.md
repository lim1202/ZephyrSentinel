<div align="center">

# 🛡️ ZephyrSentinel

<!-- badges -->
[![Test](https://github.com/lim1202/ZephyrSentinel/actions/workflows/test.yml/badge.svg)](https://github.com/lim1202/ZephyrSentinel/actions/workflows/test.yml)
[![GitHub Stars](https://img.shields.io/github/stars/lim1202/ZephyrSentinel?style=flat&logo=github)](https://github.com/lim1202/ZephyrSentinel/stargazers)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D%2020-339933?style=flat&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)](https://opensource.org/licenses/MIT)

<!-- description -->
一个强大的 **网站/API 变更监控与通知系统**，专为 GitHub Actions 设计。监控网站、API 和 RSS 订阅的变更，并通过多种渠道发送通知。

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md)

</div>

---

## ✨ 功能特性

| | |
|---|---|
| 🌐 **多种监控类型** | 网页、API (JSON)、RSS/Atom 订阅源 |
| 🔍 **变更检测** | 基于哈希的内容比较，生成详细差异报告 |
| 📡 **通知渠道** | 钉钉、Telegram、Slack、Webhook |
| ⚡ **完美适配 GitHub Actions** | 专为无服务器执行环境设计 |
| 💾 **Git 状态存储** | 状态持久化到您的仓库中 |
| ⚙️ **灵活配置** | YAML 配置，支持环境变量 |
| 🔒 **类型安全** | 完整 TypeScript 支持，Zod 验证 |

---

## 🚀 快速开始

### 1. 安装

```bash
npm install -g zephyr-sentinel
```

或直接使用 npx 运行：

```bash
npx zephyr-sentinel --help
```

### 2. 创建配置文件

在仓库中创建 `zephyr-sentinel.yaml` 文件：

```yaml
version: "1.0"

targets:
  - id: "github-releases"
    name: "Node.js 发布"
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

### 3. 配置 GitHub Secrets

将通知凭据添加为仓库密钥（Secrets）：

| 密钥 | 说明 |
|------|------|
| `DINGTALK_WEBHOOK` | 钉钉 Webhook 地址 |
| `DINGTALK_SECRET` | 钉钉签名密钥 |

### 4. 创建工作流

创建 `.github/workflows/monitor.yml`：

```yaml
name: Monitor

on:
  schedule:
    - cron: '*/30 * * * *'  # 每 30 分钟执行一次
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

---

## 📖 配置参考

### 全局设置

```yaml
global:
  timezone: "UTC"        # 时间戳时区
  timeout: 30000          # 默认 HTTP 超时时间（毫秒）
  concurrency: 5        # 并发检查数量
  failFast: false        # 遇错即停
  dryRun: false          # 试运行模式（不保存状态，不发送通知）
```

### 监控类型

#### 🌐 网页监控

支持 CSS 选择器的 HTML 内容监控：

```yaml
targets:
  - id: "my-website"
    name: "我的网站"
    url: "https://example.com/page"
    type: "webpage"
    selector: ".main-content"      # CSS 选择器（可选）
    excludeSelectors:               # 排除的元素（可选）
      - ".ads"
      - "footer"
    ignoreWhitespace: false          # 规范化空白字符（可选）
    enabled: true
```

#### 🔌 API 监控

支持 JSONPath 的 JSON API 响应监控：

```yaml
targets:
  - id: "api-endpoint"
    name: "API 监控"
    url: "https://api.example.com/data"
    type: "api"
    jsonPath: "$.data.version"       # 提取特定字段（可选）
    http:
      headers:
        Authorization: "Bearer ${API_TOKEN}"
    enabled: true
```

#### 📡 RSS 监控

RSS/Atom 订阅源监控：

```yaml
targets:
  - id: "my-rss"
    name: "RSS 订阅"
    url: "https://example.com/feed.xml"
    type: "rss"
    maxItems: 10                     # 追踪的最大条目数（可选）
    enabled: true
```

### 通知渠道

#### 钉钉

```yaml
notifications:
  dingtalk:
    enabled: true
    webhook: "${DINGTALK_WEBHOOK}"
    secret: "${DINGTALK_SECRET}"     # 签名验证密钥
    msgType: "markdown"              # text, markdown, 或 actionCard
    atAll: false                     # @所有人
    atMobiles:                       # @指定手机号
      - "13800138000"
```

#### Telegram

```yaml
notifications:
  telegram:
    enabled: true
    botToken: "${TELEGRAM_BOT_TOKEN}"
    chatId: "${TELEGRAM_CHAT_ID}"
    parseMode: "HTML"               # HTML, Markdown, 或 MarkdownV2
```

#### Slack

```yaml
notifications:
  slack:
    enabled: true
    webhook: "${SLACK_WEBHOOK}"
    channel: "#alerts"               # 可选的频道覆盖
    username: "ZephyrSentinel"        # 可选的机器人名称
    iconEmoji: ":bell:"              # 可选的图标
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

### 存储配置

```yaml
storage:
  type: "git"          # git 或 local
  git:
    branch: "state"    # 状态分支（在 GitHub Actions 中不使用）
    path: "state"      # 目录路径
    commitMessage: "chore: update state [skip ci]"
```

### 告警配置

控制发送通知的时机：

```yaml
targets:
  - id: "example"
    # ... 其他配置 ...
    alertOn:
      change: true      # 内容变更时通知
      error: true       # 检查失败时通知
      recovery: true    # 恢复成功时通知
```

---

## ⌨️ CLI 命令

```bash
# 执行监控检查
npx zephyr-sentinel run

# 针对特定目标执行
npx zephyr-sentinel run --target my-website

# 试运行模式（不保存状态，不发送通知）
npx zephyr-sentinel run --dry-run

# 测试通知渠道
npx zephyr-sentinel test
npx zephyr-sentinel test dingtalk

# 验证配置文件
npx zephyr-sentinel validate

# 显示监控状态
npx zephyr-sentinel status
```

---

## 💻 程序化使用

```typescript
import { Engine, loadConfig } from "zephyr-sentinel";

// 加载配置
const config = await loadConfig();

// 创建并运行引擎
const engine = new Engine();
const summary = await engine.run();

console.log(`已检查 ${summary.totalTargets} 个目标`);
console.log(`检测到变更: ${summary.changed}`);
```

---

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test

# 代码检查
npm run lint

# 类型检查
npm run typecheck
```

---

## 📁 项目结构

```
ZephyrSentinel/
├── src/
│   ├── cli.ts              # CLI 入口
│   ├── index.ts            # 库入口
│   ├── core/
│   │   ├── engine.ts       # 监控引擎
│   │   ├── detector.ts    # 变更检测
│   │   └── result-handler.ts
│   ├── monitors/
│   │   ├── base.ts        # 监控器基类
│   │   ├── webpage.monitor.ts
│   │   ├── api.monitor.ts
│   │   └── rss.monitor.ts
│   ├── notifiers/
│   │   ├── base.ts        # 通知器基类
│   │   ├── dingtalk.notifier.ts
│   │   ├── telegram.notifier.ts
│   │   ├── slack.notifier.ts
│   │   └── webhook.notifier.ts
│   ├── storage/
│   │   ├── base.ts        # 存储接口
│   │   └── git.storage.ts # Git 存储
│   ├── config/
│   │   ├── schema.ts     # Zod schema
│   │   └── loader.ts     # 配置加载器
│   └── utils/
│       ├── http.ts        # HTTP 工具
│       ├── hash.ts        # 哈希工具
│       ├── diff.ts        # 差异工具
│       └── logger.ts      # 日志工具
├── tests/
├── examples/
└── docs/
```

---

## 🔌 扩展开发

### 自定义监控器

```typescript
import { BaseMonitor, type MonitorResult } from "zephyr-sentinel";

class CustomMonitor extends BaseMonitor {
  get type() {
    return "custom";
  }

  async check(): Promise<MonitorResult> {
    // 在此实现您的监控逻辑
    const content = await fetchContent(this.url);
    const hash = hashContent(content);

    return this.createSuccessResult(content, hash, duration);
  }
}
```

### 自定义通知器

```typescript
import { BaseNotifier, type NotificationPayload, type NotificationResult } from "zephyr-sentinel";

class CustomNotifier extends BaseNotifier<MyConfig> {
  get channel() {
    return "custom" as const;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // 在此实现您的通知逻辑
    const title = this.formatTitle(payload);
    const body = this.formatBody(payload);

    // 发送到您的服务...

    return this.createSuccessResult(duration);
  }
}
```

---

## 📝 许可证

MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🤝 贡献

欢迎贡献！请随时提交 [Pull Request](https://github.com/lim1202/ZephyrSentinel/pulls)。