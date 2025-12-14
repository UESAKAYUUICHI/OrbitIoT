<template>
  <div class="product-management">
    <div class="management-header">
      <div class="header-left">
        <el-page-header 
          @back="goBack" 
          :content="`产品管理 - ${currentProject?.name || '项目'}'`"
        >
        </el-page-header>
      </div>
      <div class="controls">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索产品..." 
          style="width: 250px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="addProduct">
          <el-icon><Plus /></el-icon>
          添加产品
        </el-button>
      </div>
    </div>
    
    <div class="management-content">
      <!-- 产品统计 -->
      <el-row :gutter="20" class="product-stats">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon primary">
              <el-icon :size="24"><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ productStats.total }}</div>
              <div class="stat-label">产品总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon success">
              <el-icon :size="24"><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ productStats.active }}</div>
              <div class="stat-label">已发布</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon warning">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ productStats.developing }}</div>
              <div class="stat-label">开发中</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><Finished /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ productStats.deviceCount }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 产品列表 -->
      <el-card class="products-card" shadow="hover">
        <el-table 
          :data="filteredProducts" 
          style="width: 100%"
          stripe
          v-loading="loading"
          @row-click="viewProductDevices"
        >
          <el-table-column prop="id" label="产品ID" width="120" />
          <el-table-column prop="name" label="产品名称" />
          <el-table-column prop="deviceModel" label="设备模型" width="120" />
          <el-table-column label="关联设备" width="200">
            <template #default="scope">
              <el-tag
                v-for="device in getProductDevices(scope.row.id)"
                :key="device.id"
                type="primary"
                style="margin-right: 5px; margin-bottom: 5px;"
              >
                {{ device.name }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" type="primary" @click.stop="viewProductDevices(scope.row)">
                查看设备
              </el-button>
              <el-button size="small" type="success" @click.stop="editProduct(scope.row)">
                编辑
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
    
    <!-- 添加/编辑产品对话框 -->
    <el-dialog
      v-model="productDialog.visible"
      :title="productDialog.isEdit ? '编辑产品' : '添加产品'"
      width="600px"
    >
      <el-form :model="productDialog.form" label-width="100px">
        <el-form-item label="产品名称：" required>
          <el-input v-model="productDialog.form.name" />
        </el-form-item>
        <el-form-item label="产品标识：" required>
          <el-input v-model="productDialog.form.key" />
        </el-form-item>
        <el-form-item label="设备模型：">
          <el-input v-model="productDialog.form.deviceModel" />
        </el-form-item>
        <el-form-item label="产品描述：">
          <el-input 
            v-model="productDialog.form.description" 
            type="textarea" 
            :rows="3" 
          />
        </el-form-item>
        <el-form-item label="产品状态：">
          <el-select v-model="productDialog.form.status" style="width: 100%;">
            <el-option label="开发中" value="developing" />
            <el-option label="已发布" value="active" />
            <el-option label="已停产" value="discontinued" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="productDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveProduct">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Search,
  Plus,
  Box,
  Check,
  Clock,
  Finished
} from '@element-plus/icons-vue'

// 当前项目
const currentProject = ref<any>(null)

// 产品数据
const products = ref([
  {
    id: 'PROD001',
    name: 'THS-100 温湿度传感器',
    projectId: 'PROJ001',
    deviceModel: 'THS-100',
    deviceCount: 3,
    status: 'active',
    key: 'ths-100',
    description: '高精度温湿度传感器，适用于室内外环境监测',
    createTime: '2025-01-20 10:30:00'
  },
  {
    id: 'PROD002',
    name: 'AQ-200 空气质量监测器',
    projectId: 'PROJ001',
    deviceModel: 'AQ-200',
    deviceCount: 2,
    status: 'active',
    key: 'aq-200',
    description: '多功能空气质量监测器，检测PM2.5、CO2等指标',
    createTime: '2025-02-15 14:20:00'
  },
  {
    id: 'PROD003',
    name: 'SW-300 水浸传感器',
    projectId: 'PROJ002',
    deviceModel: 'SW-300',
    deviceCount: 1,
    status: 'active',
    key: 'sw-300',
    description: '工业级水浸传感器，防水等级IP67',
    createTime: '2025-03-10 09:45:00'
  },
  {
    id: 'PROD004',
    name: 'PLC-400 工业控制器',
    projectId: 'PROJ002',
    deviceModel: 'PLC-400',
    deviceCount: 0,
    status: 'developing',
    key: 'plc-400',
    description: '高性能工业控制器，支持多种通讯协议',
    createTime: '2025-11-05 11:30:00'
  }
])

