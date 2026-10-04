# CGEToast - TypeScript API Reference

This document provides the complete TypeScript API definitions, types, interfaces, and DOM event contracts for `CGEToast`.

---

## Type Definitions

### `CGEToastVariant`
Semantic styling variants supported by the alert system:
```typescript
export type CGEToastVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';
```

### `CGEToastPosition`
Viewport placement coordinates and banner modes:
```typescript
export type CGEToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'center'
  | 'top-full'
  | 'bottom-full';
```

### `CGEToastTheme`
Theme modes for card, typography, and button contrast:
```typescript
export type CGEToastTheme = 'light' | 'dark' | 'auto';
```

---

## Interfaces

### `CGEToastAction`
Definition for interactive buttons rendered inside the notification card:
```typescript
export interface CGEToastAction {
  /** Button text label */
  label: string;
  /** Optional custom CSS classes (Tailwind utilities) */
  class?: string;
  /** Click event handler callback */
  onClick?: (toast: CGEToast, event: MouseEvent) => void;
}
```

### `CGEToastImage`
Custom avatar or image slot:
```typescript
export interface CGEToastImage {
  /** Image source URL */
  src: string;
  /** Accessible alt text */
  alt?: string;
  /** Optional custom CSS classes */
  class?: string;
}
```

### `CGEToastTranslations`
Dictionary for internationalization (i18n):
```typescript
export interface CGEToastTranslations {
  close?: string;
  undo?: string;
  'success-title'?: string;
  'error-title'?: string;
  'warning-title'?: string;
  'info-title'?: string;
  'neutral-title'?: string;
  [key: string]: string | undefined;
}
```

### `CGEToastOptions`
Complete options object accepted by `CGEToast` constructors and static helpers:
```typescript
export interface CGEToastOptions {
  /** Primary notification message text (supports HTML markup) */
  message: string;

  /** Header title text. If omitted, uses localized default variant title */
  title?: string | null;

  /** Semantic theme variant (default: 'neutral') */
  variant?: CGEToastVariant;

  /** Viewport position (default: 'top-right') */
  position?: CGEToastPosition;

  /** Countdown duration in ms. Set false or 0 for persistent toasts (default: 5000) */
  duration?: number | false;

  /** Render animated countdown progress bar at bottom of card (default: true) */
  progressBar?: boolean;

  /** Freeze countdown timer while cursor is hovered over toast (default: true) */
  pauseOnHover?: boolean;

  /** Dismiss notification upon clicking the card (default: false) */
  dismissOnClick?: boolean;

  /** Show dedicated close button (default: true) */
  dismissible?: boolean;

  /** Enable touch horizontal swipe flick gesture on mobile devices (default: true) */
  swipeToDismiss?: boolean;

  /** Render variant SVG icon, custom SVG string, or disable with false (default: true) */
  icon?: boolean | string;

  /** Custom image or avatar object */
  image?: CGEToastImage | null;

  /** Action buttons rendered inside notification card */
  actions?: CGEToastAction[];

  /** Prepend new toasts to top of stack when true (default: true) */
  newestOnTop?: boolean;

  /** Maximum concurrent notifications allowed in this container (default: 5) */
  maxToasts?: number;

  /** Driver for entry and exit transitions ('auto' | 'tailwind-animations' | 'css' | 'none') */
  animationDriver?: 'auto' | 'tailwind-animations' | 'css' | 'none';

  /** Translation overrides for this specific toast */
  translations?: Partial<CGEToastTranslations>;

  /** Callback fired immediately when toast mounts into DOM */
  onOpen?: (toast: CGEToast) => void;

  /** Callback fired after toast is dismissed and removed from DOM */
  onClose?: (toast: CGEToast) => void;

  /** Callback fired when toast card is clicked */
  onClick?: (toast: CGEToast, event: MouseEvent) => void;
}
```

### `CGEToastEventDetail`
Payload attached to DOM CustomEvents (`e.detail`):
```typescript
export interface CGEToastEventDetail {
  toast: CGEToast;
  variant: CGEToastVariant;
  message: string;
  position: CGEToastPosition;
  event?: MouseEvent;
  [key: string]: any;
}
```

---

## Class Definition

```typescript
export declare class CGEToast {
  static activeToasts: Set<CGEToast>;
  static containers: Map<string, HTMLElement>;
  static translations: CGEToastTranslations;
  static defaults: CGEToastOptions;
  static ICONS: Record<string, string>;
  static VARIANTS: Record<string, { border: string; progress: string; badge: string }>;

  id: string;
  isOpen: boolean;
  isPaused: boolean;
  remainingTime: number;
  options: CGEToastOptions;
  translations: CGEToastTranslations;
  container: HTMLElement;
  el: HTMLElement;

  constructor(options: CGEToastOptions);

  /** Pauses the countdown timer */
  pause(): void;

  /** Resumes the countdown timer */
  resume(): void;

  /** Dismisses and unmounts the notification card */
  dismiss(): Promise<boolean>;

  /** Launches a toast notification */
  static show(options: CGEToastOptions): CGEToast;

  /** Shortcut for success notification */
  static success(message: string, options?: Partial<CGEToastOptions>): CGEToast;

  /** Shortcut for error notification */
  static error(message: string, options?: Partial<CGEToastOptions>): CGEToast;

  /** Shortcut for warning notification */
  static warning(message: string, options?: Partial<CGEToastOptions>): CGEToast;

  /** Shortcut for info notification */
  static info(message: string, options?: Partial<CGEToastOptions>): CGEToast;

  /** Dismisses all active notifications, or target a specific position */
  static dismissAll(position?: CGEToastPosition | null): void;

  /** Reconfigures global translation dictionary */
  static setTranslations(dict: Partial<CGEToastTranslations>): void;

  /** Scans document for declarative triggers and session flash templates */
  static init(root?: Document | HTMLElement): void;
}
```

---

## Global DOM Events

`CGEToast` extends `DocumentEventMap` to provide type-safe event listeners:

```typescript
declare global {
  interface DocumentEventMap {
    'cge:toast:open': CustomEvent<CGEToastEventDetail>;
    'cge:toast:close': CustomEvent<CGEToastEventDetail>;
    'cge:toast:click': CustomEvent<CGEToastEventDetail>;
  }
}
```
