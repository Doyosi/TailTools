# TailTools maintenance regression checks

`npm test` runs Node request/API/documentation regressions, then strict TypeScript checks with NodeNext and Bundler. TypeScript is a development dependency.

Run `npm run dev` and open `/tests/regressions.html`, or use the demo link. Scenarios cover all nine plugins, awaited clear, async teardown, native reset, submitters, ARIA and stacked overlays. Requests are mocked; no real upload/delete or Laravel server is used. Each scenario reports PASS/FAIL.

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
