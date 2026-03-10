#!/usr/bin/env node

import { Command } from "commander";
import { Engine } from "./core/engine.js";
import { createNotifiers } from "./notifiers/index.js";
import { loadConfig } from "./config/index.js";
import { createLogger, logger } from "./utils/logger.js";

const program = new Command();

program
  .name("zephyr-sentinel")
  .description("Website/API change monitoring and notification system")
  .version("1.0.0")
  .option("-c, --config <path>", "Path to configuration file")
  .option("-v, --verbose", "Enable verbose logging", false)
  .option("-q, --quiet", "Suppress all output except errors", false);

/**
 * Run command - Execute monitoring checks
 */
program
  .command("run")
  .description("Run monitoring checks for all targets")
  .option("-t, --target <id>", "Run only for specific target ID")
  .option("-n, --concurrency <number>", "Number of concurrent checks", "5")
  .option("--dry-run", "Run without saving state or sending notifications", false)
  .action(async (options, cmd) => {
    setupLogger(cmd.parent.opts());

    const engine = new Engine();

    try {
      const summary = await engine.run({
        configPath: cmd.parent.opts().config,
        targetId: options.target,
        concurrency: Number.parseInt(options.concurrency, 10),
        dryRun: options.dryRun,
      });

      // Exit with error code if any targets failed
      if (summary.failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      logger.error(
        `Failed to run monitoring: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

/**
 * Test command - Test notification channels
 */
program
  .command("test")
  .description("Test notification channels")
  .argument("[channel]", "Channel to test (dingtalk, telegram, webhook, slack)")
  .action(async (channel, options, cmd) => {
    setupLogger(cmd.parent.opts());

    try {
      const config = await loadConfig({
        configPath: cmd.parent.opts().config,
      });

      const notifiers = createNotifiers(config.notifications);

      if (channel) {
        const notifier = notifiers.find((n) => n.channel === channel);
        if (!notifier) {
          logger.error(`Notifier '${channel}' not found or not configured`);
          process.exit(1);
        }

        logger.info(`Testing ${channel} notification...`);
        const result = await notifier.test();

        if (result.success) {
          logger.info(`✓ ${channel} notification sent successfully`);
        } else {
          logger.error(`✗ ${channel} notification failed: ${result.error}`);
          process.exit(1);
        }
      } else {
        if (notifiers.length === 0) {
          logger.warn("No notification channels configured");
          return;
        }

        logger.info(`Testing ${notifiers.length} notification channels...`);

        for (const notifier of notifiers) {
          try {
            const result = await notifier.test();
            logger.notificationSent(notifier.channel, result.success);

            if (!result.success) {
              logger.error(`  Error: ${result.error}`);
            }
          } catch (error) {
            logger.error(
              `Failed to test ${notifier.channel}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      }
    } catch (error) {
      logger.error(
        `Failed to test notifications: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

/**
 * Validate command - Validate configuration file
 */
program
  .command("validate")
  .description("Validate configuration file")
  .action(async (options, cmd) => {
    setupLogger(cmd.parent.opts());

    try {
      const config = await loadConfig({
        configPath: cmd.parent.opts().config,
      });

      logger.info("✓ Configuration is valid");
      logger.info(`  Targets: ${config.targets.length}`);

      const enabledTargets = config.targets.filter((t) => t.enabled !== false);
      logger.info(`  Enabled: ${enabledTargets.length}`);

      const channels = Object.entries(config.notifications)
        .filter(([, cfg]) => cfg && (cfg as { enabled?: boolean }).enabled !== false)
        .map(([name]) => name);
      logger.info(`  Notifications: ${channels.join(", ") || "none"}`);
    } catch (error) {
      logger.error(
        `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

/**
 * Status command - Show monitoring status
 */
program
  .command("status")
  .description("Show current monitoring state")
  .option("-t, --target <id>", "Show status for specific target")
  .action(async (options, cmd) => {
    setupLogger(cmd.parent.opts());

    try {
      const config = await loadConfig({
        configPath: cmd.parent.opts().config,
      });

      const engine = new Engine();
      await engine.loadConfiguration({ configPath: cmd.parent.opts().config });

      // Import storage to read state
      const { createStorage } = await import("./storage/index.js");
      const storage = createStorage(config.storage);
      await storage.init();
      const state = await storage.load();

      if (options.target) {
        const targetState = state.targets[options.target];
        if (!targetState) {
          logger.error(`Target '${options.target}' not found in state`);
          process.exit(1);
        }

        printTargetStatus(options.target, targetState);
      } else {
        logger.info(`State updated: ${state.updatedAt}`);
        logger.info(`Targets monitored: ${Object.keys(state.targets).length}`);
        logger.separator();

        for (const [id, targetState] of Object.entries(state.targets)) {
          printTargetStatus(id, targetState);
        }
      }
    } catch (error) {
      logger.error(
        `Failed to get status: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

/**
 * Setup logger based on options
 */
function setupLogger(options: { verbose?: boolean; quiet?: boolean }): void {
  if (options.quiet) {
    logger.setLevel("error");
  } else if (options.verbose) {
    logger.setLevel("debug");
  } else {
    logger.setLevel("info");
  }
}

/**
 * Print target status
 */
function printTargetStatus(id: string, state: { [key: string]: unknown }): void {
  logger.info(`Target: ${id}`);
  logger.info(`  Last check: ${(state as { lastCheck: string }).lastCheck ?? "never"}`);
  logger.info(`  Last success: ${(state as { lastSuccess: boolean }).lastSuccess}`);
  logger.info(`  Check count: ${(state as { checkCount: number }).checkCount}`);
  logger.info(`  Change count: ${(state as { changeCount: number }).changeCount}`);

  if ((state as { lastError: string | null }).lastError) {
    logger.info(`  Last error: ${(state as { lastError: string | null }).lastError}`);
  }

  logger.info("");
}

// Parse arguments and run
program.parse();