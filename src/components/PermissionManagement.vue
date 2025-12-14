<template>
  <div class="permission-management">
    <div class="management-header">
      <h2>权限管理</h2>
      <div class="controls">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索角色/权限..." 
          style="width: 250px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="addRole">
          <el-icon><Plus /></el-icon>
          添加角色
        </el-button>
      </div>
    </div>
    
    <div class="management-content">
      <!-- 角色统计 -->
      <el-row :gutter="20" class="role-stats">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon primary">
              <el-icon :size="24"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ roleStats.total }}</div>
              <div class="stat-label">角色总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon success">
              <el-icon :size="24"><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ roleStats.assigned }}</div>
              <div class="stat-label">已分配</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><Lock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ roleStats.unassigned }}</div>
              <div class="stat-label">未分配</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon warning">
              <el-icon :size="24"><Setting /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ roleStats.custom }}</div>
              <div class="stat-label">自定义角色</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 角色和权限配置 -->
      <el-row :gutter="20">
        <!-- 角色列表 -->
        <el-col :span="8">
          <el-card class="roles-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>角色列表</span>
              </div>
            </template>
            <div class="roles-list">
              <div 
                v-for="role in filteredRoles" 
                :key="role.id"
                class="role-item"
                :class="{ active: selectedRole && selectedRole.id === role.id }"
                @click="selectRole(role)"
              >
                <div class="role-info">
                  <el-icon :color="getRoleColor(role.type)"><Avatar /></el-icon>
                  <div class="role-text">
                    <div class="role-name">{{ role.name }}</div>
                    <div class="role-desc">{{ role.description }}</div>
                  </div>
                </div>
                <div class="role-actions">
                  <el-tag :type="getRoleType(role.type)">
                    {{ getRoleTypeName(role.type) }}
                  </el-tag>
                  <el-button 
                    v-if="role.type === 'custom'" 
                    type="danger" 
                    size="small" 
                    link
                    @click.stop="deleteRole(role)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <!-- 权限配置 -->
        <el-col :span="16">
          <el-card class="permissions-card" shadow="hover" v-if="selectedRole">
            <template #header>
              <div class="card-header">
                <span>{{ selectedRole.name }} - 权限配置</span>
                <el-button type="primary" @click="savePermissions">
                  <el-icon><Check /></el-icon>
                  保存权限
                </el-button>
              </div>
            </template>
            
            <el-tabs v-model="activeTab">
              <!-- 系统权限 -->
              <el-tab-pane label="系统权限" name="system">
                <el-tree
                  ref="systemTree"
                  :data="systemPermissions"
                  show-checkbox
                  node-key="id"
                  :default-checked-keys="selectedRole.permissions.system"
                  :props="permissionProps"
                  default-expand-all
                >
                  <template #default="{ node, data }">
                    <div class="permission-node">
                      <el-icon v-if="data.icon"><component :is="data.icon" /></el-icon>
                      <span class="permission-label">{{ data.label }}</span>
                      <el-tooltip 
                        v-if="data.description" 
                        :content="data.description" 
                        placement="top"
                      >
                        <el-icon class="info-icon"><InfoFilled /></el-icon>
                      </el-tooltip>
                    </div>
                  </template>
                </el-tree>
              </el-tab-pane>
              
              <!-- 数据权限 -->
              <el-tab-pane label="数据权限" name="data">
                <div class="data-permission-config">
                  <el-form :model="dataPermissionForm" label-width="120px">
                    <el-form-item label="数据范围：">
                      <el-radio-group v-model="dataPermissionForm.scope">
                        <el-radio label="all">全部数据</el-radio>
                        <el-radio label="department">本部门数据</el-radio>
                        <el-radio label="self">本人数据</el-radio>
                        <el-radio label="custom">自定义</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    
                    <el-form-item v-if="dataPermissionForm.scope === 'custom'" label="选择项目：">
                      <el-checkbox-group v-model="dataPermissionForm.projects">
                        <el-checkbox 
                          v-for="project in projects" 
                          :key="project.id" 
                          :label="project.id"
                        >
                          {{ project.name }}
                        </el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                    
                    <el-form-item v-if="dataPermissionForm.scope === 'custom'" label="选择设备：">
                      <el-checkbox-group v-model="dataPermissionForm.devices">
                        <el-checkbox 
                          v-for="device in devices" 
                          :key="device.id" 
                          :label="device.id"
                        >
                          {{ device.name }}
                        </el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                  </el-form>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
          
          <!-- 未选择角色提示 -->
          <el-card class="permissions-card" shadow="hover" v-else>
            <div class="empty-role">
              <el-icon :size="48"><Avatar /></el-icon>
              <p>请选择一个角色来配置权限</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 添加/编辑角色对话框 -->
    <el-dialog
      v-model="roleDialog.visible"
      :title="roleDialog.isEdit ? '编辑角色' : '添加角色'"
      width="500px"
    >
      <el-form :model="roleDialog.form" label-width="100px">
        <el-form-item label="角色名称：" required>
          <el-input v-model="roleDialog.form.name" />
        </el-form-item>
        <el-form-item label="角色描述：">
          <el-input 
            v-model="roleDialog.form.description" 
            type="textarea" 
            :rows="3" 
          />
        </el-form-item>
        <el-form-item label="角色类型：">
          <el-radio-group v-model="roleDialog.form.type">
            <el-radio label="system">系统角色</el-radio>
            <el-radio label="custom">自定义角色</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveRole">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Search,
  Plus,
  Check,
  User,
  UserFilled,
  Lock,
  Setting,
  Avatar,
  InfoFilled
} from '@element-plus/icons-vue'

