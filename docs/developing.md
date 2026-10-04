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
│       └── cge-dropzone/
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
│   ├── style.css              # Main development Tailwind v4 CSS
│   └── index.ts               # Core library entry point
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
   - Every plugin must expose a `destroy()` method that removes event listeners, tears down observers, and restores DOM nodes.

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
