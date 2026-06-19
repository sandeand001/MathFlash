import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      scope: '/MathFlash/',
      base: '/MathFlash/',
      manifest: {
        name: 'Math Flash Cards',
        short_name: 'MathCards',
        description: 'Speedy math fact drills for kids.',
        start_url: '/MathFlash/',
        scope: '/MathFlash/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fefbf3',
        theme_color: '#7c3aed',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}']
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
