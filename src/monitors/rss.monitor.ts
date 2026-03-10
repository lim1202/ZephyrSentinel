import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { TargetConfig } from "../config/schema.js";
import { hashContent } from "../utils/hash.js";
import { httpGet } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import { BaseMonitor, type MonitorCheckOptions, type MonitorResult } from "./base.js";

/**
 * RSS feed item
 */
interface RssItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  guid?: string;
}

/**
 * RSS monitor - monitors RSS/Atom feeds
 */
export class RssMonitor extends BaseMonitor {
  private rssConfig: TargetConfig & { type: "rss" };

  constructor(config: TargetConfig & { type: "rss" }) {
    super(config);
    this.rssConfig = config;
  }

  get type(): string {
    return "rss";
  }

  async check(options?: MonitorCheckOptions): Promise<MonitorResult> {
    const startTime = Date.now();
    const timeout = this.getTimeout(options);

    try {
      logger.debug(`Fetching RSS feed: ${this.url}`);

      const response = await httpGet(this.url, {
        timeout,
        headers: {
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
          ...this.rssConfig.http?.headers,
        },
        retries: this.rssConfig.http?.retries,
        retryDelay: this.rssConfig.http?.retryDelay,
      });

      if (response.status >= 400) {
        return this.createErrorResult(
          `HTTP ${response.status}: ${response.statusText}`,
          Date.now() - startTime
        );
      }

      const xml = typeof response.data === "string" ? response.data : JSON.stringify(response.data);

      // Parse RSS/Atom feed
      const items = this.parseFeed(xml);
      const content = JSON.stringify(items, null, 2);
      const contentHash = hashContent(content);

      return this.createSuccessResult(content, contentHash, Date.now() - startTime, {
        itemCount: items.length,
        responseStatus: response.status,
        feedType: this.detectFeedType(xml),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug(`RSS check failed for ${this.id}: ${errorMessage}`);
      return this.createErrorResult(errorMessage, Date.now() - startTime);
    }
  }

  /**
   * Parse RSS or Atom feed
   */
  private parseFeed(xml: string): RssItem[] {
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: RssItem[] = [];

    // Try RSS format first
    const rssItems = $("item");
    if (rssItems.length > 0) {
      rssItems.each((_, element) => {
        const $item = $(element);
        items.push(this.parseRssItem($item));
      });
    } else {
      // Try Atom format
      const atomEntries = $("entry");
      atomEntries.each((_, element) => {
        const $entry = $(element);
        items.push(this.parseAtomEntry($entry));
      });
    }

    // Limit items if configured
    if (this.rssConfig.maxItems && items.length > this.rssConfig.maxItems) {
      items.length = this.rssConfig.maxItems;
    }

    return items;
  }

  /**
   * Parse RSS item
   */
  private parseRssItem($item: cheerio.Cheerio<Element>): RssItem {
    const item: RssItem = {
      title: $item.find("title").text() ?? "",
      link: $item.find("link").text() ?? "",
    };

    const description = $item.find("description").text();
    if (description) item.description = description;

    const pubDate = $item.find("pubDate").text();
    if (pubDate) item.pubDate = pubDate;

    const guid = $item.find("guid").text();
    if (guid) item.guid = guid;

    return item;
  }

  /**
   * Parse Atom entry
   */
  private parseAtomEntry($entry: cheerio.Cheerio<Element>): RssItem {
    const item: RssItem = {
      title: $entry.find("title").text() ?? "",
      link: $entry.find("link").attr("href") ?? "",
    };

    const summary = $entry.find("summary").text();
    if (summary) item.description = summary;

    const published = $entry.find("published").text() || $entry.find("updated").text();
    if (published) item.pubDate = published;

    const id = $entry.find("id").text();
    if (id) item.guid = id;

    return item;
  }

  /**
   * Detect feed type
   */
  private detectFeedType(xml: string): string {
    if (xml.includes("<rss")) return "RSS";
    if (xml.includes("<feed")) return "Atom";
    return "Unknown";
  }
}
