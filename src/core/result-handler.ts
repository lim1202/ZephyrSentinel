import type { TargetConfig } from "../config/schema.js";
import type { MonitorResult } from "../monitors/base.js";
import type { TargetState } from "../storage/base.js";
import type { ChangeDetectionResult } from "./detector.js";

/**
 * Processed monitoring result with full context
 */
export interface ProcessedResult {
  target: TargetConfig;
  monitorResult: MonitorResult;
  previousState: TargetState | null;
  newState: TargetState;
  changeResult: ChangeDetectionResult;
  shouldNotify: boolean;
  notificationType: NotificationType;
}

/**
 * Type of notification to send
 */
export type NotificationType = "change" | "error" | "recovery" | "first_check" | "none";

/**
 * Engine execution summary
 */
export interface ExecutionSummary {
  totalTargets: number;
  successful: number;
  failed: number;
  changed: number;
  unchanged: number;
  firstChecks: number;
  duration: number;
  results: ProcessedResult[];
}

/**
 * Result handler class
 */
export class ResultHandler {
  /**
   * Determine if a notification should be sent
   */
  shouldNotify(
    target: TargetConfig,
    monitorResult: MonitorResult,
    previousState: TargetState | null,
    hasChanges: boolean
  ): { shouldNotify: boolean; type: NotificationType } {
    const alertConfig = target.alertOn ?? {
      change: true,
      error: true,
      recovery: true,
    };

    // First check
    if (!previousState) {
      return {
        shouldNotify: false, // Don't notify on first check by default
        type: "first_check",
      };
    }

    // Error case
    if (!monitorResult.success) {
      // Only notify if this is a new error (previous was success)
      if (previousState.lastSuccess && alertConfig.error) {
        return { shouldNotify: true, type: "error" };
      }
      return { shouldNotify: false, type: "error" };
    }

    // Recovery case
    if (!previousState.lastSuccess && monitorResult.success) {
      if (alertConfig.recovery) {
        return { shouldNotify: true, type: "recovery" };
      }
      return { shouldNotify: false, type: "recovery" };
    }

    // Change detected
    if (hasChanges) {
      if (alertConfig.change) {
        return { shouldNotify: true, type: "change" };
      }
      return { shouldNotify: false, type: "change" };
    }

    return { shouldNotify: false, type: "none" };
  }

  /**
   * Process a monitor result
   */
  processResult(
    target: TargetConfig,
    monitorResult: MonitorResult,
    previousState: TargetState | null,
    newState: TargetState,
    changeResult: ChangeDetectionResult
  ): ProcessedResult {
    const { shouldNotify, type } = this.shouldNotify(
      target,
      monitorResult,
      previousState,
      changeResult.hasChanges
    );

    return {
      target,
      monitorResult,
      previousState,
      newState,
      changeResult,
      shouldNotify,
      notificationType: type,
    };
  }

  /**
   * Create execution summary from results
   */
  createSummary(results: ProcessedResult[], duration: number): ExecutionSummary {
    let successful = 0;
    let failed = 0;
    let changed = 0;
    let unchanged = 0;
    let firstChecks = 0;

    for (const result of results) {
      if (result.monitorResult.success) {
        successful++;
      } else {
        failed++;
      }

      if (result.changeResult.hasChanges) {
        changed++;
      } else {
        unchanged++;
      }

      if (!result.previousState) {
        firstChecks++;
      }
    }

    return {
      totalTargets: results.length,
      successful,
      failed,
      changed,
      unchanged,
      firstChecks,
      duration,
      results,
    };
  }

  /**
   * Format summary for display
   */
  formatSummary(summary: ExecutionSummary): string {
    const lines: string[] = [];

    lines.push("Execution Summary:");
    lines.push(`  Total targets: ${summary.totalTargets}`);
    lines.push(`  Successful: ${summary.successful}`);
    lines.push(`  Failed: ${summary.failed}`);
    lines.push(`  Changed: ${summary.changed}`);
    lines.push(`  Unchanged: ${summary.unchanged}`);
    lines.push(`  First checks: ${summary.firstChecks}`);
    lines.push(`  Duration: ${(summary.duration / 1000).toFixed(2)}s`);

    return lines.join("\n");
  }
}
