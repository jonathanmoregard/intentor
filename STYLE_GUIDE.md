# Intender Style Guide

## Design Philosophy

Intender embraces a **mindful, non-coercive approach** to digital wellness. Rather than blocking or punishing users, it creates gentle moments of reflection and intentionality.

### Core Principles

- **Minimalist aesthetic** with clean typography and subtle shadows
- **Warm, earthy color palette** featuring muted golds and soft grays
- **Encouraging, not demanding** - Frames reflection as an opportunity rather than a requirement
- **Mindfulness-focused** - Emphasizes intention-setting and conscious browsing
- **Non-judgmental** - Avoids shaming or punitive language around web usage

## Color Palette

- **Error**: `#FE621D` - Orange-red for error states and incorrect input
- **Green**: `#9E8E33` - Sage green for success states, active buttons, and correct input
- **Black**: `#30332E` - Dark green-black for primary text, caret, and borders
- **Gold**: `#FEE3A4` - Warm gold for particles, phrase background, and accents
- **Off White**: `#FEF8EA` - Warm off-white for dialog backgrounds and containers

## Typography

- **Primary**: `'Inter', sans-serif` - Interface elements
- **Secondary (for intention text)**: `'Merriweather', serif` (italic) - Intention text

## Buttons

### Primary Action Buttons

- **Background**: Linear gradient from `rgba(X,X,X, 0.8) to `rgba(X,X,X, 0.6)`
- **Text**: Pure white at 90% opacity (`rgba(255, 255, 255, 0.9)`)
- **Border**: 1px solid `rgba(X,X,X, 0.4)`
- **Border radius**: 12px
- **Typography**: Inter, 500 weight, 0.5px letter spacing
- **Shadow**: 2px y-offset, 6px blur, 30% black (`0 2px 6px rgba(0, 0, 0, 0.3)`)
- **Hover state**: Brighten gradient by ~5%, scale to 102%, shadow becomes `0 4px 12px rgba(0, 0, 0, 0.4)`
- **Transition**: 150ms ease for hover interactions
