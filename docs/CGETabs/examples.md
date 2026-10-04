# CGETabs Practical Examples

Practical code examples illustrating standard tabs, segmented controls, vertical layouts, deep linking, Ajax partial loading, and nested CGE plugin workflows.

---

## 1. Underline Tabs with Hash Deep Linking

Simple, elegant tabs with an animated underline indicator bar:

```html
<div id="user-profile-tabs" data-cge-tabs>
  <!-- Triggers -->
  <div role="tablist" class="flex border-b border-slate-200 dark:border-slate-800 gap-6 relative">
    <button type="button" data-cge-tab="general" class="pb-3 text-sm font-medium text-indigo-600 active">
      General Info
    </button>
    <button type="button" data-cge-tab="notifications" class="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700">
      Notifications
    </button>
    <button type="button" data-cge-tab="billing" class="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700">
      Billing & Plans
    </button>
  </div>

  <!-- Panels -->
  <div class="mt-4">
    <div data-cge-panel="general" class="space-y-4">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Personal Details</h3>
      <p class="text-sm text-slate-600 dark:text-slate-400">Manage your name, email, and public profile.</p>
    </div>
    <div data-cge-panel="notifications" class="space-y-4">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Email Preferences</h3>
      <p class="text-sm text-slate-600 dark:text-slate-400">Configure weekly digests and alert notifications.</p>
    </div>
    <div data-cge-panel="billing" class="space-y-4">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Payment Methods</h3>
      <p class="text-sm text-slate-600 dark:text-slate-400">View invoices and manage credit cards.</p>
    </div>
  </div>
</div>
```

---

## 2. Segmented Control (Pill Mode)

Ideal for filter switches, view switchers, or status toggles:

```html
<div id="segmented-filters" data-cge-tabs='{"indicator":"pill","urlSync":false}'>
  <!-- Segmented bar -->
  <div role="tablist" class="cge-tabs-segmented inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg relative">
    <button type="button" data-cge-tab="all" class="px-4 py-1.5 text-xs font-semibold rounded-md transition text-slate-800 dark:text-slate-100 active">
      All Items
    </button>
    <button type="button" data-cge-tab="pending" class="px-4 py-1.5 text-xs font-semibold rounded-md transition text-slate-500">
      Pending
    </button>
    <button type="button" data-cge-tab="completed" class="px-4 py-1.5 text-xs font-semibold rounded-md transition text-slate-500">
      Completed
    </button>
  </div>

  <!-- Panels -->
  <div class="mt-4">
    <div data-cge-panel="all">Showing all records...</div>
    <div data-cge-panel="pending">Showing pending tasks...</div>
    <div data-cge-panel="completed">Showing completed tasks...</div>
  </div>
</div>
```

---

## 3. Query Param Deep Linking

Deep-links to specific dashboard sub-views without hashes:

```html
<div id="analytics-tabs"
     data-cge-tabs='{"urlSync":"query","queryParamKey":"view","historyMode":"replace"}'>
  <div role="tablist" class="flex gap-2 border-b border-slate-200">
    <button type="button" data-cge-tab="overview">Overview</button>
    <button type="button" data-cge-tab="traffic">Traffic</button>
    <button type="button" data-cge-tab="conversions">Conversions</button>
  </div>

  <div class="mt-4">
    <div data-cge-panel="overview">Analytics Overview</div>
    <div data-cge-panel="traffic">Traffic Analytics</div>
    <div data-cge-panel="conversions">Conversion Rates</div>
  </div>
</div>
```

When switching to "Traffic", the browser URL updates to `https://example.com/analytics?view=traffic`.

---

## 4. On-Demand Ajax Partial Loading with Laravel

Load heavy blade partials on-demand when the user clicks a tab:

```html
<div id="server-stats-tabs" data-cge-tabs>
  <div role="tablist" class="flex border-b border-slate-200 gap-4">
    <button type="button" data-cge-tab="metrics" class="active">Live Metrics</button>
    <button type="button"
            data-cge-tab="logs"
            data-cge-ajax="/admin/servers/42/logs-partial">
      System Logs
    </button>
    <button type="button"
            data-cge-tab="backups"
            data-cge-ajax="/admin/servers/42/backups-partial">
      Backups
    </button>
  </div>

  <div class="mt-4">
    <div data-cge-panel="metrics">
      <p>Instant CPU and RAM telemetry chart...</p>
    </div>
    <div data-cge-panel="logs">
      <!-- Fetched via Ajax on first click with spinner and caching -->
    </div>
    <div data-cge-panel="backups">
      <!-- Fetched via Ajax on first click with spinner and caching -->
    </div>
  </div>
</div>
```

---

## 5. Nested CGE Plugins (Form & ActionButton Bridge)

Demonstrating automated lifecycle re-binding when child components live inside tab panels:

```html
<div id="settings-tabs" data-cge-tabs>
  <div role="tablist" class="flex border-b border-slate-200 gap-3">
    <button type="button" data-cge-tab="account" class="active">Account</button>
    <button type="button" data-cge-tab="danger">Danger Zone</button>
  </div>

  <div class="mt-4">
    <!-- Tab 1: Form -->
    <div data-cge-panel="account">
      <form action="/api/account" data-cge-form class="space-y-3">
        <div>
          <label class="block text-xs font-semibold">Display Name</label>
          <input type="text" name="name" value="Jane Doe" class="border p-2 rounded w-full">
        </div>
        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded">Save Changes</button>
      </form>
    </div>

    <!-- Tab 2: Destructive Action Button -->
    <div data-cge-panel="danger" class="space-y-4">
      <p class="text-sm text-slate-600">Permanently deactivate this account.</p>
      <button type="button"
              data-cge-action="delete"
              data-cge-title="Delete Account?"
              data-cge-message="All data will be permanently wiped."
              data-cge-confirm-text="Yes, Delete"
              class="px-4 py-2 bg-rose-600 text-white rounded">
        Delete Account
      </button>
    </div>
  </div>
</div>
```

---

## 6. Multi-Step Wizard with Programmatic Controls

```javascript
import { CGETabs } from 'tailtools';

const wizard = new CGETabs('#checkout-wizard', {
  urlSync: false,
  manual: true
});

document.getElementById('wizard-next-btn').addEventListener('click', () => {
  wizard.next();
});

document.getElementById('wizard-prev-btn').addEventListener('click', () => {
  wizard.prev();
});
```
