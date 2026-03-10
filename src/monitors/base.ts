import type { TargetConfig } from "../config/schema.js";

/**
 * Monitor check result
 */
export interface MonitorResult {
  targetId: string;
  targetName: string;
  url: string;
  timestamp: string;
  success: boolean;
  content?: string;
  contentHash?: string;
  error?: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

/**
 * Monitor check options
 */
export interface MonitorCheckOptions {
  timeout?: number;
  dryRun?: boolean;
}

/**
 * Abstract base class for all monitors
 */
export abstract class BaseMonitor {
  protected config: TargetConfig;

  constructor(config: TargetConfig) {
    this.config = config;
  }

  /**
   * Get the unique identifier for this monitor
   */
  get id(): string {
    return this.config.id;
  }

  /**
   * Get the display name for this monitor
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Get the URL being monitored
   */
  get url(): string {
    return this.config.url;
  }

  /**
   * Get the monitor type
   */
  abstract get type(): string;

  /**
   * Perform the monitoring check
   */
  abstract check(options?: MonitorCheckOptions): Promise<MonitorResult>;

  /**
   * Validate the monitor configuration
   */
  validateConfig(): boolean {
    // Basic validation - override in subclasses for specific validation
    if (!this.config.url) {
      throw new MonitorConfigError(`Target ${this.config.id}: URL is required`);
    }

    return true;
  }

  /**
   * Create a successful result
   */
  protected createSuccessResult(
    content: string,
    contentHash: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): MonitorResult {
    return {
      targetId: this.config.id,
      targetName: this.config.name,
      url: this.config.url,
      timestamp: new Date().toISOString(),
      success: true,
      content,
      contentHash,
      duration,
      metadata,
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(error: string, duration: number): MonitorResult {
    return {
      targetId: this.config.id,
      targetName: this.config.name,
      url: this.config.url,
      timestamp: new Date().toISOString(),
      success: false,
      error,
      duration,
    };
  }

  /**
   * Get effective timeout for this monitor
   */
  protected getTimeout(options?: MonitorCheckOptions): number {
    return options?.timeout ?? this.config.http?.timeout ?? 30000;
  }
}

/**
 * Custom error for monitor configuration issues
 */
export class MonitorConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonitorConfigError";
  }
}

/**
 * Custom error for monitor runtime issues
 */
export class MonitorError extends Error {
  constructor(
    message: string,
    public readonly targetId: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "MonitorError";
  }
}
