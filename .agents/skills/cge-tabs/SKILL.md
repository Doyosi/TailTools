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


## Maintenance contracts (2026-10-05)
- Options: defaults → data-cge-tabs JSON → individual attributes → explicit JS. Programmatic roots need no marker; mark nested groups or initialize their independent instances first. Preselected aria-selected=true participates in initial state. Disabled tabs are skipped; manual arrows move focus, Enter/Space activate. Buttons default to type=button.
- get accepts element, literal ID or selector; unknown/malformed lookups return undefined. init(root) includes/reuses matching roots.
- Encoded hashes decode correctly; hash and query writes preserve history.state and unrelated URL parts. historyMode:push creates Back/Forward steps; replace is default. CSS honors reduced motion and scopes fade fallback to tab panels.
- show(activeId) may update focus/history but emits no repeated activation and makes no request. Explicit reload: await loadAjaxTab(id,true). animationIn supports multiple classes. ui.tabList/tab/panelContainer are opt-in base layout slots; consumer markup retains default styling.
- Controllers are per tab. A new same-tab request aborts the previous one; requests for other panels may finish/cache. Late canceled responses are ignored. cacheAjax:false reloads on reactivation. Failed forced reload invalidates cache and permits retry. Loading uses aria-busy/status, errors use alert. Translations render as text; returned HTML is trusted Blade/application markup.
- Initialize AJAX children once with TailTools.init(panel), otherwise correct standalone APIs (document delegates for ActionButton/Lightbox). Includes Accordion/Collapse/Tabs. Destroy registry-backed children before replacing AJAX markup and on Tabs destroy; restore original panel nodes/attributes and cancel requests/observer. Re-init restored child markup when needed.
- on/off use full cge:tabs:* names and detail objects. Cancel activation on DOM cge:tabs:show via event.preventDefault(); instance detail has no preventDefault method.
- See [usage](../../../docs/CGETabs/usage.md), [API](../../../docs/CGETabs/api.md) and [maintenance report](../../../REPORTS.md).

Horizontal lists use automatic overflow scrolling unless consumer CSS already specifies overflow. Keyboard focus brings the last tab into view; destroy restores the original style. Partial child-init failure tears down children and clears loaded/cache state before showing Retry. Runtime resolved options expose complete UI/translation defaults; callbacks accept null.
