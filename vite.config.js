import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use base path for GitHub Pages, root for Vercel
  base: process.env.VERCEL ? '/' : '/uav-fleet-dashboard/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
  server:{
    allowedHosts: ['uav-fleet-dashboard.deltaquad.com'],
  },
})


