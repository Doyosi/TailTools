# CGEDropzone Usage & Options

Comprehensive configuration options, public methods, and event hooks for **CGEDropzone**.

---

## 1. Options Matrix

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string \| null` | `null` | Remote endpoint URL for uploading files (required for `uploadMode: 'instant'`). |
| `method` | `string` | `'POST'` | HTTP method for uploading files (`POST`, `PUT`, `PATCH`). |
| `paramName` | `string` | `'file'` | FormData field name for uploaded file. Appends `[]` if multiple. |
| `uploadMode` | `'instant' \| 'form'` | `'instant'` | Upload strategy: instant async queue or batch form submission. Only `form` mode submits files natively, through a separate hidden named input (`formInput`, name `paramName` / `paramName[]`); the click picker (`hiddenInput`) is never named. Instant mode submits server IDs instead. |
| `serverIdName` | `string \| false \| null` | `null` | Instant mode: name of the hidden inputs holding each uploaded/existing file's server ID (response `id`, `path`, `data.id` or `data.path`). `null` means `${paramName}_ids[]`; `false` disables. |
| `mode` | `'standard' \| 'avatar'` | `'standard'` | Visual mode: multi-file responsive grid or single avatar uploader. |
| `aspectRatio` | `string` | `'auto'` | Thumbnail aspect ratio preset (`1:1`, `16:9`, `300x600`, `1200x630`, `50x50`, `auto`). |
| `acceptedFiles` | `string \| null` | `null` | Comma-delimited MIME types or extensions (e.g. `'image/*,.pdf,.zip'`). |
| `maxFileSize` | `number \| null` | `10` | Maximum file size allowed in megabytes (MB). |
| `minFileSize` | `number \| null` | `null` | Minimum file size allowed in megabytes (MB). |
| `maxFiles` | `number \| null` | `null` | Maximum allowed files (automatically set to `1` in `avatar` mode). |
| `maxConcurrent` | `number` | `2` | Number of simultaneous async file uploads in instant mode. |
| `autoProcessQueue`| `boolean` | `true` | Automatically begin uploading when files are added. |
| `headers` | `Object` | `{}` | Custom HTTP request headers (they win over Accept / X-Requested-With / CSRF). |
| `extraData` | `Object \| Function` | `{}` | Additional FormData fields sent alongside the file payload. |
| `removeUrl` | `string \| null` | `null` | Remote endpoint for deleting uploaded files on server. |
| `removeMethod` | `string` | `'DELETE'` | HTTP method for remote deletion. |
| `confirmDelete` | `boolean` | `true` | Prompt confirmation before deleting uploaded file (uses `CGEAlert` if present). |
| `driver` | `'axios' \| 'xhr' \| 'fetch'` | `'axios'` | Upload driver. `axios` uses `axiosInstance`, then `window.axios`; `xhr`, `fetch` and axios-less setups upload with XHR (fetch has no upload progress). Deletes use axios when available, otherwise fetch. |
| `axiosInstance` | `AxiosInstance \| null` | `null` | Axios instance used before `window.axios`. |
| `existingFiles` | `Array<Object>` | `[]` | Preloaded files from server `{ id, name, size, url, mimeType }`. |
| `clickable` | `boolean \| string` | `true` | `true`: the dropzone opens the file dialog on click/Enter/Space; `false`: no click or keyboard picker; a selector string: matching elements (anywhere in the document) open it. Declarative: `data-cge-clickable`. |
| `previewContainer` | `string \| HTMLElement` | `null` | Custom container for rendered previews. |
| `ui` | `Object` | `{...}` | Tailwind CSS v4 class slot mapping. |
| `translations` | `Object` | `{...}` | i18n translation dictionary overrides. |
| `renderPreview` | `Function \| null` | `null` | Custom preview card renderer: `(fileItem, dropzone) => HTMLElement \| string`. |
| `renderTrigger` | `Function \| null` | `null` | Custom trigger renderer: `(dropzone) => HTMLElement \| string`. |

---

## 2. Public Methods

### Static Methods
```javascript
// Automatically initialize all [data-cge-dropzone] containers
CGEDropzone.init(document);

// Retrieve an instance by selector or DOM element
const dz = CGEDropzone.get('#my-dropzone');

// Destroy instances inside a root or whose element was removed (Livewire / Turbo)
CGEDropzone.destroyAll(document);

// Update global default translations
CGEDropzone.setTranslations({
  "dict-default-message": "Fichiers à déposer ici ou cliquez pour parcourir"
});
```

### Instance Methods
```javascript
// Add file(s)
dz.addFile(file);
dz.addFiles(fileListOrArray);

// Remove file by ID or file object
await dz.removeFile(fileId);

// Upload queue controls
dz.uploadAll();
dz.uploadFile(fileId);
dz.cancelUpload(fileId);
dz.retryUpload(fileId);
await dz.clear();

// State controls
dz.disable();
dz.enable();
dz.destroy();

