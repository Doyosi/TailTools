# CGESelect - TypeScript API Reference

Complete TypeScript declarations, option schemas, and event payload types for **CGESelect**.

---

## 1. Type Interfaces

```typescript
export interface CGESelectTranslations {
  placeholder?: string;
  'search-placeholder'?: string;
  'no-results'?: string;
  loading?: string;
  'max-items-reached'?: string;
  'clear-all'?: string;
  'more-tags'?: string;
  [key: string]: string | undefined;
}

export interface CGESelectUIConfig {
  wrapper?: string;
  trigger?: string;
  triggerActive?: string;
  triggerDisabled?: string;
  selectionContainer?: string;
  placeholder?: string;
  controls?: string;
  clearButton?: string;
  arrow?: string;
  dropdown?: string;
  searchWrapper?: string;
  searchInput?: string;
  searchIcon?: string;
  optionsList?: string;
  optgroupLabel?: string;
  option?: string;
  optionSelected?: string;
  optionFocused?: string;
  optionDisabled?: string;
  tag?: string;
  tagRemove?: string;
  tagCount?: string;
  emptyState?: string;
  loadingState?: string;
}

export interface CGESelectItem {
  value: string;
  label: string;
  selected: boolean;
  disabled: boolean;
  image?: string | null;
  icon?: string | null;
  subtext?: string | null;
  badge?: string | null;
  optgroup?: string | null;
  element?: HTMLOptionElement | null;
}

export interface CGESelectAsyncSource {
  url: string;
  driver?: 'axios' | 'fetch';
  method?: 'GET' | 'POST';
  param?: string;
  debounce?: number;
  transform?: (response: any) => any[];
}

export interface CGESelectOptions {
  /** Enables multi-selection tags mode */
  multiple?: boolean;
  /** Enables search input filtering */
  searchable?: boolean;
  /** Enables quick clear button when items are selected */
  clearable?: boolean;
  /** Trigger box placeholder when nothing is selected */
  placeholder?: string | null;
  /** Search box input placeholder text */
  searchPlaceholder?: string | null;
  /** Whether to close dropdown after selecting an option */
  closeOnSelect?: boolean;
  /** Maximum number of items selectable in multi mode */
  maxItems?: number | null;
  /** Maximum number of tags visible before collapsing into "+N more" badge */
  maxTagsVisible?: number | null;
  /** Minimum characters typed before filtering starts */
  minSearchLength?: number;
  /** Dropdown placement behavior ('auto' | 'bottom' | 'top') */
  placement?: 'auto' | 'bottom' | 'top';
  /** Configuration for remote async search endpoint */
  asyncSource?: CGESelectAsyncSource | null;
  /** Custom render function for dropdown options */
  renderOption?: ((item: CGESelectItem) => string) | null;
  /** Custom render function for selected multi-tags */
  renderTag?: ((item: CGESelectItem) => string) | null;
  /** Custom render function for single select trigger content */
  renderSelection?: ((item: CGESelectItem) => string) | null;
  /** Tailwind CSS class mapping slots */
  ui?: Partial<CGESelectUIConfig>;
  /** Localization dictionary overrides */
  translations?: Partial<CGESelectTranslations>;
}
```

---

## 2. Event Payloads

```typescript
export interface CGESelectEventMap {
  open: { instance: CGESelect; element: HTMLSelectElement };
  opened: { instance: CGESelect; element: HTMLSelectElement };
  close: { instance: CGESelect; element: HTMLSelectElement };
  closed: { instance: CGESelect; element: HTMLSelectElement };
  change: {
    instance: CGESelect;
    element: HTMLSelectElement;
    value: string | string[];
    selectedItems: CGESelectItem[];
  };
  clear: { instance: CGESelect; element: HTMLSelectElement };
  search: { instance: CGESelect; element: HTMLSelectElement; query: string };
}
```

---

## 3. Class Methods & Signatures

```typescript
export class CGESelect {
  // Static Registry & Initializers
  static instances: WeakMap<HTMLSelectElement, CGESelect>;
  static defaults: CGESelectOptions;
  static translations: CGESelectTranslations;
  static setTranslations(dict: Partial<CGESelectTranslations>): void;
  static get(target: string | HTMLSelectElement): CGESelect | null;
  static getOrCreate(target: string | HTMLSelectElement, options?: CGESelectOptions): CGESelect;
  static init(selector?: string, options?: CGESelectOptions): CGESelect[];

  // Instance Properties
  element: HTMLSelectElement;
  options: CGESelectOptions;
  isOpen: boolean;
  items: CGESelectItem[];
  filteredItems: CGESelectItem[];
  selectedValues: string[];
  focusedIndex: number;
  searchQuery: string;
  isLoading: boolean;

  // Instance Methods
  open(): this;
  close(): this;
  toggle(): this;
  getValue(): string | string[];
  setValue(val: string | string[] | null, triggerChange?: boolean): this;
  select(val: string): this;
  deselect(val: string): this;
  clear(triggerChange?: boolean): this;
  disable(): this;
  enable(): this;
  refresh(): this;
  on<K extends keyof CGESelectEventMap>(
    eventName: K,
    callback: (detail: CGESelectEventMap[K]) => void
  ): this;
  off<K extends keyof CGESelectEventMap>(
    eventName: K,
    callback: (detail: CGESelectEventMap[K]) => void
  ): this;
  destroy(): void;
}
```
