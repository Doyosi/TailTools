# CGEDropzone Implementation Plan

## 1. Executive Summary & Architecture
`CGEDropzone` is an ultra-fast, accessible, native JavaScript drag-and-drop file uploader and preview manager crafted specifically for modern web frontends using **Tailwind CSS v4.3+** and **Laravel Blade** applications.

It provides a headless-capable rendering engine, MIME-aware preview generation, dual upload strategies (instant async queue vs. form-bound batch submission), specialized avatar/profile mode, customizable dimensional aspect ratio presets, comprehensive in-flight cancellation/deletion hooks, and seamless integration with `CGEForm` and `CGEAlert`.

---

## 2. Key Capabilities & Features

1. **Dual Upload Strategies:**
   - **`uploadMode: 'instant'` (Default):** Uploads files immediately as they are dropped or picked. Supports sequential queue or concurrency (`maxConcurrent: 2`), real-time byte progress tracking, cancel in-flight uploads, and server-side deletion hook (`removeUrl`).
   - **`uploadMode: 'form'`:** Accumulates files in an internal queue and synchronizes seamlessly with an underlying native `<input type="file" multiple>` via `DataTransfer` or appends directly to enclosing `<form>` / `CGEForm` submit payload.

2. **Display Modes & Layout Presets:**
   - **Standard Dropzone Grid:** Multi-file drag zone with clickable file picker fallback and responsive thumbnail grid.
   - **Avatar / Profile Mode (`mode: 'avatar'`):** Compact single-file uploader (`w-32 h-32 rounded-full` or rounded square), hover overlay with camera icon, drag-over highlight, and immediate thumbnail replacement.
   - **Aspect Ratio Presets:** Configurable thumbnail aspect ratio slots (`1:1`, `16:9`, `300x600`, `1200x630`, `50x50`, `auto`) using Tailwind v4 utility classes (`aspect-[300/600]`, `aspect-[1200/630]`, `aspect-square`, `aspect-video`) preventing Cumulative Layout Shift (CLS).

3. **MIME-Aware Preview Engine:**
   - **Image files (`image/*`):** Instant client-side blob thumbnail using `URL.createObjectURL()` with automatic revoke cleanup upon deletion or component teardown.
   - **Non-Image files (PDF, DOC/DOCX, XLS/XLSX, ZIP/RAR, Audio, Video, Code, Text):** Context-aware SVG vector icons, extension badges, filename truncation, and human-readable file size formatting (`MB`, `KB`, `B`).

4. **Network Engine & Laravel CSRF:**
   - Supports peer `axios` (default if detected on `window.axios` or configured) and reliable `XMLHttpRequest` / `fetch` fallback.
   - 0-100% upload progress tracking via `xhr.upload.onprogress` / `axios.onUploadProgress`.
   - Automatic extraction and transmission of Laravel CSRF token (`meta[name="csrf-token"]` or `input[name="_token"]`).
   - Custom headers, HTTP methods (`POST`, `PUT`, `PATCH`), and extra payload parameters (`extraData`).

5. **Actions & Controls:**
   - **Cancel Button:** Visible during upload, aborts request via `AbortController` or `xhr.abort()`.
   - **Delete Button:** Deletes local file or dispatches server `DELETE` request with optional `CGEAlert` confirmation.
   - **Retry Button:** Appears on network or server error to restart upload.

6. **Headless UI & Theming:**
   - Complete CSS slot architecture (`ui.*`) allowing drop-in customization of every DOM element with Tailwind CSS v4 utility classes.
   - Custom preview and trigger render functions (`renderPreview`, `renderTrigger`).

7. **Accessibility & i18n:**
   - Full keyboard navigation (focus dropzone, press Space/Enter to open file browser).
   - ARIA roles (`role="region"`, `aria-label`, `aria-live="polite"`).
   - Dynamic localization dictionary with token substitution (`:maxFileSize`, `:fileSize`, `:maxFiles`, `:statusCode`).

---

