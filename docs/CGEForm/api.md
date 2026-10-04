# CGEForm API Reference

Full TypeScript interfaces, constructors, methods, and event payload contracts for `CGEForm`.

---

## 1. Type Definitions

```typescript
export type CGEFormDriver = 'axios' | 'fetch' | 'xhr';

export type CGEFormFeedbackType =
  | 'toast'
  | 'alert'
  | 'native'
  | 'sweetalert'
  | 'custom'
  | 'none';

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
```

---

## 2. Event Payloads

```typescript
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

export interface CGEFormInvalidEventDetail {
  form: CGEForm;
  errors: Record<string, string[] | string>;
  response: any;
  error?: any;
}

export interface CGEFormErrorEventDetail {
  form: CGEForm;
  error: any;
  response: any;
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
```

---

## 3. Static Methods & Properties

### `CGEForm.instances`
`Map<HTMLFormElement, CGEForm>`: Active registry of all initialized form instances.

### `CGEForm.init(root?: Document | HTMLElement): CGEForm[]`
Discovers and initializes all uninitialized forms matching `form[data-cge-form]` in the given root element.

### `CGEForm.getInstance(element: HTMLFormElement | string): CGEForm | null`
Returns the `CGEForm` instance associated with a DOM element or selector.

### `CGEForm.getOrCreateInstance(element: HTMLFormElement | string, options?: CGEFormOptions): CGEForm`
Retrieves the existing instance or creates a new one.

### `CGEForm.setTranslations(localeOrTranslations: string | Record<string, string>, translations?: Record<string, string>): void`
Merges translation strings into the global dictionary.

### `CGEForm.setLocale(locale: string, translations?: Record<string, string>): void`
Changes the active global locale and optionally registers new translations.

### `CGEForm.t(key: string, placeholders?: Record<string, string | number>, locale?: string): string`
Resolves a translation key globally with optional placeholder interpolation.

---

## 4. Instance Methods & Properties

### `form.form`
`HTMLFormElement`: The wrapped native form element.

### `form.options`
`CGEFormOptions`: Resolved options for this instance.

### `form.t(key: string, placeholders?: Record<string, string | number>): string`
Instance-scoped translation lookup respecting form dataset overrides, options, and global fallbacks.

### `form.bindErrors(errors: Record<string, string[] | string>): void`
Binds Laravel validation errors to matching inputs and feedback containers.

### `form.clearErrors(): void`
Clears invalid styles, attributes, and error feedback across the form.

### `form.reset(): void`
Resets inputs to their default values and clears all error states.

### `form.submit(): Promise<any>`
Triggers an AJAX submission programmatically.

### `form.on(event: string, callback: Function): this`
Fluent event listener registration.

### `form.off(event: string, callback?: Function): this`
Removes a registered event listener.

### `form.destroy(): void`
Removes submit listeners, resets error states, clears memory registries, and unregisters the instance.
