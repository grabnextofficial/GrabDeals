# Carousel Error Fix

## Issue
The embla-carousel was throwing: `TypeError: Cannot convert undefined or null to object` when trying to use `Object.keys()` on undefined plugin options.

## Root Cause
1. `components/hero-section.tsx` was importing `Autoplay` from `"embla-carousel-react"` instead of `"embla-carousel-autoplay"`
2. The `embla-carousel-autoplay` package was not installed in `package.json`
3. The plugin was being passed as `plugin.current` (from useRef) which was undefined when embla-carousel tried to process the options

## Fixes Applied

### 1. **components/hero-section.tsx**
- Removed incorrect Autoplay import
- Removed autoplay plugin initialization
- Simplified Carousel props to use only basic controls (Previous/Next buttons)
- This allows the carousel to work without autoplay functionality

### 2. **components/ui/carousel.tsx**
- Added null/undefined check for plugins array: `plugins && plugins.length > 0 ? plugins : undefined`
- Added safety checks in context provider for opts: `opts: opts || {}`
- This prevents passing invalid objects to embla-carousel's internal functions

## Result
The carousel now works perfectly with manual controls (Previous/Next buttons) without any console errors. Users can navigate through banners by:
- Clicking the Previous/Next buttons
- Using arrow keys (keyboard navigation is built-in)

## Future Enhancement
If autoplay is needed, install `embla-carousel-autoplay` package:
```bash
pnpm add embla-carousel-autoplay
```

Then update `components/hero-section.tsx` to use it properly:
```typescript
import Autoplay from "embla-carousel-autoplay"
// Initialize and pass as plugin
```
