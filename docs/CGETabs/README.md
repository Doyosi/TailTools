# CGETabs - Native Tailwind CSS v4 & Laravel Tabs Plugin

`CGETabs` is a high-performance, accessible tabs and segmented control plugin designed specifically for **Tailwind CSS v4.3+** and **Laravel Blade** environments. It features dual navigation state persistence (URL Hash and URL Query Param deep linking), on-demand Ajax / Blade partial lazy loading with caching, WAI-ARIA compliant keyboard navigation, dynamic animated sliding indicators, headless UI theming, and automated lifecycle re-binding for internal CGE plugins.

---

## Key Features

- **Dual Navigation State Persistence (Deep Linking):**
  - **URL Hash Mode (`urlSync: 'hash'`):** Updates `#profile`, `#security` in the URL with zero jump flicker.
  - **URL Query Param Mode (`urlSync: 'query'`):** Deep-links via `?tab=billing` with customizable query parameter name.
  - Full browser history support: Seamlessly switches active tabs when user navigates using browser Back/Forward buttons.
  - Session & storage persistence (`storage: 'localStorage' | 'sessionStorage'`): Remembers active tabs across browser sessions.
- **On-Demand Ajax & Lazy-Load Tab Panels (Blade Partials):**
  - Declarative Ajax loading via `data-cge-ajax="/route/to/partial"`.
  - In-memory response caching (`cacheAjax: true`) to prevent redundant server round-trips.
  - Built-in loading spinner indicator and error states with automated retry handlers.
  - Automatic request cancellation: Aborts active in-flight requests on tab switch or component teardown.
- **CGE Auto-Lifecycle Bridge:**
  - Automatically re-initializes nested `CGEActionButton`, `CGEForm`, `CGESelect`, `CGEModal`, `CGEDropzone`, `CGEDataTable`, and `CGEDataGrid` components inside freshly injected Ajax panels.
- **Animated Sliding Indicator:**
  - Dynamic sliding line or pill indicator (`indicator: true | 'line' | 'pill'`) that smoothly animates underneath or behind the active tab.
  - Responsive alignment with `ResizeObserver` and window resize listeners.
- **WAI-ARIA Accessibility:**
  - Automatic management of `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, and `aria-labelledby`.
  - Full keyboard navigation: Horizontal arrows, vertical arrows, Home, End, Enter, Space.
  - Automatic focus activation or manual activation (`manual: true`).
- **Headless UI Customization:**
  - Complete control over CSS classes via the `ui` slot configuration.
- **Zero Mandatory External Dependencies:**
  - Native ES2022+ JavaScript with full TypeScript support (`.d.ts`). Peer dependency on Axios if chosen as driver.

---

## Quick Start

### 1. Stylesheet Setup (Tailwind CSS v4)
In your main CSS file (`src/style.css` or `resources/css/app.css`):

```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGETabs/style.css";
```

### 2. Declarative HTML Markup

```html
<div id="account-tabs" data-cge-tabs>
  <!-- Tab List / Triggers -->
  <div role="tablist" class="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 relative">
    <button type="button" data-cge-tab="profile" class="active">Profile</button>
    <button type="button" data-cge-tab="security">Security</button>
    <button type="button" data-cge-tab="billing" data-cge-ajax="/admin/users/12/billing-partial">Billing</button>
  </div>

  <!-- Tab Panels -->
  <div class="mt-4">
    <div data-cge-panel="profile">
      <h3>User Profile Form</h3>
    </div>
    <div data-cge-panel="security">
      <h3>Security Settings</h3>
    </div>
    <div data-cge-panel="billing">
      <!-- Loaded dynamically via Ajax -->
    </div>
  </div>
</div>
```

### 3. Programmatic JavaScript Instantiation

```javascript
import { CGETabs } from 'tailtools';

const tabs = new CGETabs('#account-tabs', {
  urlSync: 'hash',
  indicator: 'line',
  onShow: (tabId, panelEl, triggerEl) => {
    console.log(`Activated tab: ${tabId}`);
  }
});

// Programmatic controls
tabs.show('security');
tabs.next();
tabs.prev();
```

---

## Documentation Links

- [Usage Guide](usage.md) - Configuration options, programmatic methods, event hooks, and lifecycle.
- [Code Examples](examples.md) - Comprehensive HTML, Tailwind CSS, and Laravel Blade implementations.
- [Laravel Blade Integration](laravel-blade.md) - Reusable Blade components and server-rendered partial patterns.
- [API Reference](api.md) - Complete TypeScript declarations and contract definitions.


## State, accessibility and teardown
Programmatic roots need no declarative marker. Nested groups must have `data-cge-tabs` or be initialized as independent programmatic instances first. Initial `aria-selected="true"` is preserved when resolving the first tab. Keyboard navigation skips disabled triggers; manual mode moves focus before activation. Native buttons default to `type="button"` inside forms.

Hash state is namespaced per group (`#account=billing&help=faq`), so several groups and nested groups keep independent deep links; legacy `#billing` links still resolve and a nested deep link opens its parent panel. URL writes preserve the host application's `history.state`. Use `historyMode: 'push'` to create Back/Forward steps; Back to a URL without tab state restores the initial tab. Alt/Ctrl/Meta shortcuts are ignored and `dir="rtl"` mirrors the arrow keys. Reduced-motion preferences disable panel, indicator and loading animations. Calling `show()` on the already active tab updates requested focus/history without repeating events or requests; use `loadAjaxTab(id, true)` for an explicit reload.

`destroy()` aborts requests, disconnects observers and restores original owned attributes and panel nodes. `CGETabs.destroyAll(root)` tears down every instance inside a region or detached from the DOM, and `CGETabs.init(root)` prunes detached instances, rebuilds Livewire-morphed ones and returns all instances under root. `CGETabs.get()` returns `null` for unknown lookups. Child plugins in replaced AJAX markup are destroyed before replacement and on teardown. This does not destroy independent static nested components that remain in the original DOM.

Horizontal tab lists gain scrolling when content overflows, so focused tabs remain reachable on narrow screens. Explicit overflow styling is respected.

## AJAX security
AJAX panels accept `text/html` (or `text/plain`) bodies and JSON only in the form `{ "html": "..." }`; any other JSON is rendered as the error state instead of being injected. Add `sanitize: html => DOMPurify.sanitize(html)` when partials may contain user-generated HTML. Non-GET requests send Laravel CSRF headers automatically and a configured `axiosInstance` wins over `window.axios`.

## ESM imports and nested plugins
The root `tailtools` import has no side effects. `tailtools/auto` registers `initTailTools` as the AJAX panel initializer; with plain ESM imports call `CGETabs.setPanelInitializer(panel => initTailTools(panel))` once or pass `initPanel` per instance.
