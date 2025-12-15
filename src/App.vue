<script setup lang="ts">
import { ref, shallowRef, markRaw, onMounted, computed } from 'vue'
import { 
  HomeFilled, 
  Management, 
  User, 
  Lock,
  Setting,
  Box,
  Monitor,
  Tickets,
  SwitchButton,
  Document,
  DataAnalysis,
  Tools
} from '@element-plus/icons-vue'
import Dashboard from './components/Dashboard.vue'
import SystemSettings from './components/SystemSettings.vue'
import UserManagement from './components/UserManagement.vue'
import PermissionManagement from './components/PermissionManagement.vue'
import ProjectManagement from './components/ProjectManagement.vue'
import ProductManagement from './components/ProductManagement.vue'
import DeviceManagement from './components/DeviceManagement.vue'
import AuditLog from './components/AuditLog.vue'
import Login from './components/Login.vue'
import NotificationPanel from './components/NotificationPanel.vue'
// 新增的三个模块
import DeviceDataManagement from './components/DeviceDataManagement.vue'
import WorkOrderManagement from './components/WorkOrderManagement.vue'
import FileManager from './components/FileManager.vue'
// 数字孪生展示组件
import DigitalTwinDisplay from './components/DigitalTwinDisplay.vue'

// 定义页面类型
type PageType = 'dashboard' | 'projects' | 'products' | 'devices' | 'users' | 'permissions' | 'settings' | 'auditlogs' | 'devicedata' | 'workorders' | 'files' | 'digitaltwin'

// 当前页面状态
const currentPage = ref<PageType>('dashboard')
const currentProject = ref<any>(null)
const currentProduct = ref<any>(null)

// 登录状态
const isLoggedIn = ref(false)

// 侧边栏菜单项
const menuItems = ref([
  // 首页
  { 
    id: 1, 
    name: '首页', 
    icon: markRaw(HomeFilled),
    page: 'dashboard'
  },
  // 数字孪生展示
  { 
    id: 10, 
    name: '全局大屏数字孪生展示', 
    icon: markRaw(Monitor),
    page: 'digitaltwin'
  },
  // 项目管理（含项目-产品-设备三级结构）
  { 
    id: 2, 
    name: '项目管理', 
    icon: markRaw(Management),
    page: 'projects'
  },
  // 人员管理（用户与权限）
  { 
    id: 3, 
    name: '用户管理', 
    icon: markRaw(User),
    page: 'users'
  },
  { 
    id: 4, 
    name: '权限管理', 
    icon: markRaw(Lock),
    page: 'permissions'
  },
  // 资源管理（文件等）
  { 
    id: 9, 
    name: '文件管理', 
    icon: markRaw(Document),
    page: 'files'
  },
  // 系统配置
  { 
    id: 5, 
    name: '系统设置', 
    icon: markRaw(Setting),
    page: 'settings'
  },
  // 设备数据管理
  { 
    id: 7, 
    name: '设备数据管理', 
    icon: markRaw(DataAnalysis),
    page: 'devicedata'
  },
  // 工单管理
  { 
    id: 8, 
    name: '工单管理', 
    icon: markRaw(Tools),
    page: 'workorders'
  },
  // 审计日志
  { 
    id: 6, 
    name: '审计日志', 
    icon: markRaw(Tickets),
    page: 'auditlogs'
  }
])

// 当前选中的菜单项
const activeMenuItem = ref(1)

// 计算是否显示主应用界面
const showMainApp = computed(() => {
  return isLoggedIn.value
})

// 处理登录成功事件
const handleLoginSuccess = () => {
  isLoggedIn.value = true
}

// 处理注销
const handleLogout = () => {
  // 清除本地存储的登录状态
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('currentUser')
  
  // 更新应用状态
  isLoggedIn.value = false
  currentPage.value = 'dashboard'
  activeMenuItem.value = 1
}

// 处理主菜单点击
const handleMainMenuClick = (item: any) => {
  currentPage.value = item.page
  activeMenuItem.value = item.id
  
  // 如果是项目管理页面，清除当前项目和产品
  if (item.page === 'projects') {
    currentProject.value = null
    currentProduct.value = null
  }
}

// 退出全屏模式
const exitFullscreen = () => {
  currentPage.value = 'dashboard'
  activeMenuItem.value = 1
}

