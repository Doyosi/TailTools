# CGEDrawer - Practical Examples & Code Recipes

Real-world code patterns and recipes for implementing **CGEDrawer** in modern Tailwind CSS v4 and Laravel applications.

---

## 1. Quick Left Navigation Drawer

```html
<!-- Trigger -->
<button type="button" data-cge-drawer-target="#sidebar-nav" class="px-4 py-2 bg-indigo-600 text-white rounded-sm text-xs font-semibold">
    Toggle Navigation
</button>

<!-- Drawer -->
<div id="sidebar-nav" class="cge-drawer fixed inset-0 z-50 hidden" data-cge-placement="left" data-cge-size="md">
    <div class="cge-drawer-backdrop fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300" data-cge-drawer-backdrop></div>
    <div class="cge-drawer-dialog fixed top-0 bottom-0 left-0 h-full w-80 bg-white border-r border-slate-200 p-6 flex flex-col justify-between" data-cge-drawer-dialog>
        <div>
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <span class="font-bold text-sm text-slate-900">Application Menu</span>
                <button type="button" data-cge-drawer-close class="w-8 h-8 rounded-sm flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100">✕</button>
            </div>
            <nav class="space-y-1 text-xs">
                <a href="#dash" class="block px-3 py-2 rounded-sm bg-indigo-50 text-indigo-700 font-semibold">Dashboard</a>
                <a href="#projects" class="block px-3 py-2 rounded-sm text-slate-600 hover:bg-slate-100">Projects</a>
                <a href="#reports" class="block px-3 py-2 rounded-sm text-slate-600 hover:bg-slate-100">Reports</a>
            </nav>
        </div>
        <button type="button" data-cge-drawer-close class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-sm">
            Close Menu
        </button>
    </div>
</div>
```

---

## 2. Right Cart / Inspector Drawer

```html
<!-- Trigger -->
<button type="button" data-cge-drawer-target="#cart-drawer" class="px-4 py-2 bg-slate-800 text-white rounded-sm text-xs font-semibold">
    Shopping Cart ($199)
</button>

<!-- Drawer -->
<div id="cart-drawer" class="cge-drawer fixed inset-0 z-50 hidden" data-cge-placement="right" data-cge-size="lg">
    <div class="cge-drawer-backdrop fixed inset-0 bg-slate-950/60 backdrop-blur-xs" data-cge-drawer-backdrop></div>
    <div class="cge-drawer-dialog fixed top-0 bottom-0 right-0 h-full w-96 bg-white border-l border-slate-200 p-6 flex flex-col justify-between" data-cge-drawer-dialog>
        <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 class="text-sm font-bold text-slate-900">Shopping Cart</h3>
                <button type="button" data-cge-drawer-close class="w-8 h-8 rounded-sm flex items-center justify-center text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-sm text-xs flex justify-between">
                <div>TailTools Developer License</div>
                <div class="font-bold text-indigo-600">$199.00</div>
            </div>
        </div>
        <button type="button" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-xs font-semibold">
            Checkout Now
        </button>
    </div>
</div>
```

---

## 3. Top Command / Announcement Drawer

```html
<button type="button" data-cge-drawer-target="#top-banner" class="px-4 py-2 bg-sky-600 text-white rounded-sm text-xs font-semibold">
    System Notification
</button>

<div id="top-banner" class="cge-drawer fixed inset-0 z-50 hidden" data-cge-placement="top" data-cge-size="sm">
    <div class="cge-drawer-backdrop fixed inset-0 bg-slate-950/70" data-cge-drawer-backdrop></div>
    <div class="cge-drawer-dialog fixed top-0 left-0 right-0 w-full h-48 bg-slate-900 text-white border-b border-slate-800 p-6 flex flex-col justify-between" data-cge-drawer-dialog>
        <div class="max-w-4xl mx-auto w-full flex items-center justify-between">
            <div>
                <h4 class="text-sm font-bold text-white mb-1">System Update Scheduled</h4>
                <p class="text-xs text-slate-300">Routine cluster maintenance is scheduled for midnight UTC.</p>
            </div>
            <button type="button" data-cge-drawer-close class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-sm">
                Understood
            </button>
        </div>
    </div>
</div>
```

---

## 4. Mobile Bottom Sheet with Touch Swipe-to-Dismiss

```html
<button type="button" data-cge-drawer-target="#mobile-sheet" class="px-4 py-2 bg-teal-600 text-white rounded-sm text-xs font-semibold">
    Open Action Sheet
</button>

<div id="mobile-sheet" class="cge-drawer fixed inset-0 z-50 hidden" data-cge-placement="bottom" data-cge-size="auto" data-cge-swipe-close="true">
    <div class="cge-drawer-backdrop fixed inset-0 bg-slate-950/60" data-cge-drawer-backdrop></div>
    <div class="cge-drawer-dialog fixed bottom-0 left-0 right-0 w-full max-h-[90vh] bg-white border-t border-slate-200 rounded-t-sm p-6" data-cge-drawer-dialog>
        <!-- Grab handle for mobile touch gestures -->
        <div class="cge-drawer-handle"></div>
        <div class="max-w-md mx-auto space-y-2">
            <h3 class="text-sm font-bold text-slate-900 text-center mb-4">Choose Action</h3>
            <button type="button" data-cge-drawer-close class="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-sm border border-slate-200">
                Share Link
            </button>
            <button type="button" data-cge-drawer-close class="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-sm border border-rose-200">
                Delete Item
            </button>
        </div>
    </div>
</div>
```

