// Test setup file
import 'fast-check';

declare global {
  var browser: any;
}

// Mock browser APIs for testing
global.browser = {
  storage: {
    local: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
    },
    sync: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
    },
    onChanged: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
  runtime: {
    getURL: (path: string) => `chrome-extension://test/${path}`,
  },
  tabs: {
    query: () => Promise.resolve([]),
    create: () => Promise.resolve({} as any),
    update: () => Promise.resolve({} as any),
  },
};
