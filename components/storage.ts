import browser from 'webextension-polyfill';
import { mapNulls } from './helpers';
import { Intention, ParsedIntention, toParsedIntention } from './intention';

declare const __IS_DEV__: boolean;

const backend = __IS_DEV__ ? browser.storage.local : browser.storage.sync;

export const storage = {
  async get(): Promise<{ intentions: Intention[] }> {
    const result = await backend.get({ intentions: [] });
    return result as { intentions: Intention[] };
  },
  async set(data: { intentions: Intention[] }) {
    await backend.set(data);
  },
  async getActiveIntentions(): Promise<ParsedIntention[]> {
    const { intentions } = await this.get();
    return mapNulls(toParsedIntention, intentions);
  },
};
