import crypto from "node:crypto";

/**
 * Calculate SHA-256 hash of content
 */
export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Calculate MD5 hash of content (for compatibility)
 */
export function hashContentMd5(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

/**
 * Normalize content for comparison
 */
export function normalizeContent(
  content: string,
  options: {
    ignoreWhitespace?: boolean;
    trimLines?: boolean;
    removeEmptyLines?: boolean;
  } = {}
): string {
  let normalized = content;

  if (options.trimLines) {
    normalized = normalized
      .split("\n")
      .map((line) => line.trim())
      .join("\n");
  }

  if (options.removeEmptyLines) {
    normalized = normalized
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .join("\n");
  }

  if (options.ignoreWhitespace) {
    normalized = normalized.replace(/\s+/g, " ").trim();
  }

  return normalized;
}

/**
 * Hash object as JSON string
 */
export function hashObject(obj: unknown): string {
  const json = JSON.stringify(obj, Object.keys(obj as object).sort());
  return hashContent(json);
}

/**
 * Verify content hash
 */
export function verifyHash(content: string, expectedHash: string): boolean {
  return hashContent(content) === expectedHash;
}