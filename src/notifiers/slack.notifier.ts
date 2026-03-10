import type { NotificationChannel, SlackConfig } from "../config/schema.js";
import { httpPost } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import { BaseNotifier, type NotificationPayload, type NotificationResult } from "./base.js";

/**
 * Slack webhook notifier implementation
 */
export class SlackNotifier extends BaseNotifier<SlackConfig> {
  get channel(): NotificationChannel {
    return "slack";
  }

  isEnabled(): boolean {
    return this.config.enabled ?? true;
  }

  validateConfig(): boolean {
    if (!this.config.webhook) {
      throw new Error("Slack webhook URL is required");
    }

    return true;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const startTime = Date.now();

    try {
      const message = this.buildMessage(payload);

      logger.debug(`Sending Slack notification for: ${payload.targetId}`);

      const response = await httpPost(this.config.webhook, message, {
        timeout: 10000,
      });

      if (response.status >= 400) {
        return this.createErrorResult(
          `Slack webhook returned status ${response.status}`,
          Date.now() - startTime
        );
      }

      return this.createSuccessResult(Date.now() - startTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug(`Slack notification failed: ${errorMessage}`);
      return this.createErrorResult(errorMessage, Date.now() - startTime);
    }
  }

  async test(): Promise<NotificationResult> {
    const testPayload: NotificationPayload = {
      targetId: "test",
      targetName: "Test Target",
      url: "https://example.com",
      hasChanges: false,
      monitorResult: {
        targetId: "test",
        targetName: "Test Target",
        url: "https://example.com",
        timestamp: new Date().toISOString(),
        success: true,
        content: "",
        contentHash: "",
        duration: 0,
      },
      timestamp: new Date().toISOString(),
    };

    return this.send(testPayload);
  }

  /**
   * Build Slack message attachment
   */
  private buildMessage(payload: NotificationPayload): Record<string, unknown> {
    const color = this.getColor(payload);
    const title = this.formatTitle(payload);
    const body = this.formatBody(payload);

    const message: Record<string, unknown> = {
      attachments: [
        {
          color,
          title,
          text: body,
          footer: "ZephyrSentinel",
          ts: Math.floor(Date.now() / 1000),
          actions: [
            {
              type: "button",
              text: "View Source",
              url: payload.url,
            },
          ],
        },
      ],
    };

    if (this.config.channel) {
      message.channel = this.config.channel;
    }

    if (this.config.username) {
      message.username = this.config.username;
    }

    if (this.config.iconEmoji) {
      message.icon_emoji = this.config.iconEmoji;
    }

    return message;
  }

  /**
   * Get attachment color based on status
   */
  private getColor(payload: NotificationPayload): string {
    if (!payload.monitorResult.success) {
      return "danger";
    }

    if (payload.hasChanges) {
      return "warning";
    }

    return "good";
  }
}
