<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="brand-section">
          <div class="logo">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="#409EFF" />
              <path d="M30,50 L45,65 L70,35" stroke="white" stroke-width="8" fill="none" />
            </svg>
          </div>
          <h1>OrbitIoT</h1>
          <p class="tagline">连接万物，智控未来</p>
        </div>
        
        <div class="features">
          <div class="feature-item">
            <el-icon><Monitor /></el-icon>
            <span>设备实时监控</span>
          </div>
          <div class="feature-item">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据分析洞察</span>
          </div>
          <div class="feature-item">
            <el-icon><Setting /></el-icon>
            <span>智能运维管理</span>
          </div>
        </div>
        
        <div class="quote">
          <p>"物联网重新定义企业数字化转型"</p>
        </div>
      </div>
      
      <div class="login-right">
        <div class="form-container">
          <div class="form-header">
            <h2>{{ isRegister ? '创建账户' : '登录账户' }}</h2>
            <p>{{ isRegister ? '欢迎加入我们' : '欢迎回来，请登录您的账户' }}</p>
          </div>
          
          <!-- 登录表单 -->
          <el-form 
            v-if="!isRegister"
            ref="loginFormRef" 
            :model="loginForm" 
            :rules="loginRules" 
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="username">
              <el-input 
                v-model="loginForm.username" 
                placeholder="用户名" 
                size="large"
                prefix-icon="User"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="密码" 
                size="large"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            
            <el-form-item>
              <div class="form-options">
                <el-checkbox v-model="rememberMe">记住我</el-checkbox>
                <el-link type="primary" :underline="false">忘记密码？</el-link>
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="submit-button"
                :loading="loading"
                @click="handleLogin"
                native-type="submit"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
          
          <!-- 注册表单 -->
          <el-form 
            v-else
            ref="registerFormRef" 
            :model="registerForm" 
            :rules="registerRules" 
            class="register-form"
            @submit.prevent="handleRegister"
          >
            <el-form-item prop="username">
              <el-input 
                v-model="registerForm.username" 
                placeholder="用户名" 
                size="large"
                prefix-icon="User"
              />
            </el-form-item>
            
            <el-form-item prop="email">
              <el-input 
                v-model="registerForm.email" 
                placeholder="邮箱地址" 
                size="large"
                prefix-icon="Message"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input 
                v-model="registerForm.password" 
                type="password" 
                placeholder="密码" 
                size="large"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            
            <el-form-item prop="confirmPassword">
              <el-input 
                v-model="registerForm.confirmPassword" 
                type="password" 
                placeholder="确认密码" 
                size="large"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="submit-button"
                :loading="loading"
                @click="handleRegister"
                native-type="submit"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="form-footer">
            <p v-if="!isRegister">
              还没有账户？ 
              <el-link type="primary" @click="switchToRegister">立即注册</el-link>
            </p>
            <p v-else>
              已有账户？ 
              <el-link type="primary" @click="switchToLogin">立即登录</el-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Monitor, DataAnalysis, Setting } from '@element-plus/icons-vue'

// 定义事件发射器
const emit = defineEmits(['login-success'])

// 表单引用
const loginFormRef = ref()
const registerFormRef = ref()

// 登录状态
const loading = ref(false)

// 控制显示登录还是注册界面
const isRegister = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: 'admin',
  password: '123456'
})

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 记住我
const rememberMe = ref(true)

// 登录验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

// 注册验证规则
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度至少3位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 切换到注册界面
const switchToRegister = () => {
  isRegister.value = true
}

// 切换到登录界面
const switchToLogin = () => {
  isRegister.value = false
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate((valid: boolean) => {
    if (valid) {
      loading.value = true
      
      // 模拟登录过程
      setTimeout(() => {
        loading.value = false
        
        // 简单的用户名密码验证
        if (loginForm.username === 'admin' && loginForm.password === '123456') {
          // 保存登录状态
          localStorage.setItem('isLoggedIn', 'true')
          localStorage.setItem('currentUser', JSON.stringify({
            username: loginForm.username,
            name: '管理员'
          }))
          
          // 发射登录成功事件
          emit('login-success')
        } else {
          ElMessage.error('用户名或密码错误')
        }
      }, 1000)
    }
  })
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate((valid: boolean) => {
    if (valid) {
      loading.value = true
      
      // 模拟注册过程
      setTimeout(() => {
        loading.value = false
        
        // 检查用户名是否已存在（这里用虚拟数据）
        if (registerForm.username === 'admin') {
          ElMessage.error('用户名已存在')
          return
        }
        
        // 注册成功，自动切换到登录界面
        switchToLogin()
      }, 1000)
    }
  })
}
</script>

