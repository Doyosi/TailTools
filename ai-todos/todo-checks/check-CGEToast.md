# CGEToast Development Phase Checklist

Track the execution and verification phases for the `CGEToast` plugin.

---

- [x] **Phase 1: Planning and Architecture design**
  - [x] Defined global singleton portal container architecture with `z-[99999]`.
  - [x] Specified 8 floating positions + 2 full-width edge-to-edge banner modes (`top-full`, `bottom-full`).
  - [x] Formulated semantic variants (`success`, `error`, `warning`, `info`, `neutral`).
  - [x] Designed animated countdown progress bar, hover-pause, and swipe-to-dismiss.
  - [x] Created `ai-todos/plans/plan-CGEToast.md` and `ai-todos/plans/CGEToast-plan.md`.

- [x] **Phase 2: Native JavaScript implementation (`plugins/CGEToast/CGEToast.js`)**
  - [x] Core class structure with constructor, defaults, and option merging.
  - [x] Lazy portal container creation & multi-position manager.
  - [x] Semantic variants styling, default SVG icons, custom image/avatar slots.
  - [x] Animated progress bar countdown with hover-pause and resume.
  - [x] Mobile touch swipe-to-dismiss gesture handling.
  - [x] Stacking limits (`maxToasts`) and queue handling.
  - [x] Action buttons with interactive callback bindings.
  - [x] Static helper methods (`success`, `error`, `warning`, `info`, `show`, `dismissAll`, `setTranslations`).
  - [x] Custom events (`cge:toast:open`, `cge:toast:close`, `cge:toast:click`).
  - [x] Declarative triggers auto-init (`[data-cge-toast]`, `[data-cge-toast-flash]`).

- [x] **Phase 3: TypeScript definitions (`plugins/CGEToast/CGEToast.d.ts`)**
  - [x] `CGEToastOptions`, `CGEToastPosition`, `CGEToastVariant`, `CGEToastAction`, `CGEToastTranslations`.
  - [x] Full class declarations and static method signatures.
  - [x] Custom event types.

- [x] **Phase 4: Tailwind v4 stylesheet (`plugins/CGEToast/style.css`)**
  - [x] Portal positioning classes (`top-right`, `bottom-full`, etc.).
  - [x] Progress bar keyframe & animation utilities.
  - [x] Full-width banner styles.

- [x] **Phase 5: Plugin barrel export (`plugins/CGEToast/index.js`)**
  - [x] Export `CGEToast` and helper functions.

- [x] **Phase 6: Main entry integration (`src/index.ts`)**
  - [x] Re-export `CGEToast` in `src/index.ts`.
  - [x] Register auto-initialization in `initTailTools()`.

- [x] **Phase 7: Interactive test in `index.html` and validation**
  - [x] Floating positions test array.
  - [x] Full-width `top-full` and `bottom-full` banner tests.
  - [x] Progress bar timer with hover-to-pause demo.
  - [x] Custom avatar & Undo action demo.
  - [x] Language switcher test.

- [x] **Phase 8: Documentation in `docs/CGEToast/` and root docs**
  - [x] `docs/CGEToast/README.md`
  - [x] `docs/CGEToast/usage.md`
  - [x] `docs/CGEToast/laravel-blade.md`
  - [x] `docs/CGEToast/examples.md`
  - [x] `docs/CGEToast/api.md`
  - [x] Update `docs/installation.md`, `docs/developing.md`, `docs/versioning.md`.

- [x] **Phase 9: AI skill creation**
  - [x] `.agents/skills/cge-toast-skill.md`
  - [x] `.agents/skills/cge-toast/SKILL.md`
