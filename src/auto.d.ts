export * from 'tailtools';
export { default } from 'tailtools';

declare global {
  interface Window {
    /** Read once by 'tailtools/auto' before it initializes. */
    TailToolsConfig?: { autoInit?: boolean; livewire?: boolean; turbo?: boolean; globals?: boolean };
  }
}
