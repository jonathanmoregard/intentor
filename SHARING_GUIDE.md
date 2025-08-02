# Intentor Extension - Testing Guide

## What is Intentor?

Intentor is a browser extension that helps you pause and reflect before visiting certain websites. It creates a moment of intentionality by requiring you to type a specific phrase before continuing to distracting sites.

## How to Install (Chrome/Edge)

1. **Download the extension files**

   - The built extension is in the `.output/chrome-mv3/` folder
   - You can zip this folder and share it, or share the folder directly

2. **Install in Chrome/Edge:**

   - Open Chrome/Edge and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `chrome-mv3` folder
   - The extension should now appear in your extensions list

3. **Set up your first intention:**

   - Click the Intentor icon in your browser toolbar
   - Go to Settings
   - Add a website URL (e.g., "reddit.com")
   - Add a phrase (e.g., "I am looking up something specific, not browsing aimlessly")
   - Save changes

4. **Test it:**
   - Try visiting the website you configured
   - You should see a pause page asking you to type your phrase
   - Type the exact phrase to continue

## Features to Test

- ✅ **Basic functionality**: Add intentions, visit sites, see pause page
- ✅ **Import/Export**: Try exporting your intentions and importing them
- ✅ **Example intentions**: Quick-add the provided examples
- ✅ **Cross-device sync**: If using Chrome sync, intentions should sync across devices
- ✅ **Different websites**: Test with various sites (social media, news, etc.)

## Feedback Areas

Please provide feedback on:

1. **User Experience**: Is the flow intuitive? Any confusing moments?
2. **Design**: How does the visual design feel? Any improvements?
3. **Functionality**: Does it work as expected? Any bugs?
4. **Usefulness**: Does it actually help with digital wellbeing?
5. **Performance**: Any lag or performance issues?
6. **Suggestions**: What features would make it more useful?

## Technical Details

- Built with React, TypeScript, and WXT
- Uses Chrome Extension Manifest V3
- Stores data in browser storage (syncs across devices)
- Background script handles navigation interception
- Pause page for intention verification

## Version

Current version: 0.1.0 (pre-release for testing)

---

**Note**: This is a pre-release version for testing. Please report any issues or feedback!
