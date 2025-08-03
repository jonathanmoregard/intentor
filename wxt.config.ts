import { defineConfig } from 'wxt';

export default defineConfig({
  vite: ({ mode }) => ({
    define: {
      __IS_DEV__: mode === 'development',
    },
  }),
  manifest: {
    name: 'Intentor',
    version: '0.1.0',
    manifest_version: 3,
    permissions: ['storage', 'webNavigation', 'tabs'],
    host_permissions: ['<all_urls>'],
    background: {
      service_worker: 'entrypoints/background.ts',
      type: 'module',
    },

    action: {
      default_popup: 'entrypoints/popup/index.html',
    },
    icons: {
      128: 'icon/intentor-128.png',
    },
    web_accessible_resources: [
      {
        resources: [
          'entrypoints/intention-page/index.html',
          'entrypoints/settings/index.html',
        ],
        matches: ['<all_urls>'],
      },
    ],
  },
});
