import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

// Desktop build. The renderer is the exact same app as the web build (no Node APIs used).
export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: { index: fileURLToPath(new URL('./electron/main.ts', import.meta.url)) },
      },
    },
  },
  renderer: {
    root: '.',
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    build: { rollupOptions: { input: fileURLToPath(new URL('./index.html', import.meta.url)) } },
  },
});
