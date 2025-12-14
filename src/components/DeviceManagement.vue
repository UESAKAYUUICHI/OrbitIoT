<template>
  <div class="device-management">
    <div class="management-header">
      <div class="header-left">
        <el-page-header 
          @back="goBack" 
          :content="`设备管理 - ${currentProduct?.name || '产品'}'`"
        >
        </el-page-header>
      </div>
      <div class="controls">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索设备..." 
          style="width: 250px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select 
          v-model="statusFilter" 
          placeholder="设备状态" 
          style="width: 120px; margin-right: 10px;"
          clearable
        >
          <el-option label="所有状态" value="" />
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="维护中" value="maintenance" />
        </el-select>
        <el-button type="primary" @click="addDevice">
          <el-icon><Plus /></el-icon>
          添加设备
        </el-button>
      </div>
    </div>
    
    <div class="management-content">
      <!-- 设备统计 -->
      <el-row :gutter="20" class="device-stats">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon primary">
              <el-icon :size="24"><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ deviceStats.total }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon success">
              <el-icon :size="24"><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ deviceStats.online }}</div>
              <div class="stat-label">在线设备</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon warning">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ deviceStats.offline }}</div>
              <div class="stat-label">离线设备</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><Tools /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ deviceStats.maintenance }}</div>
              <div class="stat-label">维护中</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 设备列表或设备详情 -->
      <div v-if="!selectedDevice">
        <!-- 设备列表 -->
        <el-card class="devices-card" shadow="hover">
          <el-table 
            :data="filteredDevices" 
            style="width: 100%"
            stripe
            v-loading="loading"
            @row-click="selectDevice"
          >
            <el-table-column prop="id" label="设备ID" width="150" />
            <el-table-column prop="name" label="设备名称" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getTagType(scope.row.status)">
                  {{ getStatusLabel(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastActive" label="最后活跃" width="180" />
            <el-table-column prop="ipAddress" label="IP地址" width="150" />
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" type="primary" @click="selectDevice(scope.row)">
                  查看详情
                </el-button>
                <el-button size="small" type="danger" @click="deleteDevice(scope.row)">
                  删除
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
      
      <!-- 设备详情 -->
      <div v-else>
        <el-page-header 
          @back="backToDeviceList" 
          :content="`设备详情 - ${selectedDevice.name}`"
          class="device-detail-header"
        >
        </el-page-header>
        
        <el-row :gutter="20" class="device-detail-content">
          <el-col :span="16">
            <el-card class="chart-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>实时数据曲线</span>
                </div>
              </template>
              <div class="chart-container">
                <div ref="detailChartRef" style="width: 100%; height: 400px;"></div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="device-info-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>设备基本信息</span>
                </div>
              </template>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="设备ID">{{ selectedDevice.id }}</el-descriptions-item>
                <el-descriptions-item label="设备名称">{{ selectedDevice.name }}</el-descriptions-item>
                <el-descriptions-item label="设备状态">
                  <el-tag :type="getTagType(selectedDevice.status)">
                    {{ getStatusLabel(selectedDevice.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="IP地址">{{ selectedDevice.ipAddress }}</el-descriptions-item>
                <el-descriptions-item label="最后活跃">{{ selectedDevice.lastActive }}</el-descriptions-item>
                <el-descriptions-item label="设备标识">{{ selectedDevice.key }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
            
            <el-card class="device-statistics-card" shadow="hover" style="margin-top: 20px;">
              <template #header>
                <div class="card-header">
                  <span>设备统计数据</span>
                </div>
              </template>
              <el-row :gutter="10">
                <el-col :span="12">
                  <div class="stat-item">
                    <div class="stat-label">今日发电量</div>
                    <div class="stat-value">125.6 kWh</div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="stat-item">
                    <div class="stat-label">本月发电量</div>
                    <div class="stat-value">3245.8 kWh</div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="stat-item">
                    <div class="stat-label">运行时长</div>
                    <div class="stat-value">1420 小时</div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="stat-item">
                    <div class="stat-label">故障次数</div>
                    <div class="stat-value">2 次</div>
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
    
    <!-- 添加/编辑设备对话框 -->
    <el-dialog
      v-model="deviceDialog.visible"
      :title="deviceDialog.isEdit ? '编辑设备' : '添加设备'"
      width="600px"
    >
      <el-form :model="deviceDialog.form" label-width="100px">
        <el-form-item label="设备名称：" required>
          <el-input v-model="deviceDialog.form.name" />
        </el-form-item>
        <el-form-item label="设备标识：" required>
          <el-input v-model="deviceDialog.form.key" />
        </el-form-item>
        <el-form-item label="设备密钥：">
          <el-input 
            v-model="deviceDialog.form.secret" 
            type="password" 
            show-password
          />
        </el-form-item>
        <el-form-item label="设备状态：">
          <el-select v-model="deviceDialog.form.status" style="width: 100%;">
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="IP地址：">
          <el-input v-model="deviceDialog.form.ipAddress" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deviceDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveDevice">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { 
  Search,
  Plus,
  Monitor,
  Check,
  Clock,
  Tools
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 当前产品
const currentProduct = ref<any>(null)

// 选中的设备（用于查看详情）
const selectedDevice = ref<any>(null)

// 图表引用
const detailChartRef = ref<HTMLDivElement | null>(null)
let detailChart: any = null

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
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)

// 对话框状态
const deviceDialog = ref({
  visible: false,
  isEdit: false,
  form: {
    id: '',
    name: '',
    productId: '',
    key: '',
    secret: '',
    status: 'offline',
    ipAddress: ''
  }
})

// 设备统计
const deviceStats = computed(() => {
  return {
    total: devices.value.length,
    online: devices.value.filter(d => d.status === 'online').length,
    offline: devices.value.filter(d => d.status === 'offline').length,
    maintenance: devices.value.filter(d => d.status === 'maintenance').length
  }
})

// 计算过滤后的设备列表
const filteredDevices = computed(() => {
  let result = devices.value
  
  // 根据当前产品过滤
  if (currentProduct.value) {
    result = result.filter(device => device.productId === currentProduct.value.id)
  }
  
  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(device => 
      device.id.toLowerCase().includes(query) ||
      device.name.toLowerCase().includes(query) ||
      device.ipAddress.includes(query)
    )
  }
  
  // 根据状态过滤
  if (statusFilter.value) {
    result = result.filter(device => device.status === statusFilter.value)
  }
  
  // 分页处理
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return result.slice(start, end)
})

// 计算总项目数
const totalItems = computed(() => {
  let result = devices.value
  
  // 根据当前产品过滤
  if (currentProduct.value) {
    result = result.filter(device => device.productId === currentProduct.value.id)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(device => 
      device.id.toLowerCase().includes(query) ||
      device.name.toLowerCase().includes(query) ||
      device.ipAddress.includes(query)
    )
  }
  
  if (statusFilter.value) {
    result = result.filter(device => device.status === statusFilter.value)
  }
  
  return result.length
})

// 获取标签类型
const getTagType = (status: string) => {
  switch (status) {
    case 'online': return 'success'
    case 'offline': return 'danger'
    case 'maintenance': return 'warning'
    default: return 'info'
  }
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'online': return '在线'
    case 'offline': return '离线'
    case 'maintenance': return '维护中'
    default: return status
  }
}

// 返回上一级
const goBack = () => {
  // 发送事件到父组件，通知返回产品管理页面
  const event = new CustomEvent('navigate-to-products');
  window.dispatchEvent(event);
}

// 选择设备查看详情
const selectDevice = (device: any) => {
  selectedDevice.value = device
  nextTick(() => {
    initDetailChart()
  })
}

// 返回设备列表
const backToDeviceList = () => {
  selectedDevice.value = null
  if (detailChart) {
    detailChart.dispose()
    detailChart = null
  }
}

// 添加设备
const addDevice = () => {
  deviceDialog.value.isEdit = false
  deviceDialog.value.form = {
    id: '',
    name: '',
    productId: currentProduct.value?.id || '',
    key: '',
    secret: '',
    status: 'offline',
    ipAddress: ''
  }
  deviceDialog.value.visible = true
}

// 编辑设备
const editDevice = (device: any) => {
  deviceDialog.value.isEdit = true
  deviceDialog.value.form = { ...device }
  deviceDialog.value.visible = true
}

// 删除设备
const deleteDevice = (device: any) => {
  ElMessageBox.confirm(
    `确定要删除设备 ${device.name} 吗？`,
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

// 保存设备
const saveDevice = () => {
  ElMessage.success('设备信息已保存')
  deviceDialog.value.visible = false
}

// 分页处理
const handleSizeChange = (val: number) => {
  itemsPerPage.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 初始化详情图表
const initDetailChart = () => {
  if (detailChartRef.value) {
    detailChart = echarts.init(detailChartRef.value)
    
    // 生成模拟数据
    const now = new Date()
    const dates = []
    const temperatureData = []
    const humidityData = []
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 60000) // 每分钟一个点
      dates.push(date.toTimeString().substr(0, 5))
      temperatureData.push(Math.random() * 10 + 20) // 20-30度
      humidityData.push(Math.random() * 30 + 40) // 40%-70%
    }
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['温度(°C)', '湿度(%)']
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates
      },
      yAxis: [
        {
          type: 'value',
          name: '温度(°C)',
          position: 'left',
          axisLabel: {
            formatter: '{value} °C'
          }
        },
        {
          type: 'value',
          name: '湿度(%)',
          position: 'right',
          axisLabel: {
            formatter: '{value} %'
          }
        }
      ],
      series: [
        {
          name: '温度(°C)',
          type: 'line',
          stack: '总量',
          data: temperatureData,
          smooth: true,
          itemStyle: {
            color: '#409EFF'
          }
        },
        {
          name: '湿度(%)',
          type: 'line',
          yAxisIndex: 1,
          stack: '总量',
          data: humidityData,
          smooth: true,
          itemStyle: {
            color: '#67C23A'
          }
        }
      ]
    }
    
    detailChart.setOption(option)
  }
}

// 窗口大小改变时重置图表大小
const resizeCharts = () => {
  if (detailChart) {
    detailChart.resize()
  }
}

// 监听选中设备变化
watch(selectedDevice, (newVal) => {
  if (!newVal && detailChart) {
    detailChart.dispose()
    detailChart = null
  }
})

onMounted(() => {
  window.addEventListener('resize', resizeCharts)
  window.addEventListener('set-current-product', (event: any) => {
    currentProduct.value = event.detail
  })
})
</script>

<style scoped>
.device-management {
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

.device-stats {
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

.devices-card {
  border-radius: 8px;
  border: none;
}

.devices-card :deep(.el-card__body) {
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