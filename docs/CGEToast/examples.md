# CGEToast - Practical Examples & Recipes

Explore ready-to-use patterns for notifications, action buttons, full-width banners, avatars, and asynchronous flows.

---

## 1. Gmail-Style "Undo" Notification

Trigger a toast when an item is deleted, giving the user 7 seconds to revert the action:

```javascript
import { CGEToast } from 'tailtools';

function archiveConversation(id) {
  // 1. Hide conversation optimistically in DOM
  hideItemFromList(id);

  // 2. Launch toast with interactive Undo button
  CGEToast.show({
    title: 'Item Archived',
    message: 'The email was moved to Archive.',
    variant: 'neutral',
    duration: 7000,
    progressBar: true,
    pauseOnHover: true,
    actions: [
      {
        label: 'Undo',
        class: 'bg-indigo-600 hover:bg-indigo-500 text-white font-medium',
        onClick: (toast) => {
          // Revert the deletion
          restoreItemInList(id);
          CGEToast.success('Action undone.');
          toast.dismiss();
        }
      }
    ],
    onClose: () => {
      // Commit the deletion to backend if not undone
      commitArchiveToBackend(id);
    }
  });
}
```

---

## 2. Cookie Consent & Telemetry Banner (bottom-full)

A clean bottom-full banner that spans the full viewport width:

```javascript
import { CGEToast } from 'tailtools';

function checkCookieConsent() {
  if (localStorage.getItem('cookie_consent')) return;

  CGEToast.show({
    title: 'Privacy & Cookie Preferences',
    message: 'We use cookies and telemetry diagnostics to improve performance and developer workflows.',
    position: 'bottom-full',
    variant: 'neutral',
    duration: false, // Persistent until user acts
    actions: [
      {
        label: 'Accept All',
        class: 'bg-cyan-600 hover:bg-cyan-500 text-white font-semibold',
        onClick: (toast) => {
          localStorage.setItem('cookie_consent', 'accepted');
          CGEToast.success('Preferences saved!');
          toast.dismiss();
        }
      },
      {
        label: 'Reject Non-Essential',
        onClick: (toast) => {
          localStorage.setItem('cookie_consent', 'essential_only');
          toast.dismiss();
        }
      }
    ]
  });
}
```

---

## 3. System Maintenance Alert Banner (top-full)

Prominently display a top full-width announcement with a custom action:

```javascript
CGEToast.show({
  title: 'Database Maintenance Tonight',
  message: 'All read/write operations will pause for approximately 90 seconds starting at 02:00 UTC.',
  position: 'top-full',
  variant: 'warning',
  duration: 10000,
  progressBar: true,
  actions: [
    {
      label: 'View Live Status',
      class: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold',
      onClick: () => {
        window.open('https://status.example.com', '_blank');
      }
    }
  ]
});
```

---

## 4. User Avatar & Direct Action

Show rich notification cards featuring user avatars:

```javascript
CGEToast.show({
  title: 'Alex Rivera',
  message: 'commented on <strong>PR #402</strong>: "Looks great to merge!"',
  variant: 'info',
  image: {
    src: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    alt: 'Alex Rivera',
    class: 'w-10 h-10 rounded-full border-2 border-sky-400/40 object-cover'
  },
  duration: 6000,
  actions: [
    {
      label: 'View PR',
      class: 'bg-sky-600 hover:bg-sky-500 text-white font-medium',
      onClick: (toast) => {
        window.location.href = '/pulls/402';
        toast.dismiss();
      }
    }
  ]
});
```

---

## 5. Async Promise Wrapper

Wrap async operations like file uploads or Stripe payments into automatic loading and completion toasts:

```javascript
async function handleExport() {
  const loadingToast = CGEToast.show({
    title: 'Generating Export',
    message: 'Compiling report data into CSV...',
    variant: 'neutral',
    duration: false, // keep open
    progressBar: false
  });

  try {
    const response = await fetch('/api/export/csv');
    if (!response.ok) throw new Error('Export failed');
    
    await response.blob();
    
    // Dismiss loading toast and show success
    await loadingToast.dismiss();
    CGEToast.success('Export downloaded successfully!', { duration: 4000 });
  } catch (err) {
    await loadingToast.dismiss();
    CGEToast.error(err.message, { title: 'Export Error' });
  }
}
```

---

## 6. Multi-Language Switcher Recipe

```javascript
// Configure Turkish language dictionary
function activateTurkish() {
  CGEToast.setTranslations({
    close: 'Bildirimi Kapat',
    undo: 'Geri Al',
    'success-title': 'Başarılı',
    'error-title': 'Hata',
    'warning-title': 'Uyarı',
    'info-title': 'Bilgilendirme'
  });

  CGEToast.success('Ayarlar başarıyla kaydedildi!');
}
```
