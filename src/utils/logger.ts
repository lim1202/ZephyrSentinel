import pc from "picocolors";
import type { NotificationChannel } from "./config/schema.js";

/**
 * Log level enum
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  timestamps: boolean;
  colors: boolean;
  prefix?: string;
}

/**
 * Logger class for consistent output formatting
 */
export class Logger {
  private level: LogLevel;
  private timestamps: boolean;
  private colors: boolean;
  private prefix?: string;

  private static readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4,
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.level = config.level ?? "info";
    this.timestamps = config.timestamps ?? true;
    this.colors = config.colors ?? true;
    this.prefix = config.prefix;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.levels[level] >= Logger.levels[this.level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];

    if (this.timestamps) {
      const timestamp = new Date().toISOString();
      parts.push(this.colors ? pc.gray(timestamp) : timestamp);
    }

    const levelStr = this.formatLevel(level);
    parts.push(levelStr);

    if (this.prefix) {
      parts.push(this.colors ? pc.cyan(`[${this.prefix}]`) : `[${this.prefix}]`);
    }

    parts.push(message);

    return parts.join(" ");
  }

  private formatLevel(level: LogLevel): string {
    if (!this.colors) {
      return `[${level.toUpperCase()}]`;
    }

    const levelMap: Record<LogLevel, string> = {
      debug: pc.gray("[DEBUG]"),
      info: pc.blue("[INFO]"),
      warn: pc.yellow("[WARN]"),
      error: pc.red("[ERROR]"),
      silent: "",
    };

    return levelMap[level];
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.error(this.formatMessage("debug", message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.error(this.formatMessage("info", message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.error(this.formatMessage("warn", message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message), ...args);
    }
  }

  /**
   * Log a monitoring result
   */
  monitorResult(
    targetId: string,
    targetName: string,
    hasChanges: boolean,
    error?: string
  ): void {
    const status = error
      ? this.colors
        ? pc.red("✗ ERROR")
        : "✗ ERROR"
      : hasChanges
        ? this.colors
          ? pc.yellow("⚡ CHANGED")
          : "⚡ CHANGED"
        : this.colors
          ? pc.green("✓ OK")
          : "✓ OK";

    const message = `${status} ${targetName} (${targetId})`;
    if (error) {
      this.error(message, error);
    } else if (hasChanges) {
      this.warn(message);
    } else {
      this.info(message);
    }
  }

  /**
   * Log notification sent
   */
  notificationSent(channel: NotificationChannel, success: boolean): void {
    const status = success
      ? this.colors
        ? pc.green("✓")
        : "✓"
      : this.colors
        ? pc.red("✗")
        : "✗";
    this.info(`${status} Notification sent via ${channel}`);
  }

  /**
   * Log a separator line
   */
  separator(char = "─", length = 60): void {
    this.info(char.repeat(length));
  }

  /**
   * Create a child logger with a prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      level: this.level,
      timestamps: this.timestamps,
      colors: this.colors,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
    });
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a new logger with configuration
 */
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new Logger(config);
}