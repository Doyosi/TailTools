# Installing TailTools

This checkout builds a private local `tailtools@0.0.0` package. `private: true` prevents accidental npm publication. The archive and imports are tested locally; no registry/CDN release is claimed.

## Local build and installation

```powershell
npm ci
npm test
npm run build
npm run test:package
npm pack
# From a consumer application:
npm install /path/to/tailtools-0.0.0.tgz
```

`npm pack` rebuilds the library through prepack. The archive includes ESM/UMD output, styles, plugin source/barrels/declarations and docs. Demo output, tests and node_modules are excluded.

## JavaScript / TypeScript

```javascript
// Zero-config entry: window.TailTools + CGE* globals, auto-init on DOM ready,
// Livewire (commit hook, wire:navigate) and Turbo (turbo:load) re-initialization.
import 'tailtools/auto';

// Side-effect-free root entry: nothing touches window until you call init.
import TailTools, { CGEModal, CGESelect, initTailTools, destroyTailTools } from 'tailtools';
initTailTools();                                        // whole document
initTailTools(document.querySelector('#new-content'));  // after injecting a subtree
destroyTailTools(document.querySelector('#old-content')); // before removing a subtree

// Individual plugin imports are also side-effect free:
import { CGEDropzone } from 'tailtools/plugins/CGEDropzone';
import CGEAlert from 'tailtools/CGEAlert';
import { CGEDataTable, CGEFilter, CGESort, CGEPagination, CGEResponsive } from 'tailtools/plugins/CGEDataTable';
import { CGETabs } from 'tailtools/plugins/CGETabs';
import { CGEAccordion, CGECollapse } from 'tailtools/plugins/CGEAccordion';
```

`initTailTools()` is idempotent. Each plugin's `init()` first destroys instances whose elements were detached (Livewire morph, Turbo, `innerHTML`) and then initializes new markup, so calling it after every DOM update is safe. Every plugin also exposes `static destroyAll(root)`.

`tailtools/auto` options (set before the import):

```javascript
window.TailToolsConfig = { autoInit: true, livewire: true, turbo: true, globals: true };
```

### Livewire

With `tailtools/auto`, plugins are re-initialized after each Livewire commit and after `wire:navigate`; instances whose elements Livewire replaced are destroyed and recreated. CGETabs, CGEAccordion and CGECollapse also rebuild when morphing strips the attributes they added. Widgets that generate their own DOM (CGESelect, CGEDropzone, CGEDataTable, CGEDataGrid) should be wrapped in `wire:ignore` so morphing does not overwrite it.

Root/plugin declarations pass strict NodeNext and Bundler resolution with skipLibCheck disabled. Plugins require a DOM when used; importing any ESM entry does not require a DOM.

TailTools has no runtime npm dependencies. `tailwindcss` (>= 4.3) and `tailwind-animations` are optional peer dependencies used by the raw stylesheet imports.

## Tailwind CSS v4 / Laravel Vite

```css
/* resources/css/app.css */
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/styles";
```

`tailtools/styles` aggregates raw plugin CSS and a relative @source for their JavaScript. This shares your application's Tailwind theme. Individual styling:

```css
@import "tailwindcss";
@import "tailtools/plugins/CGEModal/style.css";
@source "../../node_modules/tailtools/plugins/CGEModal/*.js";
```

Adjust @source relative to the CSS file. `import 'tailtools/style.css'` is the precompiled alternative, including Tailwind preflight and only the utilities used by the plugins themselves (not your markup). Prefer the raw aggregate in an existing Tailwind app. Animation classes need the animation stylesheet; auto detection uses `has-tailwind-animations` on html or `window.__TAILWIND_ANIMATIONS__ = true`, otherwise CSS is the fallback.

```javascript
// resources/js/app.js
import 'tailtools/auto';
```

```blade
<form data-cge-form data-cge-driver="fetch" action="{{ route('users.update', $user) }}" method="POST">
    @csrf
    @method('PATCH')
    <input name="name" value="{{ $user->name }}">
    <button type="submit" name="action" value="save">Save</button>
</form>
```

CGEForm and AJAX CGEActionButton send multipart PUT/PATCH/DELETE as POST plus _method, including submitter name/value. Axios is an optional driver; Fetch works without it.

## Static script distribution

Copy dist/tailtools.css and dist/tailtools.umd.cjs to static assets. The UMD bundle is built from the auto entry: it exposes globals and initializes automatically. Serve the UMD file as JavaScript; it can be renamed tailtools.umd.js for conventional static hosting.

```html
<link rel="stylesheet" href="/assets/tailtools.css">
<script src="/assets/tailtools.umd.js"></script>
<script>TailTools.CGEToast.success('Ready');</script>
```

The bundle exposes TailTools and individual CGE globals. Before a public release, choose a release version and review/remove private. Publication is outside this maintenance.

## HTML contract

Text options (titles, messages, captions, file names, table cell values, data-cge-* attributes) are always rendered as text. HTML is an explicit opt-in: Toast `html: true`, Alert `html`, Lightbox rich captions, Select/DataTable/DataGrid custom renderers and formatters, Tabs AJAX `html` responses. Only pass trusted or sanitized HTML to those; the plugins do not provide a universal sanitizer (CGETabs accepts a `sanitize` hook).

See [development](developing.md) and [tests](../tests/README.md).
