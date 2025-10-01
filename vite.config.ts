import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/web/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // We keep manifest in public/manifest.webmanifest
      manifest: undefined,
      includeAssets: [
        'favicon.svg',
        'icons/icon-192.png',
        'icons/icon-512.png'
        // If you create an optimized version (webp) UNDER 2MB you can add it here:
        // 'screensaver/bat-opel.webp'
      ],
      workbox: {
        // Standard glob; we still include png globally (icons, small pngs), then ignore the heavy one.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif,jpg,jpeg,gif}'],
        globIgnores: [
          '**/screensaver/bat-opel.png' // <— prevents error; not precached, still loadable at runtime
        ],
        runtimeCaching: [
          {
            urlPattern: /screensaver\/bat-opel\.(png|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'screensaver-logo',
              expiration: {
                maxEntries: 2,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.spotify\.com\//,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/sdk\.scdn\.co\//,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /.*\.(?:png|webp|jpg|jpeg|gif|svg|ico)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 14
              }
            }
          }
        ]
      },
      devOptions: { enabled: true }
    })
  ],
  server: { host: true, port: 5173 },
  build: { target: 'esnext' }
})