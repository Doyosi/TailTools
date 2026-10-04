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
