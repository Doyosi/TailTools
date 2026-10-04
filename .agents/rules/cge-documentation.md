# CGE Documentation Standards & Maintenance Rules

Documentation in TailTools is treated as a first-class deliverable alongside the code. 

---

## 1. Golden Rule of Documentation
> **Whenever any plugin is created or updated, its corresponding documentation files in `docs/CGE<X>/` MUST be created or updated immediately in the same session.** Out-of-date documentation is considered a critical bug.

---

## 2. Directory Layout for Plugin Documentation

For every plugin `CGE<X>`, create:
```text
docs/CGE<X>/
├── README.md       # Quickstart, installation, and visual overview
├── usage.md        # Detailed configuration, options table, methods, events
├── examples.md     # Real-world HTML/Tailwind v4 and Laravel Blade code samples
└── api.md          # Complete TypeScript types, parameter definitions, and return types
```

---

## 3. Required Content in Every Plugin Doc

### `README.md`
- 1-2 sentence description of what the plugin does.
- Quick install & import example.
- Minimal working example (both JS and data-attribute).

### `usage.md`
- **Options Table**: Option name, Type, Default value, Description.
- **Methods**: Function signatures, parameters, and return types.
- **Events**: Custom event names (`cge:<plugin>:<event>`), `detail` payload, and listener examples.

### `examples.md`
- **Tailwind CSS v4 Example**: Showing utility classes and `tailwind-animations`.
- **Laravel Blade Component Example**: Ready-to-copy `<x-cge-...>` or Blade template snippet with data attributes.
- **Dynamic / Programmatic Example**: Initializing via JavaScript with dynamic options.

### `api.md`
- Full TypeScript interface definitions.
- Lifecycle event contracts.
- DOM requirements and ARIA attributes used.

---

## 4. Root Documentation Synchronicity
If a plugin alters general installation or build procedures:
- Update [docs/installing.md](../../docs/installing.md).
- Update [docs/developing.md](../../docs/developing.md).
- Note changes for future release in [docs/versioning.md](../../docs/versioning.md).
