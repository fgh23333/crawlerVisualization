import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Element Plus 官方暗色变量（html.dark 生效），自定义界面覆盖见 styles/dark.scss
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/dark.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { initWrongStats } from './utils/wrongStats'
import { initTheme } from './utils/theme'
import { initZoom } from './utils/uiPrefs'

const app = createApp(App)

// Register all Element Plus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)
// 夜间模式：与 index.html 引导脚本同口径挂 html.dark（未选择时跟随系统）
initTheme()
// 字号档位：与 index.html 引导脚本同口径应用 body zoom（未设置为标准）
initZoom()
app.mount('#app')

// 匿名错题频率采集（默认开启，关于页可关）：启动/定时/页面隐藏冲刷，全程静默容错
initWrongStats()
