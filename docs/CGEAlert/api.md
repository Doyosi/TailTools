# CGEAlert - TypeScript API Reference

Complete TypeScript interfaces, type definitions, and DOM event contracts for `CGEAlert`.

---

## Type Definitions

### `CGEAlertArchetype`
```typescript
export type CGEAlertArchetype =
  | 'alert'
  | 'confirm'
  | 'delete'
  | 'restore'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'prompt'
  | 'custom';
```

### `CGEAlertInputType`
```typescript
export type CGEAlertInputType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'password'
  | 'select'
  | 'number';
```

### `CGEAlertSize`
```typescript
export type CGEAlertSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
```

### `CGEAlertTheme`
```typescript
export type CGEAlertTheme = 'light' | 'dark' | 'auto';
```

---

## Interfaces

### `CGEAlertResult<T = any>`
```typescript
export interface CGEAlertResult<T = any> {
  /** True if user clicked primary confirm button */
  isConfirmed: boolean;
  /** True if user clicked secondary deny button */
  isDenied: boolean;
  /** True if user dismissed dialog via cancel, close, esc, or backdrop */
  isDismissed: boolean;
  /** Specific reason if dismissed */
  dismissReason?: 'backdrop' | 'cancel' | 'close' | 'esc';
  /** Value from input field or custom return value from preConfirm */
  value?: T;
}
```

### `CGEAlertOptions`
```typescript
export interface CGEAlertOptions {
  /** Alert title heading */
  title?: string | null;

  /** Alert plain text message */
  message?: string;

  /** Alert rich HTML content (overrides message) */
  html?: string | null;

  /** Preset archetype styling and button configuration */
  archetype?: CGEAlertArchetype;

  /** Render variant SVG icon, custom SVG string, or disable with false */
  icon?: boolean | string;

  /** Modal sizing preset: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'md') */
  size?: CGEAlertSize;

  /** Show primary confirm button (default: true) */
  showConfirmButton?: boolean;

  /** Text label for confirm button */
  confirmButtonText?: string | null;

  /** Custom CSS classes for confirm button */
  confirmButtonClass?: string;

  /** Show secondary Deny button (default: false) */
  showDenyButton?: boolean;

  /** Text label for deny button */
  denyButtonText?: string | null;

  /** Custom CSS classes for deny button */
  denyButtonClass?: string;

  /** Show Cancel button (default: false, automatically true for confirm/delete/restore/prompt) */
  showCancelButton?: boolean;

  /** Text label for cancel button */
  cancelButtonText?: string | null;

  /** Custom CSS classes for cancel button */
  cancelButtonClass?: string;

  /** Show corner close button (default: true) */
  showCloseButton?: boolean;

  /** Dismiss alert when backdrop overlay is clicked (default: true; if false, shakes dialog) */
  backdropClose?: boolean;

  /** Dismiss alert when Escape key is pressed (default: true; if false, shakes dialog) */
  allowEscapeKey?: boolean;

  /** Automatically focus confirm button on open (default: true) */
  focusConfirm?: boolean;

  /** Trap keyboard Tab focus inside dialog (default: true) */
  trapFocus?: boolean;

  /** Input field type for prompt dialogs */
  input?: CGEAlertInputType | null;

  /** Initial value for input field */
  inputValue?: string;

  /** Placeholder text for input field */
  inputPlaceholder?: string;

  /** Options array or key-value object for select inputs */
  inputOptions?: Record<string, string> | Array<{ value: string | number; label: string }> | null;

  /** Async or sync validator returning an error string if invalid, or null if valid */
  inputValidator?: (value: string) => string | null | Promise<string | null>;

  /** High security confirmation phrase (confirm button disabled until exact match) */
  requireInput?: string | null;

  /** Whether type-to-confirm requires exact case match (default: true) */
  requireInputCaseSensitive?: boolean;

  /** Animation driver ('auto' | 'tailwind-animations' | 'css' | 'none') */
  animationDriver?: 'auto' | 'tailwind-animations' | 'css' | 'none';

  /** Translation overrides */
  translations?: Partial<CGEAlertTranslations>;

  /** Lifecycle hook before dialog opens */
  beforeOpen?: (dialogEl: HTMLElement) => void;

  /** Lifecycle hook after dialog opens and focuses */
  didOpen?: (dialogEl: HTMLElement) => void;

  /** Lifecycle hook before dialog closes */
  willClose?: (dialogEl: HTMLElement) => void;

  /** Async pre-confirm hook before closing; return false to abort dismissal */
  preConfirm?: (value: any) => any | Promise<any>;
}
```

### `CGEAlertEventDetail`
```typescript
export interface CGEAlertEventDetail {
  alert: CGEAlert;
  archetype: CGEAlertArchetype;
  value?: any;
  reason?: string;
  [key: string]: any;
}
```

---

## Static Methods Reference

```typescript
export declare class CGEAlert {
  static fire<T = any>(options?: CGEAlertOptions): Promise<CGEAlertResult<T>>;
  static alert(title: string, message?: string, options?: Partial<CGEAlertOptions>): Promise<CGEAlertResult>;
  static confirm(title: string, message?: string, options?: Partial<CGEAlertOptions>): Promise<CGEAlertResult>;
  static delete(title: string, message?: string, options?: Partial<CGEAlertOptions>): Promise<CGEAlertResult>;
  static restore(title: string, message?: string, options?: Partial<CGEAlertOptions>): Promise<CGEAlertResult>;
  static prompt<T = string>(title: string, inputOptions?: Partial<CGEAlertOptions>): Promise<CGEAlertResult<T>>;
  static close(reason?: 'backdrop' | 'cancel' | 'close' | 'esc'): void;
  static isLoading(): boolean;
  static showLoading(): void;
  static hideLoading(): void;
  static setTranslations(dict: Partial<CGEAlertTranslations>): void;
  static init(root?: Document | HTMLElement): void;
}
```

---

## Global DOM Events

```typescript
declare global {
  interface DocumentEventMap {
    'cge:alert:open': CustomEvent<CGEAlertEventDetail>;
    'cge:alert:confirm': CustomEvent<CGEAlertEventDetail>;
    'cge:alert:cancel': CustomEvent<CGEAlertEventDetail>;
    'cge:alert:close': CustomEvent<CGEAlertEventDetail>;
  }
}
```
