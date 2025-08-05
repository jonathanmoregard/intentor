import {
  matchesIntentionScopeIgnoringDomain,
  parseUrlToScope,
  type ParsedIntention,
} from './components/intention';
import { generateUUID } from './components/uuid';

// Helper function to create ParsedIntention with IntentionScope
function createIntention(scope: string, phrase: string): ParsedIntention {
  const parsedScope = parseUrlToScope(scope);
  if (!parsedScope) {
    throw new Error(`Invalid URL: ${scope}`);
  }
  return { id: generateUUID(), scope: parsedScope, phrase };
}

// Test the failing case: ["facebook","com",""]
const domain = 'facebook';
const suffix = 'com';
const path = '';

console.log('Testing case:', { domain, suffix, path });

const baseUrl = `https://${domain}.${suffix}${path}`;
console.log('Base URL:', baseUrl);

const intention = createIntention(baseUrl, 'test');
console.log('Created intention:', intention);

const scope = intention.scope;
console.log('Parsed scope:', scope);

const wwwUrl = `https://www.${domain}.${suffix}${path}`;
const wwwMatch = matchesIntentionScopeIgnoringDomain(wwwUrl, scope);
console.log('WWW URL:', wwwUrl, 'Match:', wwwMatch);

const langUrl = `https://sv.${domain}.${suffix}${path}`;
const langMatch = matchesIntentionScopeIgnoringDomain(langUrl, scope);
console.log('Language URL:', langUrl, 'Match:', langMatch);

const cdnUrl = `https://cdn.${domain}.${suffix}${path}`;
const cdnMatch = matchesIntentionScopeIgnoringDomain(cdnUrl, scope);
console.log('CDN URL:', cdnUrl, 'Match:', cdnMatch);

  console.log('Expected: www=true, lang=true, cdn=false');
  console.log('Actual:', { www: wwwMatch, lang: langMatch, cdn: cdnMatch });
}
