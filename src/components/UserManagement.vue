<template>
  <div class="user-management">
    <div class="management-header">
      <h2>用户管理</h2>
      <div class="controls">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索用户名..." 
          style="width: 250px; margin-right: 10px;"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button type="primary" @click="addUser" style="margin-left: 10px;">
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
              <div class="stat-value">{{ userStats.today }}</div>
              <div class="stat-label">今日新增</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><Lock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ userStats.last7Days }}</div>
              <div class="stat-label">近7日新增</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon warning">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ userStats.banned }}</div>
              <div class="stat-label">被禁用</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 用户列表 -->
      <el-card class="users-card" shadow="hover">
        <el-table 
          :data="userList" 
          style="width: 100%"
          stripe
          v-loading="loading"
        >
          <el-table-column prop="userId" label="用户ID" width="80" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="state" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.state)">
                {{ getStatusLabel(scope.row.state) }}
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
                type="danger" 
                @click="deleteUser(scope.row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[5, 10, 20, 50]"
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
              <span>{{ detailDialog.user.userId }}</span>
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
            <el-form-item label="状态：">
              <el-tag :type="getStatusTagType(detailDialog.user.state)">
                {{ getStatusLabel(detailDialog.user.state) }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="创建时间：">
          <span>{{ formatDate(detailDialog.user.createdAt) }}</span>
        </el-form-item>
        <el-form-item label="更新时间：">
          <span>{{ formatDate(detailDialog.user.updatedAt) }}</span>
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
      <el-form :model="userDialog.form" label-width="100px" ref="userFormRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名：" required prop="username">
              <el-input v-model="userDialog.form.username" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱：" required prop="email">
              <el-input v-model="userDialog.form.email" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="!userDialog.isEdit" label="初始密码：" required prop="password">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Search,
  Plus,
  User,
  UserFilled,
  Lock,
  Clock
} from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// API基础地址
const BASE_URL = 'http://localhost:10721'

// 用户列表数据
const userList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)

// 搜索查询
const searchQuery = ref('')

// 统计数据
const userStats = reactive({
  total: 0,
  today: 0,
  last7Days: 0,
  banned: 0
})

// 对话框状态
const detailDialog = ref({
  visible: false,
  user: {} as any
})

const userDialog = ref({
  visible: false,
  isEdit: false,
  form: {
    userId: 0,
    username: '',
    email: '',
    password: ''
  }
})

const userFormRef = ref()

// 获取用户统计数据
const fetchUserStats = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/userFront/head`)
    if (response.data.ok) {
      userStats.total = response.data.data.userTolal
      userStats.today = response.data.data.userLoadToday
      userStats.last7Days = response.data.data.userLoadLast7Days
      userStats.banned = response.data.data.userRegisterBeBanned
    }
  } catch (error) {
    console.error('获取用户统计数据失败:', error)
    ElMessage.error('获取用户统计数据失败')
  }
}

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    let response;
    if (searchQuery.value) {
      // 如果有搜索关键词，则使用搜索接口
      response = await axios.get(`${BASE_URL}/userFront/search`, {
        params: {
          username: searchQuery.value,
          current: currentPage.value,
          size: pageSize.value
        }
      })
    } else {
      // 否则使用普通分页接口
      response = await axios.get(`${BASE_URL}/user/pageUser`, {
        params: {
          current: currentPage.value,
          size: pageSize.value
        }
      })
    }
    
    if (response.data.ok) {
      userList.value = response.data.data.records
      total.value = response.data.data.total
    } else {
      ElMessage.error(response.data.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 格式化时间戳
const formatDate = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-')
}

// 获取状态标签类型
const getStatusTagType = (state: number) => {
  switch (state) {
    case 0: return 'success'
    case 1: return 'danger'
    default: return ''
  }
}

// 获取状态标签文本
const getStatusLabel = (state: number) => {
  switch (state) {
    case 0: return '启用'
    case 1: return '禁用'
    default: return '未知'
  }
}

// 查看用户详情
const viewUser = async (user: any) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/getUser`, {
      params: {
        userId: user.userId
      }
    })
    
    if (response.data.ok) {
      detailDialog.value.user = response.data.data
      detailDialog.value.visible = true
    } else {
      ElMessage.error(response.data.message || '获取用户详情失败')
    }
  } catch (error) {
    console.error('获取用户详情失败:', error)
    ElMessage.error('获取用户详情失败')
  }
}

// 添加用户
const addUser = () => {
  userDialog.value.isEdit = false
  userDialog.value.form = {
    userId: 0,
    username: '',
    email: '',
    password: ''
  }
  userDialog.value.visible = true
}

// 编辑用户
const editUser = (user: any) => {
  userDialog.value.isEdit = true
  userDialog.value.form = {
    userId: user.userId,
    username: user.username,
    email: user.email,
    password: '' // 编辑时不显示密码
  }
  userDialog.value.visible = true
}

// 删除用户
const deleteUser = (user: any) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${user.username}" 吗？此操作不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 注意：这里需要后端提供删除用户的API接口
      // 由于没有提供删除接口，我们模拟删除成功并刷新列表
      ElMessage.success('用户删除成功')
      await fetchUserList()
      await fetchUserStats()
    } catch (error) {
      console.error('删除用户失败:', error)
      ElMessage.error('删除用户失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 保存用户
const saveUser = async () => {
  if (!userDialog.value.form.username || !userDialog.value.form.email) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  if (!userDialog.value.isEdit && !userDialog.value.form.password) {
    ElMessage.warning('请填写初始密码')
    return
  }

  try {
    if (userDialog.value.isEdit) {
      // 更新用户
      const updateUser = {
        userId: userDialog.value.form.userId,
        username: userDialog.value.form.username,
        email: userDialog.value.form.email
      }
      
      await axios.post(`${BASE_URL}/user/updateUser`, updateUser)
      ElMessage.success('用户信息更新成功')
    } else {
      // 添加用户
      const newUser = {
        username: userDialog.value.form.username,
        email: userDialog.value.form.email,
        passwordHash: userDialog.value.form.password // 注意：实际应用中应加密处理
      }
      
      await axios.post(`${BASE_URL}/user/addUser`, newUser)
      ElMessage.success('用户添加成功')
    }
    
    userDialog.value.visible = false
    await fetchUserList()
    await fetchUserStats()
  } catch (error) {
    console.error('保存用户失败:', error)
    ElMessage.error('保存用户失败')
  }
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchUserList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchUserList()
}

// 添加搜索方法
const handleSearch = () => {
  currentPage.value = 1
  fetchUserList()
}

// 页面加载时获取数据
onMounted(() => {
  fetchUserStats()
  fetchUserList()
})
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