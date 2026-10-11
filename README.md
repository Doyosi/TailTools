# TailTools

> **High-performance, lightweight, modular UI plugins engineered for Tailwind CSS v4.3+ and Laravel (Blade & Vite).**

[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3+-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Laravel](https://img.shields.io/badge/Laravel-10_%7C_11+-ff2d20?style=flat&logo=laravel)](https://laravel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Types-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Zero Framework Lock-in](https://img.shields.io/badge/Runtime-Native_ES2022+-f7df1e?style=flat&logo=javascript)](https://developer.mozilla.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Overview

**TailTools** is an open, tree-shakeable suite of 13 reactive UI plugins crafted specifically for **modern Tailwind CSS v4** and **Laravel Blade** ecosystems. Built from the ground up in clean, native JavaScript (ES2022+) with 100% strict TypeScript declarations, TailTools delivers rich interactive components without requiring heavy frontend framework runtimes like React, Vue, or Alpine.js.

### Core Philosophy

1. **Native JavaScript Core with Strict Typing:** Zero framework lock-in. Written in modular ES2022+ classes with comprehensive `.d.ts` declarations passing strict `NodeNext` and `Bundler` TypeScript checks.
2. **Tailwind CSS v4.3+ First:** Built directly for Tailwind v4's CSS-first architecture (`@import "tailwindcss";`, `@import "tailtools/styles"`), modern CSS Grid transitions (`grid-rows-[0fr]` to `grid-rows-[1fr]`), and optional `tailwind-animations` integration with graceful CSS fallbacks.
3. **Laravel Blade & Vite Optimized:** Designed for seamless integration into Laravel applications. Every component supports declarative `data-cge-*` HTML attributes for zero-boilerplate Blade view authoring, automatic CSRF token injection, RESTful method spoofing (`_method`), and automated Laravel 422 JSON validation error handling.
4. **Accessible & Production-Hardened:** Full WAI-ARIA compliance, keyboard navigation (Arrow keys, Home, End, Esc, Space, Tab), focus trapping, and strict lifecycle memory management (`destroy()` cleanup).

---

## 📦 What TailTools Does

TailTools provides a dual-interface architecture:
- **Declarative HTML / Blade API (`data-cge-*`):** Add simple data attributes to your Blade or HTML elements. TailTools automatically discovers, binds, and manages state, animations, focus, and server interactions without writing manual JavaScript.
- **Programmatic JavaScript / TypeScript API:** Full object-oriented control via modern ES classes, typed options, instance methods (`open()`, `close()`, `destroy()`), promise-based dialogs, and DOM `CustomEvent` hooks.

### The 13 Primary CGE Plugins

| Plugin | Description | Documentation Links |
| :--- | :--- | :--- |
| **`CGEAccordion`** / `CGECollapse` | Ultra-smooth accordion and collapsible panels using CSS Grid row transitions (`0fr` ➔ `1fr`) to eliminate laggy height calculations. Supports exclusive & multi-expand modes, URL hash deep linking, keyboard navigation, and animated rotating chevrons. | [Overview](docs/CGEAccordion/README.md) • [Usage](docs/CGEAccordion/usage.md) • [Examples](docs/CGEAccordion/examples.md) • [API](docs/CGEAccordion/api.md) • [Blade](docs/CGEAccordion/laravel-blade.md) |
| **`CGEActionButton`** | Declarative action button and confirmation interceptor. Bridges UI buttons directly with confirmation modals (CGEAlert), background AJAX commands (Axios / Fetch), dynamic loading spinners, and Laravel form submissions with method spoofing. | [Overview](docs/CGEActionButton/README.md) • [Usage](docs/CGEActionButton/usage.md) • [Examples](docs/CGEActionButton/examples.md) • [API](docs/CGEActionButton/api.md) • [Blade](docs/CGEActionButton/laravel-blade.md) |
| **`CGEAlert`** | Promise-based modal dialog, confirmation, and prompt engine. Built-in archetypes (info, confirm, destructive delete, restore, text prompt), type-to-confirm safety verification, focus trapping, and customizable i18n dictionary. | [Overview](docs/CGEAlert/README.md) • [Usage](docs/CGEAlert/usage.md) • [Examples](docs/CGEAlert/examples.md) • [API](docs/CGEAlert/api.md) • [Blade](docs/CGEAlert/laravel-blade.md) |
| **`CGEDataGrid`** | Reactive card grid and list engine. Features dual rendering modes (grid vs list), direct ingestion of Laravel Blade HTML card resources, multi-card selection engine, decoupled filtering/sorting/pagination, and automated lifecycle binding for CGEActionButton. | [Overview](docs/CGEDataGrid/README.md) • [Usage](docs/CGEDataGrid/usage.md) • [Examples](docs/CGEDataGrid/examples.md) • [API](docs/CGEDataGrid/api.md) |
| **`CGEDataTable`** | High-performance, modular data grid engine with decoupled sub-modules (`CGEFilter`, `CGESort`, `CGEPagination`, `CGEResponsive`). Ingests DOM tables, in-memory JSON, and Laravel `LengthAwarePaginator` AJAX responses, with adaptive priority collapse and child-row accordions. | [Overview](docs/CGEDataTable/README.md) • [Usage](docs/CGEDataTable/usage.md) • [Examples](docs/CGEDataTable/examples.md) • [API](docs/CGEDataTable/api.md) • [Blade](docs/CGEDataTable/laravel-blade.md) |
| **`CGEDrawer`** | Sliding off-canvas navigation and sidebar drawer. Features 4-direction positioning (left, right, top, bottom), touch swipe-to-dismiss gestures, backdrop bounce feedback, layout-push mode, collapsed mini-rail mode, and full focus trapping. | [Overview](docs/CGEDrawer/README.md) • [Usage](docs/CGEDrawer/usage.md) • [Examples](docs/CGEDrawer/examples.md) • [API](docs/CGEDrawer/api.md) • [Blade](docs/CGEDrawer/laravel-blade.md) |
| **`CGEDropzone`** | Accessible drag-and-drop file uploader and preview manager. Supports single and multiple uploads, dual upload strategies (instant async vs form-bound batch), smart MIME-type previews (images and document SVG icons), specialized avatar mode, and CGEForm integration. | [Overview](docs/CGEDropzone/README.md) • [Usage](docs/CGEDropzone/usage.md) • [Examples](docs/CGEDropzone/examples.md) • [API](docs/CGEDropzone/api.md) • [Blade](docs/CGEDropzone/laravel-blade.md) |
| **`CGEForm`** | Reactive AJAX form handler engineered for Laravel. Automated Laravel 422 JSON validation error rendering across nested/array fields, multipart file handling, method spoofing (PUT/PATCH/DELETE), multi-driver HTTP (Fetch / Axios), pluggable notification drivers (CGEToast, CGEAlert), and i18n error dictionary. | [Overview](docs/CGEForm/README.md) • [Usage](docs/CGEForm/usage.md) • [Examples](docs/CGEForm/examples.md) • [API](docs/CGEForm/api.md) • [Blade](docs/CGEForm/laravel-blade.md) |
| **`CGELightbox`** | Touch-capable media lightbox and gallery viewer. Multi-media support (images, HTML5 video, YouTube/Vimeo embeds, inline HTML templates), double-tap & wheel zoom/pan, thumbnail ribbons, horizontal swipe navigation, vertical flick to dismiss, and progressive preloading. | [Overview](docs/CGELightbox/README.md) • [Usage](docs/CGELightbox/usage.md) • [Examples](docs/CGELightbox/examples.md) • [API](docs/CGELightbox/api.md) • [Blade](docs/CGELightbox/laravel-blade.md) |
| **`CGEModal`** | Accessible modal dialog system with optional `tailwind-animations` integration and CSS fallbacks. Sizing presets, static backdrop shake feedback, focus trapping, Esc key dismissal, and stacked modal support. | [Overview](docs/CGEModal/README.md) • [Usage](docs/CGEModal/usage.md) • [Examples](docs/CGEModal/examples.md) • [API](docs/CGEModal/api.md) • [Blade](docs/CGEModal/laravel-blade.md) |
| **`CGESelect`** | Searchable select and multi-tag combobox. Seamlessly augments native `<select>` elements with debounce async remote querying, rich option rendering (images, SVG icons, badges), floating position calculation, and full WAI-ARIA combobox/listbox compliance. | [Overview](docs/CGESelect/README.md) • [Usage](docs/CGESelect/usage.md) • [Examples](docs/CGESelect/examples.md) • [API](docs/CGESelect/api.md) • [Blade](docs/CGESelect/laravel-blade.md) |
| **`CGETabs`** | Accessible tabbed interfaces and segmented controls. URL Hash & URL Query Param navigation persistence, AJAX / Blade partial lazy-loading with caching, animated sliding active indicator, headless theming, and automatic nested plugin re-binding. | [Overview](docs/CGETabs/README.md) • [Usage](docs/CGETabs/usage.md) • [Examples](docs/CGETabs/examples.md) • [API](docs/CGETabs/api.md) • [Blade](docs/CGETabs/laravel-blade.md) |
| **`CGEToast`** | Reactive toast and notification alert system. 8 floating positions plus full-width top/bottom banners, semantic variants (success, error, warning, info, neutral), progress bars with hover-pause, HTML interpolation, avatar/icon support, swipe-to-dismiss, and session flash message interception. | [Overview](docs/CGEToast/README.md) • [Usage](docs/CGEToast/usage.md) • [Examples](docs/CGEToast/examples.md) • [API](docs/CGEToast/api.md) • [Blade](docs/CGEToast/laravel-blade.md) |

---

## 📋 Requirements & Prerequisites

TailTools is engineered for modern web development environments with minimal dependencies:

### 1. Runtime & Environment Requirements
- **Node.js:** `v18.0.0+` or `v20.0.0+` (LTS recommended) for build tooling, test suites, and bundling.
- **Browser Compatibility:** All modern evergreen browsers (Chrome, Edge, Firefox, Safari) supporting:
  - ECMAScript 2022+ (Optional chaining `?.`, nullish coalescing `??`, class private fields).
  - DOM Standard APIs (`CustomEvent`, `MutationObserver`, `CSS Grid`, `TouchEvents`).
- **No Heavy Runtime UI Dependencies:** TailTools does **not** require React, Vue, jQuery, or Alpine.js. It runs on pure native JavaScript.

### 2. Styling Requirements (Tailwind CSS v4)
- **Tailwind CSS:** `^4.3.0` (TailTools utilizes Tailwind v4's CSS-first `@import "tailwindcss";` architecture).
- **Tailwind Animations (Optional / Recommended):** `tailwind-animations` (`^1.0.2`). Provides 79+ CSS-only animation utilities for smooth entry/exit dialog transitions. Automatically detected when `.has-tailwind-animations` is present on `<html>` or `window.__TAILWIND_ANIMATIONS__ = true`. TailTools includes CSS fallbacks when absent.

### 3. Laravel & Backend Integration
- **Laravel Framework:** Compatible with **Laravel 10.x** and **Laravel 11.x+**.
- **Laravel Vite Plugin:** Standard `@tailwindcss/vite` or Vite asset pipeline.
- **Laravel Contracts:**
  - Automated CSRF token handling (`<meta name="csrf-token">` or `@csrf` as `X-CSRF-TOKEN`; the `XSRF-TOKEN` cookie as `X-XSRF-TOKEN`).
  - TailTools ships JavaScript and CSS only. The `<x-cge-*>` examples in the docs are Blade components you create in your application; no Composer package is required.
  - Laravel RESTful method spoofing (`_method` parameter for `PUT`, `PATCH`, `DELETE`).
  - Laravel 422 JSON validation error response compatibility (e.g. from `FormRequest`).
  - Interception of Laravel session flash messages (e.g. `session('success')`, `session('error')`).

### 4. HTTP Client (For AJAX Features)
- **Native Fetch:** Standard `window.fetch` works out of the box with zero external dependencies. TailTools has no runtime npm dependencies.
- **Axios (Optional):** Supported as a pluggable HTTP driver for `CGEForm`, `CGEActionButton`, and remote `CGESelect` / `CGEDataTable` / `CGEDataGrid`. TailTools uses a configured `axiosInstance` first, then Laravel's `window.axios`; it never bundles axios.

---

## 🚀 Quick Start & Installation

### Step 1: Install Package

```bash
npm install tailtools
```

### Step 2: Configure Styles (Tailwind CSS v4)

In your main CSS file (e.g., `resources/css/app.css` in Laravel):

```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/styles";
```

> **Note:** `tailtools/styles` automatically imports all plugin CSS rules and declares the relative `@source` path so Tailwind v4 scans plugin markup classes during compilation.

### Step 3: Configure Scripts (Vite / ES Modules)

In your main JavaScript file (e.g., `resources/js/app.js`):

```javascript
// Zero-config: window globals, automatic initialization on DOM ready,
// and re-initialization after Livewire (commit / wire:navigate) and Turbo updates.
import 'tailtools/auto';

// Or side-effect-free: nothing runs until you call initTailTools().
import { initTailTools, destroyTailTools, CGEModal } from 'tailtools';
initTailTools();

// Or import specific plugins for tree-shaking:
import { CGEToast } from 'tailtools/plugins/CGEToast';
```

Re-running `initTailTools(container)` after injecting HTML is safe: existing instances are reused and instances whose elements were removed (Livewire morph, Turbo, `innerHTML`) are destroyed first. Call `destroyTailTools(container)` before removing a subtree yourself. `tailtools/auto` can be configured before import with `window.TailToolsConfig = { autoInit, livewire, turbo, globals }`.

---

## 💡 Practical Examples

### 1. Declarative Laravel Blade Form with CGEForm

```blade
<form 
    data-cge-form 
    data-cge-driver="fetch" 
    action="{{ route('profile.update') }}" 
    method="POST" 
    class="space-y-4 max-w-lg mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800"
>
    @csrf
    @method('PATCH')

    <div>
        <label for="name" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
        <input 
            type="text" 
            id="name" 
            name="name" 
            value="{{ old('name', $user->name) }}" 
            class="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
        <!-- Automated 422 error display -->
        <span data-cge-feedback="name" class="text-xs text-rose-500 mt-1 hidden"></span>
    </div>

    <button 
        type="submit" 
        class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
        <span>Save Changes</span>
    </button>
</form>
```

### 2. Declarative Action Button with Confirmation Modal

```blade
<button 
    type="button"
    data-cge-action="delete"
    data-cge-action-url="{{ route('posts.destroy', $post) }}"
    data-cge-action-method="DELETE"
    data-cge-action-confirm="true"
    data-cge-action-confirm-title="Delete Post?"
    data-cge-action-confirm-message="This action cannot be undone. Are you sure?"
    class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
>
    Delete Post
</button>
```

### 3. Programmatic JavaScript Toast & Alert

```javascript
import { CGEToast, CGEAlert } from 'tailtools';

// Trigger an interactive toast
CGEToast.success('Profile updated successfully!', {
    duration: 4000,
    position: 'top-right',
    dismissible: true
});

// Trigger a promise-based confirmation dialog
const confirmed = await CGEAlert.confirm({
    title: 'Discard Draft?',
    message: 'Any unsaved changes will be permanently lost.',
    confirmText: 'Discard',
    cancelText: 'Keep Editing',
    type: 'warning'
});

if (confirmed) {
    console.log('User confirmed discard');
}
```

---

## 📚 Complete Documentation Index

### Core Architecture & Guides
- 📘 [Installation & Setup Guide](docs/installing.md) — Comprehensive guide covering npm packaging, Laravel Vite, Tailwind CSS v4 `@source` configs, static UMD bundles, and security contracts.
- 🛠️ [Developer & Contribution Guide](docs/developing.md) — Plugin engineering guidelines, standard directory structures, class lifecycles, and testing practices.
- 🏷️ [Versioning Strategy & SemVer](docs/versioning.md) — Semantic versioning rules, release lifecycles, git tags, and maintenance history.
- 🎭 [Tailwind Animations Guide](docs/animate.md) — Integration details for `tailwind-animations`, CSS fallbacks, and utility classes.
- 🧪 [Regression & Test Suite](tests/README.md) — Node.js test harness, TypeScript strict checks (`NodeNext` / `Bundler`), and automated browser verification.
- 📊 [Audit Reports & Maintenance Logs](REPORTS.md) — Detailed records of audits, bug fixes, accessibility verifications, and architectural enhancements.
- 🤖 [AI Agent Guidelines](AGENTS.md) — Standardized rules for AI assistants, plan definitions, and plugin creator specifications.

### Per-Plugin Documentation Folders

```text
docs/
├── CGEAccordion/       # Accordion & collapsible panels
├── CGEActionButton/    # Declarative action button & confirm bridge
├── CGEAlert/           # Promise-based modal dialogs & alerts
├── CGEDataGrid/        # Reactive card grid & list engine
├── CGEDataTable/       # Modular data grid, filter, sort, pagination
├── CGEDrawer/          # Off-canvas sliding sidebar & navigation
├── CGEDropzone/        # Drag-and-drop file uploader & preview
├── CGEForm/            # AJAX form handler with Laravel 422 binding
├── CGELightbox/        # Touch media lightbox and gallery viewer
├── CGEModal/           # Accessible modal dialog system
├── CGESelect/          # Searchable combobox and multi-tag select
├── CGETabs/            # Tabbed navigation with URL persistence
└── CGEToast/           # Floating notifications and toast system
```

Each plugin folder contains dedicated markdown files:
- `README.md` — Plugin overview, key capabilities, and quickstart.
- `usage.md` — Complete configuration options, public methods, and event hooks.
- `examples.md` — Practical HTML, Tailwind CSS, and JavaScript implementation examples.
- `api.md` — Complete TypeScript interface declarations, parameter types, and event payloads.
- `laravel-blade.md` — Declarative Blade component templates and Laravel backend integration patterns.

---

## 🛠️ Development & Testing

TailTools provides a comprehensive testing and development workflow:

```powershell
# 1. Install dependencies
npm ci

# 2. Run unit tests & strict TypeScript type validations
npm test

# 3. Start local development server with interactive sandbox
npm run dev

# 4. Build library artifacts and preview demo
npm run build
npm run preview

# 5. Validate package archive and isolated imports
npm run test:package
```

---

## 📄 License

TailTools is open-source software licensed under the [MIT License](LICENSE).
