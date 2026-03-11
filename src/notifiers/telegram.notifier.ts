import type { NotificationChannel, TelegramConfig } from "../config/schema.js";
import { httpPost } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import { BaseNotifier, type NotificationPayload, type NotificationResult } from "./base.js";

/**
 * Telegram API response
 */
interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

/**
 * Telegram notifier implementation
 */
export class TelegramNotifier extends BaseNotifier<TelegramConfig> {
  get channel(): NotificationChannel {
    return "telegram";
  }

  isEnabled(): boolean {
    return this.config.enabled ?? true;
  }

  validateConfig(): boolean {
    if (!this.config.botToken) {
      throw new Error("Telegram bot token is required");
    }

    if (!this.config.chatId) {
      throw new Error("Telegram chat ID is required");
    }

    return true;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const startTime = Date.now();

    try {
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
      const message = this.buildMessage(payload);

      logger.debug(`Sending Telegram notification for: ${payload.targetId}`);

      const response = await httpPost(url, message, {
        timeout: 10000,
      });

      const data = response.data as TelegramResponse;

      if (!data.ok) {
        return this.createErrorResult(
          `Telegram API error: ${data.description ?? "Unknown error"}`,
          Date.now() - startTime
        );
      }

      return this.createSuccessResult(Date.now() - startTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug(`Telegram notification failed: ${errorMessage}`);
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
   * Build Telegram message
   */
  private buildMessage(payload: NotificationPayload): Record<string, unknown> {
    const title = this.formatTitle(payload);
    const body = this.formatBody(payload);
    const parseMode = this.config.parseMode ?? "HTML";
    const linkUrl = payload.webUrl ?? payload.url;

    let text: string;
    if (parseMode === "HTML") {
      text = `<b>${this.escapeHtml(title)}</b>\n\n${this.formatBodyHtml(body)}\n\n<a href="${linkUrl}">View Details</a>`;
    } else if (parseMode === "Markdown" || parseMode === "MarkdownV2") {
      text = `*${this.escapeMarkdown(title)}*\n\n${this.formatBodyMarkdown(body)}\n\n[View Details](${linkUrl})`;
    } else {
      text = `${title}\n\n${body}\n\n${linkUrl}`;
    }

    return {
      chat_id: this.config.chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: false,
    };
  }

  /**
   * Format body for HTML
   */
  private formatBodyHtml(body: string): string {
    return body.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  /**
   * Format body for Markdown
   */
  private formatBodyMarkdown(body: string): string {
    return body;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /**
   * Escape Markdown special characters
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
  }
}
