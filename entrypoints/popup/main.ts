import browser from 'webextension-polyfill';

document.body.innerHTML = `
  <div style="padding: 16px; font-family: system-ui, sans-serif;">
    <h2 style="margin: 0 0 16px 0; color: #333;">Intentor</h2>
    <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">
      Pause and reflect before visiting websites.
    </p>
    <button id="openOptions" style="
      background: #9d924f;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    ">Open Settings</button>
  </div>
`;

document.getElementById('openOptions')?.addEventListener('click', () => {
  // Open settings page in a new tab
  browser.tabs.create({
    url: browser.runtime.getURL('settings.html'),
  });
});
