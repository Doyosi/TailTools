# CGEActionButton - Practical Examples & Recipes

Real-world code patterns and recipes for implementing **CGEActionButton** across modern Tailwind CSS v4 and Laravel applications.

---

## 1. Resource Data Table with Protected Rows

```html
<table class="w-full text-left text-xs border border-slate-200 rounded-sm">
  <tbody class="divide-y divide-slate-100">
    <tr data-cge-action-group class="hover:bg-slate-50">
      <td class="p-3 font-semibold text-slate-900">Enterprise Tenant #142</td>
      <td class="p-3 text-slate-500">Tier: Dedicated Cloud</td>
      <td class="p-3 text-right space-x-2">
        <!-- Edit link with confirmation check -->
        <a href="/admin/tenants/142/edit"
           data-cge-action="link"
           data-cge-title="Leave Active View?"
           data-cge-message="Navigating to edit view will drop unsaved table filters."
           class="px-2.5 py-1.5 rounded-sm bg-slate-100 text-slate-700 text-xs font-semibold">
          Edit
        </a>

        <!-- Destructive delete button with row lock -->
        <button type="button"
                data-cge-action="delete"
                data-cge-lock-group="row"
                data-cge-url="/api/tenants/142"
                data-cge-method="DELETE"
                data-cge-title="Delete Tenant #142?"
                data-cge-message="All services and user accounts will be suspended."
                data-cge-confirm-text="Yes, Delete"
                data-cge-loading-text="Deleting..."
                data-cge-success-toast="Tenant #142 has been deleted."
                class="px-2.5 py-1.5 rounded-sm bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer">
          Delete
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

---

## 2. Critical Action with Type-to-Confirm Requirement

```html
<button type="button"
        data-cge-action="delete"
        data-cge-require="PURGE"
        data-cge-url="/api/clusters/us-east-1"
        data-cge-method="DELETE"
        data-cge-title="Purge Production Cluster"
        data-cge-message="This will irrevocably wipe all 16 database partitions. Type PURGE to verify:"
        data-cge-confirm-text="Purge Now"
        data-cge-loading-text="Purging Database..."
        data-cge-success-toast="Database partitions purged."
        class="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer">
  Purge Production Cluster
</button>
```

---

## 3. Direct Background Command (Clear Cache / Optimize)

```html
<div class="flex gap-3">
  <!-- Command 1: Cache Clear -->
  <button type="button"
          data-cge-action="direct"
          data-cge-url="/admin/commands/cache-clear"
          data-cge-method="POST"
          data-cge-loading-text="Purging Cache..."
          data-cge-success-toast="Application cache successfully purged!"
          class="px-3.5 py-2 rounded-sm bg-slate-900 text-white text-xs font-semibold cursor-pointer">
    Clear Cache
  </button>

  <!-- Command 2: Re-optimize Indexes -->
  <button type="button"
          data-cge-action="direct"
          data-cge-url="/admin/commands/optimize-db"
          data-cge-method="POST"
          data-cge-loading-text="Rebuilding Indexes..."
          data-cge-success-toast="Database indexes re-optimized!"
          class="px-3.5 py-2 rounded-sm bg-indigo-600 text-white text-xs font-semibold cursor-pointer">
    Optimize DB
  </button>
</div>
```

---

## 4. Laravel Form Method Spoofing (`DELETE` / `PATCH`)

```html
<form id="project-form" action="/admin/projects/88" method="POST" class="space-y-4">
  <input type="text" name="name" value="Project Alpha" class="px-3 py-2 rounded-sm border border-slate-300 text-xs">

  <button type="submit"
          data-cge-action="delete"
          data-cge-method="DELETE"
          data-cge-title="Delete Project Alpha?"
          data-cge-message="This will submit the parent form via DELETE method spoofing."
          data-cge-loading-text="Deleting..."
          class="px-4 py-2 rounded-sm bg-rose-600 text-white text-xs font-semibold cursor-pointer">
    Delete Project
  </button>
</form>
```
*Note: Injects `<input type="hidden" name="_method" value="DELETE">` automatically.*

---

## 5. Dynamically Injected Elements (Livewire / Datatables)

Because `CGEActionButton.init()` uses delegated listeners on `document`, buttons created after initial page load require zero re-initialization:

```javascript
// Adding a button at runtime:
const newBtn = document.createElement('button');
newBtn.setAttribute('data-cge-action', 'delete');
newBtn.setAttribute('data-cge-title', 'Delete dynamically added item?');
newBtn.setAttribute('data-cge-success-toast', 'Item deleted!');
newBtn.className = 'px-3 py-1.5 rounded-sm bg-rose-50 text-rose-700 text-xs font-semibold';
newBtn.textContent = 'Delete Dynamically Added Item';

document.getElementById('my-container').appendChild(newBtn);
// Ready immediately without any manual setup!
```

---

## 6. Programmatic Triggering via JavaScript

```javascript
import { CGEActionButton } from 'tailtools';

async function performAutomatedPurge() {
  const button = document.getElementById('purge-btn');

  // Trigger confirmation dialog and execution programmatically
  await CGEActionButton.execute(button);
}
```


## Maintenance notes (2026-10-04)

Repeated execute calls while confirmation is pending are ignored, preventing duplicate dialogs/requests. Canceling or failing confirmation releases the guard. Partial per-instance translations retain global defaults.

## Extended maintenance contract (2026-10-04)

Confirmation is serialized. AJAX FormData is captured before freezing and includes the clicked button name/value exactly once. Multipart PUT/PATCH/DELETE uses POST + _method; GET uses query parameters, with no request body. Direct requests without FormData keep their requested method. Destroy cancels requests, delays and redirects and prevents late actions/results. Partial translations keep defaults.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.

```javascript
new CGEActionButton(button, { ajax: true, method: 'PATCH' });
// Form button name/value and uploads are sent via POST + _method=PATCH.
```

## Stability fixes (October 2026)

### Alpine / Livewire handlers gated by confirmation

```html
<!-- The Livewire action runs once, only after the user confirms -->
<button type="button" wire:click="archive({{ $post->id }})"
        data-cge-confirm="Archive this post?" data-cge-action="warning">
    Archive
</button>

<!-- Alpine handler: same guarantee -->
<button type="button" x-on:click="open = false" data-cge-confirm="Discard changes?">Discard</button>
```

### Confirmed submit handled by CGEForm (422 errors, submitter value)

```html
<form action="{{ route('posts.update', $post) }}" method="POST" data-cge-form>
    @csrf @method('PUT')
    <input name="title" value="{{ $post->title }}">
    <button name="intent" value="publish" data-cge-confirm="Publish now?">Publish</button>
</form>
```

### Anchor that navigates vs. anchor that sends AJAX

```html
<a href="{{ route('billing.portal') }}" target="_blank" data-cge-confirm="Open the billing portal?">Billing</a>
<a href="{{ route('users.destroy', $user) }}" data-cge-method="DELETE" data-cge-action="delete">Delete</a>
```
