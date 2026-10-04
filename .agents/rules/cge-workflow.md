# CGE Plugin Creation Workflow Rules

Whenever the user requests a new plugin `X` (or an update to an existing plugin), agents MUST strictly execute the following sequential phases without skipping steps.

---

## Phase 1: Create Implementation Plan
- **Location:** `ai-todos/plans/CGE<X>-plan.md`
- **Contents:**
  - Plugin overview, goals, and scope.
  - API design (options, methods, events, data-attributes).
  - Tailwind v4 styling strategy and `tailwind-animations` integration.
  - Laravel Blade markup patterns.
  - Teardown & memory safety strategy (`destroy()`).

---

## Phase 2: Create Phase Checklist
- **Location:** `ai-todos/todo-cheks/CGE<X>-checklist.md`
- **Contents:**
  - Checkboxes for each phase: Planning, Code Creation, Typing, Styling, Testing, Documentation, Skills/Rules Generation.
  - As each milestone completes, the checklist file must be updated.

---

## Phase 3: Code Implementation
Create the plugin folder `plugins/CGE<X>/` containing:
1. `CGE<X>.js` - Native JS implementation with zero unnecessary bloat.
2. `CGE<X>.d.ts` - Comprehensive TypeScript declaration file.
3. `style.css` - Tailwind v4 compatible styles / CSS custom properties.
4. `index.js` - Barrel export for the plugin.

---

## Phase 4: Library Integration & Export
- Expose the plugin in the main library entry point `src/index.ts`.
- Register auto-initialization hook in `initTailTools()`.

---

## Phase 5: Testing (Mandatory)
*Rule: Always test at the end of creation!*
- Add an interactive test and showcase section in `index.html`.
- Test both programmatic initialization (`new CGE<X>()`) and declarative data attributes (`data-cge-*`).
- Verify keyboard accessibility (ESC key to dismiss, TAB focus trapping if modal, ARIA attributes).
- Verify Vite compilation and browser functionality without console errors.

---

## Phase 6: Comprehensive Documentation
Create the documentation suite inside `docs/CGE<X>/`:
1. `README.md` - Quickstart and feature overview.
2. `usage.md` - Complete options, methods, and event listeners.
3. `examples.md` - Practical code samples (Vanilla HTML, Tailwind v4 styling, Laravel Blade component).
4. `api.md` - Full API reference and type signatures.

*Rule: On any update to a plugin, its corresponding `docs/` files must be updated immediately.*

---

## Phase 7: Per-Plugin Skills & Rules Generation
For every plugin created:
1. Generate an AI skill in `.agents/skills/cge-<x>/SKILL.md` formatted to the open agent skills standard (compatible with Antigravity, Claude Code, Cursor, and Codex).
2. The skill must provide exact prompt triggers, HTML examples, Blade examples, and JS setup patterns for that specific plugin.
