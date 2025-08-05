import browser from 'webextension-polyfill';
import { RawIntention } from './intention';

declare const __IS_DEV__: boolean;

const backend = __IS_DEV__ ? browser.storage.local : browser.storage.sync;

export const storage = {
  async get(): Promise<{ intentions: RawIntention[] }> {
    const result = await backend.get({ intentions: [] });
    return result as { intentions: RawIntention[] };
  },
  async set(data: { intentions: RawIntention[] }) {
    await backend.set(data);
  },
};
