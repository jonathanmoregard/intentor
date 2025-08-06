import browser from 'webextension-polyfill';
import { RawIntention } from './intention';

declare const __IS_DEV__: boolean;

const backend = __IS_DEV__ ? browser.storage.local : browser.storage.sync;

export const storage = {
  async get(): Promise<{
    intentions: RawIntention[];
    fuzzyMatching?: boolean;
  }> {
    const result = await backend.get({ intentions: [], fuzzyMatching: true });
    return result as { intentions: RawIntention[]; fuzzyMatching?: boolean };
  },
  async set(data: { intentions: RawIntention[] } | { fuzzyMatching: boolean }) {
    await backend.set(data);
  },
};
