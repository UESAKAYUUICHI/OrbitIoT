<template>
  <div class="permission-management">
    <div class="management-header">
      <h2>权限管理</h2>
      <div class="controls">
        <el-button type="primary" @click="addPermission">
          <el-icon><Plus /></el-icon>
          添加权限
        </el-button>
      </div>
    </div>
    
    <div class="management-content">
      <!-- 权限统计 -->
      <el-row :gutter="20" class="permission-stats">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon primary">
              <el-icon :size="24"><Lock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ permissionStats.total }}</div>
              <div class="stat-label">总权限数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon success">
              <el-icon :size="24"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ permissionStats.hasAllRole }}</div>
              <div class="stat-label">完全角色</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ permissionStats.hasNoAllRole }}</div>
              <div class="stat-label">非完全角色</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon warning">
              <el-icon :size="24"><Setting /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ permissionStats.createdRoles }}</div>
              <div class="stat-label">已创建角色</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 用户权限分配界面 -->
      <el-row :gutter="20" class="permission-assignment">
        <!-- 左侧用户列表 -->
        <el-col :span="6">
          <el-card class="user-list-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>用户列表</span>
              </div>
            </template>
            <div class="user-search">
              <el-input 
                v-model="userSearchQuery" 
                placeholder="搜索用户..." 
                clearable
                @clear="fetchUsers"
                @keyup.enter="fetchUsers"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" @click="fetchUsers" style="margin-top: 10px; width: 100%">
                搜索
              </el-button>
            </div>
            <el-menu
              :default-active="selectedUserId.toString()"
              class="user-menu"
              @select="handleUserSelect"
            >
              <el-menu-item index="0">
                <el-icon><Lock /></el-icon>
                <span>权限总览</span>
              </el-menu-item>
              <el-menu-item 
                v-for="user in userList" 
                :key="user.userId" 
                :index="user.userId.toString()"
              >
                <el-icon><User /></el-icon>
                <span>{{ user.username }}</span>
              </el-menu-item>
            </el-menu>
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="userCurrentPage"
                v-model:page-size="userPageSize"
                :total="userTotal"
                layout="prev, pager, next"
                small
                background
                @current-change="handleUserPageChange"
              />
            </div>
          </el-card>
        </el-col>
        
        <!-- 右侧权限详情 -->
        <el-col :span="18">
          <el-card class="permissions-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>{{ selectedUserUsername ? `${selectedUserUsername} 的权限` : '权限总览' }}</span>
                <el-button 
                  v-if="selectedUserId > 0" 
                  type="primary" 
                  @click="saveUserPermissions"
                  :loading="savingPermissions"
                >
                  保存权限
                </el-button>
              </div>
            </template>
            
            <!-- 权限树形列表 -->
            <el-tree
              ref="permissionTreeRef"
              :data="permissionTree"
              node-key="id"
              default-expand-all
              show-checkbox
              :default-checked-keys="defaultCheckedKeys"
              :expand-on-click-node="false"
              :props="treeProps"
              @check="handlePermissionCheck"
            >
              <template #default="{ node, data }">
                <div class="permission-node">
                  <span>
                    <el-tag :type="data.type === 'module' ? 'primary' : 'success'" size="small">
                      {{ data.type === 'module' ? '模块' : '权限' }}
                    </el-tag>
                    <span class="permission-name">{{ data.label }}</span>
                  </span>
                </div>
              </template>
            </el-tree>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 添加/编辑权限对话框 -->
    <el-dialog
      v-model="permissionDialog.visible"
      :title="permissionDialog.isEdit ? '编辑权限' : '添加权限'"
      width="600px"
    >
      <el-form :model="permissionDialog.form" label-width="100px" ref="permissionFormRef">
        <el-form-item label="权限编码：" required prop="permCode">
          <el-input v-model="permissionDialog.form.permCode" placeholder="例如：device:read" />
        </el-form-item>
        <el-form-item label="权限名称：" required prop="permName">
          <el-input v-model="permissionDialog.form.permName" placeholder="例如：设备查看" />
        </el-form-item>
        <el-form-item label="所属模块：" required prop="module">
          <el-input v-model="permissionDialog.form.module" placeholder="例如：device" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="savePermission">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { 
  Plus,
  Lock,
  User,
  UserFilled,
  Setting,
  Search
} from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// API基础地址
const BASE_URL = 'http://localhost:10721'

// 权限统计数据
const permissionStats = reactive({
  total: 0,
  hasAllRole: 0,
  hasNoAllRole: 0,
  createdRoles: 0
})

