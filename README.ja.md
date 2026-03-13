<div align="center">

# 🛡️ ZephyrSentinel

<!-- badges -->
[![Test](https://github.com/lim1202/ZephyrSentinel/actions/workflows/test.yml/badge.svg)](https://github.com/lim1202/ZephyrSentinel/actions/workflows/test.yml)
[![GitHub Stars](https://img.shields.io/github/stars/lim1202/ZephyrSentinel?style=flat&logo=github)](https://github.com/lim1202/ZephyrSentinel/stargazers)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D%2020-339933?style=flat&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)](https://opensource.org/licenses/MIT)

<!-- description -->
強力な **Web サイト/API 変更監視通知システム**。GitHub Actions 向けに設計されています。Web サイト、API、RSS フィードの変更を監視し、複数の渠道で通知を受け取れます。

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md)

</div>

---

## ✨ 機能

| | |
|---|---|
| 🌐 **複数の監視タイプ** | Web ページ、API (JSON)、RSS/Atom フィード |
| 🔍 **変更検出** | ハッシュベースの比較詳細な差分出力 |
| 📡 **通知チャネル** | 钉钉、Telegram、Slack、Webhook |
| ⚡ **GitHub Actions 対応** | サーバーレス実行向けに設計 |
| 💾 **Git 状態存储** | リポジトリに状態を保存 |
| ⚙️ **設定可能** | YAML 設定、环境変数サポート |
| 🔒 **型安全** | 完整的 TypeScript サポート、Zod 検証 |

---

## 🚀 クイックスタート

### 1. このリポジトリを Fork

ページ右上の **Fork** ボタンをクリックして、個人のコピーを作成します。

### 2. GitHub Secrets の設定

Fork したリポジトリ → **Settings** → **Secrets and variables** → **Actions** で通知资格情報を追加：

| Secret | 説明 |
|--------|------|
| `DINGTALK_WEBHOOK` | 钉钉 Webhook URL |
| `DINGTALK_SECRET` | 钉钉 署名シークレット |
| `TELEGRAM_BOT_TOKEN` | Telegram ボットトークン |
| `TELEGRAM_CHAT_ID` | Telegram チャットID |
| `SLACK_WEBHOOK` | Slack Webhook URL |
| `WEBHOOK_URL` | カスタム Webhook URL |
| `WEBHOOK_TOKEN` | カスタム Webhook トークン |

### 3. モニターブランチを作成

`monitor/<あなたの名前>` という名前のブランチを作成：

```bash
git checkout -b monitor/my-monitor
```

### 4. 監視を設定

リポジトリのルートに `zephyr-sentinel.yaml` ファイルを作成：

```yaml
version: "1.0"

targets:
  - id: "github-releases"
    name: "Node.js リリース"
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

### 5. プッシュして有効化

```bash
git add zephyr-sentinel.yaml
git commit -m "feat: 監視設定を追加"
git push origin monitor/my-monitor
```

その後 **Actions** → **Monitor** → **Enable workflow** で監視を有効化します。

### 6. (オプション) ワークフローのカスタマイズ

リポジトリにはすでに [`.github/workflows/monitor.yml`](.github/workflows/monitor.yml) が含まれています。スケジュールやその他の設定を必要に応じて変更できます。

---

## 📖 設定リファレンス

### グローバル設定

```yaml
global:
  timezone: "UTC"        # タイムスタンプのタイムゾーン
  timeout: 30000         # デフォルト HTTP タイムアウト（ミリ秒）
  concurrency: 5          # 同時実行数
  failFast: false        # 初エラーで停止
  dryRun: false          # 保存/送信なしで実行
```

### 監視タイプ

#### 🌐 Web ページ監視

CSS セレクターを使用した HTML コンテンツ監視：

```yaml
targets:
  - id: "my-website"
    name: "マイサイト"
    url: "https://example.com/page"
    type: "webpage"
    selector: ".main-content"      # CSS セレクター（オプション）
    excludeSelectors:              # 除外する要素（オプション）
      - ".ads"
      - "footer"
    ignoreWhitespace: false        # 空白を正規化（オプション）
    enabled: true
```

#### 🔌 API 監視

JSONPath を使用した JSON API レスポンス監視：

```yaml
targets:
  - id: "api-endpoint"
    name: "API モニター"
    url: "https://api.example.com/data"
    type: "api"
    jsonPath: "$.data.version"       # 特定のフィールドを抽出（オプション）
    http:
      headers:
        Authorization: "Bearer ${API_TOKEN}"
    enabled: true
```

#### 📡 RSS 監視

RSS/Atom フィードの監視：

```yaml
targets:
  - id: "my-rss"
    name: "RSS フィード"
    url: "https://example.com/feed.xml"
    type: "rss"
    maxItems: 10                   # 追跡するアイテム数上限（オプション）
    enabled: true
```

### 通知チャネル

#### 钉钉

```yaml
notifications:
  dingtalk:
    enabled: true
    webhook: "${DINGTALK_WEBHOOK}"
    secret: "${DINGTALK_SECRET}"     # 署名検証用
    msgType: "markdown"              # text, markdown, actionCard
    atAll: false                     # @全员
    atMobiles:                       # @特定的电话号码
      - "13800138000"
```

#### Telegram

```yaml
notifications:
  telegram:
    enabled: true
    botToken: "${TELEGRAM_BOT_TOKEN}"
    chatId: "${TELEGRAM_CHAT_ID}"
    parseMode: "HTML"               # HTML, Markdown, MarkdownV2
```

#### Slack

```yaml
notifications:
  slack:
    enabled: true
    webhook: "${SLACK_WEBHOOK}"
    channel: "#alerts"               # オプションのオーバーライド
    username: "ZephyrSentinel"       # オプションのボット名
    iconEmoji: ":bell:"              # オプションのアイコン
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

### ストレージ設定

```yaml
storage:
  type: "git"          # git または local
  git:
    branch: "state"    # ステーターブランチ（GitHub Actions では使用しない）
    path: "state"      # ディレクトリパス
    commitMessage: "chore: update state [skip ci]"
```

### アラート設定

通知のタイミングを制御：

```yaml
targets:
  - id: "example"
    # ... 他の設定 ...
    alertOn:
      change: true      # コンテンツ変更時に通知
      error: true       # チェック失敗時に通知
      recovery: true    # 回復時に通知
```

---

## ⌨️ CLI コマンド

```bash
# 監視チェックを実行
npx zephyr-sentinel run

# 特定のターゲットのみ実行
npx zephyr-sentinel run --target my-website

# ドライラン（状態保存・通知なし）
npx zephyr-sentinel run --dry-run

# 通知チャネルのテスト
npx zephyr-sentinel test
npx zephyr-sentinel test dingtalk

# 設定の検証
npx zephyr-sentinel validate

# 監視ステータスの表示
npx zephyr-sentinel status
```

---

## 💻 プログラムからの使用

```typescript
import { Engine, loadConfig } from "zephyr-sentinel";

// 設定を読み込む
const config = await loadConfig();

// エンジンを作成して実行
const engine = new Engine();
const summary = await engine.run();

console.log(`${summary.totalTargets} 個のターゲットをチェック`);
console.log(`変更検出: ${summary.changed}`);
```

---

## 🛠️ 開発

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# テスト実行
npm test

# リント
npm run lint

# 型チェック
npm run typecheck
```

---

## 📁 プロジェクト構造

```
ZephyrSentinel/
├── src/
│   ├── cli.ts              # CLI エントリーポイント
│   ├── index.ts           # ライブラリエントリーポイント
│   ├── core/
│   │   ├── engine.ts      # 監視エンジン
│   │   ├── detector.ts   # 変更検出
│   │   └── result-handler.ts
│   ├── monitors/
│   │   ├── base.ts        # モニター基底クラス
│   │   ├── webpage.monitor.ts
│   │   ├── api.monitor.ts
│   │   └── rss.monitor.ts
│   ├── notifiers/
│   │   ├── base.ts        # 通知基底クラス
│   │   ├── dingtalk.notifier.ts
│   │   ├── telegram.notifier.ts
│   │   ├── slack.notifier.ts
│   │   └── webhook.notifier.ts
│   ├── storage/
│   │   ├── base.ts        # ストレージインターフェース
│   │   └── git.storage.ts # Git ストレージ
│   ├── config/
│   │   ├── schema.ts     # Zod スキーマ
│   │   └── loader.ts    # 設定ローダー
│   └── utils/
│       ├── http.ts       # HTTP ユーティリティ
│       ├── hash.ts       # ハッシュユーティリティ
│       ├── diff.ts       # 差分ユーティリティ
│       └── logger.ts     # ロガーユーティリティ
├── tests/
├── examples/
└── docs/
```

---

## 🔌 拡張

### カスタムモニター

```typescript
import { BaseMonitor, type MonitorResult } from "zephyr-sentinel";

class CustomMonitor extends BaseMonitor {
  get type() {
    return "custom";
  }

  async check(): Promise<MonitorResult> {
    // 監視ロジックを実装
    const content = await fetchContent(this.url);
    const hash = hashContent(content);

    return this.createSuccessResult(content, hash, duration);
  }
}
```

### カスタム_notifier

```typescript
import { BaseNotifier, type NotificationPayload, type NotificationResult } from "zephyr-sentinel";

class CustomNotifier extends BaseNotifier<MyConfig> {
  get channel() {
    return "custom" as const;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // 通知ロジックを実装
    const title = this.formatTitle(payload);
    const body = this.formatBody(payload);

    // サービスに送信...

    return this.createSuccessResult(duration);
  }
}
```

---

## 📝 ライセンス

MIT ライセンス - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

---

## 🤝 コントリビューション

コントリビューションは大歓迎です！是非 [Pull Request](https://github.com/lim1202/ZephyrSentinel/pulls) を提交してください。