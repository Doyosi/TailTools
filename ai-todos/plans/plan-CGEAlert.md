# Architectural Plan: CGEAlert Plugin

## 1. Executive Summary
`CGEAlert` is a lightweight, promise-based native JavaScript alert, confirmation, and dialog system engineered for **Tailwind CSS v4.3+** and **Laravel Blade** applications. It serves as a modern, zero-dependency alternative to SweetAlert2, tailored directly for Tailwind v4 aesthetics, full TypeScript type safety, and seamless Laravel Blade form submission interception.

---

## 2. Core Architecture & Design Decisions

### 2.1 Promise-Based Execution Model
Every call (`CGEAlert.fire()`, `CGEAlert.confirm()`, `CGEAlert.delete()`, etc.) creates or reuses a single active alert instance and returns a `Promise<CGEAlertResult>` resolving to:
```typescript
{
  isConfirmed: boolean;
  isDenied: boolean;
  isDismissed: boolean;
  dismissReason?: 'backdrop' | 'cancel' | 'close' | 'esc';
  value?: any;
}
```

### 2.2 Singleton Container & Portal Isolation
- Alerts mount into a single dynamically created container attached directly to `document.body` (`#cge-alert-portal`).
- Container maintains `z-[99999]` with fixed inset-0 overlay.
- Backdrops are styled with `bg-slate-950/80 backdrop-blur-sm`.
- Scrolling is locked on `document.body` while the dialog is active, compensating for scrollbar width.

### 2.3 Preset Archetypes
1. **`alert` / `info` / `success` / `warning` / `error`**:
   - Single primary acknowledge button ("OK" / "Understood").
   - Archetype-specific SVG icons (Emerald check, Rose alert-octagon, Amber triangle, Sky info circle).
2. **`confirm`**:
   - Dual buttons: Confirm (Brand/Indigo) + Cancel (Slate).
   - Question badge icon.
3. **`delete`**:
   - Destructive styling: Crimson/Rose-600 confirm button, warning icon, default label "Delete".
4. **`restore`**:
   - Recovery styling: Emerald-600 confirm button, counter-clockwise restore arrow icon, label "Restore".
5. **`prompt`**:
   - Renders an input field (`text`, `textarea`, `email`, `password`, `select`, `number`) with placeholder, default value, and asynchronous validator callback (`inputValidator`).
6. **`type-to-confirm` (High Security)**:
   - Activated via `requireInput: "CONFIRM"` or arbitrary phrase.
   - Confirm button remains disabled until the input exactly matches the required phrase.

### 2.4 Dual Animation Driver Support
- **`tailwind-animations`**: Uses `animate-zoom-in` / `animate-zoom-out` for the dialog and `animate-fade-in` / `animate-fade-out` for the backdrop.
- **Fallback Mode**: Pure Tailwind CSS v4 transition classes (`opacity-0 scale-95 -> opacity-100 scale-100`).
- **Static Backdrop Shake**: When `backdropClose: false` and the backdrop is clicked, triggers `animate-shake` and an injected fallback keyframe vibration effect.

### 2.5 Laravel Blade & Form Interception
- Global delegated listener scans for `[data-cge-alert]`.
- If attached to a `<form>` submit button or `<a href="...">`, it intercepts the default event, prompts the user via `CGEAlert`, and upon confirmation programmatically re-triggers the form submission or navigation.

### 2.6 Internationalization (i18n)
- Built-in fallback dictionary for buttons, inputs, and helpers.
- Allows per-instance overrides (`options.translations`) or global customization (`CGEAlert.setTranslations(...)`).

---

## 3. File Breakdown

1. `plugins/CGEAlert/CGEAlert.js`: Core ES2022 implementation.
2. `plugins/CGEAlert/CGEAlert.d.ts`: Full TypeScript signatures and interfaces.
3. `plugins/CGEAlert/style.css`: Tailwind v4 portal, shake animation, and card styles.
4. `plugins/CGEAlert/index.js`: Barrel export.
5. `src/index.ts`: Library entry export, `initTailTools()` integration, window binding.
6. `src/style.css`: Import `plugins/CGEAlert/style.css`.
7. `index.html`: Interactive testbed tab & showcase.
8. `docs/CGEAlert/`: Comprehensive documentation suite (`README.md`, `usage.md`, `laravel-blade.md`, `examples.md`, `api.md`).
9. `.agents/skills/cge-alert-skill.md` & `.agents/skills/cge-alert/SKILL.md`: Consumer AI skills.
