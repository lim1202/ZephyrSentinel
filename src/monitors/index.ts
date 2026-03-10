import type { TargetConfig } from "../config/schema.js";
import { ApiMonitor } from "./api.monitor.js";
import type { BaseMonitor } from "./base.js";
import { RssMonitor } from "./rss.monitor.js";
import { WebpageMonitor } from "./webpage.monitor.js";

export {
  BaseMonitor,
  type MonitorCheckOptions,
  type MonitorResult,
  MonitorConfigError,
  MonitorError,
} from "./base.js";
export { WebpageMonitor } from "./webpage.monitor.js";
export { ApiMonitor } from "./api.monitor.js";
export { RssMonitor } from "./rss.monitor.js";

/**
 * Create a monitor instance based on target configuration
 */
export function createMonitor(config: TargetConfig): BaseMonitor {
  switch (config.type) {
    case "webpage":
      return new WebpageMonitor(config);
    case "api":
      return new ApiMonitor(config);
    case "rss":
      return new RssMonitor(config);
    default:
      throw new Error(`Unknown monitor type: ${(config as { type: string }).type}`);
  }
}

/**
 * Monitor registry - maps monitor types to their classes
 */
export const monitorRegistry = new Map<string, typeof BaseMonitor>([
  ["webpage", WebpageMonitor],
  ["api", ApiMonitor],
  ["rss", RssMonitor],
]);

/**
 * Register a custom monitor type
 */
export function registerMonitor(type: string, monitorClass: typeof BaseMonitor): void {
  monitorRegistry.set(type, monitorClass);
}

/**
 * Get monitor class by type
 */
export function getMonitorClass(type: string): typeof BaseMonitor | undefined {
  return monitorRegistry.get(type);
}
