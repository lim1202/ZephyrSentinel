// Main entry point for library usage
export { Engine, type EngineOptions } from "./core/engine.js";
export {
  ChangeDetector,
  type ChangeDetectionResult,
  type ChangeDetectorOptions,
} from "./core/detector.js";
export {
  ResultHandler,
  type ExecutionSummary,
  type NotificationType,
  type ProcessedResult,
} from "./core/result-handler.js";

export { loadConfig, ConfigError } from "./config/index.js";
export type {
  Config,
  TargetConfig,
  GlobalConfig,
  NotificationsConfig,
  StorageConfig,
} from "./config/index.js";

export { BaseMonitor, createMonitor, type MonitorResult } from "./monitors/index.js";
export { WebpageMonitor } from "./monitors/webpage.monitor.js";
export { ApiMonitor } from "./monitors/api.monitor.js";
export { RssMonitor } from "./monitors/rss.monitor.js";

export {
  BaseNotifier,
  createNotifiers,
  type NotificationPayload,
  type NotificationResult,
} from "./notifiers/index.js";
export { DingTalkNotifier } from "./notifiers/dingtalk.notifier.js";
export { TelegramNotifier } from "./notifiers/telegram.notifier.js";
export { WebhookNotifier } from "./notifiers/webhook.notifier.js";
export { SlackNotifier } from "./notifiers/slack.notifier.js";

export {
  createStorage,
  GitStorage,
  LocalStorage,
  type IStorage,
  type State,
  type TargetState,
} from "./storage/index.js";

export {
  hashContent,
  compareContent,
  type DiffResult,
} from "./utils/index.js";