import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This proxy is for local development to avoid CORS issues.
    // In production on Vercel, this is not needed as API routes are served from the same domain.
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
