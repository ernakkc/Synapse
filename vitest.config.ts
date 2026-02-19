import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/example.ts',
        '**/example-usage.ts'
      ]
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'tests/logger.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@interfaces': path.resolve(__dirname, './src/interfaces'),
      'config': path.resolve(__dirname, './config')
    }
  }
});
