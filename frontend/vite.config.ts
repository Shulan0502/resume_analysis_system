import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // 图谱服务（端口 7576）必须放在 /api 之前，更具体的路径优先匹配
      '/api/job-skill-graph': {
        target: 'http://localhost:7576',
        changeOrigin: true,
      },
      // 主后端（端口 8082）保留为 fallback
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
})
