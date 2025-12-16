<template>
  <div class="system-settings">
    <div class="settings-header">
      <h2>系统设置</h2>
      <el-button type="primary" @click="saveSettings">
        <el-icon><Check /></el-icon>
        保存设置
      </el-button>
    </div>
    
    <div class="settings-content">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 基础设置 -->
        <el-tab-pane label="基础设置" name="basic">
          <el-card class="settings-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>系统基本信息</span>
              </div>
            </template>
            <el-form :model="basicSettings" label-width="120px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="系统名称：">
                    <el-input v-model="basicSettings.systemName" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="系统版本：">
                    <el-input v-model="basicSettings.version" disabled />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="默认语言：">
                    <el-select v-model="basicSettings.language" placeholder="请选择语言">
                      <el-option label="简体中文" value="zh-CN" />
                      <el-option label="English" value="en-US" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="时区设置：">
                    <el-select v-model="basicSettings.timezone" placeholder="请选择时区">
                      <el-option label="北京时间 (UTC+8)" value="UTC+8" />
                      <el-option label="东京时间 (UTC+9)" value="UTC+9" />
                      <el-option label="纽约时间 (UTC-5)" value="UTC-5" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="系统描述：">
                <el-input 
                  v-model="basicSettings.description" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="请输入系统描述"
                />
              </el-form-item>
            </el-form>
          </el-card>
          
          <el-card class="settings-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>Logo设置</span>
              </div>
            </template>
            <el-form :model="logoSettings" label-width="120px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Logo图片：">
                    <el-upload
                      class="logo-uploader"
                      action="#"
                      :auto-upload="false"
                      :show-file-list="false"
                      :on-change="handleLogoChange"
                    >
                      <img v-if="logoSettings.logoUrl" :src="logoSettings.logoUrl" class="logo" />
                      <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
                    </el-upload>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="favicon：">
                    <el-upload
                      class="favicon-uploader"
                      action="#"
                      :auto-upload="false"
                      :show-file-list="false"
                      :on-change="handleFaviconChange"
                    >
                      <img v-if="logoSettings.faviconUrl" :src="logoSettings.faviconUrl" class="favicon" />
                      <el-icon v-else class="favicon-uploader-icon"><Plus /></el-icon>
                    </el-upload>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
        </el-tab-pane>
        
        <!-- 用户管理 -->
        <el-tab-pane label="用户管理" name="users">
          <el-card class="settings-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>用户列表</span>
                <el-button type="primary" @click="addUser">
                  <el-icon><Plus /></el-icon>
                  添加用户
                </el-button>
              </div>
            </template>
            <el-table :data="userList" style="width: 100%">
              <el-table-column prop="id" label="用户ID" width="100" />
              <el-table-column prop="username" label="用户名" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column prop="role" label="角色">
                <template #default="scope">
                  <el-tag :type="getRoleTagType(scope.row.role)">
                    {{ getRoleLabel(scope.row.role) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-switch
                    v-model="scope.row.status"
                    inline-prompt
                    active-text="启用"
                    inactive-text="禁用"
                    @change="toggleUserStatus(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button size="small" type="primary" @click="editUser(scope.row)">
                    编辑
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteUser(scope.row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>
        
        <!-- 角色权限 -->
        <el-tab-pane label="角色权限" name="roles">
          <el-card class="settings-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>角色列表</span>
                <el-button type="primary" @click="addRole">
                  <el-icon><Plus /></el-icon>
                  添加角色
                </el-button>
              </div>
            </template>
            <el-table :data="roleList" style="width: 100%">
              <el-table-column prop="id" label="角色ID" width="100" />
              <el-table-column prop="name" label="角色名称" />
              <el-table-column prop="description" label="描述" />
              <el-table-column prop="userCount" label="用户数" width="100" />
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button size="small" type="primary" @click="editRole(scope.row)">
                    权限设置
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteRole(scope.row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>
        
        <!-- 系统参数 -->
        <el-tab-pane label="系统参数" name="parameters">
          <el-card class="settings-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>参数配置</span>
              </div>
            </template>
            <el-form :model="systemParams" label-width="180px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="数据保留天数：">
                    <el-input-number 
                      v-model="systemParams.dataRetentionDays" 
                      :min="1" 
                      :max="3650" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="自动备份周期(天)：">
                    <el-input-number 
                      v-model="systemParams.backupInterval" 
                      :min="1" 
                      :max="365" 
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="最大并发连接数：">
                    <el-input-number 
                      v-model="systemParams.maxConnections" 
                      :min="1" 
                      :max="10000" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="会话超时时间(分钟)：">
                    <el-input-number 
                      v-model="systemParams.sessionTimeout" 
                      :min="1" 
                      :max="1440" 
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="启用日志记录：">
                    <el-switch v-model="systemParams.enableLogging" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="启用SSL加密：">
                    <el-switch v-model="systemParams.enableSSL" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="允许的IP地址段：">
                <el-input 
                  v-model="systemParams.allowedIPs" 
                  placeholder="多个IP用逗号分隔，如: 192.168.1.0/24,10.0.0.0/8"
                />
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>
        
        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notifications">
          <el-card class="settings-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>邮件服务器设置</span>
              </div>
            </template>
            <el-form :model="emailSettings" label-width="120px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="SMTP服务器：">
                    <el-input v-model="emailSettings.smtpServer" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="端口号：">
                    <el-input-number 
                      v-model="emailSettings.port" 
                      :min="1" 
                      :max="65535" 
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="用户名：">
                    <el-input v-model="emailSettings.username" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="密码：">
                    <el-input 
                      v-model="emailSettings.password" 
                      type="password" 
                      show-password
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="发件人邮箱：">
                    <el-input v-model="emailSettings.senderEmail" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="启用SSL：">
                    <el-switch v-model="emailSettings.enableSSL" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
          
          <el-card class="settings-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>短信服务设置</span>
              </div>
            </template>
            <el-form :model="smsSettings" label-width="120px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="服务商：">
                    <el-select v-model="smsSettings.provider">
                      <el-option label="阿里云" value="aliyun" />
                      <el-option label="腾讯云" value="tencent" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="AccessKey：">
                    <el-input v-model="smsSettings.accessKey" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="SecretKey：">
                <el-input 
                  v-model="smsSettings.secretKey" 
                  type="password" 
                  show-password
                />
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  Check,
  Plus
} from '@element-plus/icons-vue'

// 当前激活的标签页
const activeTab = ref('basic')

// 基础设置
const basicSettings = ref({
  systemName: 'OrbitIoT 物联网管理平台',
  version: 'v1.0.0',
  language: 'zh-CN',
  timezone: 'UTC+8',
  description: '一个功能强大的物联网设备管理平台，支持设备监控、数据分析、告警处理等功能。'
})

// Logo设置
const logoSettings = ref({
  logoUrl: '',
  faviconUrl: ''
})

// 用户列表
const userList = ref([
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'administrator',
    status: true
  },
  {
    id: 2,
    username: 'operator',
    email: 'operator@example.com',
    role: 'operator',
    status: true
  },
  {
    id: 3,
    username: 'viewer',
    email: 'viewer@example.com',
    role: 'viewer',
    status: true
  }
])

// 角色列表
const roleList = ref([
  {
    id: 1,
    name: '系统管理员',
    description: '拥有系统所有权限',
    userCount: 1
  },
  {
    id: 2,
    name: '操作员',
    description: '负责日常设备操作和监控',
    userCount: 1
  },
  {
    id: 3,
    name: '查看员',
    description: '只能查看数据和报表',
    userCount: 1
  }
])

// 系统参数
const systemParams = ref({
  dataRetentionDays: 365,
  backupInterval: 7,
  maxConnections: 1000,
  sessionTimeout: 30,
  enableLogging: true,
  enableSSL: true,
  allowedIPs: '192.168.1.0/24'
})

// 邮件设置
const emailSettings = ref({
  smtpServer: 'smtp.example.com',
  port: 465,
  username: 'noreply@example.com',
  password: '********',
  senderEmail: 'noreply@example.com',
  enableSSL: true
})

// 短信设置
const smsSettings = ref({
  provider: 'aliyun',
  accessKey: '********',
  secretKey: '********'
})

// 保存设置
const saveSettings = () => {
  ElMessage.success('设置已保存')
}

// 处理Logo上传
const handleLogoChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    logoSettings.value.logoUrl = e.target?.result as string
  }
  reader.readAsDataURL(file.raw)
}

