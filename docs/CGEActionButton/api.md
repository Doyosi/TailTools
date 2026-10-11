# CGEActionButton API

This reference mirrors the shipped [declaration](../../plugins/CGEActionButton/CGEActionButton.d.ts). Both named and default class imports are supported by the plugin barrel.

Confirmation is serialized. AJAX FormData is captured before freezing and includes the clicked button name/value exactly once. Multipart PUT/PATCH/DELETE uses POST + _method; GET uses query parameters, with no request body. Direct requests without FormData keep their requested method. Destroy cancels requests, delays and redirects and prevents late actions/results. Partial translations keep defaults.

**Stability fixes (October 2026):** the delegated listener runs in the capture phase, so inline `onclick`, Alpine `@click` and `wire:click` wait for confirmation and the click is replayed exactly once afterwards; confirmed native submits use `requestSubmit()` (submit event, CGEForm AJAX/422, submitter name/value); plain `<a href>` triggers navigate after confirmation (AJAX only with `data-cge-ajax` or an explicit method/`data-cge-url`) and keep `target`/`download`; the busy state recovers after `redirectTimeout` when no navigation happens; CSRF via the shared helper (cookie only as `X-XSRF-TOKEN`); `followRedirects` navigates after followed server redirects; only string `message` values are toasted and only `redirect`/`redirect_url` keys redirect; `init()` accepts a selector or a root; `static destroyAll(root)`.

```typescript
/**
 * CGEActionButton - TypeScript Definitions
 * Type definitions for TailTools CGEActionButton plugin.
 */

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
  /**
   * Target API URL for direct async execution. Plain `<a href>` triggers navigate after
   * confirmation; their href is only used as the AJAX URL with `ajax` or an explicit `method`.
   */
  url?: string | null;
  /** HTTP method for direct async execution */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | string;
  /**
   * Form selector to submit upon confirmation. Without it, submit buttons use their own form;
   * anchors never do and `type="button"` controls only with `ajax`. Native submits use
   * `requestSubmit()`, so `submit` listeners (CGEForm, Livewire) run and the submitter is kept.
   */
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
  /** Automated redirect destination URL (otherwise JSON `redirect` / `redirect_url` keys) */
  redirect?: string | null;
  /** Navigate to the final URL when fetch/axios transparently followed a server redirect (default true) */
  followRedirects?: boolean;
  /** Milliseconds after which a pending navigation that never unloaded the page re-enables the button (default 5000; 0 disables) */
  redirectTimeout?: number;
  /** Bypass confirmation dialog and execute immediately */
  instant?: boolean;
  /** Simulated async duration in milliseconds (useful for prototyping, demos, or minimum spin time) */
  simulate?: number;
  /** Additional HTTP headers (merged over Accept, X-Requested-With and CSRF headers) */
  headers?: Record<string, string>;
  /** Axios instance used before `window.axios`; fetch is used when neither exists */
  axiosInstance?: any;
  /** Localization dictionary */
  translations?: Partial<CGEActionButtonTranslations>;
  /** Custom execution callback handler */
  onExecute?: (instance: CGEActionButton) => Promise<any> | any;
}

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
  /**
   * Binds the capture-phase delegated click listener once. Pass a trigger selector to customize it,
   * or a root (Document/Element) — instances whose elements were removed are pruned either way.
   */
  static init(target?: string | Document | Element): void;
  /** Destroys instances whose element is inside root or disconnected. */
  static destroyAll(root?: Document | Element): CGEActionButton[];

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

export default CGEActionButton;
```
