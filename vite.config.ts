/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['src/ui/**', 'jsdom'],
    ],
    setupFiles: ['src/ui/jsdom-setup.ts'],
  },
});
