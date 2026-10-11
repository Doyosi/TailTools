# CGEAlert - Practical Examples & Recipes

Explore production recipes for confirmations, prompts, destructive verification, and async network operations.

---

## 1. Type-to-Confirm Deletion (Stripe / GitHub Style)

Force the user to type the word "DELETE" before activating the confirm button:

```javascript
import { CGEAlert, CGEToast } from 'tailtools';

async function deleteProductionDatabase() {
  const result = await CGEAlert.delete(
    'Delete Production Cluster',
    'This will wipe all records and terminate cluster "us-east-prod-01".',
    {
      requireInput: 'DELETE',
      confirmButtonText: 'Permanently Destroy'
    }
  );

  if (result.isConfirmed) {
    CGEToast.error('Cluster destroyed.');
  }
}
```

---

## 2. Dynamic Email Prompt with Real-Time Validation

Collect and validate an email address before closing:

```javascript
import { CGEAlert, CGEToast } from 'tailtools';

async function inviteTeamMember() {
  const result = await CGEAlert.prompt('Invite Collaborator', {
    input: 'email',
    inputPlaceholder: 'colleague@company.com',
    inputValidator: (value) => {
      if (!value) return 'Email address is required.';
      if (!value.includes('@') || !value.includes('.')) {
        return 'Please enter a valid email address.';
      }
      return null;
    }
  });

  if (result.isConfirmed) {
    await sendInviteToBackend(result.value);
    CGEToast.success(`Invitation sent to ${result.value}`);
  }
}
```

---

## 3. Tri-Action Dialog (Save / Don't Save / Cancel)

Handle unsaved edits before navigating away:

```javascript
import { CGEAlert } from 'tailtools';

async function checkUnsavedChanges() {
  const result = await CGEAlert.fire({
    title: 'Unsaved Changes',
    message: 'Do you want to save the document before exiting?',
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Save Draft',
    denyButtonText: "Don't Save",
    cancelButtonText: 'Keep Editing'
  });

  if (result.isConfirmed) {
    await saveDraft();
    navigateAway();
  } else if (result.isDenied) {
    discardDraft();
    navigateAway();
  }
  // If cancelled or dismissed, do nothing
}
```

---

## 4. Async Pre-Confirm with Built-In Button Spinner

Perform server-side operations while keeping the dialog visible:

```javascript
import { CGEAlert, CGEToast } from 'tailtools';

async function syncDatabases() {
  const result = await CGEAlert.confirm('Synchronize Nodes', 'Begin distributed synchronization?', {
    preConfirm: async () => {
      try {
        const res = await fetch('/api/nodes/sync', { method: 'POST' });
        if (!res.ok) throw new Error('Sync failed on node 3');
        return await res.json();
      } catch (err) {
        throw new Error(err.message); // Automatically displays red error and shakes dialog
      }
    }
  });

  if (result.isConfirmed) {
    CGEToast.success(`Synced ${result.value.nodesCount} nodes!`);
  }
}
```

---

## 5. Dropdown Select Input Prompt

Present a predefined set of choices to the user:

```javascript
import { CGEAlert } from 'tailtools';

async function assignUserRole() {
  const result = await CGEAlert.prompt('Assign Role', {
    input: 'select',
    inputOptions: {
      admin: 'Administrator (Full Access)',
      editor: 'Editor (Read / Write)',
      viewer: 'Viewer (Read-Only)'
    }
  });

  if (result.isConfirmed) {
    console.log('Selected role key:', result.value);
  }
}
```

---

## 6. Static Backdrop with Tactile Vibration Shake

Prevent dismissal when clicking outside, providing immediate visual feedback:

```javascript
import { CGEAlert } from 'tailtools';

async function showMandatoryTerms() {
  const result = await CGEAlert.fire({
    title: 'Updated Terms of Service',
    message: 'You must review and accept the revised terms to continue using TailTools.',
    backdropClose: false, // Clicking outside triggers shake
    allowEscapeKey: false, // Pressing Escape triggers shake
    confirmButtonText: 'I Accept Terms',
    showCancelButton: false
  });
}
```

## Extended maintenance contract (2026-10-04)

Declarative confirmation uses a valid submit button with requestSubmit, supports external form-associated buttons, and removes temporary name/value inputs for other triggers. Repeated clicks while confirmation waits cannot bypass it. Dismissed async validators/preConfirm cannot deliver late confirmation. Alert owns scroll/focus only while its overlay is active; use dismiss/close and await the result Promise rather than assuming an instance destroy API.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.

```javascript
const result = await CGEAlert.confirm('Continue?', 'Confirm this action.');
if (result.isConfirmed) console.log('confirmed');
```


## Compact confirmation in either theme
```javascript
const result = await CGEAlert.confirm('Publish article?', 'Visible to everyone in your workspace.', {
  theme: 'light', // or 'dark' / 'auto'
  confirmButtonText: 'Publish',
  cancelButtonText: 'Keep editing'
});
```

```html
<button type="button" data-cge-alert="confirm" data-cge-title="Publish article?"
  data-cge-message="Visible to everyone in your workspace." data-cge-confirm-text="Publish">
  Review and publish
</button>
```

Set icon:false for a text-only dialog, or showDenyButton:true for three actions. Long labels wrap automatically. Use the same API for the compact default; no migration is needed.

## Stability fixes (October 2026)

### Livewire action gated by a confirmation

```blade
{{-- The capture-phase gate stops wire:click until the user confirms, then replays the click once. --}}
<button type="button"
        wire:click="delete({{ $post->id }})"
        data-cge-alert="delete"
        data-cge-title="Delete {{ $post->title }}?"
        data-cge-message="This cannot be undone.">
  Delete
</button>
```

`$post->title` is rendered as text even if it contains markup.

### Trusted HTML only through `html`

```javascript
CGEAlert.confirm(userSuppliedName, 'Remove this member?');                         // escaped
CGEAlert.fire({ title: 'Release notes', html: '<ul><li>Faster tables</li></ul>' }); // trusted markup
```

### Per-instance translations

```javascript
CGEAlert.delete('Kaydı sil?', '', { translations: { 'delete-button': 'Sil', 'cancel-button': 'Vazgeç' } });
```

### Teardown

```javascript
document.addEventListener('livewire:navigating', () => CGEAlert.destroyAll());
```
