/**
 * TailTools auto entry: exposes globals, initializes on DOM ready and keeps plugins in sync
 * with Livewire (v3) and Turbo page updates. Configure before importing with
 * window.TailToolsConfig = { autoInit, livewire, turbo, globals }.
 */

import TailTools, { initTailTools, destroyTailTools } from './index';
import { CGETabs } from '../plugins/CGETabs';

export * from './index';
export { default } from './index';

type AutoConfig = { autoInit?: boolean; livewire?: boolean; turbo?: boolean; globals?: boolean };

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const w = window as any;
  const config: AutoConfig = { autoInit: true, livewire: true, turbo: true, globals: true, ...(w.TailToolsConfig || {}) };

  // AJAX tab panels initialize nested plugins without relying on globals.
  CGETabs.setPanelInitializer((panel: HTMLElement) => initTailTools(panel), (panel: HTMLElement) => destroyTailTools(panel));

  // The UMD wrapper pre-assigns an empty exports object to window.TailTools, so check for init.
  if (config.globals !== false && typeof w.TailTools?.init !== 'function') {
    w.TailTools = TailTools;
    for (const [name, value] of Object.entries(TailTools)) {
      if (name.startsWith('CGE') && !(name in w)) w[name] = value;
    }
  }

  if (config.autoInit !== false && !w.__TAILTOOLS_AUTO__) {
    w.__TAILTOOLS_AUTO__ = true;
    const run = () => initTailTools();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
    else run();

    if (config.turbo !== false) {
      // Re-init prunes instances whose elements Turbo replaced, so permanent elements survive.
      document.addEventListener('turbo:load', run);
    }

    if (config.livewire !== false) {
      // wire:navigate swaps the page and morph updates replace or strip plugin markup;
      // re-init destroys detached instances and keeps @persist elements alive.
      document.addEventListener('livewire:navigated', run);
      const hookLivewire = () => {
        const livewire = w.Livewire;
        if (!livewire?.hook || w.__TAILTOOLS_LIVEWIRE__) return;
        w.__TAILTOOLS_LIVEWIRE__ = true;
        livewire.hook('commit', ({ succeed }: { succeed: (callback: () => void) => void }) => {
          succeed(() => queueMicrotask(run));
        });
      };
      document.addEventListener('livewire:init', hookLivewire);
      hookLivewire();
    }
  }
}
