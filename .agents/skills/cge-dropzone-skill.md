---
name: cge-dropzone-skill
description: Universal agent operational guide for CGEDropzone, a versatile, accessible drag-and-drop file uploader and preview manager designed for Tailwind CSS v4.3+ and Laravel Blade. Supports single/multiple uploads, dual upload strategies (instant file-by-file async vs. form-bound batch submission), dedicated cancel/delete controls, smart MIME-type previews (images with configurable aspect ratios or SVG icons for documents/archives), specialized avatar mode, and deep CGEForm integration.
---

# CGEDropzone Universal Agent Skill

This skill guides AI coding assistants (Antigravity, Cursor, Codex, Claude Code) in implementing, configuring, styling, and debugging the `CGEDropzone` plugin from **TailTools**.

---

## Architecture Overview

- **Source Code:** `plugins/CGEDropzone/CGEDropzone.js`
- **TypeScript Types:** `plugins/CGEDropzone/CGEDropzone.d.ts`
- **Tailwind v4 Styles:** `plugins/CGEDropzone/style.css`
- **Barrel Export:** `plugins/CGEDropzone/index.js`
- **Documentation:** `docs/CGEDropzone/` (`README.md`, `usage.md`, `laravel-blade.md`, `examples.md`, `api.md`)
- **Zero Runtime Dependencies:** Native browser JavaScript (peer-dependency on `axios` if selected).

---

## Core Capabilities

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

7. **Strict Styling Constraint:**
   - Use `rounded-sm` or `rounded-xl` consistently across preview cards and buttons according to TailTools design system standards.
