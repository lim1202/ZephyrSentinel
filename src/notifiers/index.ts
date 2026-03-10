import type {
  DingTalkConfig,
  NotificationChannel,
  NotificationsConfig,
  SlackConfig,
  TelegramConfig,
  WebhookConfig,
} from "../config/schema.js";
import { BaseNotifier, type NotificationPayload, type NotificationResult } from "./base.js";
import { DingTalkNotifier } from "./dingtalk.notifier.js";
import { SlackNotifier } from "./slack.notifier.js";
import { TelegramNotifier } from "./telegram.notifier.js";
import { WebhookNotifier } from "./webhook.notifier.js";

export {
  BaseNotifier,
  type NotificationPayload,
  type NotificationResult,
  NotifierError,
} from "./base.js";
export { DingTalkNotifier } from "./dingtalk.notifier.js";
export { TelegramNotifier } from "./telegram.notifier.js";
export { WebhookNotifier } from "./webhook.notifier.js";
export { SlackNotifier } from "./slack.notifier.js";

/**
 * Notifier type map
 */
type NotifierMap = {
  dingtalk: DingTalkNotifier;
  telegram: TelegramNotifier;
  email: never; // Not implemented yet
  webhook: WebhookNotifier;
  slack: SlackNotifier;
};

/**
 * Create a notifier instance based on channel type
 */
export function createNotifier<K extends keyof NotifierMap>(
  channel: K,
  config: NotifierMap[K] extends BaseNotifier<infer C> ? C : never
): BaseNotifier | null {
  switch (channel) {
    case "dingtalk":
      return new DingTalkNotifier(config as DingTalkConfig);
    case "telegram":
      return new TelegramNotifier(config as TelegramConfig);
    case "webhook":
      return new WebhookNotifier(config as WebhookConfig);
    case "slack":
      return new SlackNotifier(config as SlackConfig);
    case "email":
      throw new Error("Email notifier is not implemented yet");
    default:
      return null;
  }
}

/**
 * Create all enabled notifiers from configuration
 */
export function createNotifiers(
  config: NotificationsConfig
): BaseNotifier[] {
  const notifiers: BaseNotifier[] = [];

  if (config.dingtalk?.enabled) {
    notifiers.push(new DingTalkNotifier(config.dingtalk));
  }

  if (config.telegram?.enabled) {
    notifiers.push(new TelegramNotifier(config.telegram));
  }

  if (config.webhook?.enabled) {
    notifiers.push(new WebhookNotifier(config.webhook));
  }

  if (config.slack?.enabled) {
    notifiers.push(new SlackNotifier(config.slack));
  }

  return notifiers;
}

/**
 * Send notification to all enabled channels
 */
export async function sendNotifications(
  config: NotificationsConfig,
  payload: NotificationPayload
): Promise<Map<NotificationChannel, NotificationResult>> {
  const results = new Map<NotificationChannel, NotificationResult>();
  const notifiers = createNotifiers(config);

  await Promise.all(
    notifiers.map(async (notifier) => {
      const result = await notifier.send(payload);
      results.set(notifier.channel, result);
    })
  );

  return results;
}