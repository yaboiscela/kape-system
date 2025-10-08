import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'https://kape-system-backend.onrender.com',          // ✅ Add this line
    },
  },
  plugins: [
    tailwindcss(),
    react()
  ],
  base: './'
})
