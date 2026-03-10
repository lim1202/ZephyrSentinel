import type { MonitorResult } from "../monitors/base.js";

/**
 * Target state stored in state file
 */
export interface TargetState {
  id: string;
  lastCheck: string;
  lastHash: string | null;
  lastContent: string | null;
  lastSuccess: boolean;
  lastError: string | null;
  checkCount: number;
  changeCount: number;
  lastChangeAt: string | null;
}

/**
 * Full state structure
 */
export interface State {
  version: string;
  updatedAt: string;
  targets: Record<string, TargetState>;
}

/**
 * Storage interface
 */
export interface IStorage {
  /**
   * Load state from storage
   */
  load(): Promise<State>;

  /**
   * Save state to storage
   */
  save(state: State): Promise<void>;

  /**
   * Get state for a specific target
   */
  getTargetState(targetId: string): Promise<TargetState | null>;

  /**
   * Update state for a specific target
   */
  updateTargetState(targetId: string, state: TargetState): Promise<void>;

  /**
   * Check if storage is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Initialize storage
   */
  init(): Promise<void>;
}

/**
 * Create initial empty state
 */
export function createEmptyState(): State {
  return {
    version: "1.0",
    updatedAt: new Date().toISOString(),
    targets: {},
  };
}

/**
 * Create target state from monitor result
 */
export function createTargetState(
  result: MonitorResult,
  previousState?: TargetState | null
): TargetState {
  const now = new Date().toISOString();
  const hasChanges = previousState?.lastHash !== result.contentHash && previousState?.lastHash !== null;

  return {
    id: result.targetId,
    lastCheck: now,
    lastHash: result.success ? result.contentHash ?? null : previousState?.lastHash ?? null,
    lastContent: result.success ? result.content ?? null : previousState?.lastContent ?? null,
    lastSuccess: result.success,
    lastError: result.success ? null : result.error ?? null,
    checkCount: (previousState?.checkCount ?? 0) + 1,
    changeCount: (previousState?.changeCount ?? 0) + (hasChanges ? 1 : 0),
    lastChangeAt: hasChanges ? now : previousState?.lastChangeAt ?? null,
  };
}