// 角色数据
const roles = ref([
  {
    id: 1,
    name: '系统管理员',
    description: '拥有系统所有权限',
    type: 'system',
    userCount: 1,
    permissions: {
      system: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      data: {
        scope: 'all',
        projects: [],
        devices: []
      }
    }
  },
  {
    id: 2,
    name: '操作员',
    description: '负责设备操作和监控',
    type: 'system',
    userCount: 1,
    permissions: {
      system: [1, 2, 3, 4, 5, 6, 7, 8],
      data: {
        scope: 'department',
        projects: [],
        devices: []
      }
    }
  },
  {
    id: 3,
    name: '查看员',
    description: '只能查看数据和报表',
    type: 'system',
    userCount: 1,
    permissions: {
      system: [1, 2, 5, 9, 12],
      data: {
        scope: 'self',
        projects: [],
        devices: []
      }
    }
  },
  {
    id: 4,
    name: '运维工程师',
    description: '专门负责系统运维工作',
    type: 'custom',
    userCount: 0,
    permissions: {
      system: [1, 2, 3, 4, 5, 6, 7],
      data: {
        scope: 'department',
        projects: [],
        devices: []
      }
    }
  }
])

// 系统权限树 (移除了无效的图标引用)
const systemPermissions = ref([
  {
    id: 1,
    label: '首页',
    icon: null,
    description: '访问系统首页和仪表板',
    children: [
      {
        id: 2,
        label: '查看仪表板',
        description: '查看系统概览仪表板'
      }
    ]
  },
  {
    id: 3,
    label: '设备管理',
    icon: null,
    description: '管理项目、产品和设备',
    children: [
      {
        id: 4,
        label: '查看设备',
        description: '查看设备列表和详情'
      },
      {
        id: 5,
        label: '添加/编辑设备',
        description: '添加新设备或编辑现有设备'
      },
      {
        id: 6,
        label: '删除设备',
        description: '从系统中删除设备'
      }
    ]
  },
  {
    id: 7,
    label: '数据监控',
    icon: null,
    description: '实时监控设备数据',
    children: [
      {
        id: 8,
        label: '查看实时数据',
        description: '查看设备实时数据流'
      },
      {
        id: 9,
        label: '历史数据查询',
        description: '查询设备历史数据'
      }
    ]
  },
  {
    id: 10,
    label: '告警中心',
    icon: null,
    description: '处理设备告警信息',
    children: [
      {
        id: 11,
        label: '查看告警',
        description: '查看设备告警信息'
      },
      {
        id: 12,
        label: '处理告警',
        description: '处理和关闭告警'
      }
    ]
  },
  {
    id: 13,
    label: '统计分析',
    icon: null,
    description: '查看数据分析报告',
    children: [
      {
        id: 14,
        label: '查看报表',
        description: '查看各类统计报表'
      },
      {
        id: 15,
        label: '导出数据',
        description: '导出统计数据和报表'
      }
    ]
  }
])

// 项目数据
const projects = ref([
  { id: 1, name: '智慧城市项目' },
  { id: 2, name: '工业物联网项目' },
  { id: 3, name: '智慧农业项目' }
])

