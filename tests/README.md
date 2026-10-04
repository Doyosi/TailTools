# TailTools maintenance regression checks

Use `node tests/run-browser.mjs --serve --alert-ui --compact` for the compact CGEAlert visual checks. It captures 11 light/dark/mobile/desktop variants at 320, 390 and 1024 px, measures overflow and close-button overlap, and checks input validation, type-to-confirm, three actions, loading/custom colors, no-action footer and declarative cancel. Screenshots and measurements are saved to OS temp. `--bundle` also loads the generated CSS and verifies compact Alert rendering/confirmation in both ESM and UMD.

`npm test` runs Node request/API/documentation regressions, then strict TypeScript checks with NodeNext and Bundler. TypeScript is a development dependency.

Run `npm run dev` and open `/tests/regressions.html`, or use the demo link. Scenarios cover all thirteen primary plugins plus CGECollapse, awaited clear, async teardown, native reset, submitters, ARIA and stacked overlays. Collection scenarios additionally cover AJAX races, stable IDs, local pagination, confirmation dismissal, responsive cleanup and recreation. Requests are mocked; no real upload/delete or Laravel server is used. Each scenario reports PASS/FAIL.

For automated browser verification, use an available Playwright installation and Chrome:

```powershell
# Optional when Playwright is provided outside this checkout:
$env:TAILTOOLS_PLAYWRIGHT_MODULE = 'C:/path/to/node_modules/playwright'
npm run build
npm run test:package
node tests/run-browser.mjs --serve --demo --bundle
```

The runner starts a temporary Vite server on 127.0.0.1:5184 and launches Chrome with an isolated profile. It closes both at the end. `TAILTOOLS_TEST_URL` can select another URL/port; `TAILTOOLS_BROWSER_CHANNEL` can select another installed Chromium channel such as `msedge`. Without `--serve`, start the server yourself at the configured URL. The demo check blocks external media requests and checks initialization and uncaught JavaScript errors, rather than remote asset availability.

`--baseline` serves plugin JavaScript from Git HEAD to compare the same scenarios against the original code without modifying working files. Run this comparison before committing the fixes; after a commit HEAD refers to the corrected version. The comparison reports failures without using them as its process exit status.

Baseline comparison runs the original regression group and skips extended maintenance scenarios, whose newer cancellation contracts are not present in HEAD.

These checks do not certify screen reader behavior, all real touch gestures, every browser engine, or a live Laravel server.

--bundle loads generated ESM and UMD artifacts in Chrome and checks exports, declarative initialization and FormData. The runner serves UMD as JavaScript. npm run test:package checks the actual archive/declarations; its temporary archive remains in the OS temp directory for inspection.

Add `--grid-ui` to verify the Grid footer at 320, 390, 639, 640 and 1024 px, a real mobile page-jump click, overflow boundaries and reduced-motion loading. The runner saves desktop/mobile/loading screenshots in an OS temporary directory and prints its path. `--demo` also waits for the delayed Cloud Clusters AJAX demo and verifies its paginator metadata.


Navigation regressions in navigation-regressions.js cover raw and nested initialization, keyboard/inert access, state restoration, encoded URL/history state, AJAX cancellation/cache/retry and child-plugin teardown for CGETabs, CGEAccordion and CGECollapse. The demo runner also verifies their interactive showcases and exported companion class.

The demo navigation check captures Tabs/Accordion at 390 and 1024 px, verifies native Arrow/Home/End and Collapse Space keys, overflowing tab reachability, the delayed AJAX success/error/retry paths, reduced motion and destroy/recreation. Screenshot paths are printed and remain in OS temp.
