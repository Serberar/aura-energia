import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'tsconfig-paths';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@domain':         path.resolve(__dirname, 'src/domain'),
      '@application':    path.resolve(__dirname, 'src/application'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
    },
  },
  test: {
    globals:     true,
    environment: 'node',
    include:     ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include:  ['src/**/*.ts'],
      exclude:  ['src/server.ts', 'src/**/*.test.ts'],
    },
  },
});