// 用户列表相关
const userList = ref([])
const userSearchQuery = ref('')
const userCurrentPage = ref(1)
const userPageSize = ref(10)
const userTotal = ref(0)

// 选中的用户
const selectedUserId = ref(0) // 0表示权限总览
const selectedUserUsername = ref('')

// 权限树数据
const permissionTree = ref([])
const defaultCheckedKeys = ref([])
const checkedPermissionIds = ref<number[]>([])

// 树属性配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 引用
const permissionTreeRef = ref()

// 加载状态
const savingPermissions = ref(false)

// 对话框状态
const permissionDialog = ref({
  visible: false,
  isEdit: false,
  form: {
    permId: 0,
    permCode: '',
    permName: '',
    module: ''
  }
})

const permissionFormRef = ref()

// 获取权限统计数据
const fetchPermissionStats = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/permissionFront/head`)
    if (response.data.ok) {
      permissionStats.total = response.data.data.permissionTotal
      permissionStats.hasAllRole = response.data.data.hasAllRoleTotal
      permissionStats.hasNoAllRole = response.data.data.hasNoAllRoleTotal
      permissionStats.createdRoles = response.data.data.createRoleTotal
    }
  } catch (error) {
    console.error('获取权限统计数据失败:', error)
    ElMessage.error('获取权限统计数据失败')
  }
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/user/pageUser`, {
      params: {
        current: userCurrentPage.value,
        size: userPageSize.value,
        username: userSearchQuery.value
      }
    })
    
    if (response.data.ok) {
      userList.value = response.data.data.records
      userTotal.value = response.data.data.total
    } else {
      ElMessage.error(response.data.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  }
}

// 获取所有权限并构建树形结构
const fetchAllPermissions = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/permission/listPermission`)
    if (response.data.ok) {
      const permissions = response.data.data
      buildPermissionTree(permissions)
    } else {
      ElMessage.error(response.data.message || '获取权限列表失败')
    }
  } catch (error) {
    console.error('获取权限列表失败:', error)
    ElMessage.error('获取权限列表失败')
  }
}

// 构建权限树
const buildPermissionTree = (permissions: any[]) => {
  // 按模块分组
  const modules: Record<string, any[]> = {}
  
  permissions.forEach(permission => {
    const module = permission.module
    if (!modules[module]) {
      modules[module] = []
    }
    modules[module].push(permission)
  })
  
  // 构建树形结构
  const tree = []
  for (const moduleName in modules) {
    const moduleNode = {
      id: `module-${moduleName}`,
      label: moduleName,
      type: 'module',
      children: modules[moduleName].map(permission => ({
        id: `permission-${permission.permId}`,
        label: permission.permName,
        type: 'permission',
        permId: permission.permId,
        permCode: permission.permCode,
        permName: permission.permName,
        module: permission.module
      }))
    }
    tree.push(moduleNode)
  }
  
  permissionTree.value = tree
}

// 获取用户权限
const fetchUserPermissions = async (userId: number) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/getUserToPermission`, {
      params: {
        userId: userId
      }
    })
    
    if (response.data.ok) {
      // 提取用户权限ID列表
      const userPermissions = response.data.data.permissions || []
      checkedPermissionIds.value = userPermissions.map((perm: any) => perm.permId)
      
      // 设置默认选中的节点
      await nextTick()
      defaultCheckedKeys.value = checkedPermissionIds.value.map(id => `permission-${id}`)
      
      // 设置半选中状态
      setHalfCheckedKeys()
    } else {
      ElMessage.error(response.data.message || '获取用户权限失败')
    }
  } catch (error) {
    console.error('获取用户权限失败:', error)
    ElMessage.error('获取用户权限失败')
  }
}

// 设置半选中状态
const setHalfCheckedKeys = () => {
  // 获取所有模块节点
  const moduleNodes = permissionTree.value.map(node => node.id)
  
  // 设置半选中状态
  moduleNodes.forEach(moduleId => {
    permissionTreeRef.value?.setCheckedKeys([moduleId], false)
  })
}

// 处理用户选择
const handleUserSelect = async (userId: string) => {
  selectedUserId.value = parseInt(userId)
  
  if (selectedUserId.value === 0) {
    // 权限总览
    selectedUserUsername.value = ''
    defaultCheckedKeys.value = []
    checkedPermissionIds.value = []
    return
  }
  
  // 找到选中的用户
  const user = userList.value.find(u => u.userId === selectedUserId.value)
  if (user) {
    selectedUserUsername.value = user.username
  }
  
  // 获取用户权限
  await fetchUserPermissions(selectedUserId.value)
}