---

## 5. Layout Push Mode

Displace adjacent content along the drawer's orientation axis:

```html
<div class="flex">
    <!-- Push Drawer -->
    <div id="push-drawer" class="cge-drawer fixed inset-0 z-50 hidden" data-cge-placement="left" data-cge-push-content="#main-content">
        <div class="cge-drawer-backdrop fixed inset-0 bg-slate-950/50" data-cge-drawer-backdrop></div>
        <div class="cge-drawer-dialog fixed top-0 bottom-0 left-0 h-full w-80 bg-white border-r border-slate-200 p-6" data-cge-drawer-dialog>
            <h3 class="text-sm font-bold mb-4">Navigation</h3>
            <button type="button" data-cge-drawer-close class="px-3 py-1.5 bg-slate-100 rounded-sm text-xs">Close</button>
        </div>
    </div>

    <!-- Main Content that is pushed -->
    <main id="main-content" class="flex-1 p-8 transition-transform duration-300">
        <button type="button" data-cge-drawer-target="#push-drawer" class="px-4 py-2 bg-emerald-600 text-white rounded-sm text-xs font-semibold">
            Open Push Drawer
        </button>
    </main>
</div>
```

---

## 6. Collapsed Mini-Rail Dock Mode

```html
<div id="mini-drawer" class="cge-drawer fixed inset-0 z-50" data-cge-placement="left" data-cge-mini="true" data-cge-mini-width="w-16" data-cge-size="w-64">
    <div class="cge-drawer-dialog fixed top-0 bottom-0 left-0 h-full bg-slate-900 text-white border-r border-slate-800 p-3 flex flex-col justify-between" data-cge-drawer-dialog>
        <div class="space-y-4">
            <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-sm bg-indigo-600 flex items-center justify-center font-bold">TT</span>
                <span class="cge-drawer-hide-on-mini text-sm font-bold">TailTools</span>
            </div>
            <nav class="space-y-2">
                <a href="#" class="flex items-center gap-3 p-2 rounded-sm hover:bg-slate-800 text-xs">
                    <span class="text-lg">🏠</span> <span class="cge-drawer-hide-on-mini">Home</span>
                </a>
                <a href="#" class="flex items-center gap-3 p-2 rounded-sm hover:bg-slate-800 text-xs">
                    <span class="text-lg">📁</span> <span class="cge-drawer-hide-on-mini">Projects</span>
                </a>
            </nav>
        </div>
        <button type="button" onclick="CGEDrawer.toggle('#mini-drawer')" class="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-sm text-xs">
            <span class="cge-drawer-hide-on-mini">Collapse</span>
            <span class="hidden is-mini:inline">↔</span>
        </button>
    </div>
</div>
```

---

## 7. Static Directional Tactile Bounce Drawer

```html
<button type="button" data-cge-drawer-target="#static-bounce-drawer" class="px-4 py-2 bg-amber-600 text-white rounded-sm text-xs font-semibold">
    Security Settings
</button>

<div id="static-bounce-drawer" class="cge-drawer fixed inset-0 z-50 hidden" data-cge-placement="left" data-cge-backdrop="static">
    <div class="cge-drawer-backdrop fixed inset-0 bg-slate-950/70" data-cge-drawer-backdrop></div>
    <div class="cge-drawer-dialog fixed top-0 bottom-0 left-0 h-full w-80 bg-white border-r border-slate-200 p-6 flex flex-col justify-between" data-cge-drawer-dialog>
        <div>
            <h3 class="text-sm font-bold text-slate-900 mb-2">Two-Factor Authentication</h3>
            <p class="text-xs text-slate-500 mb-4">Clicking outside will not close this drawer. It triggers a directional spring bounce to signal safety.</p>
        </div>
        <button type="button" data-cge-drawer-close class="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-sm">
            Confirm & Save
        </button>
    </div>
</div>
```

## Extended maintenance contract (2026-10-04)

Destroy removes click, key and touch listeners, cancels animation work and restores layout-push inline styles. Recreating on the same DOM is supported. Partial translations preserve defaults and data-cge-duration="0" is valid. Static toggle accepts an optional third trigger argument. Overlay ownership is shared with Modal, Alert and Lightbox.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.

```javascript
const opening = drawer.open(trigger);
drawer.destroy(); // cancels entry and restores pushed layout
await opening;
const replacement = new CGEDrawer(drawerElement);
```

## Stability fixes (October 2026)

### Persistent non-modal sidebar next to modals

```blade
<aside id="docs-nav" data-cge-drawer data-cge-backdrop="false" data-cge-placement="left" class="hidden">
  <nav data-cge-drawer-dialog class="bg-white border-r">...</nav>
</aside>
<button data-cge-drawer-toggle="docs-nav">Menu</button>
```

Opening and closing a modal on top keeps focus on the modal trigger instead of jumping into the sidebar.

### Guarding a drawer close

```javascript
const drawer = new CGEDrawer('.checkout-drawer'); // any CSS selector works
drawer.drawer.addEventListener('cge:drawer:close', (event) => {
  if (!confirm('Discard the cart changes?')) event.preventDefault();
});
```

### Livewire re-initialization

```javascript
document.addEventListener('livewire:navigating', () => CGEDrawer.destroyAll());
document.addEventListener('livewire:navigated', () => CGEDrawer.init());
```
