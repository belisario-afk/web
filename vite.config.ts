import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Opel Z',
        short_name: 'Opel Z',
        description: '3D Spotify Dashboard for Samsung Galaxy Tab SMT77U',
        start_url: '/web/',
        scope: '/web/',
        display: 'fullscreen',
        background_color: '#0A0F14',
        theme_color: '#0A0F14',
        orientation: 'landscape',
        icons: [
          { src: '/web/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/web/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        navigateFallback: '/web/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          { urlPattern: /^https:\/\/sdk\.scdn\.co\//, handler: 'NetworkOnly' },
          { urlPattern: /^https:\/\/accounts\.spotify\.com\//, handler: 'NetworkOnly' },
          { urlPattern: /^https:\/\/api\.spotify\.com\//, handler: 'NetworkOnly' },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'images', expiration: { maxEntries: 60, maxAgeSeconds: 604800 } }
          }
        ]
      },
      devOptions: { enabled: true }
    })
  ],
  base: '/web/',
  server: { host: true, port: 5173 },
  build: { target: 'esnext' }
})