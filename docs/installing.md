# Installing TailTools

`TailTools` is a modular, high-performance UI plugin and utility library designed specifically for **Tailwind CSS v4.3+** and **Laravel** (Blade & Vite), as well as modern Vanilla JavaScript and TypeScript projects.

---

## 1. Installation via npm

Install `tailtools` along with its peer dependencies:

```bash
npm install tailtools
# Optional animations peer:
npm install tailwind-animations
```

For Yarn or pnpm:
```bash
# pnpm
pnpm add tailtools tailwind-animations

# yarn
yarn add tailtools tailwind-animations
```

---

## 2. Tailwind CSS v4 Setup

TailTools is built natively for Tailwind CSS v4's CSS-first architecture.

In your main CSS file (e.g. `src/style.css` or `resources/css/app.css`):

```css
@import "tailwindcss";
@import "tailwind-animations";

/* Import all TailTools plugin styles (or individual plugin styles) */
@import "tailtools/styles";
```

If importing an individual plugin's styles:
```css
@import "tailtools/plugins/CGETooltip/style.css";
```

---

## 3. JavaScript / TypeScript Usage

All TailTools plugins are written in modern, dependency-free native JavaScript and include complete TypeScript type definitions (`.d.ts`).

### Modular Import (Recommended)
```javascript
import { CGEModal, CGEToast, CGEAlert, CGEForm, CGEDrawer, CGELightbox, CGEActionButton, CGESelect, CGEDropzone } from 'tailtools';
// or direct path:
// import { CGEDropzone } from 'tailtools/plugins/CGEDropzone';

// Initialize Drag & Drop File Uploader
const dropzone = new CGEDropzone('#my-dropzone', {
  uploadMode: 'instant',
  url: '/api/upload',
  acceptedFiles: 'image/*,.pdf'
});

// Initialize CGESelect on a searchable dropdown or multi-tag input
const select = new CGESelect('#skills-select', {
  multiple: true,
  maxItems: 5,
  searchable: true
});

// Initialize Action Button global delegation (auto-called in initTailTools)
CGEActionButton.init();

// Launch a touch-capable media lightbox & gallery viewer
CGELightbox.open([
  { src: '/images/photo1.jpg', caption: 'Yosemite Stream', thumb: '/images/thumb1.jpg' },
  { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', type: 'youtube', caption: 'Product Video' }
]);

// Initialize Sliding Drawer or Bottom Sheet
const drawer = new CGEDrawer('#nav-drawer', {
  placement: 'left',
  size: 'md',
  swipeClose: true
});

// Initialize AJAX Form with auto Laravel 422 error binding
const form = new CGEForm('#contact-form', {
  feedback: 'toast',
  resetOnSuccess: true
});

// Launch a confirmation dialog
const { isConfirmed } = await CGEAlert.confirm('Publish Article?');

// Trigger a toast notification
CGEToast.success('Saved successfully!', { position: 'top-right' });

// Initialize Modal
const modal = new CGEModal('#my-modal', {
  size: 'lg',
  backdrop: 'static',
});
```

### Auto-Initialization (Data Attributes)
All CGE plugins support declarative HTML initialization via `data-cge-*` attributes:
```javascript
import { initTailTools } from 'tailtools';

// Automatically initializes all plugins on elements with data-cge-* attributes
initTailTools();
```

---

## 4. Laravel Integration (Vite + Blade)

### Step A: Configure Vite (`resources/js/app.js`)
```javascript
import './bootstrap';
import '../css/app.css';

import { initTailTools, CGETooltip } from 'tailtools';

document.addEventListener('DOMContentLoaded', () => {
    initTailTools();
});

// Optionally expose to window for Alpine.js or inline scripts
window.CGETooltip = CGETooltip;
```

### Step B: Blade View Example
```blade
{{-- In resources/views/welcome.blade.php --}}
<button 
    data-cge-tooltip="Settings & Profile"
    data-cge-placement="bottom"
    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm transition-colors">
    Hover Me
</button>
```

---

## 5. CDN / Standalone Browser Script

For quick prototyping or non-bundled environments:

```html
<link rel="stylesheet" href="https://unpkg.com/tailtools/dist/tailtools.min.css">
<script src="https://unpkg.com/tailtools/dist/tailtools.umd.js"></script>

<script>
  const { CGETooltip, initTailTools } = TailTools;
  initTailTools();
</script>
```
