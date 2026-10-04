# CGELightbox Architecture & Implementation Plan

**Plugin Name:** `CGELightbox`  
**Location:** `plugins/CGELightbox/`  
**License:** MIT  
**Compatibility:** Tailwind CSS v4.3+, Native JS (ES2022+), Laravel Blade, Vite  

---

## 1. Executive Summary & Purpose

`CGELightbox` is an ultra-fast, touch-capable media lightbox and gallery viewer designed specifically for **Tailwind CSS v4.3+** and **Laravel Blade** applications. It supports:
1. **Multi-Media Types:** High-resolution images, direct HTML5 video (`<video>`), responsive YouTube and Vimeo embeds, and inline DOM templates.
2. **Smooth Pan-and-Zoom Controls:** Up to 3x zoom with double-click/double-tap toggling, mouse wheel zoom, and click-and-drag panning.
3. **Gallery Grouping & Preloading:** Elements grouped by `data-cge-gallery="name"`, with adjacent slide preloading for zero-latency switching.
4. **Touch Gestures:** Horizontal swipe navigation, vertical swipe-to-dismiss, and mobile pinch-to-zoom.
5. **Interactive Action Toolbar:** Fullscreen toggle, direct file download, zoom in/out, slide counter, and close controls.
6. **Bottom Thumbnail Ribbon:** Scrollable thumbnail carousel previewing gallery items with active item highlighting.
7. **Strict Design System Rule:** Strictly uses `rounded-sm` for buttons, badges, cards, and thumbnails. Zero `rounded-2xl` or `rounded-xl`.

---

## 2. API Specifications

### 2.1 Constructor & Options
```javascript
const lb = new CGELightbox({
  selector: '[data-cge-lightbox]', // selector to discover declarative items
  loop: true, // loop gallery navigation
  thumbnails: true, // show bottom thumbnail ribbon
  counter: true, // show slide counter badge
  download: true, // show download button in toolbar
  fullscreen: true, // show fullscreen toggle in toolbar
  zoom: true, // enable pan and zoom engine
  maxZoom: 3, // maximum zoom scale factor
  swipeClose: true, // swipe down vertically to dismiss
  preload: true, // preload adjacent slides
  backdropClose: true, // click outside to close
  animationDriver: 'auto', // 'auto' | 'tailwind-animations' | 'css' | 'none'
  duration: 250, // transition duration in ms
  translations: {
    "close": "Close (Esc)",
    "next": "Next",
    "prev": "Previous",
    "zoom-in": "Zoom in",
    "zoom-out": "Zoom out",
    "fullscreen": "Toggle fullscreen",
    "download": "Download media",
    "counter": ":current / :total"
  }
});
```

### 2.2 Static Methods
- `CGELightbox.init(selector = '[data-cge-lightbox]')`: Auto-binds all declarative lightbox elements on the page.
- `CGELightbox.open(items, options = {}, initialIndex = 0)`: Programmatically opens a lightbox with an array of media objects.
- `CGELightbox.close()`: Closes the currently active lightbox instance.
- `CGELightbox.setTranslations(dict)`: Sets global localization strings.

### 2.3 Instance Methods
- `lb.open(index = 0, gallery = null)`: Opens lightbox at specified item index.
- `lb.close()`: Closes the active lightbox.
- `lb.next()`: Navigates to the next slide.
- `lb.prev()`: Navigates to the previous slide.
- `lb.goTo(index)`: Navigates to a specific slide index.
- `lb.zoom(scale)`: Sets zoom scale (1 to 3).
- `lb.toggleZoom()`: Cycles zoom (1x -> 2x -> 3x -> 1x).
- `lb.toggleFullscreen()`: Toggles native browser fullscreen mode.
- `lb.destroy()`: Cleans up listeners, removes portal, and restores body scroll.

### 2.4 Events & Lifecycle Hooks
- `open` / `cge:lightbox:open`: Fired when lightbox opens.
- `change` / `cge:lightbox:change`: Fired when active slide changes.
- `zoom` / `cge:lightbox:zoom`: Fired when zoom scale changes.
- `close` / `cge:lightbox:close`: Fired when lightbox closes.

---

## 3. Media Type Detection

1. **YouTube:** URLs matching `youtube.com/watch` or `youtu.be/` converted to `https://www.youtube-nocookie.com/embed/{id}?autoplay=1`.
2. **Vimeo:** URLs matching `vimeo.com/{id}` converted to `https://player.vimeo.com/video/{id}?autoplay=1`.
3. **Video:** URLs ending in `.mp4`, `.webm`, `.ogg`, or items with `data-cge-type="video"`.
4. **Inline:** Selectors or items with `data-cge-type="inline"` rendering referenced HTML elements.
5. **Image (Default):** Standard high-resolution image viewer with caption and description.

---

## 4. UI Design System Compliance
- Strictly follow the project border-radius standard: **`rounded-sm`** for buttons, badges, inputs, thumbnails, and preview boxes.
- Zero usage of `rounded-2xl`, `rounded-3xl`, `rounded-4xl`, or `rounded-xl`.