<style scoped>
.login-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1E2A47 0%, #2A3A55 100%);
  overflow: hidden;
  animation: gradientShift 15s ease infinite;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  transform: rotate(30deg);
}

.login-container::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(rgba(30, 42, 71, 0.7) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 42, 71, 0.7) 1px, transparent 1px);
  background-size: 30px 30px;
  z-index: 0;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.login-wrapper {
  display: flex;
  width: 950px;
  height: 600px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 0 30px rgba(64, 158, 255, 0.2);
  overflow: hidden;
  z-index: 10;
  backdrop-filter: blur(10px);
  transform: translateY(0);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.login-wrapper:hover {
  transform: translateY(-5px);
  box-shadow: 
    0 30px 60px -15px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 0 40px rgba(64, 158, 255, 0.3);
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #2A3A55 0%, #1E2A47 100%);
  color: white;
  padding: 50px 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: "";
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(64, 158, 255, 0.1);
}

.login-left::after {
  content: "";
  position: absolute;
  bottom: -80px;
  left: -30px;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  background: rgba(103, 194, 58, 0.1);
}

.brand-section {
  text-align: center;
  position: relative;
  z-index: 2;
}

.logo {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.logo svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
}

.brand-section h1 {
  font-size: 2.8rem;
  margin: 0 0 10px 0;
  font-weight: 800;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(to right, #fff, #a0cfff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.tagline {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
  letter-spacing: 0.5px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 25px;
  position: relative;
  z-index: 2;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 1.1rem;
  padding: 12px 15px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(64, 158, 255, 0.2);
  transform: translateX(5px);
}

.feature-item .el-icon {
  font-size: 1.8rem;
  color: #409EFF;
  background: rgba(64, 158, 255, 0.1);
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quote {
  text-align: center;
  font-style: italic;
  opacity: 0.9;
  position: relative;
  z-index: 2;
}

.quote p:first-child {
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: #e6f7ff;
}

.quote .author {
  margin-top: 10px;
  font-weight: 500;
  color: #909399;
  font-size: 0.9rem;
}

.login-right {
  flex: 1;
  padding: 40px;
  display: flex;
  align-items: center;
  background: white;
  position: relative;
  overflow: hidden;
}

.login-right::before {
  content: "";
  position: absolute;
  top: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, transparent 70%);
}

.form-container {
  width: 100%;
  position: relative;
  z-index: 2;
}

.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-header h2 {
  margin: 0 0 10px 0;
  font-size: 2rem;
  color: #1E2A47;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.form-header p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.login-form,
.register-form {
  margin-bottom: 20px;
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 5px 15px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: box-shadow 0.3s ease;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409EFF inset;
}

:deep(.el-input__prefix) {
  font-size: 1.2rem;
  color: #909399;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-checkbox__label) {
  color: #666;
}

.submit-button {
  width: 100%;
  margin-top: 10px;
  background: linear-gradient(135deg, #409EFF, #1E2A47);
  border: none;
  height: 48px;
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 1px;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(64, 158, 255, 0.4);
}

.submit-button:active {
  transform: translateY(0);
}

.form-footer {
  text-align: center;
  color: #666;
  font-size: 1rem;
  margin-top: 20px;
}

.form-footer .el-link {
  font-weight: 500;
  font-size: 1rem;
}

.form-footer .el-link:hover {
  color: #409EFF;
}

@media (max-width: 950px) {
  .login-wrapper {
    width: 90%;
  }
}

@media (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
    height: auto;
  }
  
  .login-left {
    padding: 30px 20px;
  }
  
  .brand-section h1 {
    font-size: 2.2rem;
  }
}
</style>