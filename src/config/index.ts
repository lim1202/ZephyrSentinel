export { ConfigSchema } from "./schema.js";
export type {
  ApiConfig,
  Config,
  DingTalkConfig,
  EmailConfig,
  GlobalConfig,
  HttpConfig,
  MonitorType,
  NotificationsConfig,
  NotificationChannel,
  RssConfig,
  SlackConfig,
  StorageConfig,
  TargetConfig,
  TelegramConfig,
  WebhookConfig,
  WebpageConfig,
} from "./schema.js";

export {
  loadConfig,
  validateConfig,
  getDefaultConfig,
  ConfigError,
} from "./loader.js";
export type { ConfigLoaderOptions } from "./loader.js";