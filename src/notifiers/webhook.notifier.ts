import type { NotificationChannel, WebhookConfig } from "../config/schema.js";
import { httpPost } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import { BaseNotifier, type NotificationPayload, type NotificationResult } from "./base.js";

/**
 * Generic webhook notifier implementation
 */
export class WebhookNotifier extends BaseNotifier<WebhookConfig> {
  get channel(): NotificationChannel {
    return "webhook";
  }

  isEnabled(): boolean {
    return this.config.enabled ?? true;
  }

  validateConfig(): boolean {
    if (!this.config.url) {
      throw new Error("Webhook URL is required");
    }

    return true;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const startTime = Date.now();

    try {
      const body = this.buildWebhookBody(payload);

      logger.debug(`Sending webhook notification for: ${payload.targetId}`);

      const response = await httpPost(this.config.url, body, {
        timeout: 10000,
        headers: this.config.headers,
      });

      if (response.status >= 400) {
        return this.createErrorResult(
          `Webhook returned status ${response.status}`,
          Date.now() - startTime
        );
      }

      return this.createSuccessResult(Date.now() - startTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug(`Webhook notification failed: ${errorMessage}`);
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
   * Build webhook request body
   */
  private buildWebhookBody(payload: NotificationPayload): Record<string, unknown> {
    if (this.config.template) {
      // Use custom template if provided
      return this.applyTemplate(this.config.template, payload);
    }

    // Default payload structure
    return {
      event: payload.hasChanges ? "change_detected" : "check_completed",
      target: {
        id: payload.targetId,
        name: payload.targetName,
        url: payload.url,
        webUrl: payload.webUrl,
      },
      status: payload.monitorResult.success ? "success" : "error",
      hasChanges: payload.hasChanges,
      timestamp: payload.timestamp,
      changeResult: payload.changeResult,
      error: payload.monitorResult.error,
    };
  }

  /**
   * Apply custom template
   */
  private applyTemplate(template: string, payload: NotificationPayload): Record<string, unknown> {
    try {
      // Simple template substitution
      let result = template;
      result = result.replace(/\{\{targetId\}\}/g, payload.targetId);
      result = result.replace(/\{\{targetName\}\}/g, payload.targetName);
      result = result.replace(/\{\{url\}\}/g, payload.url);
      result = result.replace(/\{\{webUrl\}\}/g, payload.webUrl ?? payload.url);
      result = result.replace(/\{\{timestamp\}\}/g, payload.timestamp);
      result = result.replace(/\{\{hasChanges\}\}/g, String(payload.hasChanges));

      return JSON.parse(result);
    } catch {
      return { raw: template };
    }
  }
}
