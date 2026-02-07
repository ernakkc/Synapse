import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Electron için gerekli
  root: 'src/interfaces/electron/renderer', // React kodları burada olacak
  build: {
    outDir: '../../../../dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  }
});