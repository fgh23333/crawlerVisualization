import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  server: {
    proxy: {
      '/cdn-api': {
        target: 'https://mypan.rayni.xyz',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/cdn-api/, '')
      }
    }
  }
})
