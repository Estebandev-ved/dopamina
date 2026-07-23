import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Dopamina | Mocoa Underground Scene',
        short_name: 'Dopamina',
        description: 'Eventos underground, boletas, y la mejor escena de Mocoa.',
        theme_color: '#0A0A0F',
        background_color: '#0A0A0F',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        id: '/',
        lang: 'es-CO',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/(?!admin\/).*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              },
              networkTimeoutSeconds: 5
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
})
