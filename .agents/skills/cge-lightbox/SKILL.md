---
name: cge-lightbox
description: Ultra-fast, touch-capable media lightbox and gallery viewer designed for Tailwind CSS v4.3+ and Laravel Blade. Features multi-media support (images, HTML5 video, YouTube/Vimeo embeds, inline HTML templates), smooth pan-and-zoom controls (double-tap/click zoom, mouse wheel zoom, click-and-drag pan), bottom thumbnail ribbons, swipe gestures (horizontal navigation, vertical flick to dismiss, pinch-to-zoom), progressive image preloading, keyboard accessibility, and declarative data-attribute triggers.
---

# CGELightbox Agent Skill

Use this skill when implementing, configuring, or debugging media lightboxes, photo albums, video popups, and zoomable gallery viewers using the **TailTools** `CGELightbox` plugin in Tailwind CSS v4.3+ or Laravel Blade projects.

---

## 1. When to Use CGELightbox

Activate this skill when the user requests:
- "Add a lightbox for images, photo galleries, or portfolio albums."
- "Embed responsive YouTube, Vimeo, or HTML5 MP4 videos inside a lightbox overlay."
- "Display an inline HTML modal or custom card inside a lightbox frame (`data-cge-type="inline"`)."
- "Implement high-resolution image inspection with smooth pan and zoom (double-click/double-tap, wheel zoom, click-and-drag)."
- "Add mobile touch gestures to gallery previewing (swipe slides, flick down to dismiss, pinch-to-zoom)."
- "Create a bottom thumbnail ribbon or carousel previewing gallery slides."
- "Build Laravel Blade `<x-cge-lightbox>` or `<x-cge-gallery>` components with zero-JS declarative triggers."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGELightbox/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGELightbox } from 'tailtools';

// Auto-initializes declarative [data-cge-lightbox] triggers
initTailTools();

// Global access for Alpine.js or inline scripts
window.CGELightbox = CGELightbox;
```

---

## 3. Declarative HTML Markup Pattern

```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
  <!-- Image Slide 1 -->
  <a href="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600"
     data-cge-lightbox
     data-cge-gallery="nature-album"
     data-cge-caption="Yosemite Valley Stream"
     data-cge-subtitle="High-Resolution Landscape"
     data-cge-thumb="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300"
     class="block overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:opacity-90 transition">
    <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600" alt="Yosemite" class="w-full h-48 object-cover">
  </a>

  <!-- YouTube Embed Slide -->
  <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
     data-cge-lightbox
     data-cge-gallery="nature-album"
     data-cge-type="youtube"
     data-cge-caption="Online 4K Stream"
     class="block overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:opacity-90 transition">
    <img src="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600" alt="Stream" class="w-full h-48 object-cover">
  </a>
</div>
```

---

## 4. Programmatic JavaScript API

### Static Quick Launch
```javascript
import { CGELightbox } from 'tailtools';

CGELightbox.open([
  {
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600',
    thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300',
    caption: 'Yosemite Mist',
    subtitle: 'Nature Archive'
  },
  {
    src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'youtube',
    caption: 'YouTube Stream'
  }
], {
  loop: true,
  thumbnails: true,
  zoomable: true
});
```

### Instance Control & Event Lifecycle
```javascript
const lb = new CGELightbox({
  loop: true,
  thumbnails: true,
  onOpen: (index) => console.log('Opened at index', index),
  onChange: (index, item) => console.log('Slide changed', index, item.caption),
  onClose: () => console.log('Closed')
});

lb.on('zoom', ({ scale }) => console.log('Zoom scale:', scale));

// Open at specific index
lb.open(0);

// Programmatic controls
lb.next();
lb.prev();
lb.zoom(2.5);
lb.resetZoom();
lb.toggleFullscreen();
lb.download();
lb.close();
```

---

## 5. Declarative Attributes Reference

| Attribute | Accepted Values | Description |
| :--- | :--- | :--- |
| `data-cge-lightbox` | None (flag) | Binds element as a lightbox trigger. |
| `data-cge-gallery` | `string` | Groups items into an interconnected gallery album. |
| `data-cge-type` | `image`, `video`, `youtube`, `vimeo`, `inline` | Explicitly overrides media type detection. |
| `data-cge-caption` | `string` | Primary caption title displayed at bottom. |
| `data-cge-subtitle` | `string` | Secondary subtitle text displayed under caption. |
| `data-cge-thumb` | `string` (URL) | Custom image URL for bottom thumbnail strip preview. |
| `data-cge-poster` | `string` (URL) | Poster frame for direct HTML5 video playback. |
| `href` / `src` | URL or `#selector` | Target media asset or DOM template selector. |

---

## 6. Keyboard & Touch Gesture Controls

- **Keyboard:**
  - `Escape`: Closes the active lightbox.
  - `ArrowLeft` / `ArrowRight`: Slide navigation.
  - `ArrowUp` / `+`: Zoom in.
  - `ArrowDown` / `-`: Zoom out.
  - `0`: Reset zoom to 1x.
  - `f` / `F`: Toggle fullscreen.
- **Touch Gestures:**
  - Horizontal swipe: Navigates slides.
  - Vertical swipe down: Flick down to dismiss/close the lightbox (threshold: 80px).
  - Pinch-to-zoom: Smoothly scales images.
  - Double-tap: Cycles zoom factor (1x → 2x → 3x → reset).

---

## 7. Strict Design System Rule

- **Strict Border Radius:** Always apply **`rounded-sm`** for buttons, badges, thumbnails, inputs, cards, and dialogue frames.
- **Forbidden:** Never use `rounded-2xl`, `rounded-3xl`, `rounded-4xl`, or `rounded-xl`.
