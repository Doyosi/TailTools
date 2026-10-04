# Technical Plan: CGEToast Plugin

**Plugin:** `CGEToast`  
**Package:** `tailtools`  
**Target Environment:** Tailwind CSS v4.3+, Native JavaScript (ES2022+), TypeScript, Laravel Blade & Vite  
**Status:** In Progress  

---

## 1. Executive Summary & Objective

`CGEToast` is a lightweight, zero-dependency, high-performance notification and toast alert system engineered for Tailwind CSS v4.3+ and Laravel Blade. It provides a global singleton portal architecture, 8 standard floating positions plus top/bottom full-width banner modes, semantic color palettes with built-in SVG icons, animated countdown progress bars with hover-pause, touch swipe gestures, and full HTML and avatar support.

---

## 2. API Specification

### 2.1 Static API
```typescript
CGEToast.success(message: string, options?: CGEToastOptions): CGEToast;
CGEToast.error(message: string, options?: CGEToastOptions): CGEToast;
CGEToast.warning(message: string, options?: CGEToastOptions): CGEToast;
CGEToast.info(message: string, options?: CGEToastOptions): CGEToast;
CGEToast.show(options: CGEToastOptions): CGEToast;
CGEToast.dismissAll(position?: CGEToastPosition): void;
CGEToast.setTranslations(dict: Partial<CGEToastTranslations>): void;
```

### 2.2 Instance Creation & Options
```typescript
const toast = new CGEToast({
  message: 'Profile updated successfully!',
  title: 'Success',
  variant: 'success', // 'success' | 'error' | 'warning' | 'info' | 'neutral'
  position: 'top-right', // 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center' | 'top-full' | 'bottom-full'
  duration: 5000, // ms, or false / 0 for persistent
  progressBar: true,
  pauseOnHover: true,
  dismissOnClick: false,
  dismissible: true,
  swipeToDismiss: true,
  icon: true, // boolean or custom SVG string / HTMLElement
  image: { src: '/avatar.jpg', alt: 'Avatar', class: 'w-10 h-10 rounded-full' },
  actions: [
    { label: 'Undo', class: 'px-2 py-1 bg-slate-800 text-xs rounded', onClick: (toast, event) => { ... } }
  ],
  translations: { close: 'Close notification', undo: 'Undo' },
  onOpen: (toast) => {},
  onClose: (toast) => {},
  onClick: (toast, event) => {},
});
```

### 2.3 Instance Methods
- `toast.dismiss(): Promise<boolean>`
- `toast.pause(): void`
- `toast.resume(): void`
- `toast.el: HTMLElement`
- `toast.isOpen: boolean`

### 2.4 Events
- `cge:toast:open` (detail: `{ toast, variant, message, position }`)
- `cge:toast:close` (detail: `{ toast, variant, message, position }`)
- `cge:toast:click` (detail: `{ toast, event }`)

---

## 3. Positioning & Portal Architecture

1. **Singleton Portal Containers:**
   Containers are dynamically lazily injected under `document.body` for each position:
   - Container class: `fixed z-[99999] pointer-events-none p-4 flex flex-col gap-3 max-w-full`
   - Individual toast card: `pointer-events-auto`
   - Full-width banners (`top-full`, `bottom-full`):
     - `w-full max-w-none inset-x-0 p-0`
     - Toast card spans 100vw edge-to-edge without horizontal scrollbars.
2. **Stacking & Queueing:**
   - Default `maxToasts: 5`. When exceeding, oldest toast automatically dismisses.
   - `newestOnTop: true` prepends to container; `false` appends.
3. **Swipe-to-Dismiss:**
   - Touch listeners on toast element track `deltaX`.
   - Card moves with finger and fades opacity (`translate3d(${dx}px, 0, 0)`).
   - Dismisses if gesture exceeds 60px; otherwise snaps back smoothly.

---

## 4. Dual-Mode Animation Strategy

- **Mode A (`tailwind-animations`):**
  - Top positions: `animate-fade-in-down` entry, `animate-fade-out` / `animate-slide-out-right` exit.
  - Bottom positions: `animate-fade-in-up` entry, `animate-slide-out-right` exit.
- **Mode B (Standard Tailwind Transitions Fallback):**
  - Entry: `transition-all duration-300 ease-out opacity-0 translate-y-2` -> `opacity-100 translate-y-0`.
  - Exit: `opacity-100 translate-y-0` -> `opacity-0 translate-y-2 scale-95`.

---

## 5. Laravel Blade Synergy

- Declarative data attributes: `<button data-cge-toast="Order Placed!" data-cge-toast-variant="success">`
- Session flash component: `<x-cge-toast />` reading Laravel `@if(session('success'))`.

## Maintenance audit — 2026-10-04
Consume each session flash once; honor zero/false declarative duration.
Preserve existing public methods, CSS, Blade markup and exports. Verify programmatic and declarative behavior with regression fixtures; update docs and consumer guidance. No new dependencies or redesign.

## 2026-10-04 ek bakım planı
REPORTS.md içindeki tüm bakım adaylarını mevcut API ve tasarımı koruyarak uygulama: lifecycle/abort, ortak overlay sahipliği, erişilebilirlik, form verisi, paket/type doğrulaması ve belge tekilleştirme. Plugin özelindeki davranışlar regresyonlarla doğrulanacak.
