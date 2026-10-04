---
name: cge-tabs
description: High-performance, accessible tabs and segmented control plugin designed for Tailwind CSS v4.3+ and Laravel Blade. Features dual navigation state persistence (URL Hash and URL Query Param deep linking), on-demand Ajax / Blade partial lazy loading with caching, WAI-ARIA compliant keyboard navigation, dynamic animated sliding indicators, headless UI theming, and automated lifecycle re-binding for internal CGE plugins.
---

# CGETabs Agent Skill

Use this skill when implementing, configuring, or debugging tabs, segmented controls, deep-linked navigation panels, or on-demand Ajax Blade partials using the **TailTools** `CGETabs` plugin in Tailwind CSS v4.3+ or Laravel Blade projects.

---

## 1. When to Use CGETabs

Activate this skill when the user requests:
- "Create tabs or segmented control in Tailwind CSS or Laravel."
- "Implement deep-linked tabs with URL hash (`#profile`) or query parameter (`?tab=billing`)."
- "Lazy load tab content on-demand via Ajax with loading spinners and caching."
- "Re-bind child plugins (`CGEActionButton`, `CGEForm`) when tab panels load dynamically."
- "Add an animated sliding indicator (underline or pill) that tracks active tabs."
- "Ensure full WAI-ARIA keyboard navigation (Arrow keys, Home, End, Enter, Space)."
- "Build a Laravel Blade `<x-cge-tabs>` and `<x-cge-tab-panel>` component structure."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGETabs/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGETabs } from 'tailtools';

// Auto-initializes all declarative containers (data-cge-tabs)
initTailTools();

// Global access for Alpine.js or inline scripts
window.CGETabs = CGETabs;
```

---

## 3. Declarative HTML Markup Pattern

```html
<div id="account-tabs" data-cge-tabs>
  <!-- Tab List / Triggers -->
  <div role="tablist" class="flex border-b border-slate-200 dark:border-slate-800 gap-2 relative">
    <button type="button" data-cge-tab="overview" class="active">Overview</button>
    <button type="button" data-cge-tab="security">Security</button>
    <button type="button" data-cge-tab="billing" data-cge-ajax="/admin/users/12/billing-partial">Billing</button>
  </div>

  <!-- Tab Panels -->
  <div class="mt-4">
    <div data-cge-panel="overview">
      <p>Overview Content</p>
    </div>
    <div data-cge-panel="security">
      <p>Security Content</p>
    </div>
    <div data-cge-panel="billing">
      <!-- Injected on demand via Ajax with caching and child plugin bridging -->
    </div>
  </div>
</div>
```

---

## 4. Programmatic JavaScript API

```javascript
import { CGETabs } from 'tailtools';

const tabs = new CGETabs('#account-tabs', {
  urlSync: 'hash', // 'hash' | 'query' | false
  queryParamKey: 'tab',
  indicator: 'line', // 'line' | 'pill' | false
  cacheAjax: true,
  onShow: (tabId, panelEl, triggerEl) => {
    console.log('Showing tab:', tabId);
  }
});

// Programmatic controls:
tabs.show('security');
tabs.next();
tabs.prev();
tabs.loadAjaxTab('billing', true); // Force reload
tabs.destroy();
```

---

## 5. Laravel Blade Pattern

```blade
<x-cge-tabs id="user-tabs" urlSync="hash" indicator="line">
    <x-slot:triggers>
        <x-cge-tab-trigger name="overview" :active="true">Overview</x-cge-tab-trigger>
        <x-cge-tab-trigger name="security">Security</x-cge-tab-trigger>
        <x-cge-tab-trigger name="logs" :ajax="route('users.logs', $user->id)">Logs</x-cge-tab-trigger>
    </x-slot:triggers>

    <x-cge-tab-panel name="overview" :active="true">
        ...
    </x-cge-tab-panel>
    <x-cge-tab-panel name="security">
        ...
    </x-cge-tab-panel>
    <x-cge-tab-panel name="logs">
        <!-- Lazy loaded via Ajax -->
    </x-cge-tab-panel>
</x-cge-tabs>
```
