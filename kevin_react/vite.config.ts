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
})
