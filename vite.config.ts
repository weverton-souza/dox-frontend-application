import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('chart.js') || id.includes('chartjs-plugin')) return 'vendor-chart'
          if (id.includes('platejs') || id.includes('@platejs')) return 'vendor-plate'
          if (id.includes('@dnd-kit')) return 'vendor-dnd'
          if (id.includes('docx-preview') || id.includes('/docx/')) return 'vendor-docx'
          if (id.includes('react-day-picker') || id.includes('date-fns')) return 'vendor-day-picker'
          if (id.includes('qrcode')) return 'vendor-qrcode'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('react-dom') || id.includes('scheduler')) return 'vendor-react'
          return undefined
        },
      },
    },
  },
})
