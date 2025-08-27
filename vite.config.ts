import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 7790,
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
        secure: false
      }
    }
  }
  , build: {
    rollupOptions: {
      // ensure index.html is the main entry; we'll copy offline-landing after build
    }
  },
  plugins: [
    react(),
    {
      name: 'copy-offline-landing',
      closeBundle() {
        try {
          const src = resolve(__dirname, 'src/offline-landing.html')
          const outDir = resolve(__dirname, 'dist')
          mkdirSync(outDir, { recursive: true })
          const content = readFileSync(src)
          writeFileSync(resolve(outDir, 'offline-landing.html'), content)
        } catch {}
      }
    }
  ]
})