// 处理Favicon上传
const handleFaviconChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    logoSettings.value.faviconUrl = e.target?.result as string
  }
  reader.readAsDataURL(file.raw)
}

// 获取角色标签类型
const getRoleTagType = (role: string) => {
  switch (role) {
    case 'administrator': return 'danger'
    case 'operator': return 'warning'
    case 'viewer': return 'info'
    default: return ''
  }
}

// 获取角色标签文本
const getRoleLabel = (role: string) => {
  switch (role) {
    case 'administrator': return '系统管理员'
    case 'operator': return '操作员'
    case 'viewer': return '查看员'
    default: return role
  }
}

// 切换用户状态
const toggleUserStatus = (user: any) => {
  ElMessage.success(`用户${user.username}状态已更新`)
}

// 添加用户
const addUser = () => {
  ElMessage.info('添加用户功能')
}

// 编辑用户
const editUser = (user: any) => {
  ElMessage.info(`编辑用户: ${user.username}`)
}

// 删除用户
const deleteUser = (user: any) => {
  ElMessageBox.confirm(
    `确定要删除用户 ${user.username} 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    // 取消删除
  })
}

// 添加角色
const addRole = () => {
  ElMessage.info('添加角色功能')
}

// 编辑角色
const editRole = (role: any) => {
  ElMessage.info(`编辑角色: ${role.name}`)
}

// 删除角色
const deleteRole = (role: any) => {
  ElMessageBox.confirm(
    `确定要删除角色 ${role.name} 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    // 取消删除
  })
}
</script>

<style scoped>
.system-settings {
  background: #f5f6fa;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.settings-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.settings-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.settings-tabs {
  box-shadow: none;
}

.settings-tabs :deep(.el-tabs__content) {
  padding: 20px 0;
}

.settings-card {
  margin-bottom: 20px;
  border: none;
}

.settings-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background: #f9fafb;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-weight: 500;
  color: #333;
}

.logo-uploader,
.favicon-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.logo-uploader:hover,
.favicon-uploader:hover {
  border-color: #409eff;
}

.logo-uploader-icon,
.favicon-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  text-align: center;
  line-height: 120px;
}

.logo {
  width: 120px;
  height: 120px;
  display: block;
  object-fit: contain;
}

.favicon-uploader-icon,
.favicon {
  width: 64px;
  height: 64px;
  line-height: 64px;
}
</style>