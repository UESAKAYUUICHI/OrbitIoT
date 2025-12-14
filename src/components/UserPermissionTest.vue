<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

interface Project {
  projectId: number
  projectName: string
  mainDeviceId: string
  status: string
  createdAt: number
  updatedAt: number
}

interface Permission {
  permId: number
  permCode: string
  permName: string
  module: string
}

interface UserData {
  userId: number
  username: string
  projects: Project[]
  permissions: Permission[]
}

const userData = ref<UserData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getStatusText = (status: string) => {
  return status === 'active' ? '进行中' : '已完成'
}

const getStatusClass = (status: string) => {
  return status === 'active' ? 'status-active' : 'status-completed'
}

const fetchUserPermissions = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get('http://localhost:10721/user/getUserGetPermission?userId=6')
    
    if (response.data.ok) {
      userData.value = response.data.data
    } else {
      error.value = response.data.message || '请求失败'
    }
  } catch (err: any) {
    error.value = err.message || '网络错误'
  } finally {
    loading.value = false
  }
}

// 页面加载时自动获取数据
fetchUserPermissions()
</script>

<template>
  <div class="permission-test">
    <h2>用户权限接口测试</h2>
    
    <div class="toolbar">
      <button @click="fetchUserPermissions" :disabled="loading" class="refresh-btn">
        {{ loading ? '加载中...' : '重新获取数据' }}
      </button>
    </div>
    
    <div v-if="error" class="error-message">
      错误: {{ error }}
    </div>
    
    <div v-if="userData" class="user-data">
      <div class="user-info-section">
        <h3>用户信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>用户ID:</label>
            <span>{{ userData.userId }}</span>
          </div>
          <div class="info-item">
            <label>用户名:</label>
            <span>{{ userData.username }}</span>
          </div>
        </div>
      </div>
      
      <div class="projects-section">
        <h3>项目列表</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>项目名称</th>
              <th>主设备ID</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in userData.projects" :key="project.projectId">
              <td>{{ project.projectId }}</td>
              <td>{{ project.projectName }}</td>
              <td>{{ project.mainDeviceId }}</td>
              <td>
                <span :class="['status-badge', getStatusClass(project.status)]">
                  {{ getStatusText(project.status) }}
                </span>
              </td>
              <td>{{ formatDate(project.createdAt) }}</td>
              <td>{{ formatDate(project.updatedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="permissions-section">
        <h3>权限列表</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>权限名称</th>
              <th>权限代码</th>
              <th>模块</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="permission in userData.permissions" :key="permission.permId">
              <td>{{ permission.permId }}</td>
              <td>{{ permission.permName }}</td>
              <td>{{ permission.permCode }}</td>
              <td>{{ permission.module }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.permission-test {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.toolbar {
  margin-bottom: 20px;
}

.refresh-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.refresh-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.user-info-section,
.projects-section,
.permissions-section {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-info-section h3,
.projects-section h3,
.permissions-section h3 {
  margin: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.info-grid {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-weight: 500;
  margin-bottom: 4px;
  color: #555;
}

.info-item span {
  padding: 8px 12px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  color: #333;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 0;
}

.data-table thead th {
  background-color: #f8f9fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-top: 1px solid #e0e0e0;
  border-bottom: 2px solid #dee2e6;
  font-size: 14px;
}

.data-table tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 14px;
  color: #333;
}

.data-table tbody tr:hover {
  background-color: #f8f9fa;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  min-width: 50px;
}

.status-active {
  background-color: #d4edda;
  color: #155724;
}

.status-completed {
  background-color: #d1ecf1;
  color: #0c5460;
}

@media (max-width: 768px) {
  .permission-test {
    padding: 12px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
  }
}
</style>