// 设备数据
const devices = ref([
  { id: 1, name: '温湿度传感器-001' },
  { id: 2, name: '空气质量监测器-001' },
  { id: 3, name: '水浸传感器-001' }
])

// 状态和过滤
const searchQuery = ref('')
const activeTab = ref('system')
const selectedRole = ref(null as any)

// 表单数据
const dataPermissionForm = ref({
  scope: 'department',
  projects: [] as number[],
  devices: [] as number[]
})

// 对话框状态
const roleDialog = ref({
  visible: false,
  isEdit: false,
  form: {
    id: 0,
    name: '',
    description: '',
    type: 'custom'
  }
})

// 树形控件属性
const permissionProps = {
  children: 'children',
  label: 'label'
}

// 角色统计
const roleStats = computed(() => {
  return {
    total: roles.value.length,
    assigned: roles.value.filter(r => r.userCount > 0).length,
    unassigned: roles.value.filter(r => r.userCount === 0).length,
    custom: roles.value.filter(r => r.type === 'custom').length
  }
})

// 计算过滤后的角色列表
const filteredRoles = computed(() => {
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    return roles.value.filter(role => 
      role.name.toLowerCase().includes(query) ||
      role.description.toLowerCase().includes(query)
    )
  }
  return roles.value
})

// 获取角色颜色
const getRoleColor = (type: string) => {
  switch (type) {
    case 'system': return '#409eff'
    case 'custom': return '#67c23a'
    default: return '#909399'
  }
}

// 获取角色标签类型
const getRoleType = (type: string) => {
  switch (type) {
    case 'system': return 'primary'
    case 'custom': return 'success'
    default: return 'info'
  }
}

// 获取角色类型名称
const getRoleTypeName = (type: string) => {
  switch (type) {
    case 'system': return '系统角色'
    case 'custom': return '自定义角色'
    default: return '未知'
  }
}

// 选择角色
const selectRole = (role: any) => {
  selectedRole.value = { ...role }
  dataPermissionForm.value = { ...role.permissions.data }
}

// 添加角色
const addRole = () => {
  roleDialog.value.isEdit = false
  roleDialog.value.form = {
    id: 0,
    name: '',
    description: '',
    type: 'custom'
  }
  roleDialog.value.visible = true
}

// 删除角色
const deleteRole = (role: any) => {
  ElMessageBox.confirm(
    `确定要删除角色 "${role.name}" 吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = roles.value.findIndex(r => r.id === role.id)
    if (index > -1) {
      roles.value.splice(index, 1)
      ElMessage.success('角色已删除')
      if (selectedRole.value && selectedRole.value.id === role.id) {
        selectedRole.value = null
      }
    }
  }).catch(() => {
    // 取消删除
  })
}

// 保存角色
const saveRole = () => {
  ElMessage.success('角色已保存')
  roleDialog.value.visible = false
}

// 保存权限
const savePermissions = () => {
  ElMessage.success('权限配置已保存')
}
</script>

<style scoped>
.permission-management {
  background: #f5f6fa;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.management-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.role-stats {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  border: none;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 15px;
}

.stat-icon.primary {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.stat-icon.success {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.stat-icon.info {
  background: rgba(142, 113, 170, 0.2);
  color: #8e71aa;
}

.stat-icon.warning {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.roles-card,
.permissions-card {
  border-radius: 8px;
  border: none;
}

.roles-card :deep(.el-card__header),
.permissions-card :deep(.el-card__header) {
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

.roles-list {
  height: calc(100vh - 250px);
  overflow-y: auto;
}

.role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 10px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 8px;
  border: 1px solid #ebeef5;
}

.role-item:hover {
  background: #f0f5ff;
}

.role-item.active {
  background: #e0eeff;
  border-color: #409eff;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.role-text {
  display: flex;
  flex-direction: column;
}

.role-name {
  font-weight: 500;
  color: #333;
}

.role-desc {
  font-size: 12px;
  color: #909399;
}

.role-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.data-permission-config {
  padding: 20px 0;
}

.empty-role {
  text-align: center;
  padding: 50px 0;
  color: #909399;
}

.empty-role p {
  margin-top: 10px;
}

.permission-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.permission-label {
  flex: 1;
}

.info-icon {
  color: #909399;
  cursor: help;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>