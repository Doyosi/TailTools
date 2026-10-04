---
name: cge-accordion
description: Ultra-smooth, accessible accordion and collapsible panel plugin engineered for Tailwind CSS v4.3+ and Laravel Blade. Utilizes modern CSS Grid row transitions (`grid-rows-[0fr]` to `grid-rows-[1fr]`) to eliminate laggy height/scrollHeight calculations. Features single-expand (exclusive accordion) and multi-expand (independent collapse) modes, URL hash/deep-linking activation, animated chevron/icon rotation, nested hierarchy support, and full WAI-ARIA keyboard navigation.
---

# CGEAccordion Agent Skill

Use this skill when implementing, configuring, or debugging accordions, collapsible panels, FAQ drawers, nested documentation trees, or isolated toggles using the **TailTools** `CGEAccordion` or `CGECollapse` plugins in Tailwind CSS v4.3+ or Laravel Blade projects.

---

## 1. When to Use CGEAccordion & CGECollapse

Activate this skill when the user requests:
- "Create an accordion or FAQ section in Tailwind CSS or Laravel."
- "Implement collapsible panels with CSS Grid row animations (`grid-rows-[0fr]` to `grid-rows-[1fr]`)."
- "Avoid layout thrashing and `scrollHeight` calculations during collapse transitions."
- "Support exclusive accordion mode (only one panel open) or multi-expand mode."
- "Activate accordion panels via URL hash deep linking (`#faq-item-1`)."
- "Remember open accordion panels across reloads via `localStorage` or `sessionStorage`."
- "Implement nested hierarchical accordions (documentation tree or category explorer)."
- "Ensure full WAI-ARIA keyboard navigation (Arrow keys, Home, End, Enter, Space)."
- "Create isolated toggle buttons without an accordion container (`CGECollapse`)."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEAccordion/style.css";
```

### JavaScript Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGEAccordion, CGECollapse } from 'tailtools';

// Auto-initializes all declarative containers (data-cge-accordion and data-cge-collapse)
initTailTools();

// Global access for Alpine.js or inline scripts
window.CGEAccordion = CGEAccordion;
window.CGECollapse = CGECollapse;
```

---

## 3. Declarative HTML Markup Pattern

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
        We bill annually or monthly with automatic prorated invoicing.
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
        SOC-2 Type II, ISO 27001, and GDPR compliant data storage.
      </div>
    </div>
  </div>
</div>
```

---

## 4. Programmatic JavaScript API

### CGEAccordion

```javascript
import { CGEAccordion } from 'tailtools';

const acc = new CGEAccordion('#faq-accordion', {
  exclusive: true,
  urlSync: 'hash',
  scrollIntoView: true,
  storage: 'localStorage',
  onOpen: (itemId, itemEl) => console.log('Opened:', itemId),
  onClose: (itemId, itemEl) => console.log('Closed:', itemId)
});

acc.open('security');
acc.close('billing');
acc.toggle('billing');
acc.openAll(); // in non-exclusive mode
acc.closeAll();
acc.destroy();
```

### Standalone CGECollapse

```javascript
import { CGECollapse } from 'tailtools';

const col = new CGECollapse('#isolated-panel', {
  defaultOpen: false,
  storage: 'sessionStorage'
});

col.open();
col.close();
col.toggle();
```

---

## 5. Laravel Blade Markup Pattern

```blade
<div id="faq-accordion" data-cge-accordion data-cge-exclusive="true" class="divide-y divide-zinc-200 dark:divide-zinc-800">
    @foreach($items as $item)
        <div class="cge-accordion-item" data-cge-item="{{ $item->id }}">
            <h3>
                <button type="button" data-cge-trigger="{{ $item->id }}" class="flex justify-between items-center w-full py-4 text-left font-medium">
                    <span>{{ $item->title }}</span>
                    <svg data-cge-icon class="w-4 h-4 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
                    </svg>
                </button>
            </h3>
            <div data-cge-body="{{ $item->id }}" class="grid grid-rows-[0fr] transition-all duration-300 ease-out">
                <div class="overflow-hidden min-h-0 text-sm pb-4">
                    {{ $item->content }}
                </div>
            </div>
        </div>
    @endforeach
</div>
```