// 设备数据
const devices = ref([
  {
    id: 'DEV001THS',
    name: '温湿度传感器-001',
    productId: 'PROD001',
    status: 'online',
    lastActive: '2025-12-14 10:30:22',
    ipAddress: '192.168.1.101',
    key: 'ths-001',
    secret: '********'
  },
  {
    id: 'DEV002THS',
    name: '温湿度传感器-002',
    productId: 'PROD001',
    status: 'online',
    lastActive: '2025-12-14 10:28:45',
    ipAddress: '192.168.1.102',
    key: 'ths-002',
    secret: '********'
  },
  {
    id: 'DEV003THS',
    name: '温湿度传感器-003',
    productId: 'PROD001',
    status: 'offline',
    lastActive: '2025-12-14 09:15:33',
    ipAddress: '192.168.1.103',
    key: 'ths-003',
    secret: '********'
  },
  {
    id: 'DEV004AQ',
    name: '空气质量监测器-001',
    productId: 'PROD002',
    status: 'maintenance',
    lastActive: '2025-12-14 08:42:11',
    ipAddress: '192.168.1.201',
    key: 'aq-001',
    secret: '********'
  },
  {
    id: 'DEV005AQ',
    name: '空气质量监测器-002',
    productId: 'PROD002',
    status: 'online',
    lastActive: '2025-12-14 10:32:56',
    ipAddress: '192.168.1.202',
    key: 'aq-002',
    secret: '********'
  },
  {
    id: 'DEV006SW',
    name: '水浸传感器-001',
    productId: 'PROD003',
    status: 'online',
    lastActive: '2025-12-14 11:15:42',
    ipAddress: '192.168.2.101',
    key: 'sw-001',
    secret: '********'
  }
])

// 状态和过滤
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)

// 对话框状态
const productDialog = ref({
  visible: false,
  isEdit: false,
  form: {
    id: '',
    name: '',
    projectId: '',
    deviceModel: '',
    key: '',
    description: '',
    status: 'developing'
  }
})

// 产品统计
const productStats = computed(() => {
  const filtered = filteredProducts.value
  const deviceCount = filtered.reduce((sum, product) => sum + product.deviceCount, 0)
  return {
    total: filtered.length,
    active: filtered.filter(p => p.status === 'active').length,
    developing: filtered.filter(p => p.status === 'developing').length,
    deviceCount: deviceCount
  }
})

// 计算过滤后的产品列表
const filteredProducts = computed(() => {
  let result = products.value
  
  // 根据当前项目过滤
  if (currentProject.value) {
    result = result.filter(product => product.projectId === currentProject.value.id)
  }
  
  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(product => 
      product.id.toLowerCase().includes(query) ||
      product.name.toLowerCase().includes(query) ||
      product.deviceModel.toLowerCase().includes(query)
    )
  }
  
  // 分页处理
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return result.slice(start, end)
})

// 计算总项目数
const totalItems = computed(() => {
  let result = products.value
  
  // 根据当前项目过滤
  if (currentProject.value) {
    result = result.filter(product => product.projectId === currentProject.value.id)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(product => 
      product.id.toLowerCase().includes(query) ||
      product.name.toLowerCase().includes(query) ||
      product.deviceModel.toLowerCase().includes(query)
    )
  }
  
  return result.length
})

// 获取产品关联的设备
const getProductDevices = (productId: string) => {
  return devices.value.filter(device => device.productId === productId)
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'developing': return 'warning'
    case 'discontinued': return 'info'
    default: return ''
  }
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return '已发布'
    case 'developing': return '开发中'
    case 'discontinued': return '已停产'
    default: return status
  }
}

// 返回上一级
const goBack = () => {
  // 发送事件到父组件，通知返回项目管理页面
  const event = new CustomEvent('navigate-to-projects');
  window.dispatchEvent(event);
}

// 查看产品设备
const viewProductDevices = (product: any) => {
  // 发送事件到父组件，通知切换到设备管理页面
  const event = new CustomEvent('navigate-to-devices', { detail: product });
  window.dispatchEvent(event);
}

// 添加产品
const addProduct = () => {
  productDialog.value.isEdit = false
  productDialog.value.form = {
    id: '',
    name: '',
    projectId: currentProject.value?.id || '',
    deviceModel: '',
    key: '',
    description: '',
    status: 'developing'
  }
  productDialog.value.visible = true
}

// 编辑产品
const editProduct = (product: any) => {
  productDialog.value.isEdit = true
  productDialog.value.form = { ...product }
  productDialog.value.visible = true
}

// 保存产品
const saveProduct = () => {
  ElMessage.success('产品信息已保存')
  productDialog.value.visible = false
}

// 分页处理
const handleSizeChange = (val: number) => {
  itemsPerPage.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 监听导航事件
onMounted(() => {
  window.addEventListener('set-current-project', (event: any) => {
    currentProject.value = event.detail
  })
})
</script>

<style scoped>
.product-management {
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

.product-stats {
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

.stat-icon.warning {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.stat-icon.info {
  background: rgba(142, 113, 170, 0.2);
  color: #8e71aa;
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

.products-card {
  border-radius: 8px;
  border: none;
}

.products-card :deep(.el-card__body) {
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