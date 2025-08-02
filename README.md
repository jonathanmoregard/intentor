# Intentor

A browser extension that adds intentional friction to web browsing by requiring users to type a specific phrase before accessing certain websites.

## Overview

Intentor is designed to help users be more mindful about their web browsing habits. When you try to visit a configured website, the extension intercepts the navigation and shows an interstitial page where you must type the exact phrase associated with that site to proceed.

## Current Design

### Core Functionality

- **URL Matching**: The extension checks if the target URL matches any configured rules
- **Interstitial Page**: When a match is found, users are redirected to a custom interstitial page
- **Phrase Verification**: Users must type the exact phrase to continue to the destination

### User Interface

#### Options Page

- Simple form interface for managing rules
- Each rule consists of:
  - **URL**: The website pattern to match (e.g., "facebook.com")
  - **Phrase**: The text users must type to access the site
- Add/remove rules and save configuration

#### Interstitial Page

- **Modern Design**: Clean, centered card layout with subtle shadows
- **Phrase Display**: Shows the expected phrase above the input field
- **Real-time Feedback**:
  - Grey: Empty input
  - Green: Partial or complete match (shows you're on the right track)
  - Red: Incorrect input
- **Smart Button**: "Enter" button is only enabled when the phrase is complete

## Use Cases

- **Productivity**: Add friction to distracting websites like social media
- **Mindfulness**: Encourage intentional browsing habits
- **Focus**: Prevent impulsive visits to time-wasting sites
