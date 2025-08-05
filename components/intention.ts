/**
 * Intention data structures and URL matching logic for the Intender extension.
 *
 * This module implements the URL matching specification that provides intuitive,
 * performant, language-aware matching for intention URLs.
 */

import countries from 'i18n-iso-countries';
import ISO6391 from 'iso-639-1';
import normalizeUrlLib from 'normalize-url';
import { parse } from 'tldts';
import { Brand } from 'ts-brand';

// ============================================================================
// TYPES
// ============================================================================

// Branded type for validated normalized URLs
type NormalizedUrl = Brand<string, 'NormalizedUrl'>;

// Branded type for intention index
export type IntentionIndex = Brand<
  Map<string, { scope: IntentionScope; intention: Intention }[]>,
  'IntentionIndex'
>;

export interface Intention {
  scope: IntentionScope;
  phrase: string;
}

export interface IntentionScope {
  domain: string; // e.g. "facebook"
  publicSuffix: string; // e.g. "com", "se", "co.uk"
  subdomain: string | null; // e.g. "sv", "mail" or null
  path: string; // e.g. "/groups/foo", may be ""
  urlLength: number; // length of the full normalized string
  hasLanguageSuffix: boolean; // true if publicSuffix is a language-specific TLD
  hasLanguageSubdomain: boolean; // true if subdomain is a language code
  hasLanguagePathStart: boolean; // true if path starts with a language code
}

// ============================================================================
// URL PARSING AND NORMALIZATION
// ============================================================================

/**
 * Parses a URL string and returns a URL object if valid.
 * Uses tldts for domain validation and parsing.
 */