// 监听自定义导航事件
onMounted(() => {
  // 检查本地存储中的登录状态
  isLoggedIn.value = localStorage.getItem('isLoggedIn') === 'true'
  
  // 从项目到产品
  window.addEventListener('navigate-to-products', (event: any) => {
    currentProject.value = event.detail
    currentPage.value = 'products'
    activeMenuItem.value = 2
    
    // 延迟发送事件确保组件已加载
    setTimeout(() => {
      const productEvent = new CustomEvent('set-current-project', { detail: event.detail })
      window.dispatchEvent(productEvent)
    }, 0)
  })
  
  // 从产品到设备
  window.addEventListener('navigate-to-devices', (event: any) => {
    currentProduct.value = event.detail
    currentPage.value = 'devices'
    
    // 延迟发送事件确保组件已加载
    setTimeout(() => {
      const deviceEvent = new CustomEvent('set-current-product', { detail: event.detail })
      window.dispatchEvent(deviceEvent)
    }, 0)
  })
  
  // 返回到项目
  window.addEventListener('navigate-to-projects', () => {
    currentPage.value = 'projects'
    currentProduct.value = null
  })
  
  // 返回到产品
  window.addEventListener('navigate-to-products', () => {
    currentPage.value = 'products'
  })
})
</script>

<template>
  <div id="app">
    <!-- 登录页面 -->
    <Login v-if="!showMainApp" @login-success="handleLoginSuccess" />
    
    <!-- 主应用界面 -->
    <template v-else>
      <div class="app-layout" v-if="currentPage !== 'digitaltwin'">
        <!-- 侧边栏 -->
        <aside class="sidebar">
          <div class="logo">
            <h2>OrbitIoT</h2>
          </div>
          <nav class="menu">
            <el-menu
              :default-active="activeMenuItem.toString()"
              background-color="#1E2A47"
              text-color="#fff"
              active-text-color="#409EFF"
              style="border: none"
            >
              <el-menu-item 
                v-for="item in menuItems" 
                :key="item.id"
                :index="item.id.toString()"
                @click="handleMainMenuClick(item)"
              >
                <el-icon :size="20">
                  <component :is="item.icon" />
                </el-icon>
                <span>{{ item.name }}</span>
              </el-menu-item>
            </el-menu>
          </nav>
        </aside>

        <!-- 主内容区 -->
        <main class="main-content">
          <!-- 顶部导航栏 -->
          <header class="topbar">
            <div class="topbar-left">
              <h1>奥比特智管智慧物联IOT平台</h1>
            </div>
            <div class="topbar-right">
              <div class="notifications">
                <NotificationPanel />
              </div>
              <div class="user-info">
                <el-avatar :size="32">Admin</el-avatar>
                <span class="username">管理员</span>
              </div>
              <div class="logout-button">
                <el-button 
                  type="danger" 
                  :icon="SwitchButton" 
                  @click="handleLogout"
                  plain
                >
                  注销
                </el-button>
              </div>
            </div>
          </header>

          <!-- 内容区域 -->
          <div class="content">
            <Dashboard v-if="currentPage === 'dashboard'" />
            <ProjectManagement v-if="currentPage === 'projects'" />
            <ProductManagement v-if="currentPage === 'products'" />
            <DeviceManagement v-if="currentPage === 'devices'" />
            <UserManagement v-if="currentPage === 'users'" />
            <PermissionManagement v-if="currentPage === 'permissions'" />
            <SystemSettings v-if="currentPage === 'settings'" />
            <AuditLog v-if="currentPage === 'auditlogs'" />
            <!-- 新增的三个模块 -->
            <DeviceDataManagement v-if="currentPage === 'devicedata'" />
            <WorkOrderManagement v-if="currentPage === 'workorders'" />
            <FileManager v-if="currentPage === 'files'" />
            <!-- 数字孪生展示 -->
            <DigitalTwinDisplay v-if="currentPage === 'digitaltwin'" />
          </div>
        </main>
      </div>
      
      <!-- 全屏数字孪生展示 -->
      <div class="fullscreen-digital-twin" v-else>
        <div class="exit-button">
          <el-button 
            type="primary" 
            @click="exitFullscreen"
            size="large"
            round
          >
            退出全屏
          </el-button>
        </div>
        <DigitalTwinDisplay />
      </div>
    </template>
  </div>
</template>

<style scoped>
#app {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.app-layout {
  display: flex;
  width: 100%;
  height: 100%;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1E2A47 0%, #2A3A55 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 100;
  flex-shrink: 0;
}

.logo {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #409EFF;
  text-align: center;
}

.menu {
  flex: 1;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  height: 60px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.topbar h1 {
  font-size: 1.4rem;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notifications {
  position: relative;
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-size: 0.9rem;
  color: #333;
}

.logout-button {
  display: flex;
  align-items: center;
}

.content {
  flex: 1;
  padding: 20px;
  background: #f5f6fa;
  overflow-y: auto;
}

.fullscreen-digital-twin {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.exit-button {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1001;
}
</style>