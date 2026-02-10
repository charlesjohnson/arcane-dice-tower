/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Arcane Dice Tower',
        short_name: 'Dice Tower',
        description: 'A magical 3D dice roller for tabletop RPGs',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['src/ui/**', 'jsdom'],
    ],
    setupFiles: ['src/ui/jsdom-setup.ts'],
  },
});
