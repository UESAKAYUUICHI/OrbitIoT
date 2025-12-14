import { createApp, onErrorCaptured } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { vueErrorHandler } from './utils/errorHandler'

const app = createApp(App)

// 注册全局错误处理
app.config.errorHandler = vueErrorHandler

// 注册路由错误处理
router.onError((error) => {
  console.error('Router Error:', error)
})

app.use(ElementPlus)
app.use(router)
app.mount('#app')

// 全局错误捕获
onErrorCaptured((error, instance, info) => {
  console.error('Error Captured:', error, instance, info)
  return false
})