# CGEDrawer Architecture & Implementation Plan

**Plugin Name:** `CGEDrawer`  
**Location:** `plugins/CGEDrawer/`  
**License:** MIT  
**Compatibility:** Tailwind CSS v4.3+, Native JS (ES2022+), Laravel Blade, Vite  

---

## 1. Executive Summary & Purpose

`CGEDrawer` is a high-performance, gesture-capable sliding drawer, side-panel, and off-canvas navigation plugin tailored for modern Tailwind CSS v4.3+ environments and Laravel Blade applications. It provides:
1. **4-Direction Sliding:** `left`, `right`, `top`, and `bottom` positions.
2. **Sizing Presets & Flexible Geometry:** Presets (`sm`, `md`, `lg`, `xl`, `full`) and bottom-sheet auto-height.
3. **Dual Animation Engine:** Native CSS3 transforms with seamless fallback and optional `tailwind-animations` driver.
4. **Configurable Backdrop & Static Tactile Nudge:** Modal with dismissible overlay, non-modal docked panel (`backdrop: false`), and static backdrop with directional bounce feedback along the drawer's orientation axis.
5. **Touch Swipe-to-Dismiss:** Real-time touch gesture tracking with velocity/distance thresholds for mobile drawers and bottom sheets.
6. **Layout Push Mode (`pushContentSelector`):** Automatically shifts target page elements aside when the drawer opens.
7. **Collapsed Mini-Rail Mode (`mini: true`):** Docks into a slim icon rail instead of exiting off-screen.
8. **Accessibility & Focus Trapping:** WCAG 2.1 compliant focus loop, body scroll locking with scrollbar jump compensation, and Escape key handling.
9. **Laravel Blade Event Delegation:** Global declarative data attributes (`data-cge-drawer-target`, `data-cge-drawer-close`, `data-cge-drawer-toggle`).

---

## 2. API Specifications

### 2.1 Constructor & Options
```javascript
const drawer = new CGEDrawer('#main-drawer', {
  placement: 'left', // 'left' | 'right' | 'top' | 'bottom'
  size: 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full' | custom Tailwind class
  backdrop: true, // true | false (false for non-modal sidebar)
  backdropClose: true, // true (dismiss) | false (static with bounce)
  escapeClose: true, // close on Escape key press
  animationDriver: 'auto', // 'auto' | 'tailwind-animations' | 'css' | 'none'
  swipeClose: true, // enable touch gesture swipe dismissal
  swipeThreshold: 0.3, // 30% of dimension or 0.5px/ms
  pushContentSelector: null, // selector or element to shift on open
  mini: false, // collapsed dock rail mode
  miniWidth: 'w-16', // width of dock rail when closed
  lockScroll: true, // lock body scroll when modal drawer is open
  focusTrap: true, // trap tab key navigation inside drawer
  autoFocus: true, // autofocus first focusable element
  restoreFocus: true, // return focus to trigger element
  duration: 300, // animation duration in ms
  translations: {
    "close-button": "Close menu",
    "drawer-label": "Off-canvas navigation"
  }
});
```

### 2.2 Static Methods
- `CGEDrawer.init(root = document)`: Initializes all declarative markup.
- `CGEDrawer.get(target)`: Retrieves existing instance by ID or element.
- `CGEDrawer.open(target)`: Opens drawer by selector or element.
- `CGEDrawer.close(target)`: Closes drawer by selector or element.
- `CGEDrawer.toggle(target)`: Toggles drawer state.
- `CGEDrawer.setTranslations(dict)`: Sets global localization dictionary.

### 2.3 Instance Methods
- `drawer.open()`: Opens the drawer. Returns `Promise<void>`.
- `drawer.close()`: Closes the drawer. Returns `Promise<void>`.
- `drawer.toggle()`: Toggles open/closed state. Returns `Promise<void>`.
- `drawer.isOpen()`: Returns boolean state.
- `drawer.on(event, callback)`: Attaches event listener.
- `drawer.off(event, callback)`: Detaches event listener.
- `drawer.destroy()`: Detaches listeners, restores DOM, and unregisters instance.

### 2.4 Events & Lifecycle Hooks
- `open` / `cge:drawer:open`: Fires immediately upon open trigger.
- `opened` / `cge:drawer:opened`: Fires after entry transition completes.
- `close` / `cge:drawer:close`: Fires immediately upon close trigger.
- `closed` / `cge:drawer:closed`: Fires after exit transition completes.
- `backdropClick` / `cge:drawer:backdrop-click`: Fires when clicking backdrop.
- `swipe` / `cge:drawer:swipe`: Fires during touch drag with progress and distance.

---

## 3. Placement & Transition Architecture

| Placement | Fixed Coordinates | Sizing Presets | Fallback Closed Transform | Fallback Open Transform | Directional Static Bounce |
|---|---|---|---|---|---|
| `left` | `top-0 bottom-0 left-0 h-full` | `w-64`, `w-80`, `w-96`, `w-1/2`, `w-screen` | `-translate-x-full` | `translate-x-0` | Nudge right (+15px) |
| `right` | `top-0 bottom-0 right-0 h-full` | `w-64`, `w-80`, `w-96`, `w-1/2`, `w-screen` | `translate-x-full` | `translate-x-0` | Nudge left (-15px) |
| `top` | `top-0 left-0 right-0 w-full` | `h-48`, `h-80`, `h-1/2`, `h-screen` | `-translate-y-full` | `translate-y-0` | Nudge down (+15px) |
| `bottom` | `bottom-0 left-0 right-0 w-full` | `h-48`, `h-80`, `h-1/2`, `h-screen`, `max-h-[90vh]` | `translate-y-full` | `translate-y-0` | Nudge up (-15px) |

---

## 4. UI & Design System Rule Compliance
- Strictly follow the project border-radius standard: **`rounded-sm`** for buttons, badges, inputs, cards, and corner radii (e.g. bottom-sheet top corners `rounded-t-sm`).
- Never use `rounded-2xl`, `rounded-3xl`, `rounded-4xl`, or `rounded-xl`.

## 2026-10-04 ek bakım planı
REPORTS.md içindeki tüm bakım adaylarını mevcut API ve tasarımı koruyarak uygulama: lifecycle/abort, ortak overlay sahipliği, erişilebilirlik, form verisi, paket/type doğrulaması ve belge tekilleştirme. Plugin özelindeki davranışlar regresyonlarla doğrulanacak.

## Stability fixes (October 2026)

Source: [stability plan](TailTools-stability-plan.md) phases 1, 2 and 6.

- Missing target throws; selectors no longer rewritten to `#.foo`; declarative missing targets warn only.
- `cge:drawer:open`/`close` cancel honored; DOM events typed in `.d.ts`.
- Non-modal drawers stay off the overlay stack (no focus stealing, no aria-modal, Escape only without modal overlays).
- Mini rail: no aria-hidden/aria-modal when collapsed; closedClass not re-added after tailwind-animations close.
- Full focus trap; reduced motion (0 ms, no bounce).
- `destroyAll(root)`; `init(root)` prunes detached instances.
- Shared: `plugins/shared/overlay.js` prunes disconnected overlays, supports a separate stacking layer and exports `trapTab`/`claimFreeKey`.
- Tests: `tests/overlay-fixes.test.mjs` (Node) and `tests/stability-overlay-regressions.js` (browser).
