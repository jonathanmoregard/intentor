import browser from 'webextension-polyfill';

declare const __IS_DEV__: boolean;

const backend = __IS_DEV__ ? browser.storage.local : browser.storage.sync;

export const storage = {
  async get(): Promise<{ rules: Rule[] }> {
    const result = await backend.get({ rules: [] });
    return result as { rules: Rule[] };
  },
  async set(data: { rules: Rule[] }) {
    await backend.set(data);
  },
};

export type Rule = {
  url: string;
  phrase: string;
};
