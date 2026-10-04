---
name: cge-toast
description: Lightweight, high-performance notification and toast alert system engineered for Tailwind CSS v4.3+ and Laravel Blade. Features 8 standard floating positions plus top/bottom full-width banner modes, automated z-index portal isolation, semantic variants (success, error, warning, info, neutral), customizable duration timers with visual progress bars and hover-pause, full HTML/rich text interpolation, avatar/icon/image support, i18n translation dictionary, swipe-to-dismiss, and dual event hooks (instance callbacks + DOM CustomEvents).
---

# CGEToast Skill

Universal agent guide for Antigravity, Claude Code, Cursor, and Codex when integrating or maintaining **CGEToast** inside TailTools.

---

## 1. Core Architecture
- **Plugin Path:** `plugins/CGEToast/`
- **Source Files:**
  - `CGEToast.js`: Native ES2022 class with singleton portal managers.
  - `CGEToast.d.ts`: Comprehensive TypeScript types.
  - `style.css`: Tailwind v4 portal z-index and banner layout styling.
  - `index.js`: Barrel export.
- **Dependencies:** 0 runtime external dependencies.

---

## 2. Quick Setup

```javascript
import { CGEToast } from 'tailtools';

// Quick static triggers
CGEToast.success('Saved successfully!');
CGEToast.error('Connection failed.', { title: 'Network Error' });
CGEToast.warning('Storage reaching 95% threshold.');
CGEToast.info('Version 1.2.0 released.');

// Generic invocation
CGEToast.show({
  message: 'Order #4091 confirmed!',
  variant: 'success',
  position: 'top-right',
  duration: 5000,
  progressBar: true,
  pauseOnHover: true
});
```

---

## 3. Position Schema
- **Floating:** `top-right` (default), `top-left`, `top-center`, `bottom-right`, `bottom-left`, `bottom-center`, `center`
- **Edge-to-Edge Banners:** `top-full`, `bottom-full` (spans 100vw seamlessly)

---

## 4. Interactive Actions & Undo Flow

```javascript
CGEToast.show({
  title: 'Item Deleted',
  message: 'Conversation was archived.',
  variant: 'neutral',
  duration: 7000,
  progressBar: true,
  pauseOnHover: true,
  actions: [
    {
      label: 'Undo',
      class: 'bg-indigo-600 hover:bg-indigo-500 text-white font-medium',
      onClick: (toast) => {
        undoArchival();
        CGEToast.success('Restored.');
        toast.dismiss();
      }
    }
  ]
});
```

---

## 5. Laravel Blade Flash Component

```blade
@if (session('success'))
    <div data-cge-toast-flash
         data-cge-variant="success"
         data-cge-title="Success"
         data-cge-message="{{ session('success') }}"
         data-cge-position="top-right"
         data-cge-duration="5000">
    </div>
@endif
```
Automatically parsed and shown when `initTailTools()` or `CGEToast.init()` is executed.
