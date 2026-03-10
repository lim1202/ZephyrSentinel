import * as cheerio from "cheerio";
import type { TargetConfig } from "../config/schema.js";
import { hashContent, normalizeContent } from "../utils/hash.js";
import { httpGet } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import { BaseMonitor, type MonitorCheckOptions, type MonitorResult } from "./base.js";

/**
 * Webpage monitor - monitors HTML content
 */
export class WebpageMonitor extends BaseMonitor {
  private webpageConfig: TargetConfig & { type: "webpage" };

  constructor(config: TargetConfig & { type: "webpage" }) {
    super(config);
    this.webpageConfig = config;
  }

  get type(): string {
    return "webpage";
  }

  async check(options?: MonitorCheckOptions): Promise<MonitorResult> {
    const startTime = Date.now();
    const timeout = this.getTimeout(options);

    try {
      logger.debug(`Fetching webpage: ${this.url}`);

      const response = await httpGet(this.url, {
        timeout,
        headers: this.webpageConfig.http?.headers,
        retries: this.webpageConfig.http?.retries,
        retryDelay: this.webpageConfig.http?.retryDelay,
      });

      if (response.status >= 400) {
        return this.createErrorResult(
          `HTTP ${response.status}: ${response.statusText}`,
          Date.now() - startTime
        );
      }

      // Parse and extract content
      const html =
        typeof response.data === "string" ? response.data : JSON.stringify(response.data);

      const content = this.extractContent(html);
      const normalizedContent = this.normalizeContent(content);
      const contentHash = hashContent(normalizedContent);

      return this.createSuccessResult(normalizedContent, contentHash, Date.now() - startTime, {
        originalSize: html.length,
        extractedSize: content.length,
        selector: this.webpageConfig.selector,
        responseStatus: response.status,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug(`Webpage check failed for ${this.id}: ${errorMessage}`);
      return this.createErrorResult(errorMessage, Date.now() - startTime);
    }
  }

  /**
   * Extract content from HTML using selector
   */
  private extractContent(html: string): string {
    const $ = cheerio.load(html);

    // Remove excluded elements first
    if (this.webpageConfig.excludeSelectors) {
      for (const selector of this.webpageConfig.excludeSelectors) {
        $(selector).remove();
      }
    }

    // Extract content
    let content: string;

    if (this.webpageConfig.selector) {
      const selected = $(this.webpageConfig.selector);
      content = selected.text() ?? "";
    } else {
      // Get body text or full HTML
      content = $("body").text() ?? $.text();
    }

    return content;
  }

  /**
   * Normalize content based on config
   */
  private normalizeContent(content: string): string {
    return normalizeContent(content, {
      ignoreWhitespace: this.webpageConfig.ignoreWhitespace ?? false,
      trimLines: true,
      removeEmptyLines: true,
    });
  }
}
