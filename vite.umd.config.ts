import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// Script-tag build: exposes TailTools/CGE* globals and initializes automatically.
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: { output: { exports: 'named' } },
    lib: {
      entry: 'src/auto.ts',
      name: 'TailTools',
      formats: ['umd'],
      fileName: () => 'tailtools.umd.cjs',
      cssFileName: 'tailtools',
    },
  },
});
