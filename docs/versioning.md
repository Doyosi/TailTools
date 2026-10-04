# Versioning Strategy for TailTools

## Unreleased maintenance (2026-10-04)

- Fixed CGEForm Laravel method spoofing and duplicate submissions; removed stale delegated handlers on destroy.
- Fixed CGESelect remote/multiple native serialization, declarative async configuration, stale requests and DOM restoration. Added an optional discovery root to static init.
- Fixed CGEDropzone confirmation API, individual deletion errors, cancellation accounting, bounded uploadAll and shutdown queue behavior.
- Fixed CGELightbox close/reopen and slide races, global listener cleanup, partial translations and quoted gallery names.
- Fixed CGEActionButton duplicate confirmation workflows and partial translations.
- Fixed CGEToast repeated session flashes, persistent declarative durations and nested delegation.
- Added request/API regressions, interactive browser checks and corrected consumer docs/skills.

This records maintenance, not a published release. Local metadata is tailtools@0.0.0 with private:true; exports, strict declarations and ESM/UMD artifacts are validated locally. Public versioning, npm publication and CDN availability remain release decisions.

- Completed the follow-up list: lifecycle cancellation, awaited Dropzone clear/avatar contract, Form/Action cancellation, Select ARIA/native synchronization, submitter handling, shared overlay ownership, Lightbox drivers and pending media.
- Added type barrels, strict NodeNext/Bundler tests and library/archive/browser bundle checks.
- Consolidated duplicate guides/skills/tracking paths, preserved styling, and ignored/untracked node_modules/dist while keeping local files.

