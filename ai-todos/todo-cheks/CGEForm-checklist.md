# CGEForm Phase Checklist

Tracking the end-to-end design, implementation, testing, and documentation of `CGEForm`.

- [x] Phase 1: Planning and Architecture design (`ai-todos/plans/plan-CGEForm.md`)
- [x] Phase 2: Native JavaScript implementation (`plugins/CGEForm/CGEForm.js`)
  - [x] Multi-driver HTTP engine (Axios default with auto-fallback to Fetch, XHR)
  - [x] Laravel 422 JSON validation error binding with array & dot-notation resolver
  - [x] Pluggable response notification bridge (CGEToast, CGEAlert, native, SweetAlert2, custom, none)
  - [x] Hierarchy search & dynamic feedback container discovery
  - [x] HTML-aware i18n localization engine with placeholder interpolation
  - [x] State memory guard preserving pre-disabled/readonly inputs
  - [x] Dual event dispatching (instance API `.on()` + DOM CustomEvents)
  - [x] Declarative `CGEForm.init(root)` and static registry
- [x] Phase 3: TypeScript definitions (`plugins/CGEForm/CGEForm.d.ts`)
- [x] Phase 4: Tailwind v4 stylesheet (`plugins/CGEForm/style.css`)
- [x] Phase 5: Plugin barrel export (`plugins/CGEForm/index.js`)
- [x] Phase 6: Library integration
  - [x] Update `src/index.ts`
  - [x] Update `src/style.css`
- [x] Phase 7: Comprehensive Documentation Suite (`docs/CGEForm/`)
  - [x] `docs/CGEForm/README.md`
  - [x] `docs/CGEForm/usage.md`
  - [x] `docs/CGEForm/laravel-blade.md`
  - [x] `docs/CGEForm/examples.md`
  - [x] `docs/CGEForm/api.md`
  - [x] Update `docs/installation.md` & `docs/installing.md`
  - [x] Update `docs/versioning.md`
  - [x] Update `docs/development.md` & `docs/developing.md`
- [x] Phase 8: AI consumer skills
  - [x] `.agents/skills/cge-form/SKILL.md`
  - [x] `.agents/skills/cge-form-skill.md`
- [x] Phase 9: Interactive Showcase & Verification
  - [x] Add CGEForm tab & interactive showcase in `index.html`
  - [x] Test simulated 422 validation with array inputs (`choices[]`, `choices2[a]`)
  - [x] Test pre-disabled field retention after submission error
  - [x] Test notification driver switcher (Toast, Alert, Native, SweetAlert2)
  - [x] Test i18n dynamic localization overrides
  - [x] Browser testing and console error check

## Maintenance audit — 2026-10-04
- [x] Read AGENTS.md, rules, skills and existing implementation.
- [x] Define compatible maintenance scope in plan.
- [x] Apply fixes and synchronize docs/types/skills as applicable.
- [x] Verify regressions in programmatic and declarative use; build demo.
- [x] Record results and remaining limitations in REPORTS.md.

## 2026-10-04 ek bakım
- [x] Kapsam ve mevcut sözleşme incelemesi
- [x] Runtime ve declaration düzenlemesi
- [x] Regresyon ve paket doğrulaması
- [x] Doküman ve skill eşitlemesi

## Stability fixes (October 2026)

- [x] Shared Laravel CSRF/axios helpers
- [x] Followed redirect navigation (`followRedirects`)
- [x] 419 `csrf-expired` feedback
- [x] Per-key feedback for shared parents; independent clearing
- [x] Nested/array error keys
- [x] Invalid proxy (CGESelect trigger / `data-cge-error-target`)
- [x] `aria-describedby` restored
- [x] Spinner on `event.submitter`; frozen during `redirectDelay`
- [x] `destroyAll(root)` + init pruning
- [x] Docs, api.md, skill, Node + browser regressions
