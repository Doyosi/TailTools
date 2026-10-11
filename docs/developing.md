# Developing TailTools

This guide details the architectural standards, directory structure, and contribution guidelines for building plugins inside **TailTools**.

---

## 1. Project Directory Structure

```text
TailTools/
├── .agents/
│   ├── rules/                 # Agent rules & guidelines (Universal)
│   └── skills/                # Agent Skills (SKILL.md for Antigravity, Claude, Codex, Cursor)
│       ├── cge-plugin-creator/
│       ├── cge-modal/
│       ├── cge-toast/
│       ├── cge-alert/
│       ├── cge-form/
│       ├── cge-drawer/
│       ├── cge-lightbox/
│       ├── cge-action-button/
│       ├── cge-select/
│       ├── cge-dropzone/
│       ├── cge-datatable/
│       ├── cge-datagrid/
│       ├── cge-tabs/
│       └── cge-accordion/
├── ai-todos/
│   ├── plans/                 # Architectural plans for each plugin
│   └── todo-cheks/            # Step-by-step progress & phase checklists
├── docs/                      # Central documentation
│   ├── installing.md
│   ├── versioning.md
│   ├── developing.md
│   └── CGE<X>/                # Per-plugin markdown documentation
│       ├── README.md
│       ├── usage.md
│       ├── examples.md
│       └── api.md
├── plugins/                   # All TailTools CGE plugins live here
│   └── CGE<X>/
│       ├── CGE<X>.js          # Native JS implementation
│       ├── CGE<X>.d.ts        # TypeScript declarations
│       ├── style.css          # Plugin CSS (Tailwind v4 compatible)
│       └── index.js           # Plugin barrel export
├── src/
│   ├── style.css              # Library Tailwind v4 CSS (scans plugins/ only)
│   ├── demo.css               # Demo/regression CSS (library + showcase markup)
│   ├── index.ts               # Side-effect-free library entry (initTailTools/destroyTailTools)
│   └── auto.ts                # Opt-in entry: globals, auto-init, Livewire/Turbo hooks
├── index.html                 # Interactive testbed & demo sandbox
├── package.json
├── vite.config.ts
└── AGENTS.md                  # Universal AI agent instructions
```

---

## 2. Core Engineering Principles

1. **Native JavaScript Core with TypeScript Types:**
   - Every plugin is authored in clean, modular native JavaScript (ES2022+) without heavy runtime dependencies.
   - Every plugin includes a comprehensive `.d.ts` file providing full autocomplete and type safety for TypeScript and IDE users.
2. **Tailwind CSS v4.3+ First:**
   - Styles rely on modern CSS and Tailwind v4 features (e.g. `@import "tailwindcss";`, `tailwind-animations`).
   - Plugins use CSS custom properties (variables) for themeability and Tailwind utility classes for styling.
3. **Laravel Blade & Vite Ready:**
   - Markup patterns must be straightforward to copy into Laravel Blade components.
   - Declarative data-attribute API (`data-cge-*`) ensures zero-JS or single-line JS initialization for Blade views.
4. **Lifecycle & Memory Safety:**
   - Instance plugins use destroy; static/promise APIs use their declared dismiss/close/clear operations. Cleanup cancels owned requests, scheduled work and listeners and releases DOM/scroll/focus ownership.

---

## 3. Standard CGE Plugin Architecture

Every plugin named `CGE<X>` follows this standard structure:

```javascript
/**
 * CGE<X> - TailTools Plugin
 * Native JavaScript plugin with Tailwind v4 & Laravel support.
 */
export class CGE<X> {
  /**
   * @param {string | HTMLElement} target
   * @param {Object} options
   */
  constructor(target, options = {}) {
    this.target = typeof target === 'string' ? document.querySelector(target) : target;
    this.options = { ...CGE<X>.defaults, ...options };
    this._isOpen = false;
    this._listeners = [];

    if (this.target) {
      this.init();
    }
  }

  static defaults = {
    // Default configuration options
  };

  init() {
    this._bindEvents();
    this._dispatch('init');
  }

  _bindEvents() {
    // Attach event listeners and record them in this._listeners for teardown
  }

  _dispatch(eventName, detail = {}) {
    const event = new CustomEvent(`cge:<name>:${eventName}`, {
      bubbles: true,
      cancelable: true,
      detail: { instance: this, ...detail }
    });
    this.target.dispatchEvent(event);
    return event;
  }

  destroy() {
    // 1. Remove all attached event listeners
    // 2. Clear timers or observers
    // 3. Remove injected DOM or cleanup attributes
    this._dispatch('destroy');
  }
}
```

---

## 4. Development Workflow

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```
2. **Interactive Testing:**
   - Open `index.html` in your browser.
   - Add a demo section for the plugin under development.
   - Test mouse, keyboard (accessibility / a11y), responsive sizing, and edge cases.
3. **Verify Build:**
   ```bash
   npm run build
   ```

## Maintenance regression checks (2026-10-04)

Run npm test for Node regressions and strict TypeScript checks. The existing demo links to /tests/regressions.html for programmatic/declarative, ARIA, serialization, stacking and teardown regressions. See [tests/README.md](../tests/README.md). TypeScript is a development dependency.

## Library and demo artifacts

- npm run build:lib cleans dist/, then vite.lib.config.ts builds the ESM entries dist/tailtools.js (side-effect free) and dist/auto.js, and vite.umd.config.ts builds dist/tailtools.umd.cjs from the auto entry. Both emit dist/tailtools.css.
- The package has no runtime dependencies; tailwindcss and tailwind-animations are optional peers.
- Shared internals: plugins/shared/dom.js (escaping, text-first rendering, instance teardown) and plugins/shared/http.js (Laravel CSRF, headers, errors, redirects). Every plugin exposes static destroyAll(root) and prunes detached instances in init().
- npm run build:demo uses vite.config.ts: the existing showcase and regression page in dist/demo/.
- npm run build runs both; npm run preview serves dist/demo/.
- npm run test:package packs/imports every plugin and checks declarations in isolation.
- node_modules/dist are ignored local generated directories. Recreate with npm ci and npm run build; package-lock.json remains tracked.

Canonical sources: .agents/skills/cge-*/SKILL.md, ai-todos/plans/CGE*-plan.md, ai-todos/todo-cheks/CGE*-checklist.md, docs/installing.md and this guide. Shared plugins/shared helpers coordinate ownership while retaining public classes and CSS designs.
