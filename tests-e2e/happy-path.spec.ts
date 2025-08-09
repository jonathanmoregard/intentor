import { expect, Page, test } from '@playwright/test';
import {
  launchExtension,
  openSettingsPage,
  waitForSyncStorageChange,
} from './utils/extension';

test.describe('Happy path intention flow', () => {
  test('add intention, get intention page, type phrase, and enter', async () => {
    const { context } = await launchExtension();

    // Open options page
    const { page: options } = await openSettingsPage(context);

    // Fill first intention (URL and phrase) and save
    const urlInput = options.locator('input.url-input').first();
    const phraseInput = options.locator('textarea.phrase-input').first();
    await urlInput.fill('google.com');
    await phraseInput.fill('Hello Intent');

    // Prepare a listener for storage change (intentions)
    await waitForSyncStorageChange(options, ['intentions']);

    await options.getByRole('button', { name: 'Save changes' }).click();
    // Wait for background to pick up intentions
    await options.waitForTimeout(500);

    // Open real site that should be intercepted
    const page: Page = await context.newPage();
    try {
      await page.goto('https://google.com', { waitUntil: 'domcontentloaded' });
    } catch {
      // Navigation aborted due to extension redirect is expected
    }

    // Expect to land on intention page first
    await expect(page).toHaveURL(
      /chrome-extension:\/\/.+\/intention-page\.html\?target=/
    );

    // Type the exact phrase and click Go
    const intentionTextarea = page.locator('#phrase');
    await intentionTextarea.click();
    await intentionTextarea.fill('Hello Intent');
    const goButton = page.locator('#go');
    await expect(goButton).toBeEnabled();
    await Promise.all([
      page.waitForNavigation({ url: /https:\/\/www\.google\.com\/?/ }),
      goButton.click(),
    ]);

    // Should navigate to google.com
    await expect(page).toHaveURL(/https:\/\/www\.google\.com\/?/);

    await context.close();
  });
});
