import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg'],
      manifest: {
        name: 'Questford — Career Quest',
        short_name: 'Questford',
        description: 'Explore careers by stepping into real on-the-job simulations across a cozy world map.',
        theme_color: '#0f1b3d',
        background_color: '#0a1228',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        // Supabase calls must always hit the network, never the precache.
        navigateFallbackDenylist: [/^\/api/, /supabase/],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
