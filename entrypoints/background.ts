import browser from 'webextension-polyfill';
import { storage } from '../components/storage';

import { parse } from 'tldts';

const getDomain = (input: string): string => {
  const { domainWithoutSuffix } = parse(input);
  return domainWithoutSuffix ?? '';
};

const allowList = new Map<number, string>(); // tabId → base domain

// @ts-ignore
export default defineBackground(() => {
  browser.webNavigation.onBeforeNavigate.addListener(async details => {
    if (details.frameId !== 0) return;

    const currentDomain = getDomain(details.url);
    const allowedDomain = allowList.get(details.tabId);

    if (allowedDomain && currentDomain === allowedDomain) {
      console.log('[Intentor] Allowing follow-up navigation to:', details.url);
      return;
    }

    const { intentions } = await storage.get();
    const match = intentions.find(r => details.url.includes(r.url));

    if (match) {
      console.log('[Intentor] Match found:', match);

      const redirectUrl = browser.runtime.getURL(
        'interstitial.html?target=' + encodeURIComponent(details.url)
      );

      allowList.set(details.tabId, getDomain(details.url)); // base domain
      await browser.tabs.update(details.tabId, { url: redirectUrl });
    }
  });
});
