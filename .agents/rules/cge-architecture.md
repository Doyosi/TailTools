# CGE Architecture & Coding Rules

All plugins created in TailTools follow strict architectural conventions to ensure modularity, performance, and cross-framework compatibility between Tailwind CSS v4.3+ and Laravel.

---

## 1. Naming Conventions

- **Plugin Name:** Always prefixed with `CGE` + `<FeatureName>` in PascalCase (e.g., `CGETooltip`, `CGEModal`, `CGEAccordion`, `CGEToast`).
- **Directory Path:** `plugins/CGE<X>/`
- **File Names:**
  - `plugins/CGE<X>/CGE<X>.js` (Core native JavaScript)
  - `plugins/CGE<X>/CGE<X>.d.ts` (TypeScript type definitions)
  - `plugins/CGE<X>/style.css` (Tailwind v4 compatible styling)
  - `plugins/CGE<X>/index.js` (Export aggregator)
- **Data Attributes:** Declarative HTML configuration uses `data-cge-<feature>` (e.g., `data-cge-tooltip="Settings"`, `data-cge-placement="top"`).
- **Custom Events:** Prefixed with `cge:<feature>:<action>` (e.g., `cge:tooltip:show`, `cge:modal:open`, `cge:modal:close`).

---

## 2. Technology Stack & Dependencies

- **Language:** Clean, modern Native JavaScript (ES2022+).
- **TypeScript Support:** Every plugin must provide a `.d.ts` file declaring all constructor options, instance methods, and events.
- **Dependencies:** Aim for zero external runtime dependencies wherever possible. When wrapping an industry-standard library (e.g., Tippy.js, Axios), encapsulate it cleanly within the CGE wrapper class.
- **Styling:** Tailwind CSS v4.3+ compatible. Utilize Tailwind utility classes, CSS custom variables, and `tailwind-animations` where appropriate.

---

## 3. Dual Ecosystem Requirements

### A. Tailwind CSS v4.3+
- Provide standard Tailwind utility class examples in docs and tests.
- Support animation classes from `tailwind-animations` (e.g., `animate-fade-in`, `animate-slide-down`).
- Any custom CSS must use standard CSS properties or `@utility` definitions compatible with Tailwind v4.

### B. Laravel & Blade Compatibility
- Provide ready-to-paste Laravel Blade component examples.
- Support auto-initialization via data attributes so Laravel developers do not have to write custom JavaScript for every view.
- Provide clean integration examples for Laravel Vite (`resources/js/app.js` and `resources/css/app.css`).

---

## 4. Required Plugin Lifecycle Methods

Every CGE plugin class must implement:
1. `constructor(target, options)` - Parses target and merges defaults.
2. `init()` - Attaches listeners, sets ARIA attributes, prepares DOM.
3. `open()` / `show()` or primary action method.
4. `close()` / `hide()` or secondary action method.
5. `destroy()` - Completely cleans up DOM nodes, removes all bound event listeners, and clears timeouts.
6. `_dispatch(eventName, detail)` - Dispatches custom DOM events for lifecycle hooks.
