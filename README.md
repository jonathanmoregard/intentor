# Intentor

A browser extension that helps you pause and reflect before visiting certain websites. It gives you an opportunity to reflect and write down an intention before you enter the page.

## Overview

Intentor is designed to help you be more mindful about your web browsing habits. When you try to visit a configured website, the extension gives you an opportunity to reflect and write down an intention before you enter the page.

## Current Design

### Core Functionality

- **URL Matching**: The extension checks if the target URL matches any configured rules
- **Pause Page**: When a match is found, users are redirected to a custom pause page
- **Phrase Verification**: Users have an opportunity to reflect and write down their intention before continuing

### User Interface

#### Options Page

- Simple form interface for managing rules
- Each rule consists of:
  - **URL**: The website pattern to match (e.g., "facebook.com")
  - **Phrase**: The text that represents your intention for visiting the site
- Add/remove rules and save configuration

#### Pause Page

- **Modern Design**: Clean, centered card layout with subtle shadows
- **Phrase Display**: Shows the expected phrase above the input field
- **Real-time Feedback**:
  - Grey: Empty input
  - Green: Partial or complete match (shows you're on the right track)
  - Red: Incorrect input
- **Smart Button**: "Enter" button is only enabled when the phrase is complete

## Design Philosophy

Intentor embraces a **mindful, non-coercive approach** to digital wellness. Rather than blocking or punishing users, it creates gentle moments of reflection and intentionality.

### Visual Design

- **Minimalist aesthetic** with clean typography and subtle shadows
- **Warm, earthy color palette** featuring muted golds and soft grays
- **Encouraging, not demanding** - Frames reflection as an opportunity rather than a requirement
- **Mindfulness-focused** - Emphasizes intention-setting and conscious browsing
- **Non-judgmental** - Avoids shaming or punitive language around web usage

## Use Cases

- **Productivity**: Add gentle friction to distracting websites like social media
- **Mindfulness**: Encourage intentional browsing habits through reflection
- **Focus**: Create moments of pause before visiting time-wasting sites
