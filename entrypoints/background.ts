import browser from 'webextension-polyfill';
import {
  createIntentionIndex,
  lookupIntention,
  parseUrlToScope,
  type Intention,
  type IntentionIndex,
} from '../components/intention';
import { storage } from '../components/storage';

const getDomain = (input: string): string => {
  const parsed = parseUrlToScope(input);
  return parsed?.domain || '';
};

const domainEquals = (url1: string, url2: string): boolean => {
  const domain1 = getDomain(url1);
  const domain2 = getDomain(url2);
  return domain1 === domain2 && domain1 !== '';
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default defineBackground(async () => {
  // Cache data that won't change during session
  let intentionIndex: IntentionIndex = createIntentionIndex([]);
  const intentionPageUrl = browser.runtime.getURL('intention-page.html');

  // Load intentions on startup before registering listener to prevent race conditions
  const { intentions } = await storage.get();
  intentionIndex = createIntentionIndex(intentions);

  browser.webNavigation.onBeforeNavigate.addListener(async details => {
    if (details.frameId !== 0) return;

    const targetUrl = details.url;

    // Get active tab and source tab in parallel for performance
    const [activeTabs, sourceTab] = await Promise.all([
      browser.tabs.query({ active: true, currentWindow: true }),
      browser.tabs.get(details.tabId).catch(() => null),
    ]);

    const navigationTabId = details.tabId;
    const activeTabId = activeTabs[0]?.id;
    const activeTabUrl = activeTabs[0]?.url;

    // If no active tab (window unfocused), treat as different tab to be safe
    const isNavigationTabActive =
      activeTabId === navigationTabId && activeTabs.length > 0;
    const sourceUrl = sourceTab?.url;

    // Development logging
    console.log('[Intender] Navigation check:', {
      targetUrl,
      sourceUrl,
      navigationTabId,
      activeTabId,
      activeTabUrl,
    });

    // Rule 1: If navigating from same domain → same domain, allow
    if (sourceUrl && domainEquals(sourceUrl, targetUrl)) {
      console.log('[Intender] Rule 1: Same domain navigation, allowing');
      return;
    }

    // Rule 2: If origin is intention page, allow
    if (sourceUrl && sourceUrl.startsWith(intentionPageUrl)) {
      console.log('[Intender] Rule 2: Origin is intention page, allowing');
      return;
    }

    // Rule 3: If active tab is on same domain as target (and not same tab), allow
    // This handles cases like:
    // - Opening new tab from Facebook (active tab is Facebook) → navigating to Facebook
    // - Duplicating Facebook tab (active tab is Facebook) → navigating within Facebook
    // - Middle-click link from Facebook (active tab is Facebook) → opening Facebook link
    // The !== check is to avoid allowing everything. Without it,
    // navigation that is happeing in the active tab would always pass

    if (
      !isNavigationTabActive &&
      activeTabUrl &&
      domainEquals(activeTabUrl, targetUrl)
    ) {
      console.log('[Intender] Rule 3: Active tab on same domain, allowing');
      return;
    }

    // Rule 4: Otherwise, check if we need to block using new matching system
    const matchedIntention = lookupIntention(targetUrl, intentionIndex);

    if (matchedIntention) {
      console.log(
        '[Intender] Rule 4: Blocking navigation, showing intention page for:',
        matchedIntention
      );

      const redirectUrl = browser.runtime.getURL(
        'intention-page.html?target=' + encodeURIComponent(targetUrl)
      );

      try {
        await browser.tabs.update(details.tabId, { url: redirectUrl });
      } catch (error) {
        // Tab might be gone, ignore the error
        console.log('[Intender] Tab update failed, tab may be closed:', error);
      }
    }
  });

  // Refresh cached intentions when storage changes
  browser.storage.onChanged.addListener(changes => {
    if (changes.intentions) {
      const newIntentions = (changes.intentions.newValue as Intention[]) || [];
      intentionIndex = createIntentionIndex(newIntentions);
    }
  });
});
