import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000',          // ✅ Add this line
    },
  },
  plugins: [
    tailwindcss(),
    react()
  ],
  base: './'
})
