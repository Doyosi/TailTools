---
name: cge-lightbox-skill
description: Universal agent operational guide for CGELightbox, an ultra-fast media lightbox and gallery viewer designed for Tailwind CSS v4.3+ and Laravel Blade with multi-media support, pan-and-zoom controls, thumbnail ribbons, mobile swipe gestures, and declarative data-cge-* triggers.
---

# CGELightbox Universal Agent Skill

This skill guides AI assistants (Antigravity, Cursor, Codex, Claude Code) in implementing, styling, and debugging the `CGELightbox` plugin from **TailTools**.

---

## Architecture Overview

- **Source Code:** `plugins/CGELightbox/CGELightbox.js`
- **TypeScript Types:** `plugins/CGELightbox/CGELightbox.d.ts`
- **Tailwind v4 Styles:** `plugins/CGELightbox/style.css`
- **Documentation:** `docs/CGELightbox/` (`README.md`, `usage.md`, `laravel-blade.md`, `examples.md`, `api.md`)
- **Zero Runtime Dependencies:** Completely pure ECMAScript 2022.

---

## Core Capabilities

1. **Multi-Media Support:**
   - Images (`image`): High-resolution images with auto-fit aspect ratios and captions.
   - Videos (`video`): Direct HTML5 `<video controls>` with poster images.
   - Embeds (`youtube`, `vimeo`): Responsive 16:9 container auto-wrapping YouTube and Vimeo URLs.
   - Inline DOM (`inline`): Extracts and displays hidden DOM templates or interactive cards.
2. **Pan & Zoom Engine:**
   - Double-tap or double-click to step zoom (`1x` → `2x` → `3x` → reset).
   - Smooth mouse wheel zoom.
   - Click-and-drag and touch pan to inspect zoomed photographs freely.
3. **Mobile Touch Gestures:**
   - Horizontal swipe: Navigate previous/next slides.
   - Vertical swipe down: Flick down to dismiss/close the lightbox (80px threshold).
   - Pinch-to-zoom on multi-touch mobile screens.
4. **Gallery Navigation & Preloading:**
   - Declarative grouping via `data-cge-gallery="gallery-id"`.
   - Bottom thumbnail preview ribbon with active slide highlighting.
   - Slide position counter badge (`1 / 8`).
   - Progressive background preloading for adjacent slides.
5. **Top Action Toolbar:**
   - Fullscreen toggle, Direct download button, Zoom In/Out controls, Close button.
6. **Accessibility & Keyboard Control:**
   - `Escape` (Close), `ArrowLeft` / `ArrowRight` (Prev/Next), `ArrowUp` / `ArrowDown` or `+` / `-` (Zoom), `f` (Fullscreen).
   - Trapped document scroll (`overflow: hidden` on body).
7. **Strict Styling Constraint:**
   - Always use **`rounded-sm`** for all controls, buttons, thumbnails, and preview cards.

---

## Declarative Markup Quick Reference

```html
<a href="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600"
   data-cge-lightbox
   data-cge-gallery="main-gallery"
   data-cge-caption="Yosemite Valley"
   data-cge-subtitle="Landscape Photography"
   data-cge-thumb="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300"
   class="block rounded-sm overflow-hidden border border-slate-200">
  <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600" alt="Yosemite" class="w-full h-48 object-cover">
</a>
```

---

## Programmatic Quick Reference

```javascript
import { CGELightbox } from 'tailtools';

// Quick static launch
CGELightbox.open([
  { src: '/images/photo1.jpg', caption: 'Mountain Sunrise', thumb: '/images/thumb1.jpg' },
  { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', type: 'youtube', caption: 'Promo Video' }
], {
  loop: true,
  thumbnails: true,
  zoomable: true
});
```
