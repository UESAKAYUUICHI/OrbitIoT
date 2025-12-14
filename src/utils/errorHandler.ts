import { ElMessage, ElNotification } from 'element-plus'

// 全局错误处理器
export class GlobalErrorHandler {
  static handle(error: any, context: string = '') {
    console.error('Global Error:', error)
    
    // 根据错误类型显示不同的消息
    if (error.response) {
      // HTTP错误响应
      const status = error.response.status
      const message = error.response.data?.message || '服务器错误'
      
      switch (status) {
        case 400:
          ElMessage.error(`请求错误: ${message}`)
          break
        case 401:
          ElMessage.error('未授权访问，请重新登录')
          // 可以在这里添加登出逻辑
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(`服务器错误 (${status}): ${message}`)
      }
    } else if (error.request) {
      // 网络错误
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      // 其他错误
      ElMessage.error(error.message || '未知错误')
    }
    
    // 发送错误通知（可选）
    ElNotification({
      title: '系统错误',
      message: `${context}: ${error.message || '未知错误'}`,
      type: 'error',
      duration: 5000
    })
  }
  
  // 处理网络异常
  static handleNetworkError() {
    ElMessage.error('网络连接不稳定，请稍后重试')
  }
  
  // 处理超时错误
  static handleTimeout() {
    ElMessage.error('请求超时，请稍后重试')
  }
}

// Vue全局错误处理
export const vueErrorHandler = (err: any, instance: any, info: string) => {
  console.error('Vue Error:', err, instance, info)
  GlobalErrorHandler.handle(err, `Vue错误 [${info}]`)
}

// Promise未捕获异常处理
export const promiseErrorHandler = (event: PromiseRejectionEvent) => {
  console.error('Unhandled Promise Rejection:', event.reason)
  GlobalErrorHandler.handle(event.reason, '未处理的Promise异常')
}

// 注册全局错误处理
export const registerGlobalErrorHandlers = () => {
  // Vue错误处理
  // 这会在main.ts中注册
  
  // 全局未捕获的Promise异常
  window.addEventListener('unhandledrejection', promiseErrorHandler)
  
  // JavaScript运行时错误
  window.addEventListener('error', (event) => {
    console.error('JavaScript Error:', event.error)
    GlobalErrorHandler.handle(event.error, 'JavaScript运行时错误')
  })
}