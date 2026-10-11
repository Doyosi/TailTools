import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// ESM build: side-effect-free root entry plus the opt-in auto entry.
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: { output: { exports: 'named', chunkFileNames: 'tailtools-[name].js' } },
    lib: {
      entry: { tailtools: 'src/index.ts', auto: 'src/auto.ts' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: 'tailtools',
    },
  },
});
