# CGESelect - Usage Guide

Comprehensive documentation for options, data attributes, modes, async endpoints, custom renderers, and keyboard navigation in **CGESelect**.

---

## Configuration Options

When instantiating manually (`new CGESelect(element, options)`):

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `multiple` | `boolean` | `false` | Enables multi-selection tags mode. Automatically inferred if original element has `<select multiple>`. |
| `searchable` | `boolean` | `true` | Enables real-time search input filtering inside the dropdown. |
| `clearable` | `boolean` | `true` | Displays quick clear button (`×`) when value is selected. |
| `placeholder` | `string \| null` | `null` | Placeholder text when no option is selected. |
| `searchPlaceholder` | `string \| null` | `null` | Placeholder text inside the search input box. |
| `closeOnSelect` | `boolean \| null` | `null` | Whether dropdown closes on selection (defaults to `true` for single, `false` for multi). |
| `maxItems` | `number \| null` | `null` | Maximum selectable items in multi mode. Prevents further selection when reached. |
| `maxTagsVisible` | `number \| null` | `null` | Maximum visible badges before collapsing into `"+N more"` badge. |
| `minSearchLength` | `number` | `0` | Minimum character threshold before filtering starts. |
| `placement` | `'auto' \| 'bottom' \| 'top'` | `'auto'` | Dropdown placement mode with automatic viewport clearance calculation. |
| `asyncSource` | `Object \| null` | `null` | Configuration for remote async queries (`{ url, driver, method, param, debounce, transform }`). |
| `renderOption` | `Function \| null` | `null` | Custom render function for dropdown options: `(item: CGESelectItem) => string`. |
| `renderTag` | `Function \| null` | `null` | Custom render function for multi-select tags: `(item: CGESelectItem) => string`. |
| `renderSelection` | `Function \| null` | `null` | Custom render function for single select trigger content: `(item: CGESelectItem) => string`. |
| `ui` | `Object` | `{ ... }` | Custom Tailwind CSS class mappings for trigger, dropdown, tags, etc. |
| `translations` | `Object` | `{ ... }` | Localization dictionary overrides. |

---

## Declarative HTML Data Attributes

All features can be declared directly in HTML or Laravel Blade markup without bespoke JavaScript:

| Attribute | Target Tag | Description | Example |
| :--- | :--- | :--- | :--- |
| `data-cge-select` | `<select>` | Triggers automatic CGESelect initialization. | `<select data-cge-select>` |
| `data-cge-multiple` | `<select>` | Explicitly enables multi-select mode. | `data-cge-multiple="true"` |
| `data-cge-searchable` | `<select>` | Disables search input when set to `'false'`. | `data-cge-searchable="false"` |
| `data-cge-clearable` | `<select>` | Disables clear button when set to `'false'`. | `data-cge-clearable="false"` |
| `data-cge-placeholder` | `<select>` | Custom placeholder text. | `data-cge-placeholder="Choose..."` |
| `data-cge-max-items` | `<select>` | Maximum selections allowed in multi mode. | `data-cge-max-items="3"` |
| `data-cge-max-tags-visible`| `<select>` | Maximum tags shown before `+N more` badge. | `data-cge-max-tags-visible="2"` |
| `data-cge-min-search` | `<select>` | Minimum character threshold before filtering. | `data-cge-min-search="2"` |
| `data-cge-placement` | `<select>` | Forces placement `'bottom'`, `'top'`, or `'auto'`. | `data-cge-placement="top"` |
| `data-cge-close-on-select` | `<select>` | Closes after selection; defaults to single/multiple behavior. | `data-cge-close-on-select="false"` |
| `data-cge-async-url` | `<select>` | Remote endpoint. Constructor asyncSource takes precedence. | `data-cge-async-url="/api/users"` |
| `data-cge-async-driver` | `<select>` | Remote driver: fetch (default) or axios. | `data-cge-async-driver="fetch"` |
| `data-cge-async-method` | `<select>` | GET (default) or POST with JSON query body. | `data-cge-async-method="GET"` |
| `data-cge-async-param` | `<select>` | Query parameter name; default q. | `data-cge-async-param="term"` |
| `data-cge-async-debounce` | `<select>` | Delay in milliseconds; default 300. Zero is supported. | `data-cge-async-debounce="300"` |
| `data-image` | `<option>` | Avatar/thumbnail image URL. | `data-image="/avatars/user.jpg"` |
| `data-icon` | `<option>` | SVG or icon markup snippet. | `data-icon="<svg...>"` |
| `data-subtext` | `<option>` | Secondary description or role label. | `data-subtext="Engineering Lead"` |
| `data-badge` | `<option>` | Micro badge/pill label displayed on option. | `data-badge="Admin"` |

---

## Remote Async Search Configuration

Configure `asyncSource` to query remote REST APIs with automated debounce and AbortController request cancellation:

```javascript
new CGESelect('#async-select', {
  asyncSource: {
    url: '/api/v1/search-users',
    driver: 'axios', // 'axios' or 'fetch' (default)
    method: 'GET',
    param: 'q',
    debounce: 300,
    transform: (response) => {
      // Return array of objects: { value, label, subtext, image, badge }
      return response.data.map(user => ({
        value: user.id,
        label: user.name,
        subtext: user.email,
        image: user.avatar_url,
        badge: user.role
      }));
    }
  }
});
```

---

## Keyboard Navigation

| Key | Context | Action |
| :--- | :--- | :--- |
| `ArrowDown` | Trigger / Input | Highlights next option in list with smooth scroll into view. |
| `ArrowUp` | Trigger / Input | Highlights previous option in list with smooth scroll into view. |
| `Enter` | Highlighted Option | Selects the highlighted option. Closes in single mode. |
| `Escape` | Dropdown Open | Closes dropdown and returns focus to trigger button. |
| `Tab` | Dropdown Open | Closes dropdown and allows normal browser tab focus advance. |
| `Backspace` | Search Input Empty | Deletes the last selected tag in multi-select mode. |
| `Home` / `End` | Dropdown Open | Jumps to the first / last option in list. |

---

## Event Hooks & Subscriptions

```javascript
const select = new CGESelect('#my-select');

// Fluent instance listeners
select.on('change', ({ value, selectedItems }) => {
  console.log('Value changed:', value, selectedItems);
});

select.on('open', () => console.log('Dropdown opened'));
select.on('close', () => console.log('Dropdown closed'));
select.on('search', ({ query }) => console.log('Search query:', query));
select.on('clear', () => console.log('Selection cleared'));

// Native DOM CustomEvents on original <select>
document.getElementById('my-select').addEventListener('cge:select:change', (e) => {
  console.log('DOM Event:', e.detail.value);
});
```


## Maintenance notes (2026-10-04)

Remote selections become native options and serialize through FormData. Native multiple is synchronized. Declarative async URL/driver/method/param/debounce and close-on-select attributes work. Async requests honor minSearchLength; POST uses a JSON query body. Superseded/destroyed requests cannot replace current results. Destroy restores original style/tabindex/aria-hidden/multiple attributes. Local search resets on reopening and disabled optgroups remain disabled. `CGESelect.init(selector, options, root)` accepts an optional discovery root and includes a matching root itself.

## Extended maintenance contract (2026-10-04)

The native select retains every remote/multiple value in FormData. Declarative async settings, stale-result guards, cancellation and scoped init are supported. The trigger is an HTMLDivElement combobox with sibling tag/clear button controls inside the layout, avoiding button-in-button markup; it has a label, aria-controls and aria-activedescendant. Native change and form reset refresh the UI. open/opened/close/closed all emit the declared detail object. Destroy restores original attributes and removes change/reset listeners.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.
