/**
 * Intention data structures and URL matching logic for the Intender extension.
 *
 * This module implements the URL matching specification that provides intuitive,
 * performant, language-aware matching for intention URLs.
 */

import countries from 'i18n-iso-countries';
import ISO6391 from 'iso-639-1';
import { Brand } from 'ts-brand';
import { normalizeUrl, parseUrlString, toComponents } from './normalized-url';
import { UUID, generateUUID } from './uuid';

// ============================================================================
// TYPES
// ============================================================================

// Branded type for intention index
export type IntentionIndex = Brand<
  Map<string, { scope: IntentionScope; intention: ParsedIntention }[]>,
  'IntentionIndex'
>;

export interface IntentionScope {
  domain: string; // e.g. "facebook"
  publicSuffix: string; // e.g. "com", "se", "co.uk"
  subdomain: string | null; // e.g. "sv", "mail" or null
  path: string; // e.g. "/groups/foo", may be ""
  urlLength: number; // length of the full normalized string
  hasLanguageSuffix: boolean; // true if publicSuffix is a language-specific TLD
  hasLanguageSubdomain: boolean; // true if subdomain is a language code
  hasLanguagePathStart: boolean; // true if path starts with a language code
  originalUrl: string; // the original URL string that was parsed
}

export interface ParsedIntention {
  id: UUID; // UUID for unique identification
  scope: IntentionScope;
  phrase: string;
}

export interface UnparsedIntention {
  url: string;
  phrase: string;
}

// Union type for heterogeneous intentions
export type Intention = ParsedIntention | UnparsedIntention;

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
  const { domain, publicSuffix, subdomain, path } = toComponents(normalizedUrl);

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
    originalUrl: urlString,
  };
}

/**
 * Converts a ParsedIntention to UnparsedIntention
 */
export function parsedIntentionToUnparsed(
  intention: ParsedIntention
): UnparsedIntention {
  return {
    url: intention.scope.originalUrl,
    phrase: intention.phrase,
  };
}

/**
 * Converts any Intention to UnparsedIntention
 */
export function intentionToUnparsed(intention: Intention): UnparsedIntention {
  if ('scope' in intention) {
    return parsedIntentionToUnparsed(intention);
  } else {
    return intention;
  }
}

/**
 * Attempts to convert an UnparsedIntention to Intention.
 * Returns null if the URL cannot be parsed.
 */
export function unparsedToIntention(
  unparsed: UnparsedIntention
): Intention | null {
  const scope = parseUrlToScope(unparsed.url);
  if (!scope) {
    return null;
  }
  return {
    id: generateUUID(),
    scope,
    phrase: unparsed.phrase,
  };
}

/**
 * Checks if an UnparsedIntention can be parsed successfully.
 */
export function canParseIntention(unparsed: UnparsedIntention): boolean {
  return parseUrlToScope(unparsed.url) !== null;
}

/**
 * Converts an Intention to ParsedIntention or null.
 * Returns the intention if it's already parsed, or tries to parse unparsed intentions.
 */
export function toParsedIntention(
  intention: Intention
): ParsedIntention | null {
  if (isParsedIntention(intention)) {
    return intention;
  } else {
    const parsed = unparsedToIntention(intention);
    return parsed && isParsedIntention(parsed) ? parsed : null;
  }
}

// Type guards
export function isParsedIntention(
  intention: Intention
): intention is ParsedIntention {
  return 'scope' in intention;
}

export function isUnparsedIntention(
  intention: Intention
): intention is UnparsedIntention {
  return 'url' in intention;
}

/**
 * Checks if an intention is empty (no meaningful content).
 */
export function isEmpty(intention: Intention): boolean {
  if (isParsedIntention(intention)) {
    // Parsed intentions are never empty by definition
    return false;
  } else {
    // For unparsed intentions, check if URL and phrase are empty
    return (
      (!intention.url || intention.url.trim() === '') &&
      (!intention.phrase || intention.phrase.trim() === '')
    );
  }
}

// ============================================================================
// INTENTION INDEXING AND LOOKUP
// ============================================================================

/**
 * Creates an index for fast intention lookup by domain.
 */
export function createIntentionIndex(
  intentions: ParsedIntention[]
): IntentionIndex {
  const index = new Map<
    string,
    { scope: IntentionScope; intention: ParsedIntention }[]
  >();

  for (const intention of intentions) {
    const scope = intention.scope;
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
  const targetParts = toComponents(normalizedTarget);

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
): ParsedIntention | null {
  const parsedUrl = parseUrlString(targetUrl);
  if (!parsedUrl) {
    return null;
  }
  const normalizedTarget = normalizeUrl(parsedUrl);
  const { domain } = toComponents(normalizedTarget);

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
