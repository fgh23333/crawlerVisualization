import { fileURLToPath, URL } from 'node:url'
import svgLoader from "vite-svg-loader"
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import IconsResolver from 'unplugin-icons/resolver'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue(),
    svgLoader(),
    vueDevTools(),
    AutoImport({
      resolvers: [
        // 自动导入 Element Plus 相关函数，如：ElMessage, ElMessageBox... (带样式)
        ElementPlusResolver(),
      ],
    }),
    Components({
      resolvers: [
        //自动导入 Element Plus 组件
        ElementPlusResolver(),
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: "localhost",
    hmr: true,
  },
})
