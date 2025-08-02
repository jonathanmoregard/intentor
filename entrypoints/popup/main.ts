import browser from 'webextension-polyfill';

// Automatically open settings when popup is clicked
browser.tabs.create({
  url: browser.runtime.getURL('settings.html'),
});

// Close the popup immediately
window.close();
