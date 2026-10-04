# CGEToast - Lightweight Reactive Notification & Toast Alert System

`CGEToast` is a lightweight, high-performance notification and toast alert system engineered specifically for **Tailwind CSS v4.3+** and **Laravel Blade** applications. Built in native ES2022+ JavaScript with full TypeScript support, it delivers 8 standard floating positions, top/bottom edge-to-edge banners, automated z-index portal isolation, semantic variants, countdown timers with visual progress bars and hover-pause, touch swipe-to-dismiss, and complete i18n localization.

**Zero external runtime dependencies.**

---

## Key Features

- **Multi-Position Viewport Grid:**
  - **7 Floating Quadrants:** `top-right` (default), `top-left`, `top-center`, `bottom-right`, `bottom-left`, `bottom-center`, and `center`.
  - **2 Edge-to-Edge Banners:** `top-full` and `bottom-full` spanning 100vw seamlessly without horizontal clipping or scrollbar shifts.
- **Zero z-index Collisions & Portal Isolation:**
  - Injects isolated portal containers directly under `document.body` with `z-[99999]`.
  - Containers use `pointer-events-none` so underlying page UI remains 100% interactive, while individual toast cards use `pointer-events-auto`.
- **Semantic Variants Palette:** Out-of-the-box styling and inline SVG icons for `success`, `error`, `warning`, `info`, and `neutral`.
- **60fps Countdown Progress Bar & Hover-Pause:** Animated RAF progress bar matching the variant accent. Hovering over a toast freezes the timer; moving away resumes the countdown.
- **Touch Swipe Gestures:** Native touch support allowing mobile users to flick away toasts horizontally with natural spring transitions.
- **Rich Content & Actions:** Full HTML interpolation, custom avatar/image slots, and customizable action buttons (e.g. Gmail-style "Undo").
- **Localization (i18n) Engine:** Built-in translation dictionary with runtime overrides for custom titles, close button aria labels, and action labels.
- **Laravel Blade & Flash Integration:** Automatic processing of Laravel session flash messages via `<x-cge-toast />` or declarative `data-cge-toast-flash` attributes.
- **Dual Event System:** Both instance callback functions (`onOpen`, `onClose`, `onClick`) and standard DOM CustomEvents dispatched on `document`.

---

## Semantic Variants Matrix

| Variant | Accent Color | Default Title | Default Icon | Intended Use Case |
| :--- | :--- | :--- | :--- | :--- |
| `success` | Emerald (`#10b981`) | "Success" | Checkmark badge | Successful saves, order placements, checkouts |
| `error` | Rose (`#f43f5e`) | "Error" | Alert X badge | Validation errors, network timeouts, payment failures |
| `warning` | Amber (`#f59e0b`) | "Warning" | Triangle caution | Quota limits, expiration warnings, unsaved changes |
| `info` | Sky (`#0ea5e9`) | "Notice" | Information circle | System announcements, software updates, tips |
| `neutral` | Slate (`#64748b`) | "Notification" | Bell outline | General notices, subtle activity feeds, cookies |

---

## Position Matrix

```text
┌────────────────────────────────────────────────────────┐
│                      top-full                          │
├──────────────┬──────────────────────────┬──────────────┤
│   top-left   │        top-center        │  top-right   │
│              │                          │  (default)   │
├──────────────┼──────────────────────────┼──────────────┤
│              │          center          │              │
├──────────────┼──────────────────────────┼──────────────┤
│ bottom-left  │      bottom-center       │ bottom-right │
├──────────────┴──────────────────────────┴──────────────┤
│                     bottom-full                        │
└────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Import Stylesheet
In your main CSS bundle (`src/style.css` or `resources/css/app.css`):

```css
@import "tailwindcss";
@import "tailwind-animations";

/* Import TailTools CGEToast styles */
@import "tailtools/plugins/CGEToast/style.css";
```

### 2. Basic JavaScript Usage

```javascript
import { CGEToast } from 'tailtools';

// Quick static shortcuts
CGEToast.success('Profile updated successfully!');
CGEToast.error('Could not connect to payment gateway.', { title: 'Payment Failed' });
CGEToast.warning('Your session expires in 5 minutes.');
CGEToast.info('New release v1.2.0 is live.');

// Full-width top banner
CGEToast.show({
  title: 'Scheduled Maintenance',
  message: 'Routine cluster maintenance tonight at 02:00 UTC.',
  position: 'top-full',
  variant: 'warning',
  duration: 8000
});
```

### 3. Declarative HTML Trigger

```html
<button type="button"
        data-cge-toast="Order #9401 confirmed!"
        data-cge-toast-variant="success"
        data-cge-toast-position="top-right">
    Confirm Order
</button>
```

---

## Documentation Index

- [Usage & API Reference](usage.md) - Complete static methods, constructor options, lifecycle, and event hooks.
- [Laravel Blade Integration](laravel-blade.md) - Flash session handling, Blade components, and Livewire setup.
- [Practical Examples](examples.md) - Action buttons, Undo flows, custom avatars, and banner recipes.
- [TypeScript API Specification](api.md) - Full TypeScript interfaces and event contracts.
