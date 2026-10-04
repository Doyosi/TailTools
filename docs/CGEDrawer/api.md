# CGEDrawer - API Reference

Complete TypeScript definitions, method signatures, properties, and event payloads for **CGEDrawer**.

---

## TypeScript Interfaces & Types

```typescript
export type CGEDrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

export type CGEDrawerSideSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | string;
export type CGEDrawerVerticalSize = 'sm' | 'md' | 'lg' | 'full' | 'auto' | string;
export type CGEDrawerSize = CGEDrawerSideSize | CGEDrawerVerticalSize;

export type CGEDrawerAnimationDriver = 'auto' | 'tailwind-animations' | 'css' | 'none';

export interface CGEDrawerTranslations {
  'close-button'?: string;
  'drawer-label'?: string;
  [key: string]: string | undefined;
}

export interface CGEDrawerSwipeEventDetail {
  direction: CGEDrawerPlacement;
  distance: number;
  progress: number;
  event: TouchEvent;
}

export interface CGEDrawerEventDetail {
  drawer: CGEDrawer;
  [key: string]: any;
}

export interface CGEDrawerOptions {
  placement?: CGEDrawerPlacement;
  size?: CGEDrawerSize;
  backdrop?: boolean | 'static';
  backdropClose?: boolean;
  escapeClose?: boolean;
  animationDriver?: CGEDrawerAnimationDriver;
  swipeClose?: boolean;
  swipeThreshold?: number;
  pushContentSelector?: string | HTMLElement | null;
  mini?: boolean;
  miniWidth?: string;
  lockScroll?: boolean;
  focusTrap?: boolean;
  autoFocus?: boolean | string;
  restoreFocus?: boolean;
  duration?: number;
  translations?: CGEDrawerTranslations;
}
```

---

## Static Members & Registry

### `CGEDrawer.instances: Map<HTMLElement, CGEDrawer>`
Map registry holding all active drawer instances by DOM element.

### `CGEDrawer.SIZES: Object`
Mapping of dimension presets to Tailwind CSS utility classes:
- `side`: `{ sm: 'w-64', md: 'w-80', lg: 'w-96', xl: 'w-1/2', full: 'w-screen' }`
- `vertical`: `{ sm: 'h-48', md: 'h-80', lg: 'h-1/2', full: 'h-screen', auto: 'max-h-[90vh] h-auto' }`

### `CGEDrawer.defaults: CGEDrawerOptions`
The global default configuration applied to newly instantiated drawers.

### `CGEDrawer.translations: CGEDrawerTranslations`
Active fallback dictionary for accessibility labels and button texts.

### `CGEDrawer.get(target: string | HTMLElement): CGEDrawer | null`
Finds an active drawer instance by CSS selector, ID, or DOM element.

### `CGEDrawer.open(target: string | HTMLElement, options?: CGEDrawerOptions): Promise<void>`
Opens a drawer by selector or element.

### `CGEDrawer.close(target: string | HTMLElement): Promise<void>`
Closes a drawer by selector or element.

### `CGEDrawer.toggle(target: string | HTMLElement, options?: CGEDrawerOptions): Promise<void>`
Toggles a drawer by selector or element.

### `CGEDrawer.init(root?: Document | HTMLElement): void`
Binds global declarative triggers for `[data-cge-drawer-target]`, `[data-cge-drawer-close]`, and `[data-cge-drawer-toggle]`.

### `CGEDrawer.setTranslations(dict: CGEDrawerTranslations): void`
Replaces or merges global localization strings.

---

## Instance Members & Methods

### `constructor(target: string | HTMLElement, options?: CGEDrawerOptions)`
Initializes a new drawer instance and binds event listeners.

### `drawer: HTMLElement`
The root container element of the drawer.

### `dialog: HTMLElement | null`
The sliding dialog / panel container.

### `backdrop: HTMLElement | null`
The backdrop overlay element (if enabled).

### `id: string`
Unique element identifier for the drawer.

### `options: CGEDrawerOptions`
Resolved configuration options.

### `open(trigger?: HTMLElement | null): Promise<void>`
Opens the drawer. Resolves when the transition has finished.

### `close(): Promise<void>`
Closes the drawer. Resolves when the exit animation completes.

### `toggle(trigger?: HTMLElement | null): Promise<void>`
Toggles between open and closed states.

### `isOpen(): boolean`
Returns `true` if the drawer is active.

### `on(event: string, callback: Function): this`
Attaches an event listener to the instance. Supported events:
- `'open'`
- `'opened'`
- `'close'`
- `'closed'`
- `'backdropClick'`
- `'swipe'`

### `off(event: string, callback: Function): this`
Detaches an event listener from the instance.

### `destroy(): void`
Unbinds all event listeners, unlocks scroll, and deletes the instance from the registry.

---

## Native DOM CustomEvents

All events bubble and can be caught at the `document` level or on the drawer element itself:

```javascript
document.addEventListener('cge:drawer:opened', (e) => {
  const { drawer } = e.detail;
  console.log(`Drawer "${drawer.id}" opened.`);
});

document.addEventListener('cge:drawer:swipe', (e) => {
  const { direction, distance, progress } = e.detail;
  console.log(`Swiping ${direction}: ${progress * 100}%`);
});
```