## 3. Options & Configuration Matrix

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string \| null` | `null` | Upload endpoint URL (required for `uploadMode: 'instant'`). |
| `method` | `string` | `'POST'` | HTTP method for uploading files. |
| `paramName` | `string` | `'file'` | FormData field name for uploaded file. |
| `uploadMode` | `'instant' \| 'form'` | `'instant'` | Upload strategy: instant async network upload or form-bound batch. |
| `mode` | `'standard' \| 'avatar'` | `'standard'` | Visual mode: multi-file responsive grid or single avatar uploader. |
| `aspectRatio` | `string` | `'auto'` | Thumbnail aspect ratio preset (`1:1`, `16:9`, `300x600`, `1200x630`, `50x50`, `auto`). |
| `acceptedFiles` | `string \| null` | `null` | Comma-separated MIME types or extensions (e.g. `'image/*,.pdf,.zip'`). |
| `maxFileSize` | `number \| null` | `10` | Maximum file size allowed in megabytes (MB). |
| `minFileSize` | `number \| null` | `null` | Minimum file size allowed in megabytes (MB). |
| `maxFiles` | `number \| null` | `null` | Maximum number of files permitted (forced to `1` in `avatar` mode). |
| `maxConcurrent` | `number` | `2` | Number of simultaneous async file uploads in instant mode. |
| `autoProcessQueue`| `boolean` | `true` | Automatically begin uploading when files are added in instant mode. |
| `headers` | `Object` | `{}` | Custom HTTP request headers. |
| `extraData` | `Object \| Function` | `{}` | Additional FormData fields sent alongside the file. |
| `removeUrl` | `string \| null` | `null` | Remote endpoint for deleting uploaded files. |
| `removeMethod` | `string` | `'DELETE'` | HTTP method for remote file deletion. |
| `confirmDelete` | `boolean` | `true` | Prompt confirmation before deleting uploaded file (uses `CGEAlert` if present). |
| `driver` | `'axios' \| 'xhr' \| 'fetch'` | `'axios'` | HTTP client driver to use. |
| `existingFiles` | `Array<Object>` | `[]` | Preloaded files from server `{ id, name, size, url, mimeType }`. |
| `clickable` | `boolean \| string` | `true` | Whether dropzone element or child selector opens file dialog on click. |
| `ui` | `Object` | `{...}` | Tailwind CSS v4 class slot mapping. |
| `translations` | `Object` | `{...}` | i18n translation dictionary overrides. |
| `renderPreview` | `Function \| null` | `null` | Custom preview card renderer: `(fileItem) => HTMLElement \| string`. |
| `renderTrigger` | `Function \| null` | `null` | Custom dropzone trigger renderer. |

---

## 4. Public API Methods

```typescript
// Static
CGEDropzone.init(selectorOrElement, options)
CGEDropzone.get(idOrElement)
CGEDropzone.setTranslations(dictionary)

// Instance
dropzone.addFile(file: File)
dropzone.addFiles(files: FileList | File[])
dropzone.removeFile(fileId: string, silent?: boolean)
dropzone.uploadAll()
dropzone.uploadFile(fileId: string)
dropzone.cancelUpload(fileId: string)
dropzone.retryUpload(fileId: string)
dropzone.clear()
dropzone.disable()
dropzone.enable()
dropzone.destroy()
dropzone.getFiles(): DropzoneFile[]
dropzone.getQueuedFiles(): DropzoneFile[]
dropzone.getUploadingFiles(): DropzoneFile[]
dropzone.getCompletedFiles(): DropzoneFile[]
dropzone.getFailedFiles(): DropzoneFile[]
dropzone.appendToFormData(formData: FormData, fieldName?: string)
dropzone.on(eventName, handler)
dropzone.off(eventName, handler)
```

---

## 5. Event Lifecycle

### Instance Callbacks & Event Emitter
- `onAddedFile(fileItem)`
- `onUploadProgress(fileItem, progress)`
- `onSuccess(fileItem, response)`
- `onError(fileItem, error)`
- `onRemoved(fileItem)`
- `onQueueComplete()`

### DOM Custom Events (Dispatched on dropzone root element)
- `cge:dropzone:add`
- `cge:dropzone:progress`
- `cge:dropzone:success`
- `cge:dropzone:error`
- `cge:dropzone:removed`
- `cge:dropzone:complete`

---

## 6. Execution Roadmap
- **Phase 1:** Planning & Checklist files
- **Phase 2:** Core JavaScript implementation (`plugins/CGEDropzone/CGEDropzone.js`)
- **Phase 3:** TypeScript definitions (`plugins/CGEDropzone/CGEDropzone.d.ts`)
- **Phase 4:** Tailwind CSS v4 styling & animations (`plugins/CGEDropzone/style.css`)
- **Phase 5:** Barrel export (`plugins/CGEDropzone/index.js`)
- **Phase 6:** Core library entry integration (`src/index.ts` and `src/style.css`)
- **Phase 7:** Interactive test showcase in `index.html`
- **Phase 8:** Complete documentation suite (`docs/CGEDropzone/` and general guides)
- **Phase 9:** AI skills (`.agents/skills/cge-dropzone/SKILL.md` and `cge-dropzone-skill.md`)

## Maintenance audit — 2026-10-04
Correct CGEAlert signature; retain failed remote deletions; single upload slot accounting; prevent queue restart after destroy.
Preserve existing public methods, CSS, Blade markup and exports. Verify programmatic and declarative behavior with regression fixtures; update docs and consumer guidance. No new dependencies or redesign.

## 2026-10-04 ek bakım planı
REPORTS.md içindeki tüm bakım adaylarını mevcut API ve tasarımı koruyarak uygulama: lifecycle/abort, ortak overlay sahipliği, erişilebilirlik, form verisi, paket/type doğrulaması ve belge tekilleştirme. Plugin özelindeki davranışlar regresyonlarla doğrulanacak.

## Stability fixes (October 2026)

Scope: DOM/text rendering for file data (XSS), instant mode server-ID hidden inputs (`serverIdName`) instead of filling the file input, Laravel 422/419 card messages, `resolveAxios`, non-retryable validation errors and queued retries, `clickable` selector, XHR for `driver: 'fetch'`, `isUploading`, avatar error UI + revert, form reset handling, full destroy restoration, `destroyAll(root)` + init pruning.
