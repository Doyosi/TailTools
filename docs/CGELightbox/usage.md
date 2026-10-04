# CGELightbox - Usage Guide

Comprehensive documentation for options, data attributes, instance methods, static controls, keyboard shortcuts, touch gestures, and event hooks in **CGELightbox**.

---

## Configuration Options

When creating an instance (`new CGELightbox(options)`) or calling `CGELightbox.open(items, options)`, you can configure the following options:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `Array<CGELightboxItem>` | `[]` | Array of media items to display in the gallery. |
| `initialIndex` | `number` | `0` | Zero-based index of the slide to display upon opening. |
| `loop` | `boolean` | `true` | Allows wrapping around when advancing past the last slide or backing past the first slide. |
| `zoomable` | `boolean` | `true` | Enables zoom and pan inspection controls for images. |
| `zoomSteps` | `number[]` | `[1, 2, 3]` | Scale factors cycled through when clicking or double-tapping an image. |
| `maxZoom` | `number` | `4` | Maximum allowable zoom scale factor. |
| `wheelZoom` | `boolean` | `true` | Enables smooth mouse wheel zooming over media items. |
| `swipeClose` | `boolean` | `true` | Enables vertical flick/swipe gesture on mobile touchscreens to dismiss the lightbox. |
| `swipeThreshold` | `number` | `80` | Minimum vertical drag distance (in pixels) required to dismiss the lightbox. |
| `thumbnails` | `boolean` | `true` | Displays a bottom thumbnail carousel/ribbon with active slide indicator. |
| `counter` | `boolean` | `true` | Displays slide position counter badge (e.g., `1 / 8`). |
| `fullscreen` | `boolean` | `true` | Shows the fullscreen toggle button in the top action toolbar. |
| `download` | `boolean` | `true` | Shows the direct file download button in the top action toolbar. |
| `backdropClose` | `boolean` | `true` | Closes the lightbox when clicking outside the media panel. If `false`, outside clicks trigger subtle bounce feedback. |
| `preload` | `boolean` | `true` | Automatically preloads adjacent previous and next media slides in the background. |
| `animationDriver` | `'auto' \| 'tailwind-animations' \| 'css' \| 'none'` | `'auto'` | Animation driver. In `'auto'`, auto-detects `animate-zoom-in` / `animate-fade-in` support. |
| `duration` | `number` | `250` | Transition duration in milliseconds. |
| `translations` | `Object` | `{ ... }` | Localization dictionary for action toolbar buttons, counter, and accessibility labels. |
| `onOpen` | `Function` | `null` | Callback executed when the lightbox opens: `(index: number) => void`. |
| `onChange` | `Function` | `null` | Callback executed when slide changes: `(index: number, item: CGELightboxItem) => void`. |
| `onZoom` | `Function` | `null` | Callback executed on zoom scale change: `(scale: number) => void`. |
| `onClose` | `Function` | `null` | Callback executed when the lightbox is closed: `() => void`. |

---

## Declarative HTML Data Attributes

All media items can be declared directly in HTML or Laravel Blade without writing custom JavaScript:

| Attribute | Target Tag | Description | Example |
| :--- | :--- | :--- | :--- |
| `data-cge-lightbox` | `<a>`, `<button>`, `<img>` | Marks the element as a lightbox trigger. | `data-cge-lightbox` |
| `data-cge-gallery` | `<a>`, `<button>`, `<img>` | Groups elements into a shared gallery album. | `data-cge-gallery="product-album"` |
| `data-cge-type` | `<a>`, `<button>`, `<img>` | Explicit media type: `image`, `video`, `youtube`, `vimeo`, or `inline`. | `data-cge-type="youtube"` |
| `data-cge-caption` | `<a>`, `<button>`, `<img>` | Primary title/caption displayed in the bottom footer. | `data-cge-caption="Grand Canyon at Dawn"` |
| `data-cge-subtitle` | `<a>`, `<button>`, `<img>` | Secondary descriptive text displayed under the caption. | `data-cge-subtitle="Photo by Ansel Adams"` |
| `data-cge-thumb` | `<a>`, `<button>`, `<img>` | URL for the bottom thumbnail ribbon preview image. | `data-cge-thumb="/img/thumb-1.jpg"` |
| `data-cge-poster` | `<a>`, `<button>`, `<img>` | Poster image URL for direct HTML5 video slides. | `data-cge-poster="/video/poster.jpg"` |
| `href` / `src` | `<a>`, `<img>` | Media source URL or selector (for `data-cge-type="inline"`). | `href="/media/highres.jpg"` |

---

## Keyboard Shortcuts

The lightbox automatically captures keyboard events while open:

