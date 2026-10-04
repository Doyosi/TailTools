# CGEAccordion (incorporating CGECollapse)

Ultra-smooth, accessible accordion and collapsible panel plugin engineered for Tailwind CSS v4.3+ and Laravel Blade. Utilizes modern CSS Grid row transitions (`grid-rows-[0fr]` to `grid-rows-[1fr]`) to eliminate laggy height and `scrollHeight` calculations. Features single-expand (exclusive accordion) and multi-expand (independent collapse) modes, URL hash/deep-linking activation, animated chevron rotation, nested hierarchy support, and full WAI-ARIA keyboard navigation.

---

## Key Features

- **Zero `scrollHeight` Dependency (CSS Grid Transition Engine):**
  Uses native CSS Grid row animation (`grid-template-rows: 0fr -> 1fr`). Transitions adapt to dynamic content without JavaScript height or scrollHeight measurements.
- **Dual Exposure:**
  - `CGEAccordion`: Group manager for multi-item accordions with exclusive or multi-expand behavior.
  - `CGECollapse`: Standalone helper for isolated toggles without group wrappers.
- **WAI-ARIA Accordion Pattern:**
  Automated injection and management of `role="region"`, `role="button"`, `aria-expanded`, `aria-controls`, and `aria-labelledby`.
- **Keyboard Navigation:**
  Full support for `ArrowDown`, `ArrowUp`, `Home`, `End`, `Enter`, and `Space`.
- **URL Hash Deep Linking:**
  Opens targeted accordion item automatically from `window.location.hash`, with smooth scroll support and live `hashchange` listeners.
- **Storage State Persistence:**
  Persists open panel state across browser refreshes via `localStorage` or `sessionStorage`.
- **Nested Accordion Support:**
  Clean hierarchical event scoping prevents child accordion clicks from collapsing parent accordion items.
- **Headless UI Theming (`ui`):**
  Full control over utility classes for items, triggers, icons, wrappers, and content.
- **Laravel Blade Ready:**
  Declarative markup with `data-cge-accordion`, `data-cge-item`, `data-cge-trigger`, and `data-cge-body`.

---

## Quick Start

### Installation

```bash
npm install tailtools
```

### CSS Setup (Tailwind CSS v4)

```css
/* app.css */
@import "tailwindcss";
@import "tailtools/styles";
```

Or import the plugin stylesheet directly:

```css
@import "tailwindcss";
@import "tailtools/plugins/CGEAccordion/style.css";
```

### HTML / Blade Markup

```html
<div id="faq-accordion" data-cge-accordion data-cge-exclusive="true">
  <!-- Item 1 -->
  <div class="cge-accordion-item" data-cge-item="billing">
    <h3>
      <button data-cge-trigger="billing" class="cge-trigger">
        <span>How does billing work?</span>
        <svg data-cge-icon class="cge-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
        </svg>
      </button>
    </h3>
    <div data-cge-body="billing" class="cge-wrapper">
      <div class="cge-content">
        We bill monthly or annually with automated prorated refunds.
      </div>
    </div>
  </div>

  <!-- Item 2 -->
  <div class="cge-accordion-item" data-cge-item="security">
    <h3>
      <button data-cge-trigger="security" class="cge-trigger">
        <span>What security certifications do you possess?</span>
        <svg data-cge-icon class="cge-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
        </svg>
      </button>
    </h3>
    <div data-cge-body="security" class="cge-wrapper">
      <div class="cge-content">
        All infrastructure is SOC-2 Type II and ISO 27001 certified.
      </div>
    </div>
  </div>
</div>
```

### JavaScript Initialization

```javascript
import { CGEAccordion } from 'tailtools';

// Declarative auto-initialization for all [data-cge-accordion] on the page:
CGEAccordion.init();

// Or manual programmatic instance:
const acc = new CGEAccordion('#faq-accordion', {
  exclusive: true,
  urlSync: 'hash',
  scrollIntoView: true
});

// Programmatic controls:
acc.open('security');
acc.toggle('billing');
```

---

## Standalone CGECollapse Helper

For isolated collapsible panels without an accordion group wrapper:

```html
<button data-cge-collapse="#details-panel" class="btn">
  <span>Toggle Details</span>
  <svg data-cge-icon viewBox="0 0 20 20" fill="currentColor">
    <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
  </svg>
</button>

<div id="details-panel" class="cge-wrapper">
  <div class="cge-content p-4">
    Detailed content rendered smoothly via CSS Grid transitions.
  </div>
</div>
```

```javascript
import { CGECollapse } from 'tailtools';

CGECollapse.init();
```

---

## Documentation Navigation

- [Usage & Configuration Guide](usage.md)
- [Practical Examples & Patterns](examples.md)
- [Laravel Blade Components](laravel-blade.md)
- [Complete TypeScript API](api.md)


## Initialization and cleanup
Programmatic roots need no `data-cge-accordion` marker. Use distinct item IDs per group and mark nested groups declaratively (or initialize each nested programmatic instance first). `init(root)` includes a matching root and skips already registered accordions. `get()` accepts an element, literal ID or selector; invalid selectors return null.

Closed panels use `inert` and `aria-hidden` while retaining CSS Grid animation. Closing a focused panel returns focus to its trigger. Disabled triggers are skipped by keyboard navigation. `duration` controls wrapper/icon transition duration; the stylesheet honors reduced motion. `destroy()` restores original owned attributes, classes and styles, cancels queued scrolling and permits recreation without replacing consumer nodes.

Standalone Collapse controls targeting one panel share an instance, synchronized ARIA and icons. Import `CGECollapse` as a named export from `tailtools` or `tailtools/CGEAccordion`; there is no separate Collapse directory.
