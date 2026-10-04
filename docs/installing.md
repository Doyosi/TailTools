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
import TailTools, { CGEModal, CGESelect, CGEDataTable, CGEDataGrid, CGETabs, CGEAccordion, initTailTools } from 'tailtools';
// Root import exposes globals and auto-initializes in the browser.
initTailTools(document.querySelector('#new-content')); // after injecting a subtree

// Individual imports have no root auto-initialization side effect:
import { CGEDropzone } from 'tailtools/plugins/CGEDropzone';
import CGEAlert from 'tailtools/CGEAlert';
import { CGEDataTable, CGEFilter, CGESort, CGEPagination, CGEResponsive } from 'tailtools/plugins/CGEDataTable';
import { CGEDataGrid } from 'tailtools/plugins/CGEDataGrid';
import { CGETabs } from 'tailtools/plugins/CGETabs';
import { CGEAccordion, CGECollapse } from 'tailtools/plugins/CGEAccordion';
```

Root/plugin declarations pass strict NodeNext and Bundler resolution with skipLibCheck disabled. Plugins require a DOM when used; importing the ESM package itself does not require a DOM.

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

Adjust @source relative to the CSS file. `import 'tailtools/style.css'` is the precompiled alternative, including this checkout's theme and preflight. Prefer the raw aggregate in an existing Tailwind app. Animation classes need the animation stylesheet; auto detection uses `has-tailwind-animations` on html or `window.__TAILWIND_ANIMATIONS__ = true`, otherwise CSS is the fallback.

```javascript
// resources/js/app.js
import { CGEForm } from 'tailtools';
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

Copy dist/tailtools.css and dist/tailtools.umd.cjs to static assets. Serve the UMD file as JavaScript; it can be renamed tailtools.umd.js for conventional static hosting.

```html
<link rel="stylesheet" href="/assets/tailtools.css">
<script src="/assets/tailtools.umd.js"></script>
<script>TailTools.CGEToast.success('Ready');</script>
```

The bundle exposes TailTools and individual CGE globals. Before a public release, choose a release version and review/remove private. Publication is outside this maintenance.

## HTML contract

Toast rich messages, Alert HTML/custom content, Select custom renderers and Lightbox captions/inline templates accept trusted HTML. Escape user-controlled text before passing it to these APIs or use their text fields/native labels. Existing rich rendering is preserved; the plugins do not provide a universal sanitizer.

See [development](developing.md) and [tests](../tests/README.md).