| Key | Action |
| :--- | :--- |
| `Escape` | Closes the active lightbox. |
| `ArrowRight` | Advances to the next slide in the gallery. |
| `ArrowLeft` | Returns to the previous slide in the gallery. |
| `ArrowUp` or `+` | Zooms into the current media item. |
| `ArrowDown` or `-` | Zooms out of the current media item. |
| `0` | Resets zoom scale back to `1x`. |
| `f` or `F` | Toggles fullscreen mode for the viewer window. |

---

## Touch Gestures & Mouse Interaction

- **Horizontal Swipe:** Swipe left or right on mobile screens to navigate forward or backward through slides.
- **Vertical Swipe-Down (Flick to Dismiss):** Drag downwards from anywhere in the media container; passing 80px dismisses and closes the lightbox.
- **Pinch to Zoom:** Multi-touch pinch gestures smoothly zoom into and out of high-resolution images.
- **Click or Double-Tap Zoom:** Cycles through configured zoom steps (`1x` → `2x` → `3x` → reset).
- **Mouse Wheel Zoom:** Scroll up to zoom in, scroll down to zoom out.
- **Click & Drag Pan:** When zoomed (`scale > 1`), drag the image in any direction to inspect details.

---

## Static Methods

### `CGELightbox.open(items, options = {})`
Instantly launches the lightbox with an array of media objects.

```javascript
import { CGELightbox } from 'tailtools';

CGELightbox.open([
  {
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600',
    caption: 'Yosemite Mist',
    thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300'
  },
  {
    src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'youtube',
    caption: 'Demo Stream'
  }
], {
  initialIndex: 0,
  loop: true,
  thumbnails: true
});
```

### `CGELightbox.init(root = document)`
Scans the DOM inside `root` and automatically binds click delegation for all declarative triggers matching `[data-cge-lightbox]`.

```javascript
// Automatically executed on DOMContentLoaded, or invoke manually for dynamic AJAX content:
CGELightbox.init(document.getElementById('catalog-content'));
```

### `CGELightbox.setTranslations(translations)`
Updates global default translations across all lightbox instances.

```javascript
CGELightbox.setTranslations({
  "close": "Kapat (Esc)",
  "next": "Sonraki",
  "prev": "Önceki",
  "zoom-in": "Yakınlaştır",
  "zoom-out": "Uzaklaştır",
  "fullscreen": "Tam Ekran",
  "download": "İndir",
  "counter": ":current / :total"
});
```

---

## Instance Methods

```javascript
const lb = new CGELightbox({
  loop: true,
  thumbnails: true
});
```

### `lb.open(index = 0)`
Opens the lightbox at the specified slide index.

### `lb.close()`
Closes the lightbox, animates portal exit, and restores document body scrolling.

### `lb.next()`
Advances to the next slide in the active gallery.

### `lb.prev()`
Navigates to the previous slide in the active gallery.

### `lb.zoom(scale)`
Sets zoom level to an arbitrary scale factor (clamped between `1` and `maxZoom`).

### `lb.zoomIn()`
Increases zoom level to the next step.

### `lb.zoomOut()`
Decreases zoom level to the previous step.

### `lb.resetZoom()`
Resets zoom level back to `1x` and centers the image.

### `lb.toggleFullscreen()`
Toggles browser fullscreen mode on the lightbox viewport.

### `lb.download()`
Initiates direct file download for the current active slide.

### `lb.destroy()`
Removes DOM elements, tears down event listeners, and unlocks body scroll.

---

## Event Hooks

`CGELightbox` supports both instance method subscription (`.on()`) and native DOM CustomEvents dispatched to `document`.

### Instance Event Subscription

```javascript
const lb = new CGELightbox({ ... });

lb.on('open', ({ index }) => {
  console.log(`Opened at slide ${index}`);
});

lb.on('change', ({ index, item }) => {
  console.log(`Switched to slide ${index}: ${item.caption}`);
});

lb.on('zoom', ({ scale }) => {
  console.log(`Zoom level is now: ${scale}x`);
});

lb.on('close', () => {
  console.log('Lightbox closed');
});
```

### Native DOM CustomEvents

| Event Name | `detail` Payload | Description |
| :--- | :--- | :--- |
| `cge:lightbox:open` | `{ instance, index, item }` | Fired when the lightbox completes opening. |
| `cge:lightbox:change` | `{ instance, index, item }` | Fired when the active slide changes. |
| `cge:lightbox:zoom` | `{ instance, scale }` | Fired when image zoom scale changes. |
| `cge:lightbox:close` | `{ instance }` | Fired when the lightbox is closed. |

```javascript
document.addEventListener('cge:lightbox:change', (e) => {
  console.log('Slide changed to:', e.detail.index, e.detail.item);
});
```