TailTools adheres strictly to [Semantic Versioning 2.0.0 (SemVer)](https://semver.org/).

Given a version number `MAJOR.MINOR.PATCH`, we increment:

- **`MAJOR`**: Incompatible API changes, breaking changes to DOM attributes (`data-cge-*`), dropping support for a major Tailwind or Laravel version, or removing existing CGE plugins.
- **`MINOR`**: Adding new CGE plugins (e.g., adding `CGEModal`), adding new backwards-compatible options, methods, or animations to existing plugins.
- **`PATCH`**: Backwards-compatible bug fixes, performance improvements, CSS alignment fixes, or documentation corrections.

---

## 1. Plugin-Level vs. Monolithic Package Versioning

While TailTools contains multiple `CGE` plugins (`plugins/CGETooltip`, `plugins/CGEModal`, etc.), the entire suite is published as a unified npm package (`tailtools`).

- **Unified Package Version:** Governed by [package.json](../package.json).
- **Per-Plugin Metadata:** Each plugin folder maintains its own `README.md` and changelog section indicating the TailTools version it was introduced or updated in.

---

## 2. Release Lifecycle & Git Tags

1. **Feature Branching:**
   - Plugin branches follow the naming pattern: `feature/cge-<plugin-name>` (e.g., `feature/cge-modal`).
2. **Pre-Release Checklist:**
   - All tests passing (unit tests + manual demo in `index.html`).
   - Plugin documentation created in `docs/CGE<X>/`.
   - `CHANGELOG.md` updated with added/changed/fixed entries.
   - Skill created in `.agents/skills/cge-<plugin-name>/`.
3. **Tagging:**
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0: Added CGEModal plugin"
   git push origin v1.2.0
   ```

---

## 3. npm Release Process

```bash
# 1. Ensure working directory is clean
git status

# 2. Run test suite & build
npm run test
npm run build

# 3. Bump version (updates package.json and package-lock.json)
npm version minor -m "Release v%s"

# 4. Publish to npm registry
npm publish --access public
```

---

## 4. Changelog Standards

Every release must document changes following [Keep a Changelog](https://keepachangelog.com/):
- **Added**: New plugins, new methods, or new features.
- **Changed**: Modifications to default behaviors or styles.
- **Deprecated**: Features scheduled for removal in future major versions.
- **Removed**: Features eliminated in this major version.
- **Fixed**: Bug fixes and browser compatibility patches.
- **Security**: Vulnerability remediations.

---

## 5. Current Release Track (v1.13.0)

- **Added**: `CGEAccordion` plugin (`plugins/CGEAccordion/`) incorporating `CGECollapse`. Ultra-smooth, accessible accordion and collapsible panel plugin engineered for Tailwind CSS v4.3+ and Laravel Blade. Utilizes modern CSS Grid row transitions (`grid-rows-[0fr]` to `grid-rows-[1fr]`) to eliminate laggy height/scrollHeight calculations. Features single-expand (exclusive accordion) and multi-expand (independent collapse) modes, URL hash/deep-linking activation, animated chevron/icon rotation, nested hierarchy support, and full WAI-ARIA keyboard navigation.
- **Previous (v1.12.0)**: `CGETabs` plugin (`plugins/CGETabs/`) high-performance, accessible tabs and segmented control plugin designed for Tailwind CSS v4.3+ and Laravel Blade. Features dual navigation state persistence (URL Hash and URL Query Param deep linking), on-demand Ajax / Blade partial lazy loading with caching, WAI-ARIA compliant keyboard navigation, dynamic animated sliding indicators, headless UI theming, and automated lifecycle re-binding for internal CGE plugins.
- **Previous (v1.11.0)**: `CGEDataGrid` plugin (`plugins/CGEDataGrid/`) high-performance, reactive, and modular Card Grid & List engine designed for Tailwind CSS v4.3+ and Laravel Blade. Features dual rendering modes (`cardRendererGrid` + `cardRendererList` for client JSON or direct Laravel API Resource Blade partials `html_card` and `html_list`), layout flexibility (`layoutMode: 'grid' | 'list' | 'both'` with interactive view switcher 🔲 / ☰), multi-card selection engine (`selectable: true`) with floating bulk action toolbar, decoupled sub-modules (`CGEFilter`, `CGESort`, `CGEPagination`), and automated lifecycle binding for `CGEActionButton`.

- **Previous (v1.10.0)**: `CGEDataTable` plugin (`plugins/CGEDataTable/`) high-performance, tree-shakeable modular data grid engine designed for Tailwind CSS v4.3+ and Laravel Blade. Built with a decoupled sub-module architecture connecting independent standalone modules for Filtering (`CGEFilter`), Sorting (`CGESort`), Pagination (`CGEPagination`), and Adaptive Responsive Layouts (`CGEResponsive`). Supports multi-format data ingestion (HTML DOM, JSON, Laravel paginated AJAX with/without metas, and server-rendered HTML rows), headless UI styling, and automated lifecycle binding for `CGEActionButton`.
- **Previous (v1.9.0)**: `CGEDropzone` plugin (`plugins/CGEDropzone/`) versatile, accessible drag-and-drop file uploader and preview manager designed specifically for Tailwind CSS v4.3+ and Laravel Blade. Features dual upload strategies (instant file-by-file async queue with `maxConcurrent` vs. form-bound batch submission synchronized via `DataTransfer`), avatar profile photo mode (`mode: 'avatar'`), dimensional aspect ratio presets (`300x600`, `1200x630`, `50x50`, `1:1`, `16:9`, `auto`) eliminating CLS, MIME-aware preview engine (instant client-side blob thumbnails for images, contextual semantic SVG vector icons for PDF/Word/Excel/ZIP/Audio/Video/Code), in-flight cancellation via abort, server deletion hook with optional `CGEAlert` confirmation, headless `ui` slots, and deep `CGEForm` integration.
- **Previous (v1.8.0)**: `CGESelect` plugin (`plugins/CGESelect/`) versatile, accessible searchable select and multi-tag combobox plugin designed for Tailwind CSS v4.3+ and Laravel Blade. Features seamless native `<select>` synchronization (dispatching native bubbling `change` and `input` events directly onto the hidden select), single and multi-select tag modes with `maxItems` and `maxTagsVisible` overflow badges, headless UI style inheritance (extracting colors, borders, and `rounded-sm` from original select), Popper-like viewport auto-flip placement, rich option rendering (avatars, icons, badges, descriptions) with `<optgroup>` support, local fuzzy filter and remote async search engine (Axios/Fetch with debounce and `AbortController`), WAI-ARIA 1.2 keyboard combobox navigation, and pluggable i18n dictionaries.
- **Previous (v1.7.0)**: `CGEActionButton` plugin (`plugins/CGEActionButton/`) high-performance, declarative action button and confirmation interceptor designed specifically for Laravel Blade and Tailwind CSS v4.3+. Features Mode 1 (Confirmation Gatekeeper with CGEAlert dialogs and type-to-confirm verification) and Mode 2 (Direct Command Execution with instant loading spinners), multi-target execution (form submission with Laravel method spoofing, direct async HTTP requests with automatic CSRF token attachment, link navigation interception), sibling button locking in table rows (`data-cge-lock-group="row"`), dynamic layout width preservation, toast notification feedback bridge, and global event delegation for seamless Livewire, Datatables, and Turbo support.
- **Previous (v1.6.0)**: `CGELightbox` plugin (`plugins/CGELightbox/`) ultra-fast, touch-capable media lightbox and gallery viewer designed for Tailwind CSS v4.3+ and Laravel Blade. Features multi-media support (images, HTML5 video, YouTube/Vimeo 16:9 embeds, inline HTML modal templates), smooth pan-and-zoom controls (double-tap/click zoom, mouse wheel zoom, click-and-drag pan), bottom thumbnail carousel ribbon with active highlighting, mobile swipe gestures (horizontal navigation, vertical flick to dismiss, pinch-to-zoom), progressive image preloading, keyboard accessibility, top action toolbar (fullscreen, direct download, zoom, counter, close), and declarative data-attribute triggers (`data-cge-lightbox`, `data-cge-gallery`, `data-cge-type`, `data-cge-caption`, `data-cge-thumb`).
- **Previous (v1.5.0)**: `CGEDrawer` plugin (`plugins/CGEDrawer/`) high-performance, gesture-capable sliding drawer and off-canvas navigation plugin designed for Tailwind CSS v4.3+ and Laravel Blade.
- **Previous (v1.4.0)**: `CGEForm` plugin (`plugins/CGEForm/`) high-performance, reactive AJAX form handling plugin designed specifically for Laravel Blade and Tailwind CSS v4+.
- **Previous (v1.3.0)**: `CGEAlert` plugin (`plugins/CGEAlert/`) promise-based alert, confirmation, and dialog system with built-in archetypes, high-security exact-match type-to-confirm validation, and declarative form interception.
- **Previous (v1.2.0)**: `CGEToast` plugin (`plugins/CGEToast/`) with 8 floating positions, top/bottom banners, countdown timers with progress bars, and touch gestures.
- **Previous (v1.1.0)**: `CGEModal` plugin (`plugins/CGEModal/`) with dual-mode animations and tactile shake alert.
