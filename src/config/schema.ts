import { z } from "zod";

/**
 * Monitor type enum
 */
export const MonitorTypeSchema = z.enum(["webpage", "api", "rss"]);
export type MonitorType = z.infer<typeof MonitorTypeSchema>;

/**
 * Notification channel type enum
 */
export const NotificationChannelSchema = z.enum([
  "dingtalk",
  "telegram",
  "email",
  "webhook",
  "slack",
]);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

/**
 * HTTP request configuration
 */
export const HttpConfigSchema = z.object({
  headers: z.record(z.string()).optional(),
  timeout: z.number().int().positive().default(30000),
  retries: z.number().int().min(0).max(5).default(3),
  retryDelay: z.number().int().positive().default(1000),
});

/**
 * Webpage monitor specific configuration
 */
export const WebpageConfigSchema = z.object({
  type: z.literal("webpage"),
  selector: z.string().optional(),
  excludeSelectors: z.array(z.string()).optional(),
  stripTags: z.boolean().optional(),
  ignoreWhitespace: z.boolean().optional(),
});

/**
 * API monitor specific configuration
 */
export const ApiConfigSchema = z.object({
  type: z.literal("api"),
  jsonPath: z.string().optional(),
  jqFilter: z.string().optional(),
});

/**
 * RSS monitor specific configuration
 */
export const RssConfigSchema = z.object({
  type: z.literal("rss"),
  fields: z.array(z.string()).optional(),
  maxItems: z.number().int().positive().optional(),
});

/**
 * Monitor type-specific configuration union
 */
export const MonitorTypeConfigSchema = z.discriminatedUnion("type", [
  WebpageConfigSchema,
  ApiConfigSchema,
  RssConfigSchema,
]);

/**
 * Target monitoring configuration
 */
export const TargetConfigSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    url: z.string().url(),
    enabled: z.boolean().default(true),
    checkInterval: z.number().int().positive().optional(),
    description: z.string().optional(),
    http: HttpConfigSchema.optional(),
    alertOn: z
      .object({
        change: z.boolean().default(true),
        error: z.boolean().default(true),
        recovery: z.boolean().default(true),
      })
      .optional(),
  })
  .and(MonitorTypeConfigSchema);

export type TargetConfig = z.infer<typeof TargetConfigSchema>;

/**
 * DingTalk notification configuration
 */
export const DingTalkConfigSchema = z.object({
  enabled: z.boolean().default(true),
  webhook: z.string().startsWith("https://oapi.dingtalk.com/"),
  secret: z.string().optional(),
  msgType: z.enum(["text", "markdown", "actionCard"]).default("markdown"),
  atAll: z.boolean().default(false),
  atMobiles: z.array(z.string()).optional(),
});

/**
 * Telegram notification configuration
 */
export const TelegramConfigSchema = z.object({
  enabled: z.boolean().default(true),
  botToken: z.string(),
  chatId: z.string(),
  parseMode: z.enum(["HTML", "Markdown", "MarkdownV2"]).default("HTML"),
});

/**
 * Email notification configuration
 */
export const EmailConfigSchema = z.object({
  enabled: z.boolean().default(true),
  smtp: z.object({
    host: z.string(),
    port: z.number().int().positive().default(587),
    secure: z.boolean().default(false),
    user: z.string(),
    password: z.string(),
  }),
  from: z.string().email(),
  to: z.array(z.string().email()),
  subject: z.string().optional(),
});

/**
 * Webhook notification configuration
 */
export const WebhookConfigSchema = z.object({
  enabled: z.boolean().default(true),
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT"]).default("POST"),
  headers: z.record(z.string()).optional(),
  template: z.string().optional(),
});

/**
 * Slack notification configuration
 */
export const SlackConfigSchema = z.object({
  enabled: z.boolean().default(true),
  webhook: z.string().url(),
  channel: z.string().optional(),
  username: z.string().optional(),
  iconEmoji: z.string().optional(),
});

/**
 * Notifications configuration
 */
export const NotificationsConfigSchema = z.object({
  dingtalk: DingTalkConfigSchema.optional(),
  telegram: TelegramConfigSchema.optional(),
  email: EmailConfigSchema.optional(),
  webhook: WebhookConfigSchema.optional(),
  slack: SlackConfigSchema.optional(),
});

/**
 * Git storage configuration
 */
export const GitStorageConfigSchema = z.object({
  branch: z.string().default("state"),
  path: z.string().default("state"),
  commitMessage: z.string().default("chore: update monitoring state [skip ci]"),
  authorName: z.string().default("zephyr-sentinel[bot]"),
  authorEmail: z.string().default("zephyr-sentinel[bot]@users.noreply.github.com"),
});

/**
 * Storage configuration
 */
export const StorageConfigSchema = z.object({
  type: z.enum(["git", "local"]).default("git"),
  git: GitStorageConfigSchema.optional(),
  local: z
    .object({
      path: z.string().default("./state"),
    })
    .optional(),
});

/**
 * Global configuration
 */
export const GlobalConfigSchema = z.object({
  timezone: z.string().default("UTC"),
  timeout: z.number().int().positive().default(30000),
  concurrency: z.number().int().positive().default(5),
  failFast: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});

/**
 * Full configuration schema
 */
export const ConfigSchema = z.object({
  version: z.string().default("1.0"),
  global: GlobalConfigSchema.optional(),
  targets: z.array(TargetConfigSchema).min(1),
  notifications: NotificationsConfigSchema,
  storage: StorageConfigSchema.optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
export type NotificationsConfig = z.infer<typeof NotificationsConfigSchema>;
export type StorageConfig = z.infer<typeof StorageConfigSchema>;
export type DingTalkConfig = z.infer<typeof DingTalkConfigSchema>;
export type TelegramConfig = z.infer<typeof TelegramConfigSchema>;
export type EmailConfig = z.infer<typeof EmailConfigSchema>;
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;
export type SlackConfig = z.infer<typeof SlackConfigSchema>;
export type HttpConfig = z.infer<typeof HttpConfigSchema>;
export type WebpageConfig = z.infer<typeof WebpageConfigSchema>;
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type RssConfig = z.infer<typeof RssConfigSchema>;
export type MonitorTypeConfig = z.infer<typeof MonitorTypeConfigSchema>;