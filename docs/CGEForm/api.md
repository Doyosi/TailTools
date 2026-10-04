# CGEForm API

This reference mirrors the shipped [declaration](../../plugins/CGEForm/CGEForm.d.ts). Both named and default class imports are supported by the plugin barrel.

All drivers send Laravel multipart PUT/PATCH/DELETE as POST plus _method. FormData is captured before freezing and includes the SubmitEvent submitter. Concurrent submissions are prevented. Destroy aborts Axios/Fetch/XHR, cancels redirect timers, restores frozen controls and suppresses late callbacks/events; delayed beforeSubmit cannot start a request afterward. Input/change listeners and plugin-added novalidate are restored on teardown.

```typescript
/**
 * TypeScript Definitions for CGEForm - TailTools Plugin
 * High-performance, reactive AJAX form handling plugin designed specifically for Laravel Blade and modern Tailwind CSS v4+ frontends.
 */

export type CGEFormDriver = 'axios' | 'fetch' | 'xhr';

export type CGEFormFeedbackType = 'toast' | 'alert' | 'native' | 'sweetalert' | 'custom' | 'none';

export type CGEFormFeedbackCustomHandler = (
  status: 'success' | 'validation' | 'error',
  message: string,
  payload: any,
  form: HTMLFormElement
) => void;

export interface CGEFormFeedbackOptions {
  type?: CGEFormFeedbackType;
  options?: Record<string, any>;
  onSuccess?: CGEFormFeedbackType | CGEFormFeedbackCustomHandler | null;
  onError?: CGEFormFeedbackType | CGEFormFeedbackCustomHandler | null;
  onValidationError?: CGEFormFeedbackType | CGEFormFeedbackCustomHandler | null;
}

export type CGEFormTranslations = Record<string, string>;

export interface CGEFormSubmitEventDetail {
  form: CGEForm;
  formData: FormData;
  url: string;
  method: string;
}

export interface CGEFormSuccessEventDetail {
  form: CGEForm;
  response: any;
  data: any;
}

export interface CGEFormErrorEventDetail {
  form: CGEForm;
  error: any;
  response: any;
}

export interface CGEFormInvalidEventDetail {
  form: CGEForm;
  errors: Record<string, string[] | string>;
  response: any;
  error?: any;
}

export interface CGEFormCompleteEventDetail {
  form: CGEForm;
  ok: boolean;
  response: any;
}

export interface CGEFormRedirectEventDetail {
  form: CGEForm;
  url: string;
  response: any;
}

export interface CGEFormProgressEventDetail {
  form: CGEForm;
  percent: number;
  loaded: number;
  total: number;
}

export interface CGEFormOptions {
  driver?: CGEFormDriver;
  url?: string | null;
  method?: string | null;
  headers?: Record<string, string>;
  feedback?: CGEFormFeedbackType | CGEFormFeedbackOptions;
  autoClearErrors?: boolean;
  invalidClass?: string;
  validClass?: string;
  groupErrorClass?: string;
  showLoadingIndicator?: boolean;
  loadingText?: string | null;
  freezeInputs?: boolean;
  resetOnSuccess?: boolean;
  redirectDelay?: number;
  onRedirect?: ((url: string, payload: any) => boolean | void) | null;
  translations?: CGEFormTranslations;
  beforeSubmit?: ((formData: FormData, formInstance: CGEForm) => boolean | Promise<boolean>) | null;
  onSubmit?: ((data: CGEFormSubmitEventDetail) => void) | null;
  onSuccess?: ((data: CGEFormSuccessEventDetail) => void) | null;
  onError?: ((data: CGEFormErrorEventDetail) => void) | null;
  onInvalid?: ((data: CGEFormInvalidEventDetail) => void) | null;
  onComplete?: ((data: CGEFormCompleteEventDetail) => void) | null;
  axiosInstance?: any;
}

export class CGEForm {
  /**
   * Registry of initialized form instances mapped to their HTMLFormElement.
   */
  static instances: Map<HTMLFormElement, CGEForm>;

  /**
   * Active global locale.
   */
  static currentLocale: string;

  /**
   * Global translations registry supporting multi-language dictionaries.
   */
  static translations: Record<string, CGEFormTranslations>;

  /**
   * Default configuration options for CGEForm instances.
   */
  static defaults: CGEFormOptions;

  /**
   * Set or update translations for a specific locale, or the current locale.
   */
  static setTranslations(
    localeOrTranslations: string | CGEFormTranslations,
    translations?: CGEFormTranslations
  ): void;

  /**
   * Set active locale code and optional dictionary.
   */
  static setLocale(locale: string, translations?: CGEFormTranslations): void;

  /**
   * Global static translation resolver with placeholder replacement.
   */
  static t(
    key: string,
    placeholders?: Record<string, string | number>,
    locale?: string
  ): string;

  /**
   * Retrieve an initialized CGEForm instance for a given element or selector.
   */
  static getInstance(element: HTMLFormElement | string): CGEForm | null;

  /**
   * Get an existing instance or initialize a new one.
   */
  static getOrCreateInstance(
    element: HTMLFormElement | string,
    options?: CGEFormOptions
  ): CGEForm;

  /**
   * Automatically initializes all forms matching [data-cge-form] within a container root.
   */
  static init(root?: Document | HTMLElement): CGEForm[];

  /**
   * The underlying HTMLFormElement.
   */
  form: HTMLFormElement;

  /**
   * Active resolved options for this instance.
   */
  options: CGEFormOptions;

  /**
   * Constructs and attaches a new CGEForm instance.
   */
  constructor(target: HTMLFormElement | string, options?: CGEFormOptions);

  /**
   * Instance-level translation resolver following the strict precedence hierarchy.
   */
  t(key: string, placeholders?: Record<string, string | number>): string;

  /**
   * Resolves and binds Laravel 422 JSON validation errors to the DOM.
   */
  bindErrors(errors: Record<string, string[] | string>): void;

  /**
   * Clears all validation errors and feedback across the entire form.
   */
  clearErrors(): void;

  /**
   * Resets all fields in the form and clears errors.
   */
  reset(): void;

  /**
   * Manually triggers the freeze/loading state.
   */
  freeze(): void;

  /**
   * Manually unfreezes and restores button and input states.
   */
  unfreeze(): void;

  /**
   * Fluent instance event registration.
   */
  on(event: 'submit', callback: (data: CGEFormSubmitEventDetail) => void): this;
  on(event: 'success', callback: (data: CGEFormSuccessEventDetail) => void): this;
  on(event: 'error', callback: (data: CGEFormErrorEventDetail) => void): this;
  on(event: 'invalid', callback: (data: CGEFormInvalidEventDetail) => void): this;
  on(event: 'complete', callback: (data: CGEFormCompleteEventDetail) => void): this;
  on(event: 'redirect', callback: (data: CGEFormRedirectEventDetail) => void): this;
  on(event: 'progress', callback: (data: CGEFormProgressEventDetail) => void): this;
  on(event: string, callback: (...args: any[]) => void): this;

  /**
   * Fluent instance event unregistration.
   */
  off(event: string, callback?: (...args: any[]) => void): this;

  /**
   * Programmatically triggers a form submission.
   */
  submit(): Promise<any>;

  /**
   * Completely destroys the CGEForm instance, removing listeners and clearing DOM references.
   */
  destroy(): void;
}

export default CGEForm;
```
