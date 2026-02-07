import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    main: 'src/interfaces/electron/main/index.ts', 
    preload: 'src/interfaces/electron/preload/index.ts'
  },
  outDir: 'dist',
  format: ['esm'],         // ESM Formatı
  target: 'node20',        // Electron için güncel node sürümü
  clean: true,             // Her seferinde temizle
  shims: true,             // __dirname hatalarını çözer
  splitting: false,        
  sourcemap: true,         
  external: ['electron'],  
});