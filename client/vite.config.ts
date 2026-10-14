import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development, send /api requests to the Express server.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
