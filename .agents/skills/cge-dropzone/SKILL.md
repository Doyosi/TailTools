---
name: cge-dropzone
description: Versatile, accessible drag-and-drop file uploader and preview manager designed for Tailwind CSS v4.3+ and Laravel Blade. Supports single/multiple uploads, dual upload strategies (instant file-by-file async vs. form-bound batch submission), dedicated cancel/delete controls, smart MIME-type previews (images with configurable aspect ratios or SVG icons for documents/archives), specialized avatar mode, and deep CGEForm integration.
---

# CGEDropzone Agent Skill

Use this skill when implementing, configuring, styling, or debugging file uploads, drag-and-drop targets, profile avatar pickers, and media preview galleries in **TailTools** with Tailwind CSS v4.3+ and Laravel Blade.

---

## 1. When to Use CGEDropzone

Activate this skill when the user requests:
- "Build a drag-and-drop file upload zone with animated progress bars."
- "Implement instant file-by-file asynchronous upload with concurrency limits (`maxConcurrent`)."
- "Synchronize dropped files directly with a standard `<form>` or `CGEForm` using `uploadMode: 'form'` and `DataTransfer`."
- "Create a profile photo / avatar uploader with 1:1 circular container and camera overlay (`mode: 'avatar'`)."
- "Set up custom thumbnail aspect ratios (`1200x630`, `300x600`, `1:1`, `16:9`, `50x50`) preventing layout shifts (CLS)."
- "Render semantic vector icons for non-image files like PDFs, Word, Excel, ZIP archives, audio, video, or code."
- "Support in-flight request cancellation, retry for failed uploads, and delete with `CGEAlert` confirmation."
- "Create reusable Laravel Blade components `<x-cge-dropzone>` and `<x-cge-avatar-upload>`."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEDropzone/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGEDropzone } from 'tailtools';

// Automatically initializes all [data-cge-dropzone] on DOMContentLoaded
initTailTools();

// Global registration for inline scripts or Alpine.js
window.CGEDropzone = CGEDropzone;
```

---

## 3. Core Declarative Markup Patterns

### A. Instant Async Upload with Progress & Deletion
```html
<div data-cge-dropzone
     data-cge-upload-mode="instant"
     data-cge-url="/api/files/upload"
     data-cge-remove-url="/api/files/delete"
     data-cge-accepted-files="image/*,.pdf,.zip"
     data-cge-max-file-size="10"
     data-cge-max-concurrent="2">
</div>
```

### B. Batch Form Submission (`uploadMode: 'form'`)
```html
<form action="/documents/store" method="POST" enctype="multipart/form-data">
  <input type="hidden" name="_token" value="{{ csrf_token() }}">
  
  <input type="text" name="title" required class="mb-4">

  <div data-cge-dropzone
       data-cge-upload-mode="form"
       data-cge-param-name="attachments"
       data-cge-max-files="5"
       data-cge-accepted-files=".pdf,.docx,.xlsx">
  </div>

  <button type="submit" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-sm font-semibold">
    Submit All Files
  </button>
</form>
```

### C. Avatar Profile Mode (`mode: 'avatar'`)
```html
<div data-cge-dropzone
     data-cge-mode="avatar"
     data-cge-upload-mode="instant"
     data-cge-url="/user/avatar/upload"
     data-cge-accepted-files="image/jpeg,image/png,image/webp">
</div>
```

---

## 4. Programmatic JavaScript API

```javascript
import { CGEDropzone } from 'tailtools';

const dz = new CGEDropzone('#my-dropzone', {
  uploadMode: 'instant',
  url: '/api/uploads',
  acceptedFiles: 'image/*,.pdf',
  maxFileSize: 15,
  maxConcurrent: 2,
  onAddedFile: (file) => console.log('Queued:', file.name),
  onUploadProgress: (file, progress) => console.log(`${file.name}: ${progress}%`),
  onSuccess: (file, response) => console.log('Uploaded:', response),
  onError: (file, error) => console.error('Error:', error)
});

// Programmatic controls
dz.addFile(myBlob);
dz.uploadAll();
dz.cancelUpload(fileId);
await dz.clear();
dz.disable();
dz.enable();
dz.destroy();
```

---

## 5. Event Lifecycle

- `cge:dropzone:add` — Fired when a file is validated and added to queue.
- `cge:dropzone:progress` — Fired on every progress tick with percentage.
- `cge:dropzone:success` — Fired when file upload returns HTTP 2xx.
- `cge:dropzone:error` — Fired when validation or upload fails.
- `cge:dropzone:removed` — Fired when file is deleted.
- `cge:dropzone:complete` — Fired when the upload queue empties.


## Verified maintenance guidance (2026-10-04)

Delete confirmation uses `CGEAlert.confirm(title, message, options)`. Failed individual remote deletions retain the file/card and emit `error` / onError. Fetch checks non-2xx responses. uploadAll respects maxConcurrent in instant mode. Cancellation releases slots once when requests settle; removing an upload preserves neighboring files. Destroy stops the queue. Upload driver fetch currently falls back to XHR for progress support.

## Verified maintenance contract (2026-10-04)

clear({ remote: true }) returns Promise<void>; await clear() to wait for server deletions. Each failed remote deletion keeps its file/card and emits error; new files added during a clear remain. clear({ remote: false }) detaches locally without deleting saved assets. Avatar replacement uses local detachment; invalid replacement preserves the current avatar. The backend owns final replacement/deletion of saved avatars. Concurrent upload/cancel slot accounting is bounded; destroy cancels uploads/deletes and suppresses late results. Existing rounded-xl and circular/avatar styling is preserved.

Use the existing plugin radius/theme defaults. New markup may prefer rounded-sm; do not replace Dropzone rounded-xl or circular avatar defaults during maintenance. The canonical API is [CGEDropzone.d.ts](../../../../plugins/CGEDropzone/CGEDropzone.d.ts).

## Stability fixes (October 2026)

- Never build card markup from file data: names, extensions and errors are text nodes.
- Instant mode never names/fills the native file input; server IDs (`id`/`path`/`data.id`/`data.path`) go into hidden `serverIdName` inputs (default `${paramName}_ids[]`, `false` disables). Laravel endpoints should return an `id`.
- 422/419 messages are shown on the card; validation errors are not retryable; retries go through `_processQueue` (maxConcurrent, form mode).
- `clickable` accepts a selector; `driver: 'fetch'` uploads with XHR (progress); `isUploading` is maintained; configured `axiosInstance` wins.
- Avatar errors show under the avatar and a rejected upload restores the previous image. Keep the circular avatar and rounded-xl card styling.
- Form reset clears new previews; `destroy()` restores the element; use `CGEDropzone.destroyAll(root)`.
