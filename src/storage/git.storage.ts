import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { logger } from "../utils/logger.js";
import {
  type IStorage,
  type State,
  type TargetState,
  createEmptyState,
  createTargetState,
} from "./base.js";
import type { MonitorResult } from "../monitors/base.js";
import type { StorageConfig } from "../config/schema.js";

/**
 * Git-based state storage
 * Stores state in JSON files within the repository
 */
export class GitStorage implements IStorage {
  private stateDir: string;
  private stateFile: string;
  private initialized = false;

  constructor(config?: StorageConfig) {
    const gitConfig = config?.git;
    this.stateDir = gitConfig?.path ?? "state";
    this.stateFile = path.join(this.stateDir, "monitor-state.json");
  }

  async load(): Promise<State> {
    await this.ensureInitialized();

    if (!existsSync(this.stateFile)) {
      logger.debug("No existing state file, creating empty state");
      return createEmptyState();
    }

    try {
      const content = await readFile(this.stateFile, "utf-8");
      const state = JSON.parse(content) as State;
      logger.debug(`Loaded state with ${Object.keys(state.targets).length} targets`);
      return state;
    } catch (error) {
      logger.warn(
        `Failed to load state file: ${error instanceof Error ? error.message : String(error)}`
      );
      return createEmptyState();
    }
  }

  async save(state: State): Promise<void> {
    await this.ensureInitialized();

    state.updatedAt = new Date().toISOString();

    try {
      const content = JSON.stringify(state, null, 2);
      await writeFile(this.stateFile, content, "utf-8");
      logger.debug(`Saved state to ${this.stateFile}`);
    } catch (error) {
      logger.error(
        `Failed to save state: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async getTargetState(targetId: string): Promise<TargetState | null> {
    const state = await this.load();
    return state.targets[targetId] ?? null;
  }

  async updateTargetState(targetId: string, targetState: TargetState): Promise<void> {
    const state = await this.load();
    state.targets[targetId] = targetState;
    await this.save(state);
  }

  async isAvailable(): Promise<boolean> {
    return existsSync(this.stateDir);
  }

  async init(): Promise<void> {
    if (!existsSync(this.stateDir)) {
      await mkdir(this.stateDir, { recursive: true });
      logger.debug(`Created state directory: ${this.stateDir}`);
    }
    this.initialized = true;
  }

  /**
   * Update state with monitor result
   */
  async updateWithResult(result: MonitorResult): Promise<TargetState> {
    const state = await this.load();
    const previousState = state.targets[result.targetId];
    const newState = createTargetState(result, previousState);
    state.targets[result.targetId] = newState;
    await this.save(state);
    return newState;
  }

  /**
   * Get previous hash for a target
   */
  async getPreviousHash(targetId: string): Promise<string | null> {
    const targetState = await this.getTargetState(targetId);
    return targetState?.lastHash ?? null;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }
}

/**
 * Local file-based storage (alternative to Git storage)
 */
export class LocalStorage implements IStorage {
  private stateFile: string;

  constructor(config?: StorageConfig) {
    this.stateFile = path.join(config?.local?.path ?? "./state", "monitor-state.json");
  }

  async load(): Promise<State> {
    if (!existsSync(this.stateFile)) {
      return createEmptyState();
    }

    const content = await readFile(this.stateFile, "utf-8");
    return JSON.parse(content) as State;
  }

  async save(state: State): Promise<void> {
    const dir = path.dirname(this.stateFile);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    state.updatedAt = new Date().toISOString();
    await writeFile(this.stateFile, JSON.stringify(state, null, 2), "utf-8");
  }

  async getTargetState(targetId: string): Promise<TargetState | null> {
    const state = await this.load();
    return state.targets[targetId] ?? null;
  }

  async updateTargetState(targetId: string, targetState: TargetState): Promise<void> {
    const state = await this.load();
    state.targets[targetId] = targetState;
    await this.save(state);
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async init(): Promise<void> {
    const dir = path.dirname(this.stateFile);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

/**
 * Create storage instance based on configuration
 */
export function createStorage(config?: StorageConfig): IStorage {
  const type = config?.type ?? "git";

  switch (type) {
    case "git":
      return new GitStorage(config);
    case "local":
      return new LocalStorage(config);
    default:
      throw new Error(`Unknown storage type: ${type}`);
  }
}