# TailTools stability and Laravel-compatibility fix plan

**Date:** 11 October 2026
**Source:** Full review of all 13 plugins, shared helpers and packaging (see REPORTS.md).
**Context:** The package is not published yet, so contract fixes that change unsafe defaults are allowed when they are documented.

## Shared foundation (done first)

- `plugins/shared/dom.js` — `escapeHTML`, `setContent(el, value, allowHTML)`, `prefersReducedMotion()`, `destroyInstances(map, root)`, `pruneInstances(map)`.
- `plugins/shared/http.js` — `csrfHeaders(form)` (meta → `_token` → `window.csrfToken` → cookie as `X-XSRF-TOKEN`), `laravelHeaders()`, `resolveAxios(instance)` (configured instance first), `nestParams()`, `appendQuery()` (arrays as `key[]`), `HttpError` (status + Laravel `{message, errors}`), `parseBody()`, `firstFieldError()`, `errorMessage()`, `wasRedirected()`.
- Every plugin gains `static destroyAll(root = document)` that destroys instances whose element is inside `root` or disconnected (Livewire/Turbo teardown).

## Phase 1 — Security (XSS): text by default, HTML by explicit opt-in

| ID | Plugin | Fix |
|---|---|---|
| S1 | CGEDataTable / CGEDataGrid | Raw values without a formatter/renderer render as text; formatter/renderer output stays trusted developer HTML and `escapeHTML` is exported for interpolating values inside it. |
| S2 | CGEDropzone | File name, extension, error text and existing-file names rendered as text. |
| S3 | CGEAlert | `title`, `message`, `requireInput`, placeholders, input values and select options escaped; only `html` and `icon` are HTML. |
| S4 | CGELightbox | `caption`/`description`/title as text (opt-in `captionHtml`); image `src`/thumb built with DOM APIs. |
| S5 | CGETabs | AJAX JSON without a string `html` is an error; optional `sanitize(html)` hook. |
| S6 | CGEToast | `title` and `message` are text by default (programmatic and `data-cge-*`); HTML requires `html: true` / `data-cge-html`. Server messages from CGEForm/CGEActionButton therefore render as text. |
| S7 | CGESelect | Remote `icon` rendered as text/class only; option labels escaped. |

## Phase 2 — Critical behavior

| ID | Plugin | Fix |
|---|---|---|
| B1 | CGEAlert | Enter confirms only from the input or confirm button and ignores `e.repeat`. |
| B2 | CGEActionButton | Confirmed form submit uses `submitConfirmedForm` (fires `submit`, keeps submitter). |
| B3 | CGEActionButton / CGEAlert | Delegated click listener in capture phase with `stopImmediatePropagation`; inline `onclick` is not executed twice. |
| B4 | CGEDropzone | `instant` mode no longer fills the native `file[]` input; server IDs go into hidden inputs. |
| B5 | shared/overlay.js | Disconnected stack/lock entries are pruned; body scroll lock always recovers. |

## Phase 3 — Laravel HTTP integration

| ID | Plugin | Fix |
|---|---|---|
| H1 | CGESelect, collections | POST requests send CSRF headers. |
| H2 | CGEActionButton | Cookie token sent as `X-XSRF-TOKEN`, never as `X-CSRF-TOKEN`. |
| H3 | CGEForm, CGEActionButton | Followed redirects navigate to the final URL. |
| H4 | CGEDropzone | 422/419 messages shown on the card (`errors[paramName]`, `message`). |
| H5 | CGEForm, CGEDropzone | Configured `axiosInstance` wins over `window.axios`. |
| H6 | CGEForm | Error targets resolved per field; shared parents keep one feedback element per key. |
| H7 | collections | Nested JSON bodies, `key[]` arrays in query strings. |
| H8 | CGEActionButton | `<a href>` navigates unless `data-cge-ajax`; `_isRedirecting` resets; `{success:true}` does not toast "true". |

## Phase 4 — Data collections

Paginator adapter (`meta.*`, `simplePaginate`, `last_page`), `setMetrics({lastPage})`, configurable `allValue` for "All", per-element debounce, Turkish locale search, single-type column sort with `DD.MM.YYYY`, Grid date detection, Grid `'all'` filter, initial select values, page-safe fallback IDs, Grid search ignores internal fields, shared Filter/Sort/Pagination core, unified Grid `fetch()` error behavior, `CGEResponsive` breakpoint.

## Phase 5 — Navigation

Namespaced Tabs hash state and parent activation for nested deep links, Back restores initial tab, disabled classes removed on re-enable, Collapse inside accordion bodies initialized, single Collapse event dispatch, nested buttons in accordion triggers do not toggle, modifier keys ignored, panel plugin init without globals, consistent `get()`.

## Phase 6 — Overlay robustness and accessibility

Alert loading blocks dismissal, Lightbox concurrent-open guard, overlay portal z-index, non-modal drawers outside the stack, Drawer mini-mode ARIA/classes, full focus traps, missing-target errors, Alert per-instance translations and `alertdialog` ARIA, Lightbox key handling in inputs and button labels, reduced motion, Toast early dismiss, `.d.ts` event declarations, cancelable Drawer events.

## Phase 7 — Packaging and lifecycle

Side-effect-free root entry, `tailtools/auto` (globals + auto init + Livewire/Turbo hooks), no production `console.log`, `destroyTailTools(root)`, dependency cleanup (`tippy.js`/`axios` removed, Tailwind peer), demo classes removed from library CSS, CSS layers, minified ESM.

## Phase 8 — Hygiene, docs and tests

Legacy duplicate tracking/skill/doc stubs removed, docs/skills/api.md updated per plugin, Node regression tests for every verified bug, full browser regression run.
