# CGEAccordion Examples

Practical code recipes and patterns for Tailwind CSS v4, Laravel Blade, and Alpine.js.

---

## 1. Exclusive FAQ Accordion (Single-Expand Mode)

Opening any panel automatically collapses sibling panels in the container:

```html
<div id="faq" data-cge-accordion data-cge-exclusive="true" class="divide-y divide-slate-200 dark:divide-slate-800">
  <!-- FAQ Item 1 -->
  <div class="cge-accordion-item" data-cge-item="faq-pricing">
    <h3>
      <button data-cge-trigger="faq-pricing" class="flex justify-between items-center w-full py-4 text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition cursor-pointer">
        <span>Can I switch subscription plans at any time?</span>
        <svg data-cge-icon class="w-5 h-5 text-slate-400 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
        </svg>
      </button>
    </h3>
    <div data-cge-body="faq-pricing" class="grid grid-rows-[0fr] transition-all duration-300 ease-out">
      <div class="overflow-hidden min-h-0 text-sm text-slate-600 dark:text-slate-400 pb-4">
        Yes! Upgrade or downgrade your plan anytime from your account settings. Prorated credits are automatically credited to your invoice.
      </div>
    </div>
  </div>

  <!-- FAQ Item 2 -->
  <div class="cge-accordion-item" data-cge-item="faq-cancel">
    <h3>
      <button data-cge-trigger="faq-cancel" class="flex justify-between items-center w-full py-4 text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition cursor-pointer">
        <span>What is your cancellation and refund policy?</span>
        <svg data-cge-icon class="w-5 h-5 text-slate-400 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
        </svg>
      </button>
    </h3>
    <div data-cge-body="faq-cancel" class="grid grid-rows-[0fr] transition-all duration-300 ease-out">
      <div class="overflow-hidden min-h-0 text-sm text-slate-600 dark:text-slate-400 pb-4">
        Cancel with one click whenever you want. You will retain access until the end of your billing period with zero cancellation penalties.
      </div>
    </div>
  </div>
</div>
```

---

## 2. Multi-Expand Accordion (`exclusive: false`)

Allows multiple panels to stay open simultaneously, with "Expand All" and "Collapse All" programmatic triggers:

```html
<div class="flex items-center gap-2 mb-4">
  <button type="button" onclick="multiAcc.openAll()" class="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200">
    Expand All
  </button>
  <button type="button" onclick="multiAcc.closeAll()" class="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200">
    Collapse All
  </button>
</div>

<div id="multi-accordion" data-cge-accordion data-cge-exclusive="false" class="space-y-3">
  <div class="cge-accordion-item rounded-lg border border-slate-200 p-4" data-cge-item="features">
    <button data-cge-trigger="features" class="flex justify-between items-center w-full font-bold">
      <span>Module Features</span>
      <svg data-cge-icon class="w-4 h-4 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>
    </button>
    <div data-cge-body="features" class="grid grid-rows-[0fr] transition-all duration-300 ease-out">
      <div class="overflow-hidden min-h-0 pt-3 text-sm text-slate-500">
        Features list content...
      </div>
    </div>
  </div>

  <div class="cge-accordion-item rounded-lg border border-slate-200 p-4" data-cge-item="specifications">
    <button data-cge-trigger="specifications" class="flex justify-between items-center w-full font-bold">
      <span>Hardware Specifications</span>
      <svg data-cge-icon class="w-4 h-4 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>
    </button>
    <div data-cge-body="specifications" class="grid grid-rows-[0fr] transition-all duration-300 ease-out">
      <div class="overflow-hidden min-h-0 pt-3 text-sm text-slate-500">
        Specs list content...
      </div>
    </div>
  </div>
</div>

<script>
  const multiAcc = new window.CGEAccordion('#multi-accordion', { exclusive: false });
</script>
```

---

## 3. Nested Hierarchies (Multi-Level Accordions)

Child accordions operate independently without bubbling toggle events to parent accordions:

