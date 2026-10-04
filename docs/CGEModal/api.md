# CGEModal API Reference

Comprehensive TypeScript declarations, interface contracts, and DOM event specifications for `CGEModal`.

---

## 1. Type Definitions

```typescript
export type CGEModalSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | 'full'
  | string;

export type CGEModalAnimationDriver = 'auto' | 'tailwind-animations' | 'css' | 'none';

export type CGEModalAnimation = 'zoom' | 'fade' | 'slide-up' | 'slide-down' | string;

export interface CGEModalOptions {
  /**
   * Dismissal behavior on backdrop click.
   * If `true`, clicking backdrop closes modal.
   * If `'static'`, outside clicks shake the dialog card.
   * If `false`, backdrop does not close modal.
   * @default true
   */
  backdrop?: boolean | 'static';

  /**
   * Shorthand alias for backdrop dismissal behavior.
   * @default true
   */
  backdropClose?: boolean;

  /**
   * Whether pressing Escape key closes the modal.
   * If `false` and `backdrop` is `'static'`, triggers shake effect.
   * @default true
   */
  escapeClose?: boolean;

  /**
   * Sizing preset key or custom Tailwind max-width class.
   * @default 'lg'
   */
  size?: CGEModalSize;

  /**
   * Animation engine driver mode.
   * @default 'auto'
   */
  animationDriver?: CGEModalAnimationDriver;

  /**
   * Preset animation style name.
   * @default 'zoom'
   */
  animation?: CGEModalAnimation;

  /**
   * Trap keyboard Tab focus inside open modal.
   * @default true
   */
  focusTrap?: boolean;

  /**
   * Autofocus first interactive element or selector on open.
   * @default true
   */
  autoFocus?: boolean | string;

  /**
   * Restore focus to trigger element upon closing.
   * @default true
   */
  restoreFocus?: boolean;

  /**
   * Lock body scrolling while open (with scrollbar compensation).
   * @default true
   */
  lockScroll?: boolean;

  /**
   * Animation duration in milliseconds for cleanup timers.
   * @default 250
   */
  duration?: number;
}

export interface CGEModalEventDetail {
  instance: CGEModal;
  modal: HTMLElement;
  dialog: HTMLElement | null;
  trigger?: HTMLElement | null;
  [key: string]: any;
}
```

---

## 2. Class Signature

```typescript
export class CGEModal {
  static instances: Map<HTMLElement, CGEModal>;
  static SIZES: Record<string, string>;
  static defaults: CGEModalOptions;

  modal: HTMLElement;
  dialog: HTMLElement | null;
  backdrop: HTMLElement | null;
  options: CGEModalOptions;

  constructor(target: string | HTMLElement, options?: CGEModalOptions);

  init(): void;
  open(triggerElement?: HTMLElement | null): Promise<boolean>;
  close(): Promise<boolean>;
  toggle(triggerElement?: HTMLElement | null): Promise<boolean>;
  shake(): void;
  setSize(newSize: CGEModalSize): this;
  get isOpen(): boolean;
  destroy(): void;

  static getInstance(target: string | HTMLElement): CGEModal | undefined;
  static getOrCreateInstance(target: string | HTMLElement, options?: CGEModalOptions): CGEModal;
  static closeAll(): void;
  static init(root?: Document | HTMLElement): void;
}
```

---

## 3. DOM Events Contract

All custom events bubble (`bubbles: true`) and can be attached to the modal element or delegated to `document`:

| Event Name | Cancelable | Detail Payload | Trigger Timing |
| :--- | :--- | :--- | :--- |
| `cge:modal:open` | Yes | `{ instance, modal, dialog, trigger }` | Before open transitions begin. Calling `e.preventDefault()` halts opening. |
| `cge:modal:opened` | No | `{ instance, modal, dialog, trigger }` | After entry transition finishes and focus is applied. |
| `cge:modal:close` | Yes | `{ instance, modal, dialog }` | Before exit transitions begin. Calling `e.preventDefault()` halts closing. |
| `cge:modal:closed` | No | `{ instance, modal, dialog }` | After exit transition completes and focus is restored. |
| `cge:modal:shake` | No | `{ instance, modal, dialog }` | Whenever shake animation is triggered. |
| `cge:modal:init` | No | `{ instance, modal, dialog }` | Upon modal initialization. |
| `cge:modal:destroy` | No | `{ instance, modal, dialog }` | Upon modal destruction. |

---

## 4. Accessibility (a11y) Specifications

- **`role="dialog"`**: Automatically attached to the modal root container if not present.
- **`aria-modal="true"`**: Informs assistive technologies that elements outside the dialog are inert.
- **`aria-hidden="false"` / `"true"`**: Synchronized with visibility states.
- **Focus Trap Loop**:
  - Focusable query: `a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])`.
  - Pressing <kbd>Tab</kbd> on the last element wraps to the first element.
  - Pressing <kbd>Shift+Tab</kbd> on the first element wraps to the last element.
- **Scroll Lock & Shift Compensation**:
  - Automatically calculates scrollbar width via `window.innerWidth - document.documentElement.clientWidth`.
  - Sets padding on `document.body` before applying `overflow-hidden` to avoid visual jarring.
