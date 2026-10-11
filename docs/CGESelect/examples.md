# CGESelect - Practical Examples & Recipes

Code recipes and real-world implementation patterns for **CGESelect**.

---

## 1. Single Select with Rich Media & Status Badges

```html
<label class="block text-xs font-semibold text-slate-700 mb-1">Server Cluster Leader:</label>
<select id="leader-select" data-cge-select class="w-full text-xs">
    <option value="" disabled selected data-placeholder>Choose cluster leader...</option>
    <option value="us-east" data-image="/images/us-flag.png" data-subtext="Latency: 14ms" data-badge="Primary">US-East (N. Virginia)</option>
    <option value="eu-central" data-image="/images/eu-flag.png" data-subtext="Latency: 38ms" data-badge="Failover">EU-Central (Frankfurt)</option>
    <option value="ap-east" data-image="/images/jp-flag.png" data-subtext="Latency: 120ms" data-badge="Standby">AP-Northeast (Tokyo)</option>
</select>
```

---

## 2. Multi-Select Tags with Tag Limits

```html
<label class="block text-xs font-semibold text-slate-700 mb-1">Assigned Security Roles (Max 2):</label>
<select
    id="roles-select"
    multiple
    data-cge-select
    data-cge-max-items="2"
    data-cge-max-tags-visible="1"
    data-cge-placeholder="Select security roles..."
    class="w-full text-xs"
>
    <option value="admin" selected data-badge="Security">Super Administrator</option>
    <option value="billing" data-badge="Finance">Billing Manager</option>
    <option value="auditor" data-badge="Compliance">Compliance Auditor</option>
    <option value="support" data-badge="Tier 1">Customer Support Rep</option>
</select>
```

---

## 3. Remote Async Search with Axios & Debounce

```html
<label class="block text-xs font-semibold text-slate-700 mb-1">Search Global Customers:</label>
<select id="customer-async-select" class="w-full text-xs">
    <option value="" disabled selected>Start typing customer name or email...</option>
</select>

<script>
    import { CGESelect } from 'tailtools';

    new CGESelect('#customer-async-select', {
        minSearchLength: 2,
        asyncSource: {
            url: '/api/customers/search',
            driver: 'axios',
            method: 'GET',
            param: 'query',
            debounce: 350,
            transform: (response) => {
                return response.data.map(c => ({
                    value: c.id,
                    label: c.company_name,
                    subtext: c.contact_email,
                    badge: c.subscription_plan,
                    image: c.logo_url
                }));
            }
        }
    });
</script>
```

---

## 4. Hierarchical Optgroups with Auto-Flip

```html
<label class="block text-xs font-semibold text-slate-700 mb-1">Cloud Infrastructure Component:</label>
<select data-cge-select class="w-full text-xs">
    <optgroup label="Compute Engines">
        <option value="k8s">Managed Kubernetes EKS</option>
        <option value="vm">Virtual Machine Droplet</option>
        <option value="functions">Serverless Edge Functions</option>
    </optgroup>
    <optgroup label="Databases">
        <option value="postgres" selected>PostgreSQL 16 Cluster</option>
        <option value="mysql">MySQL 8.4 Enterprise</option>
        <option value="redis">Redis Cache Cluster</option>
    </optgroup>
</select>
```

---

## 5. Programmatic Controller API

```javascript
import { CGESelect } from 'tailtools';

const select = new CGESelect('#framework-select');

// Set single value
select.setValue('laravel');

// In multi mode: set array of values
// select.setValue(['laravel', 'tailwind']);

// Get current value
const current = select.getValue();
console.log('Selected:', current);

// Clear selection
select.clear();

// Temporarily disable while processing
select.disable();

setTimeout(() => {
    select.enable();
    select.open();
}, 1000);
```


## Maintenance notes (2026-10-04)

Remote selections become native options and serialize through FormData. Native multiple is synchronized. Declarative async URL/driver/method/param/debounce and close-on-select attributes work. Async requests honor minSearchLength; POST uses a JSON query body. Superseded/destroyed requests cannot replace current results. Destroy restores original style/tabindex/aria-hidden/multiple attributes. Local search resets on reopening and disabled optgroups remain disabled. `CGESelect.init(selector, options, root)` accepts an optional discovery root and includes a matching root itself.

## Extended maintenance contract (2026-10-04)

The native select retains every remote/multiple value in FormData. Declarative async settings, stale-result guards, cancellation and scoped init are supported. The trigger is an HTMLDivElement combobox with sibling tag/clear button controls inside the layout, avoiding button-in-button markup; it has a label, aria-controls and aria-activedescendant. Native change and form reset refresh the UI. open/opened/close/closed all emit the declared detail object. Destroy restores original attributes and removes change/reset listeners.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.

```javascript
nativeSelect.value = '42';
nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
form.reset(); // UI refreshes in a microtask after native defaults apply
select.on('opened', ({ instance }) => console.log(instance.getValue()));
```

## Stability fixes (October 2026)

### POST search behind Laravel CSRF

```javascript
new CGESelect('#user-picker', {
  asyncSource: {
    url: '/users/search',
    method: 'POST', // X-CSRF-TOKEN / X-XSRF-TOKEN are added automatically
    headers: { 'X-Team': document.body.dataset.team },
    transform: response => response.data.map(user => ({ value: user.id, label: user.name, icon: 'fa-solid fa-user' }))
  }
});
```

### Escaping inside a custom renderer

```javascript
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
new CGESelect('#remote', {
  asyncSource: { url: '/api/projects' },
  renderOption: item => `<span class="font-medium">${escape(item.label)}</span>`
});
```
