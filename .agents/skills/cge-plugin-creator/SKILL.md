---
name: cge-plugin-creator
description: Standardized engineering workflow to design, implement, test, and document TailTools CGE plugins with dual Laravel and Tailwind CSS v4 support, including generating consumer AI skills.
---

# CGE Plugin Creator Skill

Use this skill whenever creating a new plugin or extending an existing plugin in the `TailTools` repository. This skill guarantees adherence to the strict TailTools engineering standard.

---

## Trigger Scenarios
Activate this workflow when the user requests:
- *"Create a [Name] plugin"*
- *"Add CGE[Name] plugin"*
- *"Build a new UI tool for TailTools"*

---

## Standard Execution Checklist

When executing this skill, complete every step in sequence:

### Step 1: Normalize Naming
1. Identify the plugin concept `X` (e.g., `Tooltip`, `Modal`, `Accordion`, `Toast`, `Dropdown`).
2. Format the class and folder name as `CGE` + `PascalCase(X)` -> `CGE<X>` (e.g., `CGETooltip`).
3. Set the directory path: `plugins/CGE<X>/`.
4. Set the documentation path: `docs/CGE<X>/`.
5. Set the plan path: `ai-todos/plans/CGE<X>-plan.md`.
6. Set the checklist path: `ai-todos/todo-cheks/CGE<X>-checklist.md`.
7. Set the skill path: `.agents/skills/cge-<x>/SKILL.md`.

---

### Step 2: Create Implementation Plan
Write `ai-todos/plans/CGE<X>-plan.md` specifying:
- **Component Purpose:** What problem it solves and user interactions.
- **API Spec:**
  - Options: Props, configurations, default values.
  - Public Methods: `init()`, `open()`/`show()`, `close()`/`hide()`, `toggle()`, `destroy()`, `update()`.
  - Events: Custom events dispatched (e.g., `cge:<x>:show`, `cge:<x>:hidden`).
  - Data Attributes: `data-cge-<x>`, `data-cge-target`, `data-cge-options`.
- **Tailwind CSS v4 & Animations:** Classes utilized, transitions, `tailwind-animations` classes.
- **Laravel Blade Compatibility:** Example markup for Blade templates.

---

### Step 3: Create Phase Checklist
Write `ai-todos/todo-cheks/CGE<X>-checklist.md` with:
- [ ] Phase 1: Planning and Architecture design
- [ ] Phase 2: Native JavaScript implementation (`plugins/CGE<X>/CGE<X>.js`)
- [ ] Phase 3: TypeScript definitions (`plugins/CGE<X>/CGE<X>.d.ts`)
- [ ] Phase 4: Tailwind v4 stylesheet (`plugins/CGE<X>/style.css`)
- [ ] Phase 5: Plugin barrel export (`plugins/CGE<X>/index.js`)
- [ ] Phase 6: Main entry integration (`src/index.ts`)
- [ ] Phase 7: Interactive test in `index.html` and validation
- [ ] Phase 8: Documentation in `docs/CGE<X>/` (README, usage, examples, api)
- [ ] Phase 9: AI skill creation in `.agents/skills/cge-<x>/SKILL.md`

Update checkboxes as each phase is completed!

---

### Step 4: Implement Plugin Files
Inside `plugins/CGE<X>/`:

1. **`CGE<X>.js`**:
   - Modern, lightweight Native JavaScript (ES2022+).
   - Clean class structure with constructor, defaults, init, handlers, and `destroy()`.
   - Complete cleanup in `destroy()` to prevent memory leaks.
2. **`CGE<X>.d.ts`**:
   - Complete TypeScript typings for options, methods, and event signatures.
3. **`style.css`**:
   - CSS variables and Tailwind CSS v4 `@utility` / classes.
4. **`index.js`**:
   - Barrel export exporting `CGE<X>` and any helper functions.

---

### Step 5: Integrate into TailTools Library
In `src/index.ts`:
- Export the new plugin:
  ```ts
  export { CGE<X> } from '../plugins/CGE<X>'
  ```
- Add auto-initialization handling to `initTailTools()`.

---

### Step 6: Interactive Testing (Mandatory)
*Rule: Never complete a plugin without testing!*
1. Add an interactive demonstration section to `index.html`.
2. Include both:
   - Declarative data attribute markup (`<button data-cge-<x>="...">`)
   - Programmatic JS instantiation (`new CGE<X>('#elem', { ... })`)
3. Verify the Vite server runs smoothly and interactions work without console errors.

---

### Step 7: Create Full Documentation Suite
In `docs/CGE<X>/`:
- `README.md`: Overview, quick start, installation.
- `usage.md`: Comprehensive options table, methods, events.
- `examples.md`: Tailwind v4 samples, Laravel Blade examples, Alpine.js interoperability.
- `api.md`: Full TypeScript interfaces, DOM event contracts.

---

### Step 8: Generate AI Consumer Skill
Create `.agents/skills/cge-<x>/SKILL.md` adhering to the open skills standard:
```markdown
---
name: cge-<x>
description: Use and configure the TailTools CGE<X> plugin for Tailwind CSS v4 and Laravel Blade.
---

# CGE<X> Skill
...
```
This skill enables Antigravity, Claude Code, Cursor, and Codex to instantly generate accurate code using the new plugin.


## Maintenance of existing plugins

Append a scoped maintenance phase to the canonical plan/checklist before editing. Preserve the plugin's actual instance/static/promise API and visual defaults; do not impose all sample lifecycle names on existing plugins. Include index.d.ts barrel declarations, strict NodeNext/Bundler checks, affected browser regressions, and docs/skills updates. Canonical docs are installing.md/developing.md; legacy skill and tracking paths are compatibility links, not independent copies. Package checks use npm run build and npm run test:package. Never commit node_modules or dist; npm pack derives artifacts from the build.
