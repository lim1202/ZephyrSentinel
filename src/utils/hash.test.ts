import { describe, it, expect } from 'vitest';
import { hashContent, verifyHash, normalizeContent } from './hash';

describe('hashContent', () => {
  it('should generate consistent hashes', () => {
    const data = 'test data';
    const hash1 = hashContent(data);
    const hash2 = hashContent(data);
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different inputs', () => {
    const hash1 = hashContent('data1');
    const hash2 = hashContent('data2');
    expect(hash1).not.toBe(hash2);
  });

  it('should return a string', () => {
    const result = hashContent('test');
    expect(typeof result).toBe('string');
  });
});

describe('verifyHash', () => {
  it('should verify correct hash', () => {
    const content = 'test content';
    const expected = hashContent(content);
    expect(verifyHash(content, expected)).toBe(true);
  });

  it('should reject incorrect hash', () => {
    const content = 'test content';
    expect(verifyHash(content, 'wrong-hash')).toBe(false);
  });
});

describe('normalizeContent', () => {
  it('should trim lines when option is enabled', () => {
    const content = '  line1  \n  line2  \n';
    const normalized = normalizeContent(content, { trimLines: true });
    expect(normalized).toBe('line1\nline2\n');
  });

  it('should remove empty lines when option is enabled', () => {
    const content = 'line1\n\nline2\n';
    const normalized = normalizeContent(content, { removeEmptyLines: true });
    expect(normalized).toBe('line1\nline2');
  });

  it('should ignore whitespace when option is enabled', () => {
    const content = 'line1   line2';
    const normalized = normalizeContent(content, { ignoreWhitespace: true });
    expect(normalized).toBe('line1 line2');
  });
});
