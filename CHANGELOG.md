# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/) (while `0.x`, breaking changes bump the minor version).

## [0.1.1] - 2026-10-11

### Fixed
- CGEDropzone form mode: files chosen by clicking the drop area were never submitted (only dragged files were). Resetting the picker so the same file can be chosen again also emptied the files synced for submission. The picker (`hiddenInput`) and the submitted files (new named `formInput`) are now separate inputs.

## [0.1.0] - 2026-10-11

First public release on npm (`npm install tailtools`).

### Added
- Thirteen plugins: CGEModal, CGEToast, CGEAlert, CGEForm, CGEDrawer, CGELightbox, CGEActionButton, CGESelect, CGEDropzone, CGEDataTable, CGEDataGrid, CGETabs, CGEAccordion (with CGECollapse).
- `tailtools/auto` entry: window globals, automatic initialization and Livewire (commit, `wire:navigate`) / Turbo re-initialization. The UMD bundle is built from it.
- `destroyTailTools(root)` and `static destroyAll(root)` on every plugin; `init()` destroys instances whose elements were removed.
- Laravel HTTP helpers shared by all AJAX plugins: CSRF (`X-CSRF-TOKEN` / `X-XSRF-TOKEN`), 419/422 messages, followed redirects, `axiosInstance` priority.
- DataTable/DataGrid: Laravel paginator formats (paginate, API Resource `meta`, simplePaginate, cursor), `responseAdapter`, `paramNames`, `allValue`, `locale`, per-column `html` opt-in; `escapeHTML` export.
- Tabs: namespaced hash state (`#group=tab`), `sanitize`, `initPanel`/`destroyPanel`, `hashKey`.

### Changed
- The root `tailtools` import is side-effect free; use `tailtools/auto` for globals and auto-init.
- Text options (titles, messages, captions, file names, cell values, `data-cge-*` attributes) render as text; HTML requires an explicit opt-in.
- No runtime dependencies; `tailwindcss` and `tailwind-animations` are optional peer dependencies.

### Fixed
- XSS paths in DataTable, Dropzone, Alert, Toast, Lightbox, Select and Tabs.
- Alert Enter key confirming from Cancel; confirmation gates now run before element handlers; confirmed submits go through `requestSubmit`.
- Dropzone instant mode re-uploading files; scroll lock stuck after overlays are removed by Livewire/Turbo.
- Turkish case-insensitive search, column sort types and `DD.MM.YYYY` dates, Tabs Back navigation and nested deep links.
