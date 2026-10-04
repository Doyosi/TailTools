---
name: cge-toast
description: Lightweight, reactive notification and toast alert system engineered for Tailwind CSS v4.3+ and Laravel Blade. Features 8 standard floating positions plus top/bottom full-width banner modes, automated z-index portal isolation, semantic variants (success, error, warning, info, neutral), customizable duration timers with visual progress bars and hover-pause, full HTML/rich text interpolation, avatar/icon/image support, i18n translation dictionary, swipe-to-dismiss, and dual event hooks (instance callbacks + DOM CustomEvents).
---

# CGEToast Agent Skill

Use this skill when implementing, configuring, or debugging toast notifications, status banners, snackbars, and alert popups using the **TailTools** `CGEToast` plugin in Tailwind CSS v4.3+ or Laravel Blade projects.

---

## 1. When to Use CGEToast

Apply `CGEToast` whenever the user asks for:
- "Add toast notifications / snackbars in Tailwind or Laravel."
- "Show success, error, warning, or info alert messages."
- "Display an edge-to-edge top or bottom announcement banner (e.g. cookie consent, system maintenance)."
- "Implement a notification with animated countdown progress bar that freezes on mouse hover."
- "Provide a Gmail-style action toast with an 'Undo' button."
- "Display Laravel session flash messages (`session('success')`, `session('error')`) as toasts."
- "Enable mobile touch swipe-to-dismiss for notifications."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEToast/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGEToast } from 'tailtools';

// Auto-initialize declarative triggers and session flash elements
initTailTools();

// Expose globally for inline scripts or Alpine.js
window.CGEToast = CGEToast;
```

---

## 3. Core API Quick Reference

### Static Shortcut Helpers

```javascript
import { CGEToast } from 'tailtools';

// Quick semantic helpers
CGEToast.success('Saved successfully!');
CGEToast.error('Failed to update record.', { title: 'Network Error' });
CGEToast.warning('Your plan quota is almost full (95%).');
CGEToast.info('New feature released: Dark mode.');

// Theme configuration: 'light' (default), 'dark', or 'auto' (respects html.dark / prefers-color-scheme)
CGEToast.setDefaultOptions({ theme: 'light' });

// Generic invocation
CGEToast.show({
  message: 'Payment received!',
  variant: 'success',
  theme: 'light', // 'light' | 'dark' | 'auto'
  position: 'top-right',
  duration: 5000,
  progressBar: true,
  pauseOnHover: true
});

// Dismiss all toasts or target a position
CGEToast.dismissAll();
CGEToast.dismissAll('top-right');
```

---

## 4. Multi-Position Grid & Banners

Positions supported:
- **Floating:** `'top-right'` (default), `'top-left'`, `'top-center'`, `'bottom-right'`, `'bottom-left'`, `'bottom-center'`, `'center'`.
- **Full-Width Banners:** `'top-full'`, `'bottom-full'` (spans 100vw edge-to-edge).

```javascript
// Top edge-to-edge alert banner
CGEToast.show({
  title: 'System Maintenance',
  message: 'Read-only maintenance scheduled for 02:00 UTC.',
  position: 'top-full',
  variant: 'warning',
  duration: 8000
});

// Bottom edge-to-edge cookie banner
CGEToast.show({
  title: 'Cookie Consent',
  message: 'We use cookies to improve your user experience.',
  position: 'bottom-full',
  variant: 'neutral',
  duration: false, // Persistent
  actions: [
    {
      label: 'Accept All',
      class: 'bg-emerald-600 hover:bg-emerald-500 text-white font-medium',
      onClick: (toast) => {
        localStorage.setItem('cookies', 'all');
        toast.dismiss();
      }
    }
  ]
});
```

---

## 5. Interactive Action Buttons & Undo Flows

```javascript
CGEToast.show({
  title: 'Item Deleted',
  message: 'Conversation was moved to Trash.',
  variant: 'neutral',
  duration: 6000,
  progressBar: true,
  pauseOnHover: true,
  actions: [
    {
      label: 'Undo',
      class: 'bg-indigo-600 hover:bg-indigo-500 text-white font-medium',
      onClick: (toast) => {
        revertItem();
        CGEToast.success('Restored.');
        toast.dismiss();
      }
    }
  ]
});
```

---

## 6. Laravel Blade & Session Flash Integration

### Declarative Button Triggers

```blade
<button type="button"
        data-cge-toast="Order #5091 confirmed!"
        data-cge-toast-variant="success"
        data-cge-toast-theme="light"
        data-cge-toast-position="top-right">
    Submit Order
</button>
```

### Laravel Blade Session Flash Component (`<x-cge-toast />`)

In `resources/views/components/cge-toast.blade.php`:
```blade
@props(['position' => 'top-right', 'duration' => 5000])

@if (session('success'))
    <div data-cge-toast-flash
         data-cge-variant="success"
         data-cge-title="{{ session('title', 'Success') }}"
         data-cge-message="{{ session('success') }}"
         data-cge-position="{{ $position }}"
         data-cge-duration="{{ $duration }}">
    </div>
@endif

@if (session('error'))
    <div data-cge-toast-flash
         data-cge-variant="error"
         data-cge-title="{{ session('title', 'Error') }}"
         data-cge-message="{{ session('error') }}"
         data-cge-position="{{ $position }}"
         data-cge-duration="{{ $duration }}">
    </div>
@endif
```

Include once in `resources/views/layouts/app.blade.php`:
```blade
<x-cge-toast position="top-right" :duration="5000" />
```

---

## 7. DOM CustomEvents

```javascript
document.addEventListener('cge:toast:open', (e) => {
  console.log('Opened:', e.detail.variant, e.detail.message);
});

document.addEventListener('cge:toast:close', (e) => {
  console.log('Closed:', e.detail.position);
});

document.addEventListener('cge:toast:click', (e) => {
  console.log('Clicked card');
});
```

---

## 8. Internationalization (i18n)

```javascript
CGEToast.setTranslations({
  close: 'Bildirimi Kapat',
  undo: 'Geri Al',
  'success-title': 'Başarılı',
  'error-title': 'Hata',
  'warning-title': 'Uyarı',
  'info-title': 'Bilgilendirme'
});
```
