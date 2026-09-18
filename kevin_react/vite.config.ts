import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vite.dev/config/
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  base: "/",
  build: {
    // Modern browsers only — smaller output than the default 'modules' target
    // since it skips legacy transpilation/polyfills.
    target: 'es2020',
    cssCodeSplit: true,
    // Split large, rarely-changing dependencies into their own long-lived
    // cache chunks so app-code changes don't force users to re-download them.
    // Leaflet is additionally route-split via React.lazy on the Map component.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
        },
      },
    },
  },
})
