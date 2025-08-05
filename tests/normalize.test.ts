import { describe, expect, it } from 'vitest';
import { normalizeUrl } from '../components/intention';

describe('normalizeUrl - Resilience Tests', () => {
  it('should normalize valid URLs correctly', () => {
    expect(normalizeUrl(new URL('https://www.example.com/path'))).toBe(
      'example.com/path'
    );
    expect(normalizeUrl(new URL('http://facebook.com'))).toBe('facebook.com');
    expect(normalizeUrl(new URL('https://reddit.com/r/vegan'))).toBe(
      'reddit.com/r/vegan'
    );
  });

  it('should handle user input patterns', () => {
    expect(normalizeUrl(new URL('https://facebook.com'))).toBe('facebook.com');
    expect(normalizeUrl(new URL('https://example.com?param=value'))).toBe(
      'example.com'
    );
    expect(normalizeUrl(new URL('https://example.com#fragment'))).toBe(
      'example.com'
    );
  });

  it('should normalize valid URLs correctly', () => {
    expect(normalizeUrl(new URL('https://www.example.com/path'))).toBe(
      'example.com/path'
    );
    expect(normalizeUrl(new URL('http://facebook.com'))).toBe('facebook.com');
    expect(normalizeUrl(new URL('https://reddit.com/r/vegan'))).toBe(
      'reddit.com/r/vegan'
    );
  });

  it('should handle user input patterns', () => {
    expect(normalizeUrl(new URL('https://facebook.com'))).toBe('facebook.com');
    expect(normalizeUrl(new URL('https://example.com?param=value'))).toBe(
      'example.com'
    );
    expect(normalizeUrl(new URL('https://example.com#fragment'))).toBe(
      'example.com'
    );
    expect(normalizeUrl(new URL('https://example.com/'))).toBe('example.com');
  });
});