```html
<div id="parent-accordion" data-cge-accordion data-cge-exclusive="true" class="border border-slate-200 rounded-lg p-2">
  <!-- Parent Item 1 -->
  <div class="cge-accordion-item" data-cge-item="level-1">
    <button data-cge-trigger="level-1" class="flex justify-between items-center w-full py-3 px-2 font-bold text-slate-900">
      <span>Chapter 1: Frontend Architecture</span>
      <svg data-cge-icon class="w-4 h-4 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>
    </button>
    <div data-cge-body="level-1" class="grid grid-rows-[0fr] transition-all duration-300 ease-out">
      <div class="overflow-hidden min-h-0 pl-4 pr-2 pb-3">
        <p class="text-xs text-slate-500 mb-2">Select a subtopic below:</p>

        <!-- Nested Child Accordion -->
        <div id="child-accordion" data-cge-accordion data-cge-exclusive="true" class="border-l-2 border-indigo-200 pl-3 space-y-1">
          <div class="cge-accordion-item" data-cge-item="child-css">
            <button data-cge-trigger="child-css" class="flex justify-between items-center w-full py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600">
              <span>1.1 Tailwind CSS v4 Engine</span>
              <svg data-cge-icon class="w-3.5 h-3.5 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>
            </button>
            <div data-cge-body="child-css" class="grid grid-rows-[0fr] transition-all duration-300 ease-out">
              <div class="overflow-hidden min-h-0 text-[11px] text-slate-500 py-1">
                Zero JavaScript height calculations using CSS Grid row interpolation.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>
```

---

## 4. Standalone CGECollapse (Isolated Toggle)

For a card filter toggle, preview reveal, or isolated dropdown drawer:

```html
<button data-cge-collapse="#filter-drawer" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded font-medium cursor-pointer">
  <span>Filter Options</span>
  <svg data-cge-icon class="w-4 h-4 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
  </svg>
</button>

<div id="filter-drawer" class="cge-wrapper mt-3">
  <div class="cge-content p-4 rounded-lg bg-slate-100 border border-slate-200">
    <div class="grid grid-cols-3 gap-4 text-xs">
      <div>
        <label class="font-bold block mb-1">Status</label>
        <select class="w-full rounded border border-slate-300 p-1.5"><option>Active</option><option>Archived</option></select>
      </div>
    </div>
  </div>
</div>
```

---

## 5. Alpine.js Interoperability

CGEAccordion works seamlessly alongside Alpine.js reactive components:

```html
<div x-data="{ currentStep: 'step-1' }" class="space-y-4">
  <div id="wizard-accordion" data-cge-accordion data-cge-exclusive="true">
    <div class="cge-accordion-item" data-cge-item="step-1">
      <button data-cge-trigger="step-1" class="font-bold">Step 1: Account</button>
      <div data-cge-body="step-1">
        <div class="cge-content py-2">
          <button type="button" @click="TailTools.CGEAccordion.get('#wizard-accordion').open('step-2')" class="btn">
            Continue to Step 2 &rarr;
          </button>
        </div>
      </div>
    </div>
    <div class="cge-accordion-item" data-cge-item="step-2">
      <button data-cge-trigger="step-2" class="font-bold">Step 2: Payment</button>
      <div data-cge-body="step-2">
        <div class="cge-content py-2">Payment Details Form...</div>
      </div>
    </div>
  </div>
</div>
```


## Multiple controls and scoped setup
```html
<div id="details-region">
  <button type="button" data-cge-collapse="#details" data-cge-duration="180">Details</button>
  <button type="button" data-cge-collapse="#details">Toggle details again</button>
  <div id="details"><div><input name="notes" aria-label="Notes"></div></div>
</div>
```
```javascript
import { CGECollapse } from 'tailtools/CGEAccordion';
const [details] = CGECollapse.init(document.getElementById('details-region'));
details.open(); // both controls update; the panel becomes keyboard accessible
console.log(details.triggers.length); // 2
details.destroy(); // restores the original controls and panel attributes
```
Destroy nested instances before destroying their parent when managing independent programmatic lifecycles.

## Collapse inside an accordion item and nested trigger actions

```html
<div id="orders" data-cge-accordion data-cge-url-sync="false">
  <section data-cge-item="order-42">
    <div data-cge-trigger tabindex="0" class="flex justify-between items-center">
      <span>Order #42</span>
      <!-- Does not toggle the item -->
      <a href="/orders/42/edit" class="text-sm underline">Edit</a>
    </div>
    <div data-cge-body>
      <div data-cge-content>
        <button type="button" data-cge-collapse="#order-42-notes">Show notes</button>
        <div id="order-42-notes"><div>Delivery notes...</div></div>
      </div>
    </div>
  </section>
</div>
```

```javascript
import { CGEAccordion, CGECollapse } from 'tailtools';
const [orders] = CGEAccordion.init(document.getElementById('orders'));
const [notes] = CGECollapse.init(document.getElementById('orders')); // initialized inside the body
document.addEventListener('cge:collapse:open', e => console.log('opened once', e.detail.instance.id));
```
