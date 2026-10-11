# CGEDrawer Execution Checklist

Track the progress of designing, implementing, testing, and documenting the **CGEDrawer** plugin.

---

- [x] **Phase 1: Planning and Architecture design**
  - [x] Defined 4-direction placements (`left`, `right`, `top`, `bottom`)
  - [x] Defined sizing presets (`sm`, `md`, `lg`, `xl`, `full`) and bottom-sheet capabilities
  - [x] Defined dual animation engine (`tailwind-animations` and fallback CSS transitions)
  - [x] Outlined static directional bounce nudge feedback
  - [x] Specified touch swipe-to-dismiss gesture handling
  - [x] Specified push mode and mini-rail mode
  - [x] Created `ai-todos/plans/plan-CGEDrawer.md` and `ai-todos/plans/CGEDrawer-plan.md`

- [x] **Phase 2: Native JavaScript implementation (`plugins/CGEDrawer/CGEDrawer.js`)**
  - [x] Core class structure with static registry and static shortcut methods
  - [x] Placement management and dynamic position class application
  - [x] Backdrop handling (modal, non-modal `backdrop: false`, static mode with directional bounce)
  - [x] Touch gesture recognition and swipe-to-dismiss tracking
  - [x] Layout push mode implementation (`pushContentSelector`)
  - [x] Mini collapsed rail mode toggle (`mini: true`)
  - [x] Accessibility: focus trapping, body scroll lock, Escape key, ARIA
  - [x] Global event delegation (`[data-cge-drawer-target]`, `[data-cge-drawer-close]`, `[data-cge-drawer-toggle]`)
  - [x] i18n translation dictionary and overrides

- [x] **Phase 3: TypeScript definitions (`plugins/CGEDrawer/CGEDrawer.d.ts`)**
  - [x] Options interface with placement, size, driver, swipe, push, and mini options
  - [x] Instance methods, static registry methods, and event payload types

- [x] **Phase 4: Tailwind v4 stylesheet (`plugins/CGEDrawer/style.css`)**
  - [x] Fallback transition utilities and directional bounce keyframes
  - [x] Z-index layering, backdrop styling, and mini dock rail styling

- [x] **Phase 5: Plugin barrel export (`plugins/CGEDrawer/index.js`)**
  - [x] Export `CGEDrawer` class and helpers

- [x] **Phase 6: Main entry integration (`src/index.ts` & `src/style.css`)**
  - [x] Export `CGEDrawer` in `src/index.ts`
  - [x] Add auto-initialization in `initTailTools()` and global `window.TailTools`
  - [x] Import `plugins/CGEDrawer/style.css` in `src/style.css`

- [x] **Phase 7: Interactive test in `index.html` and validation**
  - [x] Add CGEDrawer tab in `index.html`
  - [x] 4-direction interactive showcase (Left navigation, Right cart/inspect, Top banner/alert, Bottom sheet)
  - [x] Static bounce nudge demo (`backdropClose: false`)
  - [x] Non-modal panel demo (`backdrop: false`)
  - [x] Layout push mode test
  - [x] Declarative Blade triggers demo
  - [x] Strictly ensure `rounded-sm` is used for all UI components and buttons

- [x] **Phase 8: Documentation in `docs/CGEDrawer/`**
  - [x] `README.md` (overview, placements, quickstart)
  - [x] `usage.md` (complete options, methods, gestures)
  - [x] `laravel-blade.md` (Blade component examples)
  - [x] `examples.md` (code recipes for common patterns)
  - [x] `api.md` (TypeScript interfaces and DOM events)
  - [x] Update `docs/installation.md`, `docs/installing.md`, `docs/versioning.md`, `docs/development.md`, `docs/developing.md`

- [x] **Phase 9: AI skill creation in `.agents/skills/`**
  - [x] `.agents/skills/cge-drawer/SKILL.md`
  - [x] `.agents/skills/cge-drawer-skill.md`

## 2026-10-04 ek bakım
- [x] Kapsam ve mevcut sözleşme incelemesi
- [x] Runtime ve declaration düzenlemesi
- [x] Regresyon ve paket doğrulaması
- [x] Doküman ve skill eşitlemesi

## Stability fixes (October 2026)

- [x] Missing target throws; selectors no longer rewritten to `#.foo`; declarative missing targets warn only.
- [x] `cge:drawer:open`/`close` cancel honored; DOM events typed in `.d.ts`.
- [x] Non-modal drawers stay off the overlay stack (no focus stealing, no aria-modal, Escape only without modal overlays).
- [x] Mini rail: no aria-hidden/aria-modal when collapsed; closedClass not re-added after tailwind-animations close.
- [x] Full focus trap; reduced motion (0 ms, no bounce).
- [x] `destroyAll(root)`; `init(root)` prunes detached instances.
- [x] `.d.ts`, `docs/CGEDrawer/` (README, usage, examples, api) and skill updated
- [x] Node tests (`tests/overlay-fixes.test.mjs`) and browser scenarios (`tests/stability-overlay-regressions.js`) added
- [ ] Full browser regression run (`tests/run-browser.mjs`) by the release owner
