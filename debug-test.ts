import {
  matchesIntentionScope,
  parseIntention,
  parseUrlToScope,
  type Intention,
} from './components/intention';

// Helper function to create Intention with IntentionScope
function createIntention(scope: string, phrase: string): Intention {
  const parsedScope = parseUrlToScope(scope);
  if (!parsedScope) {
    throw new Error(`Invalid URL: ${scope}`);
  }
  return { scope: parsedScope, phrase };
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

const scope = parseIntention(intention);
console.log('Parsed scope:', scope);

if (scope) {
  const wwwUrl = `www.${baseUrl}`;
  const wwwMatch = matchesIntentionScope(wwwUrl, scope);
  console.log('WWW URL:', wwwUrl, 'Match:', wwwMatch);

  const langUrl = `sv.${baseUrl}`;
  const langMatch = matchesIntentionScope(langUrl, scope);
  console.log('Language URL:', langUrl, 'Match:', langMatch);

  const cdnUrl = `cdn.${baseUrl}`;
  const cdnMatch = matchesIntentionScope(cdnUrl, scope);
  console.log('CDN URL:', cdnUrl, 'Match:', cdnMatch);

  console.log('Expected: www=true, lang=true, cdn=false');
  console.log('Actual:', { www: wwwMatch, lang: langMatch, cdn: cdnMatch });
}