// Queue inspectors
const allFiles = dz.getFiles();
const queuedFiles = dz.getQueuedFiles();
const uploadingFiles = dz.getUploadingFiles();
const completedFiles = dz.getCompletedFiles();
const failedFiles = dz.getFailedFiles();

// Append to external FormData (for batch submissions or CGEForm)
dz.appendToFormData(formData, 'custom_attachments');
```

---

## 3. Events & Lifecycle

### Instance Callbacks
```javascript
const dz = new CGEDropzone('#dropzone', {
  onAddedFile: (file) => console.log('File added:', file.name),
  onUploadProgress: (file, progress) => console.log(`${file.name}: ${progress}%`),
  onSuccess: (file, response) => console.log('File uploaded:', response),
  onError: (file, error) => console.error('Error on file:', error),
  onRemoved: (file) => console.log('File removed:', file.name),
  onQueueComplete: () => console.log('All queued files processed!')
});
```

### Custom Event Emitter (`.on()` / `.off()`)
```javascript
dz.on('add', (file) => { ... });
dz.on('progress', (file, progress) => { ... });
dz.on('success', (file, response) => { ... });
dz.on('error', (file, error) => { ... });
dz.on('removed', (file) => { ... });
dz.on('complete', () => { ... });
```

### Native DOM CustomEvents
Dispatched on the dropzone root element with bubbling enabled:
- `cge:dropzone:add`
- `cge:dropzone:progress`
- `cge:dropzone:success`
- `cge:dropzone:error`
- `cge:dropzone:removed`
- `cge:dropzone:complete`

```javascript
document.addEventListener('cge:dropzone:success', (e) => {
  const { instance, file, data } = e.detail;
  console.log('DOM Event: Upload successful', file.name, data);
});
```

---

## 4. Headless UI Class Slots

Every component element can be customized with Tailwind CSS v4 classes via the `ui` configuration slot:

```javascript
const dropzone = new CGEDropzone('#my-dropzone', {
  ui: {
    container: 'border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary-500 rounded-2xl p-6 transition-colors',
    dragOver: 'border-primary-500 bg-primary-50/20',
    previewCard: 'relative group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm',
    progressBar: 'h-1.5 bg-primary-500 rounded-full transition-all duration-200',
    removeBtn: 'absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity',
    fileIcon: 'w-10 h-10 text-zinc-500'
  }
});
```


## Maintenance notes (2026-10-04)

Delete confirmation uses `CGEAlert.confirm(title, message, options)`. Failed individual remote deletions retain the file/card and emit `error` / onError. Fetch checks non-2xx responses. uploadAll respects maxConcurrent in instant mode. Cancellation releases slots once when requests settle; removing an upload preserves neighboring files. Destroy stops the queue. Upload driver fetch currently falls back to XHR for progress support.

## Extended maintenance contract (2026-10-04)

clear({ remote: true }) returns Promise<void>; await clear() to wait for server deletions. Each failed remote deletion keeps its file/card and emits error; new files added during a clear remain. clear({ remote: false }) detaches locally without deleting saved assets. Avatar replacement uses local detachment; invalid replacement preserves the current avatar. The backend owns final replacement/deletion of saved avatars. Concurrent upload/cancel slot accounting is bounded; destroy cancels uploads/deletes and suppresses late results. Existing rounded-xl and circular/avatar styling is preserved.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.

## Stability fixes (October 2026)

- **XSS:** file names, extensions, existing-file names and error messages are rendered with text nodes.
- **Form mode keeps click-picked files** (0.1.1): the picker (`hiddenInput`) is reset after every selection so the same file can be chosen again, and the files for submission live in a separate named `formInput`. Before 0.1.1 that reset also emptied the submitted files, so only dragged files reached the server.
- **Instant mode no longer re-uploads on submit** (behavior change): the native `<input type="file">` is unnamed and never filled; each successful upload (and each existing file with an `id`/`path`) writes `<input type="hidden" name="file_ids[]" value="...">` (see `serverIdName`), removed together with the file.
- **Laravel errors:** 422 field messages (`errors.file`, `errors["file.0"]`) and `message` (419 "CSRF token mismatch.") appear on the card instead of "Server responded with 422".
- **Retry:** hidden for client validation errors (size/type); retries go through the queue (respecting `maxConcurrent`; no uploads in form mode).
- **Avatar mode:** client and server errors show below the avatar (`.cge-dropzone-avatar-error`), and a rejected upload restores the previous image.
- **Lifecycle:** `isUploading` reflects in-flight uploads; form `reset` (including CGEForm `resetOnSuccess`) removes newly added previews and keeps existing files; `destroy()` removes the generated trigger/previews/avatar nodes and restores the original `class`, `role`, `tabindex` and `aria-label`, so re-initialization does not duplicate UI; `CGEDropzone.destroyAll(root)` and pruning in `init()`.
- **HTTP:** shared Laravel CSRF helper (cookie only as `X-XSRF-TOKEN`) and the configured `axiosInstance` wins over `window.axios`.
