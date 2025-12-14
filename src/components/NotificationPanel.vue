<template>
  <div class="notification-container">
    <!-- 铃铛图标 -->
    <div class="notification-icon" @click.stop="togglePanel">
      <el-badge :value="unreadCount" :max="99" class="badge-item" :hidden="unreadCount === 0">
        <el-icon :size="20"><Bell /></el-icon>
      </el-badge>
    </div>
    
    <!-- 通知面板 -->
    <transition name="slide-fade">
      <div v-show="isPanelVisible" class="notification-panel" ref="panelRef" @click.stop>
        <div class="panel-header">
          <h3>通知中心</h3>
          <div class="panel-actions">
            <el-button 
              type="text" 
              size="small" 
              @click="markAllAsRead"
              :disabled="unreadCount === 0"
            >
              全部已读
            </el-button>
            <el-button 
              type="text" 
              size="small" 
              @click="clearAll"
              :disabled="notifications.length === 0"
            >
              清空
            </el-button>
          </div>
        </div>
        
        <div class="panel-tabs">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="未读" name="unread">
              <div class="notification-list">
                <div 
                  v-for="notification in unreadNotifications" 
                  :key="notification.id"
                  class="notification-item unread"
                  @click="markAsRead(notification.id)"
                >
                  <div class="notification-content">
                    <div class="notification-header">
                      <div class="notification-title">{{ notification.title }}</div>
                      <div class="notification-status unread-dot"></div>
                    </div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <div class="notification-time">{{ formatTime(notification.time) }}</div>
                  </div>
                </div>
                <div v-if="unreadNotifications.length === 0" class="empty-state">
                  <div class="empty-icon">
                    <el-icon :size="48"><Bell /></el-icon>
                  </div>
                  <p>暂无未读通知</p>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="已读" name="read">
              <div class="notification-list">
                <div 
                  v-for="notification in readNotifications" 
                  :key="notification.id"
                  class="notification-item read"
                >
                  <div class="notification-content">
                    <div class="notification-header">
                      <div class="notification-title">{{ notification.title }}</div>
                    </div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <div class="notification-time">{{ formatTime(notification.time) }}</div>
                  </div>
                </div>
                <div v-if="readNotifications.length === 0" class="empty-state">
                  <div class="empty-icon">
                    <el-icon :size="48"><Document /></el-icon>
                  </div>
                  <p>暂无已读通知</p>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Bell, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 通知面板可见性
const isPanelVisible = ref(false)

// 激活的标签页
const activeTab = ref('unread')

// 通知数据
const notifications = ref([
  {
    id: 1,
    title: '设备告警',
    message: 'THS-100 温湿度传感器温度过高',
    time: new Date(Date.now() - 1000 * 60 * 5), // 5分钟前
    read: false
  },
  {
    id: 2,
    title: '系统更新',
    message: '平台将在今晚 2:00 进行维护升级',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
    read: false
  },
  {
    id: 3,
    title: '设备上线',
    message: 'AQ-200 空气质量监测器已连接',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1天前
    read: true
  },
  {
    id: 4,
    title: '数据报告',
    message: '上周数据分析报告已生成',
    time: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2天前
    read: true
  }
])

// 面板引用
const panelRef = ref<HTMLElement | null>(null)

// 未读通知数量
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

// 未读通知
const unreadNotifications = computed(() => {
  return notifications.value.filter(n => !n.read)
})

// 已读通知
const readNotifications = computed(() => {
  return notifications.value.filter(n => n.read)
})

// 切换面板可见性
const togglePanel = (event: Event) => {
  event.stopPropagation();
  isPanelVisible.value = !isPanelVisible.value
}

// 标记为已读
const markAsRead = (id: number) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
    ElMessage.success('通知已标记为已读')
  }
}

// 标记所有为已读
const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
  ElMessage.success('所有通知已标记为已读')
}

// 清空所有通知
const clearAll = () => {
  notifications.value = []
  ElMessage.success('所有通知已清空')
}

// 格式化时间
const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 1) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (minutes < 1440) { // 24小时内
    return `${Math.floor(minutes / 60)}小时前`
  } else {
    return `${Math.floor(minutes / 1440)}天前`
  }
}

// 处理标签页切换
const handleTabChange = (tab: string) => {
  activeTab.value = tab
}

// 点击外部关闭面板
const handleClickOutside = (event: MouseEvent) => {
  if (panelRef.value && !panelRef.value.contains(event.target as Node)) {
    isPanelVisible.value = false
  }
}

// 组件挂载时添加事件监听器
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// 组件卸载前移除事件监听器
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notification-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.notification-icon {
  cursor: pointer;
  padding: 10px;
  color: #666;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-icon:hover {
  background-color: #f0f2f5;
  color: #409eff;
}

.notification-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 380px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.panel-actions {
  display: flex;
  gap: 10px;
}

.panel-tabs {
  max-height: 450px;
  overflow-y: auto;
}

.panel-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 20px;
}

.panel-tabs :deep(.el-tabs__nav-wrap)::after {
  height: 1px;
}

.panel-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  padding: 0 10px;
  height: 50px;
  line-height: 50px;
}

.notification-list {
  padding: 10px 0;
}

.notification-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.notification-item:hover {
  background-color: #f9f9f9;
}

.notification-item.unread {
  background-color: #f0f8ff;
}

.notification-item.unread:hover {
  background-color: #e6f4ff;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.notification-status.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #409eff;
}

.notification-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  line-height: 1.5;
  word-break: break-all;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
  color: #999;
}

.empty-icon {
  margin-bottom: 15px;
  color: #c0c4cc;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.badge-item :deep(.el-badge__content) {
  transform: translateY(-50%) translateX(100%) scale(0.8) !important;
  border: none;
  background-color: #f56c6c;
}
</style>