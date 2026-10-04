import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        tailwindcss(),
    ],
    build: {
        outDir: 'dist/demo',
        rollupOptions: {
            input: {
                main: 'index.html',
                regressions: 'tests/regressions.html',
            },
        },
    },
    server: {
        port: 5174,
    },
})
