import { describe, expect, it } from 'vitest';

describe('Basic Test Setup', () => {
  it('should work with basic Jest functionality', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const url = 'https://example.com/path';
    const normalized = url.replace(/^https?:\/\//, '');
    expect(normalized).toBe('example.com/path');
  });

  it('should handle array operations', () => {
    const domains = ['facebook.com', 'reddit.com'];
    const filtered = domains.filter(d => d.includes('facebook'));
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toBe('facebook.com');
  });
});
