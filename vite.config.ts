import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    // Mirrors long-lived immutable caching in local/proxy environments.
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  build: {
    assetsInlineLimit: 4096,
    modulePreload: false,
    rollupOptions: {
      output: {
        // Split vendor ecosystem into dedicated chunks to minimize initial payload.
        manualChunks(id) {
          if (id.includes('\u0000vite/preload-helper.js')) return 'reactVendor'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'reactVendor'
          if (id.includes('node_modules/three/examples/jsm')) return 'threeExamples'
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/@react-three')) return 'threeReact'
          if (id.includes('node_modules/postprocessing')) return 'threePostFX'
          return undefined
        },
      },
    },
  },
})
