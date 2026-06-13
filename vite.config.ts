import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('antd') || id.includes('@ant-design')) return 'ui-antd'
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
            if (id.includes('dayjs')) return 'vendor-dayjs'
            return 'vendor-misc'
          }
        },
      },
    },
  },
})
