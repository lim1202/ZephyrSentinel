import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { load } from "js-yaml";
import type { z } from "zod";
import { logger } from "../utils/logger.js";
import { type Config, ConfigSchema } from "./schema.js";

/**
 * Configuration file names to search for
 */
const CONFIG_FILES = ["monitor.yaml", "monitor.yml", "config.yaml", "config.yml", ".monitor.yaml"];

/**
 * Configuration loader options
 */
export interface ConfigLoaderOptions {
  configPath?: string;
  env?: NodeJS.ProcessEnv;
}

/**
 * Load configuration from a file
 */
export async function loadConfig(options: ConfigLoaderOptions = {}): Promise<Config> {
  const configPath = findConfigFile(options.configPath);

  if (!configPath) {
    throw new ConfigError(
      "Configuration file not found. Create a monitor.yaml file or specify a path."
    );
  }

  logger.debug(`Loading configuration from: ${configPath}`);

  const content = await readFile(configPath, "utf-8");
  const rawConfig = load(content) as unknown;

  // Substitute environment variables
  const substitutedConfig = substituteEnvVars(rawConfig, options.env ?? process.env);

  // Validate with Zod
  const result = ConfigSchema.safeParse(substitutedConfig);

  if (!result.success) {
    const issues = formatZodIssues(result.error);
    throw new ConfigError(`Configuration validation failed:\n${issues}`);
  }

  logger.debug(`Configuration loaded successfully: ${result.data.targets.length} targets`);

  return result.data;
}

/**
 * Find the configuration file
 */
function findConfigFile(explicitPath?: string): string | null {
  if (explicitPath) {
    if (!existsSync(explicitPath)) {
      throw new ConfigError(`Configuration file not found: ${explicitPath}`);
    }
    return explicitPath;
  }

  for (const filename of CONFIG_FILES) {
    if (existsSync(filename)) {
      return filename;
    }
  }

  return null;
}

/**
 * Substitute environment variables in configuration
 * Supports ${VAR_NAME} and ${VAR_NAME:-default} syntax
 */
function substituteEnvVars(value: unknown, env: NodeJS.ProcessEnv): unknown {
  if (typeof value === "string") {
    // Match ${VAR} or ${VAR:-default}
    return value.replace(/\$\{(\w+)(?::-(.*?))?\}/g, (_, varName, defaultValue) => {
      const envValue = env[varName];
      if (envValue !== undefined) {
        return envValue;
      }
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      return "";
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => substituteEnvVars(item, env));
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = substituteEnvVars(val, env);
    }
    return result;
  }

  return value;
}

/**
 * Format Zod validation issues for display
 */
function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `  - ${path ? `${path}: ` : ""}${issue.message}`;
    })
    .join("\n");
}

/**
 * Custom configuration error
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Validate configuration without loading
 */
export function validateConfig(config: unknown): Config {
  const result = ConfigSchema.parse(config);
  return result;
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): Partial<Config> {
  return {
    version: "1.0",
    global: {
      timezone: "UTC",
      timeout: 30000,
      concurrency: 5,
      failFast: false,
      dryRun: false,
    },
    targets: [],
    notifications: {},
    storage: {
      type: "git",
      git: {
        branch: "state",
        path: "state",
        commitMessage: "chore: update monitoring state [skip ci]",
        authorName: "mutation-watcher[bot]",
        authorEmail: "mutation-watcher[bot]@users.noreply.github.com",
      },
    },
  };
}
