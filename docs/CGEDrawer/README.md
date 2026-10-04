# CGEDrawer - Native Tailwind CSS v4 & Laravel Sliding Drawer Plugin

`CGEDrawer` is a high-performance, gesture-capable sliding drawer, off-canvas navigation, and bottom-sheet plugin built specifically for **Tailwind CSS v4.3+** and **Laravel Blade** environments. It features 4-direction positioning, configurable backdrop physics, tactile directional bounce feedback, touch swipe-to-dismiss gestures, layout-push mode, collapsed mini-rail mode, and full focus trapping with zero runtime dependencies.

---

## Key Features

- **4-Direction Sliding Geometry:**
  - Fly-in panels from `left`, `right`, `top`, or `bottom`.
- **Sizing Presets & Flexible Geometry:**
  - Side drawers: `sm` (w-64), `md` (w-80), `lg` (w-96), `xl` (w-1/2), `full` (w-screen), or arbitrary utility classes.
  - Vertical drawers: `sm` (h-48), `md` (h-80), `lg` (h-1/2), `full` (h-screen), or auto-height bottom sheets (`auto` / `max-h-[90vh]`).
- **Dual Animation Pipeline:**
  - **Mode A (`tailwind-animations`):** Dynamic sliding keyframes (`animate-slide-in-left`, `animate-slide-out-right`, etc.).
  - **Mode B (Standard Tailwind Transitions):** Hardware-accelerated CSS transforms (`-translate-x-full` to `translate-x-0`).
- **Configurable Backdrop & Static Bounce Physics:**
  - Dismissible modal overlays (`backdropClose: true`).
  - Tactile directional bounce nudge feedback (`backdrop: 'static'` / `backdropClose: false`). Outside clicks trigger an axis-aligned spring nudge along the drawer's orientation edge.
  - Persistent non-modal docking (`backdrop: false`). Main page content remains fully interactive while the drawer is open.
- **Mobile Touch Swipe-to-Dismiss:**
  - Real-time touch gesture tracking with velocity/distance snapping thresholds and drag handles.
- **Layout Push Mode (`pushContentSelector`):**
  - Smoothly shifts page content aside when the drawer opens instead of overlaying it.
- **Collapsed Mini-Rail Mode (`mini: true`):**
  - Docks into a slim icon navigation bar (`w-16`) instead of hiding off-screen.
- **Strict Accessibility (a11y):**
  - Focus trapping, scroll locking with scrollbar compensation, autofocus and Escape handling. Browser-tested behavior; no WCAG certification is claimed.
- **Design System Rule Compliance:**
  - Uses modern technical styling adhering strictly to the **`rounded-sm`** border-radius standard.

---

## Placement & Sizing Matrix

### Side Drawers (`placement: 'left' | 'right'`)
| Preset | Utility Class | Width | Target Use Case |
| :--- | :--- | :--- | :--- |
| `sm` | `w-64` | 256px | Compact menus, icon-heavy navigation |
| `md` (Default) | `w-80` | 320px | Standard sidebar navigation, tree views |
| `lg` | `w-96` | 384px | Shopping carts, detail inspectors, filters |
| `xl` | `w-1/2` | 50% | Split-screen editors, code comparison |
| `full` | `w-screen` | 100vw | Full-screen overlays, document managers |

### Vertical Drawers (`placement: 'top' | 'bottom'`)
| Preset | Utility Class | Height | Target Use Case |
| :--- | :--- | :--- | :--- |
| `sm` | `h-48` | 192px | Notification banners, command prompts |
| `md` | `h-80` | 320px | Medium content drawers, search palettes |
| `lg` | `h-1/2` | 50vh | Half-screen media players, multi-step actions |
| `full` | `h-screen` | 100vh | Full-page takeovers, mobile wizards |
| `auto` | `max-h-[90vh] h-auto` | Content-fit | Dynamic mobile action sheets, share sheets |

---

## Quick Start

### 1. Stylesheet Setup (Tailwind CSS v4)
In your main CSS file (`src/style.css` or `resources/css/app.css`):

```css
@import "tailwindcss";
@import "tailwind-animations";

/* Import CGEDrawer stylesheet */
@import "tailtools/plugins/CGEDrawer/style.css";
```

### 2. Declarative HTML / Blade Markup

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

### 3. Programmatic JavaScript API

```javascript
import { CGEDrawer } from 'tailtools';

// Quick static control
await CGEDrawer.open('#main-nav-drawer');

// Instance control
const drawer = new CGEDrawer('#main-nav-drawer', {
  placement: 'left',
  size: 'md',
  backdropClose: true,
  swipeClose: true
});

drawer.on('open', () => console.log('Drawer opening...'));
drawer.on('closed', () => console.log('Drawer closed.'));

await drawer.toggle();
```

## Extended maintenance contract (2026-10-04)

Destroy removes click, key and touch listeners, cancels animation work and restores layout-push inline styles. Recreating on the same DOM is supported. Partial translations preserve defaults and data-cge-duration="0" is valid. Static toggle accepts an optional third trigger argument. Overlay ownership is shared with Modal, Alert and Lightbox.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.
