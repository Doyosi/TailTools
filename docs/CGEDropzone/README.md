# CGEDropzone

Versatile, accessible drag-and-drop file uploader and preview manager designed specifically for **Tailwind CSS v4.3+** and **Laravel Blade** applications.

---

## Features

- **Dual Upload Strategies:**
  - **Instant Async Queue (`uploadMode: 'instant'`):** Automatically uploads files file-by-file with concurrency control (`maxConcurrent`), animated per-file progress bars, and in-flight cancel.
  - **Batch Form Submission (`uploadMode: 'form'`):** Keeps files in a local queue and synchronizes seamlessly with an underlying native `<input type="file" multiple>` via `DataTransfer` or appends directly to enclosing `<form>` / `CGEForm` submit payloads.
- **Display Modes & Dimensions:**
  - **Standard Multi-File Grid:** Responsive drag-and-drop zone with auto grid layout and clickable file picker fallback.
  - **Avatar / Profile Mode (`mode: 'avatar'`):** Specialized 1:1 circular/square photo uploader with hover camera overlay and instant replacement.
  - **Aspect Ratio Presets:** Presets for `1:1`, `16:9`, `300x600`, `1200x630`, `50x50`, and `auto` that prevent Cumulative Layout Shift (CLS).
- **MIME-Aware Preview Engine:**
  - Image files render immediate blob thumbnails via `URL.createObjectURL()` with automatic revoke cleanup.
  - Non-image files (PDF, Word, Excel, Archives, Audio, Video, Code) render contextual semantic SVG vector icons with extension badges and human-readable file sizes (`MB`, `KB`).
- **Network Engine & Laravel CSRF:**
  - Works with `axios` (peer dependency) or fallback `XMLHttpRequest` / `fetch`.
  - Automatically retrieves `X-CSRF-TOKEN` from `<meta name="csrf-token">` or `input[name="_token"]`.
  - Supports custom headers, HTTP methods (`POST`, `PUT`, `PATCH`), and extra payload parameters.
- **Actions & Controls:**
  - In-flight **Cancel** button aborts requests.
  - **Delete** button with optional `CGEAlert` confirmation dialog.
  - Contextual **Retry** button on network failure.
- **Headless Design Architecture:**
  - Complete UI slot theming via Tailwind CSS v4 utility classes (`ui.*`).
  - Custom trigger and preview render hooks (`renderPreview`, `renderTrigger`).
- **Zero Runtime Bloat:**
  - Native ESM JavaScript, full TypeScript types (`.d.ts`), accessible keyboard navigation, and ARIA roles.

---

## Quick Start

### 1. Stylesheet Import

In your Tailwind CSS v4 CSS bundle (`src/style.css` or `resources/css/app.css`):

```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEDropzone/style.css";
```

### 2. Declarative HTML / Blade Usage

```html
<!-- Instant Upload Dropzone -->
<div data-cge-dropzone
     data-cge-upload-mode="instant"
     data-cge-url="/api/files/upload"
     data-cge-accepted-files="image/*,.pdf,.zip"
     data-cge-max-file-size="10"
     data-cge-max-concurrent="2">
</div>
```

### 3. Programmatic JavaScript Usage

```javascript
import { CGEDropzone } from 'tailtools';

const dropzone = new CGEDropzone('#my-dropzone', {
  uploadMode: 'instant',
  url: '/api/uploads',
  acceptedFiles: 'image/*',
  maxFileSize: 5,
  onAddedFile: (file) => console.log('Added file:', file.name),
  onSuccess: (file, response) => console.log('Uploaded:', response),
  onError: (file, error) => console.error('Upload failed:', error)
});
```

---

## Table of Documentation

- [Complete Usage & Options Matrix](usage.md)
- [Practical Code Examples](examples.md)
- [Laravel Blade Components Guide](laravel-blade.md)
- [TypeScript API & DOM Event Contracts](api.md)