// 处理权限勾选
const handlePermissionCheck = (data: any, info: any) => {
  // 获取所有选中的叶子节点（权限节点）
  const checkedNodes = info.checkedNodes.filter((node: any) => node.type === 'permission')
  checkedPermissionIds.value = checkedNodes.map((node: any) => node.permId)
  
  // 同时也要包含半选中的节点
  const halfCheckedNodes = info.halfCheckedNodes.filter((node: any) => node.type === 'permission')
  const halfCheckedIds = halfCheckedNodes.map((node: any) => node.permId)
  
  // 合并选中和半选中的ID
  checkedPermissionIds.value = [...checkedPermissionIds.value, ...halfCheckedIds]
}

// 保存用户权限
const saveUserPermissions = async () => {
  if (selectedUserId.value <= 0) return
  
  savingPermissions.value = true
  try {
    // 调用后端接口保存用户权限
    const response = await axios.post(`${BASE_URL}/permission/saveUserPermissions`, 
      checkedPermissionIds.value,
      {
        params: {
          userId: selectedUserId.value
        }
      }
    )
    
    if (response.data.ok) {
      ElMessage.success('权限保存成功')
    } else {
      ElMessage.error(response.data.message || '权限保存失败')
    }
  } catch (error) {
    console.error('保存用户权限失败:', error)
    ElMessage.error('保存用户权限失败')
  } finally {
    savingPermissions.value = false
  }
}

// 用户分页变化
const handleUserPageChange = (page: number) => {
  userCurrentPage.value = page
  fetchUsers()
}

// 添加权限
const addPermission = () => {
  permissionDialog.value.isEdit = false
  permissionDialog.value.form = {
    permId: 0,
    permCode: '',
    permName: '',
    module: ''
  }
  permissionDialog.value.visible = true
}

// 编辑权限
const editPermission = (permission: any) => {
  permissionDialog.value.isEdit = true
  permissionDialog.value.form = {
    permId: permission.permId,
    permCode: permission.permCode,
    permName: permission.permName,
    module: permission.module
  }
  permissionDialog.value.visible = true
}

// 删除权限
const deletePermission = (permission: any) => {
  ElMessageBox.confirm(
    `确定要删除权限 "${permission.permName}" 吗？此操作不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/permission/deletePermission`, {
        params: {
          permId: permission.permId
        }
      })
      
      if (response.data.ok) {
        ElMessage.success('权限删除成功')
        await fetchAllPermissions()
        await fetchPermissionStats()
      } else {
        ElMessage.error(response.data.message || '权限删除失败')
      }
    } catch (error) {
      console.error('删除权限失败:', error)
      ElMessage.error('删除权限失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 保存权限
const savePermission = async () => {
  if (!permissionDialog.value.form.permCode || 
      !permissionDialog.value.form.permName || 
      !permissionDialog.value.form.module) {
    ElMessage.warning('请填写所有必填项')
    return
  }

  try {
    let response;
    if (permissionDialog.value.isEdit) {
      // 更新权限
      response = await axios.post(`${BASE_URL}/permission/updatePermission`, {
        permId: permissionDialog.value.form.permId,
        permCode: permissionDialog.value.form.permCode,
        permName: permissionDialog.value.form.permName,
        module: permissionDialog.value.form.module
      })
    } else {
      // 添加权限
      response = await axios.post(`${BASE_URL}/permission/addPermission`, {
        permCode: permissionDialog.value.form.permCode,
        permName: permissionDialog.value.form.permName,
        module: permissionDialog.value.form.module
      })
    }
    
    if (response.data.ok) {
      ElMessage.success(permissionDialog.value.isEdit ? '权限更新成功' : '权限添加成功')
      permissionDialog.value.visible = false
      await fetchAllPermissions()
      await fetchPermissionStats()
    } else {
      ElMessage.error(response.data.message || (permissionDialog.value.isEdit ? '权限更新失败' : '权限添加失败'))
    }
  } catch (error) {
    console.error('保存权限失败:', error)
    ElMessage.error('保存权限失败')
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchPermissionStats()
  fetchAllPermissions()
  fetchUsers()
})
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

.permission-stats {
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

.permission-assignment {
  margin-top: 20px;
}

.user-list-card, .permissions-card {
  border-radius: 8px;
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-menu {
  border: none;
  margin-top: 15px;
}

.user-menu :deep(.el-menu-item) {
  height: 40px;
  line-height: 40px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

.permission-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.permission-name {
  margin-left: 10px;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>