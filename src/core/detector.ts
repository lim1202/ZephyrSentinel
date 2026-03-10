import { type DiffResult, compareContent, formatDiff, getChangeSummary } from "../utils/diff.js";
import { hashContent, normalizeContent } from "../utils/hash.js";

/**
 * Change detection result
 */
export interface ChangeDetectionResult {
  hasChanges: boolean;
  oldHash: string | null;
  newHash: string;
  diff?: DiffResult;
  diffText?: string;
  changeSummary?: string;
}

/**
 * Change detection options
 */
export interface ChangeDetectorOptions {
  normalizeWhitespace?: boolean;
  ignoreEmptyLines?: boolean;
  customNormalizer?: (content: string) => string;
}

/**
 * Change detector class
 */
export class ChangeDetector {
  private options: ChangeDetectorOptions;

  constructor(options: ChangeDetectorOptions = {}) {
    this.options = options;
  }

  /**
   * Detect changes between old and new content
   */
  detect(oldContent: string | null, newContent: string): ChangeDetectionResult {
    // Normalize content if options are set
    const normalizedOld = oldContent ? this.normalize(oldContent) : null;
    const normalizedNew = this.normalize(newContent);

    // Calculate hashes
    const oldHash = normalizedOld ? hashContent(normalizedOld) : null;
    const newHash = hashContent(normalizedNew);

    // Check for changes
    if (oldHash === newHash) {
      return {
        hasChanges: false,
        oldHash,
        newHash,
      };
    }

    // Generate diff if there are changes
    const diff = normalizedOld ? compareContent(normalizedOld, normalizedNew) : null;

    const result: ChangeDetectionResult = {
      hasChanges: true,
      oldHash,
      newHash,
    };

    if (diff) {
      result.diff = diff;
      result.diffText = formatDiff(diff);
      result.changeSummary = getChangeSummary(diff);
    }

    return result;
  }

  /**
   * Detect changes using pre-computed hash
   */
  detectFromHash(oldHash: string | null, newContent: string): ChangeDetectionResult {
    const normalizedNew = this.normalize(newContent);
    const newHash = hashContent(normalizedNew);

    return {
      hasChanges: oldHash !== newHash,
      oldHash,
      newHash,
    };
  }

  /**
   * Normalize content according to options
   */
  private normalize(content: string): string {
    let normalized = content;

    if (this.options.customNormalizer) {
      normalized = this.options.customNormalizer(normalized);
    } else {
      const opts: { ignoreWhitespace?: boolean; trimLines?: boolean; removeEmptyLines?: boolean } =
        {
          trimLines: true,
        };
      if (this.options.normalizeWhitespace !== undefined) {
        opts.ignoreWhitespace = this.options.normalizeWhitespace;
      }
      if (this.options.ignoreEmptyLines !== undefined) {
        opts.removeEmptyLines = this.options.ignoreEmptyLines;
      }
      normalized = normalizeContent(normalized, opts);
    }

    return normalized;
  }

  /**
   * Calculate hash for content
   */
  hash(content: string): string {
    const normalized = this.normalize(content);
    return hashContent(normalized);
  }
}

/**
 * Create a default change detector
 */
export function createChangeDetector(options?: ChangeDetectorOptions): ChangeDetector {
  return new ChangeDetector(options);
}
