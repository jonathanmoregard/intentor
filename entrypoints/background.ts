import browser from 'webextension-polyfill';
import { storage, type Intention } from '../components/storage';

import { parse } from 'tldts';

const getDomain = (input: string): string => {
  const { domain } = parse(input);
  return domain ?? '';
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
  let cachedIntentions: (Intention & { hostname: string })[] = [];
  const pausePageUrl = browser.runtime.getURL('pause-page.html');

  // Helper to sanitize and parse a single intention URL
  const processIntention = (
    intention: Intention
  ): Intention & { hostname: string } => {
    let hostname = '';
    try {
      // Remove any existing scheme and add https://
      const cleanUrl = intention.url.replace(/^https?:\/\//, '');
      const url = new URL(`https://${cleanUrl}`);
      hostname = url.hostname;
    } catch {
      // Fallback to original URL if parsing fails
      hostname = intention.url;
    }
    return { ...intention, hostname };
  };

  // Load intentions on startup before registering listener to prevent race conditions
  const { intentions } = await storage.get();
  cachedIntentions = intentions.map(processIntention);

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
    console.log('[Intentor] Navigation check:', {
      targetUrl,
      sourceUrl,
      navigationTabId,
      activeTabId,
      activeTabUrl,
    });

    // Rule 1: If navigating from same domain → same domain, allow
    if (sourceUrl && domainEquals(sourceUrl, targetUrl)) {
      console.log('[Intentor] Rule 1: Same domain navigation, allowing');
      return;
    }

    // Rule 2: If origin is pause page, allow
    if (sourceUrl && sourceUrl.startsWith(pausePageUrl)) {
      console.log('[Intentor] Rule 2: Origin is pause page, allowing');
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
      console.log('[Intentor] Rule 3: Active tab on same domain, allowing');
      return;
    }

    // Rule 4: Otherwise, check if we need to block
    let targetHostname = '';
    try {
      targetHostname = new URL(targetUrl).hostname;
    } catch {
      // Invalid URL, skip matching
    }

    const match = cachedIntentions.find(i => {
      if (!targetHostname || !i.hostname) return false;
      return (
        targetHostname === i.hostname ||
        targetHostname.endsWith(`.${i.hostname}`)
      );
    });

    if (match) {
      console.log(
        '[Intentor] Rule 4: Blocking navigation, showing pause page for:',
        match
      );

      const redirectUrl = browser.runtime.getURL(
        'pause-page.html?target=' + encodeURIComponent(targetUrl)
      );

      try {
        await browser.tabs.update(details.tabId, { url: redirectUrl });
      } catch (error) {
        // Tab might be gone, ignore the error
        console.log('[Intentor] Tab update failed, tab may be closed:', error);
      }
    }
  });

  // Refresh cached intentions when storage changes
  browser.storage.onChanged.addListener(changes => {
    if (changes.intentions) {
      const newIntentions = (changes.intentions.newValue as Intention[]) || [];
      cachedIntentions = newIntentions.map(processIntention);
    }
  });
});
