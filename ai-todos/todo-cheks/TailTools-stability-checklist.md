# TailTools stability fix checklist

Plan: [TailTools-stability-plan.md](../plans/TailTools-stability-plan.md)

- [x] Shared foundation: `plugins/shared/dom.js`, `plugins/shared/http.js`
- [x] Phase 1 — Security (S1–S7): text-first rendering in DataTable, Dropzone, Alert, Lightbox, Tabs, Toast, Select
- [x] Phase 2 — Critical behavior (B1–B5): Alert Enter, capture-phase confirmation gates, confirmed submits via `requestSubmit`, Dropzone instant mode, overlay pruning
- [x] Phase 3 — Laravel HTTP integration (H1–H8): CSRF everywhere, `X-XSRF-TOKEN` cookie, followed redirects, 419/422 messages, `axiosInstance` priority, per-field error targets
- [x] Phase 4 — Data collections: paginator adapters, `allValue`, Turkish search, column type sort, unified Filter/Sort/Pagination core
- [x] Phase 5 — Navigation: namespaced hash state, Back fallback, disabled classes, Collapse in accordions, morph rebuild
- [x] Phase 6 — Overlay robustness and accessibility: focus traps, z-index layers, non-modal drawers, reduced motion, ARIA
- [x] Phase 7 — Packaging and lifecycle: side-effect-free root, `tailtools/auto`, `destroyTailTools`, `destroyAll`, no runtime dependencies, library-only CSS
- [x] Phase 8 — Hygiene, docs and tests: legacy duplicates removed, docs/skills/api.md updated, new Node and browser regressions
- [x] Final verification: `npm test` (92/92 + strict types), `npm run build`, `npm run test:package`, browser regressions 168/168, ESM/UMD bundles in Chrome
