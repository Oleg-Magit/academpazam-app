import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// IMPORTANT:
// This app is deployed to:
// https://oleg-magit.github.io/academpazam-app/
// Therefore base MUST match the repository name.

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/academpazam-app/' : '/',

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),

    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'mask-icon.svg',
      ],

      manifest: {
        name: 'AcademPazam',
        short_name: 'AcademPazam',
        description: 'AcademPazam - Degree Progress Tracker',
        theme_color: '#ffffff',
        background_color: '#2563eb',
        display: 'standalone',

        // MUST match repository subpath
        start_url: '/academpazam-app/',
        scope: '/academpazam-app/',

        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },

      // Ensures SPA refresh works on GitHub Pages
      workbox: {
        navigateFallback: '/academpazam-app/index.html',
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-pdf-lib': ['pdf-lib'],
          'vendor-fonts': ['fontkit', '@pdf-lib/fontkit'],
          'vendor-utils': ['idb', 'uuid', 'bidi-js'],
        },
      },
    },
  },
}));