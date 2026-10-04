import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    rollupOptions: { output: { exports: 'named' } },
    lib: {
      entry: 'src/index.ts',
      name: 'TailTools',
      formats: ['es', 'umd'],
      fileName: format => format === 'es' ? 'tailtools.js' : 'tailtools.umd.cjs',
      cssFileName: 'tailtools',
    },
  },
});
