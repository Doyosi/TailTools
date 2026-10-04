---
name: cge-drawer
description: High-performance, gesture-capable sliding drawer and off-canvas navigation plugin designed for Tailwind CSS v4.3+ and Laravel Blade. Features 4-direction positioning (left, right, top, bottom), configurable backdrop behavior (dismissible, static with directional bounce feedback, or non-modal backdrop-less mode), swipe-to-dismiss touch gestures, layout-push mode, collapsed mini-rail mode, full keyboard/focus trapping, and seamless Laravel Blade declarative triggers.
---

# CGEDrawer Agent Skill

Use this skill when implementing, configuring, or debugging sliding drawers, off-canvas navigation panels, mobile bottom sheets, and push sidebars using the **TailTools** `CGEDrawer` plugin in Tailwind CSS v4.3+ or Laravel Blade projects.

---

## 1. When to Use CGEDrawer

Activate this skill when the user requests:
- "Add a sliding drawer, sidebar navigation, or off-canvas menu."
- "Create a mobile bottom sheet with swipe-to-dismiss touch gestures."
- "Implement a non-modal persistent sidebar that allows editing page elements behind it."
- "Implement a static backdrop that nudges/bounces along the drawer edge when clicking outside."
- "Push main page content aside when opening a sidebar (`pushContentSelector`)."
- "Create a collapsed mini-dock rail (`mini: true`) that expands on toggle."
- "Build a Laravel Blade `<x-cge-drawer>` component with declarative data triggers."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEDrawer/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGEDrawer } from 'tailtools';

// Auto-initializes all declarative triggers (data-cge-drawer-*)
initTailTools();

// Global access for Alpine.js or inline scripts
window.CGEDrawer = CGEDrawer;
```

---

## 3. Declarative HTML Markup Pattern

```html
<!-- Trigger Button -->
<button type="button" 
        data-cge-drawer-target="#main-nav-drawer" 
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-xs font-semibold">
    Open Menu
</button>

<!-- Drawer Container -->
<div id="main-nav-drawer"
     class="cge-drawer fixed inset-0 z-50 hidden"
     data-cge-placement="left"
     data-cge-size="md">
    
    <!-- Backdrop Overlay -->
    <div class="cge-drawer-backdrop fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300" data-cge-drawer-backdrop></div>

    <!-- Drawer Dialog Panel -->
    <div class="cge-drawer-dialog fixed top-0 bottom-0 left-0 h-full w-80 bg-white border-r border-slate-200 p-6 shadow-2xl flex flex-col justify-between" data-cge-drawer-dialog>
        <div>
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h3 class="text-sm font-bold text-slate-900">Application Menu</h3>
                <button type="button" data-cge-drawer-close class="w-8 h-8 rounded-sm flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">✕</button>
            </div>
            <nav class="space-y-1">
                <a href="/dashboard" class="flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-semibold bg-indigo-50 text-indigo-700">Dashboard</a>
                <a href="/settings" class="flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Settings</a>
            </nav>
        </div>
        <button type="button" data-cge-drawer-close class="w-full py-2 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
            Close Menu
        </button>
    </div>
</div>
```

---

## 4. 4-Direction Placements & Presets

- `placement: 'left'` (Default): Originates from left screen edge (`top-0 bottom-0 left-0 h-full`).
- `placement: 'right'`: Originates from right screen edge (`top-0 bottom-0 right-0 h-full`).
- `placement: 'top'`: Originates from top screen edge (`top-0 left-0 right-0 w-full`).
- `placement: 'bottom'`: Originates from bottom screen edge (`bottom-0 left-0 right-0 w-full`).

### Presets:
- Side (`left`, `right`): `sm` (`w-64`), `md` (`w-80`), `lg` (`w-96`), `xl` (`w-1/2`), `full` (`w-screen`).
- Vertical (`top`, `bottom`): `sm` (`h-48`), `md` (`h-80`), `lg` (`h-1/2`), `full` (`h-screen`), `auto` (`max-h-[90vh] h-auto`).

---

## 5. Touch Gestures (Swipe-to-Dismiss)

Enable real-time touch gesture tracking for mobile bottom sheets and side drawers:

```html
<div id="mobile-sheet" class="cge-drawer fixed inset-0 z-50 hidden" data-cge-placement="bottom" data-cge-size="auto" data-cge-swipe-close="true">
    <div class="cge-drawer-backdrop fixed inset-0 bg-slate-950/60" data-cge-drawer-backdrop></div>
    <div class="cge-drawer-dialog fixed bottom-0 left-0 right-0 w-full max-h-[90vh] bg-white border-t border-slate-200 rounded-t-sm p-6" data-cge-drawer-dialog>
        <!-- Drag Handle Indicator -->
        <div class="cge-drawer-handle"></div>
        <h3 class="text-sm font-bold text-center mb-4">Swipe down to dismiss</h3>
    </div>
</div>
```

---

## 6. Directional Tactile Bounce Nudge Feedback

When `data-cge-backdrop="static"` or `backdropClose: false` is configured:
- Clicks outside the drawer do not close it.
- Instead, the drawer executes an axis-aligned spring bounce nudge along its originating border:
  - Left drawer nudges right (+14px) and snaps back.
  - Right drawer nudges left (-14px) and snaps back.
  - Top drawer nudges down (+14px) and snaps back.
  - Bottom drawer nudges up (-14px) and snaps back.

---

## 7. Layout Push Mode

Shift page content aside when opened:

```javascript
const drawer = new CGEDrawer('#push-nav', {
  placement: 'left',
  pushContentSelector: '#main-content',
  duration: 300
});
```

---

## 8. Collapsed Mini-Rail Mode

Dock into a narrow icon bar (`w-16`) instead of hiding off-screen:

```javascript
const drawer = new CGEDrawer('#mini-nav', {
  placement: 'left',
  mini: true,
  miniWidth: 'w-16',
  size: 'w-64'
});
```

---

## 9. Design System Rule Reminder

## Verified maintenance contract (2026-10-04)

Destroy removes click, key and touch listeners, cancels animation work and restores layout-push inline styles. Recreating on the same DOM is supported. Partial translations preserve defaults and data-cge-duration="0" is valid. Static toggle accepts an optional third trigger argument. Overlay ownership is shared with Modal, Alert and Lightbox.

Use the existing plugin radius/theme defaults. New markup may prefer rounded-sm; do not replace Dropzone rounded-xl or circular avatar defaults during maintenance. The canonical API is [CGEDrawer.d.ts](../../../../plugins/CGEDrawer/CGEDrawer.d.ts).
