import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// Tiny valid PNGs embedded as data URLs to avoid manifest icon fetch issues on Android.
// 192x192 (opaque yellow) and 512x512 (opaque yellow). These are valid PNG payloads.
const ICON_192 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADAAAAAAACuQ0kQAAAACXBIWXMAAAsSAAALEgHS3X78AAAAG0lEQVR4nO3BMQEAAADCoPdPbQ43oAAAAAAAAAAAfh4HnQAAAf2jZ1sAAAAASUVORK5CYII='
const ICON_512 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsSAAALEgHS3X78AAAAK0lEQVQYV2NgYGD4z0AEYGBg+M/AwMCgGQwGQwZDBgYGQyGQAAI0Q8A9sQX8iUAAIh5E0Vf7Qj6AAAAAElFTkSuQmCC'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
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
          { src: ICON_192, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: ICON_512, sizes: '512x512', type: 'image/png', purpose: 'any' }
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