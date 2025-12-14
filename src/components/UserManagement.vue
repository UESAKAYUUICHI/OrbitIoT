<template>
  <div class="user-management">
    <div class="management-header">
      <h2>用户管理</h2>
      <div class="controls">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索用户..." 
          style="width: 250px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="addUser">
          <el-icon><Plus /></el-icon>
          添加用户
        </el-button>
      </div>
    </div>
    
    <div class="management-content">
      <!-- 用户统计 -->
      <el-row :gutter="20" class="user-stats">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon primary">
              <el-icon :size="24"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ userStats.total }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon success">
              <el-icon :size="24"><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ userStats.active }}</div>
              <div class="stat-label">活跃用户</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><Lock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ userStats.admins }}</div>
              <div class="stat-label">管理员</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon warning">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ userStats.pending }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 用户列表 -->
      <el-card class="users-card" shadow="hover">
        <el-table 
          :data="filteredUsers" 
          style="width: 100%"
          stripe
          v-loading="loading"
        >
          <el-table-column prop="id" label="用户ID" width="80" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="role" label="角色">
            <template #default="scope">
              <el-tag :type="getRoleTagType(scope.row.role)">
                {{ getRoleLabel(scope.row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="department" label="部门" />
          <el-table-column prop="lastLogin" label="最后登录" width="180" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250">
            <template #default="scope">
              <el-button size="small" type="primary" @click="viewUser(scope.row)">
                查看详情
              </el-button>
              <el-button size="small" type="success" @click="editUser(scope.row)">
                编辑
              </el-button>
              <el-button 
                size="small" 
                type="warning" 
                @click="resetPassword(scope.row)"
              >
                重置密码
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="itemsPerPage"
            :total="totalItems"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
    
    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      :title="'用户详情 - ' + detailDialog.user.username"
      width="600px"
    >
      <el-form :model="detailDialog.user" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户ID：">
              <span>{{ detailDialog.user.id }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户名：">
              <span>{{ detailDialog.user.username }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱：">
              <span>{{ detailDialog.user.email }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号：">
              <span>{{ detailDialog.user.phone }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色：">
              <el-tag :type="getRoleTagType(detailDialog.user.role)">
                {{ getRoleLabel(detailDialog.user.role) }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态：">
              <el-tag :type="getStatusTagType(detailDialog.user.status)">
                {{ getStatusLabel(detailDialog.user.status) }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门：">
              <span>{{ detailDialog.user.department }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位：">
              <span>{{ detailDialog.user.position }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="创建时间：">
          <span>{{ detailDialog.user.createTime }}</span>
        </el-form-item>
        <el-form-item label="最后登录：">
          <span>{{ detailDialog.user.lastLogin }}</span>
        </el-form-item>
        <el-form-item label="备注：">
          <span>{{ detailDialog.user.remark }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="userDialog.visible"
      :title="userDialog.isEdit ? '编辑用户' : '添加用户'"
      width="600px"
    >
      <el-form :model="userDialog.form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名：" required>
              <el-input v-model="userDialog.form.username" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱：" required>
              <el-input v-model="userDialog.form.email" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号：">
              <el-input v-model="userDialog.form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门：">
              <el-input v-model="userDialog.form.department" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职位：">
              <el-input v-model="userDialog.form.position" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色：" required>
              <el-select v-model="userDialog.form.role" style="width: 100%;">
                <el-option 
                  v-for="role in roles" 
                  :key="role.value" 
                  :label="role.label" 
                  :value="role.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态：">
          <el-radio-group v-model="userDialog.form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
            <el-radio label="pending">待审核</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注：">
          <el-input 
            v-model="userDialog.form.remark" 
            type="textarea" 
            :rows="3" 
          />
        </el-form-item>
        <el-form-item v-if="!userDialog.isEdit" label="初始密码：" required>
          <el-input 
            v-model="userDialog.form.password" 
            type="password" 
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveUser">保存</el-button>
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
  User,
  UserFilled,
  Lock,
  Clock
} from '@element-plus/icons-vue'

// 用户数据
const users = ref([
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    phone: '13800138000',
    role: 'administrator',
    department: '技术部',
    position: '系统管理员',
    status: 'active',
    createTime: '2025-01-01 10:00:00',
    lastLogin: '2025-12-14 10:30:22',
    remark: '系统超级管理员'
  },
  {
    id: 2,
    username: 'operator',
    email: 'operator@example.com',
    phone: '13800138001',
    role: 'operator',
    department: '运维部',
    position: '运维工程师',
    status: 'active',
    createTime: '2025-01-15 14:30:00',
    lastLogin: '2025-12-14 09:15:33',
    remark: '负责设备运维工作'
  },
  {
    id: 3,
    username: 'viewer',
    email: 'viewer@example.com',
    phone: '13800138002',
    role: 'viewer',
    department: '管理层',
    position: '项目经理',
    status: 'active',
    createTime: '2025-02-01 09:45:00',
    lastLogin: '2025-12-14 08:42:11',
    remark: '只读权限用户'
  },
  {
    id: 4,
    username: 'newuser',
    email: 'newuser@example.com',
    phone: '13800138003',
    role: 'operator',
    department: '技术部',
    position: '开发工程师',
    status: 'pending',
    createTime: '2025-12-10 16:20:00',
    lastLogin: '',
    remark: '新入职员工'
  }
])

// 角色选项
const roles = ref([
  { value: 'administrator', label: '系统管理员' },
  { value: 'operator', label: '操作员' },
  { value: 'viewer', label: '查看员' }
])

// 状态和过滤
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)

// 对话框状态
const detailDialog = ref({
  visible: false,
  user: {} as any
})

const userDialog = ref({
  visible: false,
  isEdit: false,
  form: {
    id: 0,
    username: '',
    email: '',
    phone: '',
    role: 'viewer',
    department: '',
    position: '',
    status: 'pending',
    password: '',
    remark: ''
  }
})

// 用户统计
const userStats = computed(() => {
  return {
    total: users.value.length,
    active: users.value.filter(u => u.status === 'active').length,
    admins: users.value.filter(u => u.role === 'administrator').length,
    pending: users.value.filter(u => u.status === 'pending').length
  }
})

// 计算过滤后的用户列表
const filteredUsers = computed(() => {
  let result = users.value
  
  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.department.toLowerCase().includes(query)
    )
  }
  
  // 分页处理
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return result.slice(start, end)
})

// 计算总项目数
const totalItems = computed(() => {
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    return users.value.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.department.toLowerCase().includes(query)
    ).length
  }
  return users.value.length
})

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

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'danger'
    case 'pending': return 'warning'
    default: return ''
  }
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return '启用'
    case 'inactive': return '禁用'
    case 'pending': return '待审核'
    default: return status
  }
}

// 查看用户详情
const viewUser = (user: any) => {
  detailDialog.value.user = { ...user }
  detailDialog.value.visible = true
}

// 添加用户
const addUser = () => {
  userDialog.value.isEdit = false
  userDialog.value.form = {
    id: 0,
    username: '',
    email: '',
    phone: '',
    role: 'viewer',
    department: '',
    position: '',
    status: 'pending',
    password: '',
    remark: ''
  }
  userDialog.value.visible = true
}

// 编辑用户
const editUser = (user: any) => {
  userDialog.value.isEdit = true
  userDialog.value.form = { ...user }
  userDialog.value.visible = true
}

// 重置密码
const resetPassword = (user: any) => {
  ElMessageBox.prompt(`请输入为用户 ${user.username} 设置的新密码：`, '重置密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'password',
    inputPlaceholder: '请输入新密码'
  }).then(({ value }) => {
    if (value) {
      ElMessage.success('密码已重置')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 保存用户
const saveUser = () => {
  ElMessage.success('用户信息已保存')
  userDialog.value.visible = false
}

// 分页处理
const handleSizeChange = (val: number) => {
  itemsPerPage.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}
</script>

<style scoped>
.user-management {
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

.user-stats {
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

.users-card {
  border-radius: 8px;
  border: none;
}

.users-card :deep(.el-card__body) {
  padding: 0;
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>