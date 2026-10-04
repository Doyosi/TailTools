# CGELightbox - Native Tailwind CSS v4 & Laravel Media Lightbox Plugin

`CGELightbox` is an ultra-fast, touch-capable media lightbox and gallery viewer built specifically for **Tailwind CSS v4.3+** and **Laravel Blade** environments. It delivers rich multi-media support (images, HTML5 video, YouTube, Vimeo, inline HTML templates), smooth pan-and-zoom controls, bottom thumbnail navigation ribbons, swipe gestures, progressive image preloading, keyboard accessibility, and zero-JS declarative data-attribute triggers.

---

## Key Features

- **Multi-Media Engine:**
  - **High-Resolution Images:** Automatic aspect ratio fitting with captions and subtitles.
  - **HTML5 Video Player:** Native `<video controls>` rendering with optional poster frames.
  - **Responsive Embeds:** Automatic 16:9 aspect ratio responsive iframes for YouTube and Vimeo.
  - **Inline DOM / Custom Content:** Displays hidden template markup or rich interactive cards (`data-cge-type="inline"`).
- **Smooth Pan & Zoom Controls:**
  - Double-tap or double-click to step zoom (`1x` → `2x` → `3x` → reset).
  - Smooth mouse wheel zoom in and out.
  - Click-and-drag and touch pan to inspect zoomed photographs freely.
- **Mobile Touch Gestures:**
  - Horizontal swipe to navigate previous and next slides.
  - Vertical swipe down: Flick down to dismiss and close the viewer.
  - Pinch-to-zoom on multi-touch mobile screens.
- **Gallery Grouping & Thumbnails:**
  - Declarative gallery grouping via `data-cge-gallery="gallery-name"`.
  - Slide counter badge (`1 / 8`) with customizable format string.
  - Bottom thumbnail ribbon previewing all slides with active slide highlight.
  - Progressive background preloading for the previous and next slides.
- **Action Toolbar & Backdrop Physics:**
  - Top action toolbar with Fullscreen toggle, Direct Download, Zoom In/Out, and Close buttons.
  - Translucent backdrop overlay with configurable blur (`bg-black/90 backdrop-blur-md`).
  - Static backdrop behavior: When `backdropClose: false`, outside clicks trigger an axis-centered bounce feedback.
- **Full Keyboard Accessibility (a11y):**
  - Full keyboard shortcuts: `Escape` (Close), `ArrowLeft` / `ArrowRight` (Navigation), `ArrowUp` / `ArrowDown` or `+` / `-` (Zoom), `f` (Fullscreen).
  - Trapped body scroll (`overflow-hidden`) with zero layout shift.
  - WAI-ARIA modal dialogue attributes (`role="dialog"`, `aria-modal="true"`).
- **Design System Rule Compliance:**
  - Exclusively uses **`rounded-sm`** for buttons, badges, thumbnails, and preview cards.

---

## Quick Start

### 1. Stylesheet Setup (Tailwind CSS v4)

In your main CSS file (`src/style.css` or `resources/css/app.css`):

```css
@import "tailwindcss";
@import "tailwind-animations";

/* Import CGELightbox stylesheet */
@import "tailtools/plugins/CGELightbox/style.css";
```

### 2. Declarative HTML / Blade Markup

Wrap your gallery images or links with `data-cge-lightbox` and a shared `data-cge-gallery` name:

```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
  <!-- Image Slide 1 -->
  <a href="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600"
     data-cge-lightbox
     data-cge-gallery="nature-album"
     data-cge-caption="Yosemite Valley Mist"
     data-cge-subtitle="High-resolution landscape photograph"
     data-cge-thumb="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300"
     class="block overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:opacity-90 transition">
    <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600" alt="Yosemite" class="w-full h-48 object-cover">
  </a>

  <!-- Image Slide 2 -->
  <a href="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600"
     data-cge-lightbox
     data-cge-gallery="nature-album"
     data-cge-caption="Wilderness Mountain Ridge"
     data-cge-thumb="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300"
     class="block overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:opacity-90 transition">
    <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600" alt="Mountain" class="w-full h-48 object-cover">
  </a>

  <!-- Video Slide (YouTube) -->
  <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
     data-cge-lightbox
     data-cge-gallery="nature-album"
     data-cge-type="youtube"
     data-cge-caption="Demo YouTube 4K Stream"
     class="block overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:opacity-90 transition">
    <img src="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600" alt="Video" class="w-full h-48 object-cover">
  </a>
</div>
```

### 3. Programmatic JavaScript API

```javascript
import { CGELightbox } from 'tailtools';

// Quick static launch
CGELightbox.open([
  {
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600',
    thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300',
    caption: 'Yosemite Valley Mist',
    subtitle: 'Nature Collection'
  },
  {
    src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'youtube',
    caption: 'Streaming Media'
  }
], {
  loop: true,
  thumbnails: true,
  zoomable: true
});

// Or create an instance to control lifecycle
const lb = new CGELightbox({
  loop: true,
  thumbnails: true
});

lb.on('change', ({ index, item }) => {
  console.log(`Active slide is now: ${index + 1} - ${item.caption}`);
});

lb.open(0);
```

---

## Documentation Index

- [Usage Guide (`usage.md`)](file:///f:/GITHUB/TailTools/docs/CGELightbox/usage.md) - Configuration options, instance & static methods, keyboard controls, touch gestures, and events.
- [Laravel Blade Guide (`laravel-blade.md`)](file:///f:/GITHUB/TailTools/docs/CGELightbox/laravel-blade.md) - Blade components `<x-cge-lightbox>` and `<x-cge-gallery>` with slots and declarative options.
- [Examples & Recipes (`examples.md`)](file:///f:/GITHUB/TailTools/docs/CGELightbox/examples.md) - Practical code patterns for photo albums, mixed media, gigapixel inspection, and inline HTML.
- [API Reference (`api.md`)](file:///f:/GITHUB/TailTools/docs/CGELightbox/api.md) - TypeScript interfaces, types, and event payload structures.
