# CGEActionButton - TypeScript API Reference

Complete TypeScript declarations, option schemas, and event payload types for **CGEActionButton**.

---

## 1. Type Interfaces

```typescript
export type CGEActionType =
  | 'delete'
  | 'restore'
  | 'confirm'
  | 'danger'
  | 'warning'
  | 'direct'
  | 'link'
  | (string & {});

export interface CGEActionButtonTranslations {
  loading?: string;
  'confirm-title'?: string;
  'confirm-message'?: string;
  'delete-title'?: string;
  'delete-message'?: string;
  'restore-title'?: string;
  'restore-message'?: string;
  'confirm-btn'?: string;
  'delete-btn'?: string;
  'restore-btn'?: string;
  'cancel-btn'?: string;
  'csrf-error'?: string;
  'server-error'?: string;
  [key: string]: string | undefined;
}

export interface CGEActionButtonOptions {
  /** Action archetype or mode */
  action?: CGEActionType;
  /** Modal confirmation title */
  title?: string | null;
  /** Modal confirmation message or description */
  message?: string | null;
  /** Custom confirm button text in dialog */
  confirmText?: string | null;
  /** Custom cancel button text in dialog */
  cancelText?: string | null;
  /** Require exact keyword typing to confirm (e.g. 'DELETE') */
  requireInput?: string | null;
  /** Target API URL for direct async execution */
  url?: string | null;
  /** HTTP method for direct async execution */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | string;
  /** Form selector to submit upon confirmation */
  form?: string | null;
  /** Submit form asynchronously via AJAX */
  ajax?: boolean;
  /** Custom text to display alongside spinner */
  loadingText?: string | null;
  /** Sibling button lock group ('row' or CSS selector) */
  lockGroup?: 'row' | string | null;
  /** Success toast message override */
  successToast?: string | null;
  /** Error toast message override */
  errorToast?: string | null;
  /** Automated redirect destination URL */
  redirect?: string | null;
  /** Bypass confirmation dialog and execute immediately */
  instant?: boolean;
  /** Simulated async duration in milliseconds (useful for prototyping, demos, or minimum spin time) */
  simulate?: number;
  /** Additional HTTP headers */
  headers?: Record<string, string>;
  /** Localization dictionary */
  translations?: Partial<CGEActionButtonTranslations>;
  /** Custom execution callback handler */
  onExecute?: (instance: CGEActionButton) => Promise<any> | any;
}
```

---

## 2. Event Types & Payloads

```typescript
export interface CGEActionButtonEventMap {
  start: { element: HTMLElement; action: string };
  confirm: { element: HTMLElement; action: string };
  cancel: { element: HTMLElement; action: string };
  success: { element: HTMLElement; action: string; result: any };
  error: { element: HTMLElement; action: string; error: any };
  complete: { element: HTMLElement; action: string };
}

export interface CGEActionButtonCustomEventDetail {
  instance: CGEActionButton;
  element: HTMLElement;
  action: string;
  result?: any;
  error?: any;
}
```

---

## 3. Class Declaration

```typescript
export class CGEActionButton {
  // Static Properties
  static instances: WeakMap<HTMLElement, CGEActionButton>;
  static defaults: Required<CGEActionButtonOptions>;
  static translations: CGEActionButtonTranslations;

  // Static Methods
  static setTranslations(dict: Partial<CGEActionButtonTranslations>): void;
  static get(target: string | HTMLElement): CGEActionButton | null;
  static getOrCreate(target: string | HTMLElement, options?: CGEActionButtonOptions): CGEActionButton;
  static execute(target: string | HTMLElement, options?: CGEActionButtonOptions): Promise<any>;
  static init(selector?: string): void;

  // Instance Properties
  readonly element: HTMLElement;
  readonly options: Required<CGEActionButtonOptions>;
  isExecuting: boolean;

  // Constructor
  constructor(element: HTMLElement, options?: CGEActionButtonOptions);

  // Instance Methods
  execute(event?: Event | null): Promise<any>;
  freeze(): void;
  unfreeze(): void;
  destroy(): void;

  // Event Subscription
  on<K extends keyof CGEActionButtonEventMap>(
    eventName: K,
    callback: (detail: CGEActionButtonEventMap[K]) => void
  ): this;

  off<K extends keyof CGEActionButtonEventMap>(
    eventName: K,
    callback: (detail: CGEActionButtonEventMap[K]) => void
  ): this;
}
```
