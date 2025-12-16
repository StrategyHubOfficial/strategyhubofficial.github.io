# PWA Icons

This directory contains icons for the StrategyHub Progressive Web App.

## Required Icons

- `icon-192x192.png` - 192x192 pixels (for Android)
- `icon-512x512.png` - 512x512 pixels (for Android and splash screens)

## Generating Icons

### Option 1: Using Node.js (Recommended)

If you have Node.js and the `canvas` package installed:

```bash
npm install canvas
node generate-icons.js
```

### Option 2: Using HTML Generator

1. Open `generate-icons.html` in a web browser
2. Right-click each canvas and "Save image as..."
3. Save as `icon-192x192.png` and `icon-512x512.png`

### Option 3: Using Online Tools

You can use online tools like:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

Use the SVG icon (`icon.svg`) as the source.

## Icon Design

The icons feature:
- Background: `#0a0a0a` (dark)
- Bitcoin symbol (₿): `#f7931a` (Bitcoin orange)
- Subtle gradient overlay for depth