function parseUrlString(input: string): URL | null {
  const trimmed = input.trim();
  const parsed = parse(trimmed, { allowPrivateDomains: false });

  if (!parsed.isIcann || !parsed.domain) return null;

  let urlStr = trimmed;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    urlStr = 'https://' + trimmed;
  }

  try {
    const url = new URL(urlStr);
    if (!url.hostname || url.hostname !== parsed.hostname) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Normalizes a URL object
 * - Strip protocol (http://, https://)
 * - Remove query parameters and hash fragments
 * - Lowercase the entire string
 * - Strip www subdomains
 * @param url - The parsed URL object to normalize
 * @returns Normalized URL as NormalizedUrl
 */
export function normalizeUrl(url: URL): NormalizedUrl {
  const normalized = normalizeUrlLib(url.toString(), {
    stripProtocol: true,
    stripWWW: true,
    removeQueryParameters: true,
    stripHash: true,
    removeTrailingSlash: true,
    removeSingleSlash: true,
  });

  // Additional validation: ensure it looks like a domain
  if (
    !normalized.includes('.') ||
    normalized.startsWith('.') ||
    normalized.endsWith('.')
  ) {
    throw new Error('Invalid domain format');
  }

  return normalized as NormalizedUrl;
}

/**
 * Parses a normalized URL into components for matching.
 */
export function parseUrl(normalizedUrl: NormalizedUrl): {
  domain: string;
  publicSuffix: string;
  subdomain: string | null;
  path: string;
} {
  try {
    // Add protocol if missing for URL constructor
    const urlWithProtocol = normalizedUrl.startsWith('http')
      ? normalizedUrl
      : `https://${normalizedUrl}`;

    const parsedUrl = new URL(urlWithProtocol);
    const { domain, publicSuffix, subdomain } = parse(parsedUrl.hostname);

    return {
      domain: domain || '',
      publicSuffix: publicSuffix || '',
      subdomain: subdomain || null,
      path: parsedUrl.pathname === '/' ? '' : parsedUrl.pathname,
    };
  } catch {
    // Fallback to manual parsing for edge cases
    const [hostAndPath, ...rest] = normalizedUrl.split('/');
    const path = rest.length > 0 ? '/' + rest.join('/') : '';

    const hostParts = hostAndPath.split('.');

    if (hostParts.length === 1) {
      return {
        domain: hostParts[0],
        publicSuffix: '',
        subdomain: null,
        path,
      };
    }

    if (hostParts.length === 2) {
      return {
        domain: hostParts[0],
        publicSuffix: hostParts[1],
        subdomain: null,
        path,
      };
    }

    const publicSuffix = hostParts[hostParts.length - 1];
    const domain = hostParts[hostParts.length - 2];
    const subdomain = hostParts.slice(0, -2).join('.');

    return {
      domain,
      publicSuffix,
      subdomain: subdomain || null,
      path,
    };
  }
}

// ============================================================================
// LANGUAGE DETECTION
// ============================================================================

/**
 * Checks if a string is a recognized language code.
 * Uses ISO 639-1 library for language codes and i18n-iso-countries for country codes.
 */
export function isLanguageCode(code: string): boolean {
  const lowerCode = code.toLowerCase();

  // Check if it's a simple language code (e.g., 'en', 'fr')
  if (ISO6391.validate(lowerCode)) {
    return true;
  }

  // Check if it's a language-country combination (e.g., 'en-us', 'fr-fr')
  if (lowerCode.includes('-')) {
    const [lang, country] = lowerCode.split('-');
    return ISO6391.validate(lang) && countries.isValid(country.toUpperCase());
  }

  return false;
}

/**
 * Checks if a public suffix contains language information using i18n-iso-countries.
 * Uses the official country code list to determine language-specific TLDs.
 */
export function isLanguageSuffix(suffix: string): boolean {
  // Get all country codes from i18n-iso-countries
  const countryCodes = Object.keys(countries.getAlpha2Codes());

  // Check if suffix matches a country code (common pattern for ccTLDs)
  // Convert to uppercase for comparison since country codes are uppercase
  return countryCodes.includes(suffix.toUpperCase());
}

/**
 * Extracts language part from a path if present using URLPattern.
 * Returns the language code and the remaining path.
 */
export function extractLanguageFromPath(path: string): {
  language: string | null;
  remainingPath: string;
} {
  const match = path.match(/^\/([^\/]+)(\/.*)?$/);
  if (!match) return { language: null, remainingPath: path };

  const [, firstSegment, rest = ''] = match;

  if (isLanguageCode(firstSegment)) {
    return {
      language: firstSegment,
      remainingPath: rest || '',
    };
  }

  return { language: null, remainingPath: path };
}

// ============================================================================
// INTENTION PARSING
// ============================================================================

/**
 * Parses a URL string into an IntentionScope for matching.
 */
export function parseUrlToScope(urlString: string): IntentionScope | null {
  const parsedUrl = parseUrlString(urlString);
  if (!parsedUrl) {
    return null;
  }
  const normalizedUrl = normalizeUrl(parsedUrl);
  const { domain, publicSuffix, subdomain, path } = parseUrl(normalizedUrl);

  // Check for language parts
  const hasLanguageSubdomain = subdomain ? isLanguageCode(subdomain) : false;
  const hasLanguageSuffix = isLanguageSuffix(publicSuffix);
  const { language: pathLanguage } = extractLanguageFromPath(path);
  const hasLanguagePathStart = pathLanguage !== null;

  return {
    domain,
    publicSuffix,
    subdomain,
    path,
    urlLength: normalizedUrl.length,
    hasLanguageSuffix,
    hasLanguageSubdomain,
    hasLanguagePathStart,
  };
}

/**
 * Parses an intention URL into a structured format for matching.
 */
export function parseIntention(intention: Intention): IntentionScope | null {
  // Since intention.scope is already an IntentionScope, we can return it directly
  return intention.scope;
}

// ============================================================================
// INTENTION INDEXING AND LOOKUP
// ============================================================================

/**
 * Creates an index for fast intention lookup by domain.
 */
export function createIntentionIndex(intentions: Intention[]): IntentionIndex {
  const index = new Map<
    string,
    { scope: IntentionScope; intention: Intention }[]
  >();

  for (const intention of intentions) {
    const scope = parseIntention(intention);
    if (!scope) {
      continue; // Skip invalid intentions
    }

    if (!index.has(scope.domain)) {
      index.set(scope.domain, []);
    }

    index.get(scope.domain)!.push({ scope, intention });
  }

  // Sort each domain's intentions by urlLength descending
  for (const [domain, intentionScopes] of index) {
    intentionScopes.sort((a, b) => b.scope.urlLength - a.scope.urlLength);
  }

  return index as IntentionIndex;
}

/**
 * Checks if a target URL matches an intention scope according to the matching rules.
 * Note: This function assumes the domain has already been matched.
 */
export function matchesIntentionScopeIgnoringDomain(
  targetUrl: string,
  intentionScope: IntentionScope
): boolean {
  const parsedUrl = parseUrlString(targetUrl);
  if (!parsedUrl) {
    return false;
  }
  const normalizedTarget = normalizeUrl(parsedUrl);
  const targetParts = parseUrl(normalizedTarget);

  // Step 1: Public Suffix Match
  if (intentionScope.hasLanguageSuffix) {
    // If intention has language suffix, match any suffix
    // (no suffix check needed)
  } else {
    // If intention has non-language suffix, match same suffix OR any language suffix
    if (isLanguageSuffix(targetParts.publicSuffix)) {
      // Target has language suffix - always match
    } else {
      // Target has non-language suffix - must match intention suffix
      if (targetParts.publicSuffix !== intentionScope.publicSuffix) {
        return false;
      }
    }
  }

  // Step 2: Subdomain Match
  if (intentionScope.subdomain) {
    // If intention has subdomain, check if it's a language subdomain
    if (intentionScope.hasLanguageSubdomain) {
      // If intention has language subdomain, target can have:
      // - no subdomain
      // - same language subdomain
      // - different language subdomain
      if (targetParts.subdomain) {
        // Target has subdomain - must be a language subdomain
        if (!isLanguageCode(targetParts.subdomain)) {
          return false;
        }
      }
    } else {
      // If intention has non-language subdomain, target must match exactly
      if (targetParts.subdomain !== intentionScope.subdomain) {
        return false;
      }
    }
  } else {
    // If intention has no subdomain, target can have:
    // - no subdomain
    // - www subdomains (already stripped in normalization)
    // - language subdomains (stripped)
    if (targetParts.subdomain) {
      // Check if target subdomain is a language code
      if (!isLanguageCode(targetParts.subdomain)) {
        return false;
      }
    }
  }

  // Step 3: Path Match
  if (!intentionScope.path) {
    // If intentionScope.path is empty, match any path
    return true;
  }

  // Try matching with original path first
  if (targetParts.path.startsWith(intentionScope.path)) {
    return true;
  }

  // If that fails, try stripping language from target path
  const { remainingPath } = extractLanguageFromPath(targetParts.path);
  if (remainingPath.startsWith(intentionScope.path)) {
    return true;
  }

  return false;
}

/**
 * Fast lookup of matching intention using the domain index.
 */
export function lookupIntention(
  targetUrl: string,
  intentionIndex: IntentionIndex
): Intention | null {
  const parsedUrl = parseUrlString(targetUrl);
  if (!parsedUrl) {
    return null;
  }
  const normalizedTarget = normalizeUrl(parsedUrl);
  const { domain } = parseUrl(normalizedTarget);

  const intentionScopes = intentionIndex.get(domain);
  if (!intentionScopes) {
    return null;
  }

  const match =
    intentionScopes.find(item =>
      matchesIntentionScopeIgnoringDomain(targetUrl, item.scope)
    ) || null;
  return match ? match.intention : null;
}
