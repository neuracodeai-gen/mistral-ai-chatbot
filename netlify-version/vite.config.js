import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import netlify from 'vite-plugin-netlify'

export default defineConfig({
  plugins: [
    react(),
    netlify({
      // Netlify functions directory
      functionsDir: './functions'
    })
  ],
  server: {
    port: 3000,
    // Proxy Netlify functions in dev
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/.netlify\/functions/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
