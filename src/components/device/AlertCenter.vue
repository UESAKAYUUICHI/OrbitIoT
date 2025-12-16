<template>
  <div class="alert-center">
    <div class="management-header">
      <h2>设备告警中心</h2>
      <div class="controls">
        <el-select 
          v-model="levelFilter" 
          placeholder="告警级别" 
          style="width: 150px; margin-right: 10px;"
          clearable
        >
          <el-option label="所有级别" value="" />
          <el-option label="紧急" value="critical" />
          <el-option label="重要" value="major" />
          <el-option label="一般" value="minor" />
          <el-option label="提示" value="info" />
        </el-select>
        <el-select 
          v-model="deviceFilter" 
          placeholder="选择设备" 
          style="width: 200px; margin-right: 10px;"
          clearable
          filterable
        >
          <el-option 
            v-for="device in devices" 
            :key="device.id" 
            :label="device.name" 
            :value="device.id"
          />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px; margin-right: 10px;"
          value-format="YYYY-MM-DD"
        />
        <el-button type="primary" @click="refreshAlerts">
          <el-icon><Refresh /></el-icon>
          刷新告警
        </el-button>
      </div>
    </div>
    
    <div class="management-content">
      <!-- 告警统计 -->
      <el-row :gutter="20" class="alert-stats">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon critical">
              <el-icon :size="24"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ alertStats.critical }}</div>
              <div class="stat-label">紧急告警</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon major">
              <el-icon :size="24"><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ alertStats.major }}</div>
              <div class="stat-label">重要告警</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon minor">
              <el-icon :size="24"><InfoFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ alertStats.minor }}</div>
              <div class="stat-label">一般告警</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><Message /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ alertStats.info }}</div>
              <div class="stat-label">提示信息</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 告警列表 -->
      <el-card class="alerts-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>告警列表</span>
            <div class="table-controls">
              <el-button type="success" plain @click="acknowledgeSelected">
                <el-icon><Check /></el-icon>
                批量确认
              </el-button>
              <el-button type="warning" plain @click="clearSelected">
                <el-icon><Delete /></el-icon>
                批量清除
              </el-button>
            </div>
          </div>
        </template>
        <el-table 
          :data="paginatedAlerts" 
          style="width: 100%"
          stripe
          v-loading="loading"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="告警ID" width="100" />
          <el-table-column prop="deviceName" label="设备名称" />
          <el-table-column prop="alertType" label="告警类型" width="120" />
          <el-table-column prop="level" label="级别" width="100">
            <template #default="scope">
              <el-tag :type="getLevelTagType(scope.row.level)">
                {{ getLevelLabel(scope.row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="告警描述" />
          <el-table-column prop="timestamp" label="发生时间" width="180" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <el-button 
                v-if="scope.row.status === 'active'" 
                size="small" 
                type="success" 
                @click="acknowledgeAlert(scope.row)"
              >
                确认
              </el-button>
              <el-button 
                size="small" 
                type="warning" 
                @click="clearAlert(scope.row)"
              >
                清除
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Refresh,
  Warning,
  Bell,
  InfoFilled,
  Message,
  Check,
  Delete
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 过滤和分页
const levelFilter = ref('')
const deviceFilter = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)
const selectedAlerts = ref([])

// 设备列表
const devices = ref([
  { id: 'DEV001THS', name: '温湿度传感器-001' },
  { id: 'DEV002THS', name: '温湿度传感器-002' },
  { id: 'DEV003THS', name: '温湿度传感器-003' },
  { id: 'DEV004AQ', name: '空气质量监测器-001' },
  { id: 'DEV005AQ', name: '空气质量监测器-002' },
  { id: 'DEV006SW', name: '水浸传感器-001' },
  { id: 'DEV007DOOR', name: '门磁传感器-001' },
  { id: 'DEV008CAM', name: '摄像头-001' }
])

// 告警数据
const alerts = ref([
  {
    id: 'ALERT001',
    deviceId: 'DEV001THS',
    deviceName: '温湿度传感器-001',
    alertType: '温度过高',
    level: 'critical',
    message: '设备温度达到42°C，超过阈值40°C',
    timestamp: '2025-12-16 14:30:22',
    status: 'active'
  },
  {
    id: 'ALERT002',
    deviceId: 'DEV004AQ',
    deviceName: '空气质量监测器-001',
    alertType: 'PM2.5超标',
    level: 'major',
    message: 'PM2.5浓度达到85μg/m³，超过阈值75μg/m³',
    timestamp: '2025-12-16 13:45:17',
    status: 'acknowledged'
  },
  {
    id: 'ALERT003',
    deviceId: 'DEV007DOOR',
    deviceName: '门磁传感器-001',
    alertType: '非法开启',
    level: 'critical',
    message: '检测到非授权时间内门被打开',
    timestamp: '2025-12-16 12:20:05',
    status: 'active'
  },
  {
    id: 'ALERT004',
    deviceId: 'DEV002THS',
    deviceName: '温湿度传感器-002',
    alertType: '湿度过高',
    level: 'minor',
    message: '湿度达到78%，超过阈值75%',
    timestamp: '2025-12-16 11:15:33',
    status: 'cleared'
  },
  {
    id: 'ALERT005',
    deviceId: 'DEV005AQ',
    deviceName: '空气质量监测器-002',
    alertType: 'CO2超标',
    level: 'major',
    message: 'CO2浓度达到1200ppm，超过阈值1000ppm',
    timestamp: '2025-12-16 10:30:42',
    status: 'active'
  },
  {
    id: 'ALERT006',
    deviceId: 'DEV003THS',
    deviceName: '温湿度传感器-003',
    alertType: '通信中断',
    level: 'major',
    message: '设备连续5分钟未上报数据',
    timestamp: '2025-12-16 09:45:18',
    status: 'active'
  },
  {
    id: 'ALERT007',
    deviceId: 'DEV008CAM',
    deviceName: '摄像头-001',
    alertType: '存储空间不足',
    level: 'minor',
    message: '存储空间剩余容量低于10%',
    timestamp: '2025-12-16 08:22:51',
    status: 'acknowledged'
  },
  {
    id: 'ALERT008',
    deviceId: 'DEV001THS',
    deviceName: '温湿度传感器-001',
    alertType: '电池电量低',
    level: 'info',
    message: '设备电池电量低于20%',
    timestamp: '2025-12-16 07:15:36',
    status: 'active'
  }
])

// 告警统计
const alertStats = computed(() => {
  const stats = {
    critical: 0,
    major: 0,
    minor: 0,
    info: 0
  }
  
  alerts.value.forEach(alert => {
    switch (alert.level) {
      case 'critical':
        stats.critical++
        break
      case 'major':
        stats.major++
        break
      case 'minor':
        stats.minor++
        break
      case 'info':
        stats.info++
        break
    }
  })
  
  return stats
})

// 计算过滤后的告警
const filteredAlerts = computed(() => {
  let result = alerts.value
  
  // 根据级别过滤
  if (levelFilter.value) {
    result = result.filter(alert => alert.level === levelFilter.value)
  }
  
  // 根据设备过滤
  if (deviceFilter.value) {
    result = result.filter(alert => alert.deviceId === deviceFilter.value)
  }
  
  // 根据日期范围过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value
    result = result.filter(alert => {
      const alertDate = new Date(alert.timestamp)
      return alertDate >= new Date(startDate) && alertDate <= new Date(endDate)
    })
  }
  
  return result
})

// 计算分页数据
const paginatedAlerts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredAlerts.value.slice(start, end)
})

// 计算总项目数
const totalItems = computed(() => {
  return filteredAlerts.value.length
})

// 刷新告警
const refreshAlerts = () => {
  loading.value = true
  // 模拟数据加载
  setTimeout(() => {
    loading.value = false
    ElMessage.success('告警数据已刷新')
  }, 500)
}

// 获取级别标签类型
const getLevelTagType = (level: string) => {
  switch (level) {
    case 'critical': return 'danger'
    case 'major': return 'warning'
    case 'minor': return 'info'
    case 'info': return 'primary'
    default: return ''
  }
}

// 获取级别标签文本
const getLevelLabel = (level: string) => {
  switch (level) {
    case 'critical': return '紧急'
    case 'major': return '重要'
    case 'minor': return '一般'
    case 'info': return '提示'
    default: return level
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'active': return 'danger'
    case 'acknowledged': return 'warning'
    case 'cleared': return 'success'
    default: return ''
  }
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return '未处理'
    case 'acknowledged': return '已确认'
    case 'cleared': return '已清除'
    default: return status
  }
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedAlerts.value = selection
}

// 确认告警
const acknowledgeAlert = (alert: any) => {
  ElMessageBox.confirm(
    `确定要确认告警 "${alert.message}" 吗？`,
    '确认告警',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 更新告警状态
    const alertIndex = alerts.value.findIndex(a => a.id === alert.id)
    if (alertIndex !== -1) {
      alerts.value[alertIndex].status = 'acknowledged'
    }
    ElMessage.success('告警已确认')
  }).catch(() => {
    // 取消操作
  })
}

// 清除告警
const clearAlert = (alert: any) => {
  ElMessageBox.confirm(
    `确定要清除告警 "${alert.message}" 吗？`,
    '清除告警',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 更新告警状态
    const alertIndex = alerts.value.findIndex(a => a.id === alert.id)
    if (alertIndex !== -1) {
      alerts.value[alertIndex].status = 'cleared'
    }
    ElMessage.success('告警已清除')
  }).catch(() => {
    // 取消操作
  })
}

// 批量确认
const acknowledgeSelected = () => {
  if (selectedAlerts.value.length === 0) {
    ElMessage.warning('请先选择要确认的告警')
    return
  }
  
  ElMessageBox.confirm(
    `确定要确认选中的 ${selectedAlerts.value.length} 个告警吗？`,
    '批量确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 更新选中告警的状态
    selectedAlerts.value.forEach(alert => {
      const alertIndex = alerts.value.findIndex(a => a.id === alert.id)
      if (alertIndex !== -1 && alerts.value[alertIndex].status === 'active') {
        alerts.value[alertIndex].status = 'acknowledged'
      }
    })
    ElMessage.success('选中的告警已确认')
  }).catch(() => {
    // 取消操作
  })
}

// 批量清除
const clearSelected = () => {
  if (selectedAlerts.value.length === 0) {
    ElMessage.warning('请先选择要清除的告警')
    return
  }
  
  ElMessageBox.confirm(
    `确定要清除选中的 ${selectedAlerts.value.length} 个告警吗？`,
    '批量清除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 更新选中告警的状态
    selectedAlerts.value.forEach(alert => {
      const alertIndex = alerts.value.findIndex(a => a.id === alert.id)
      if (alertIndex !== -1) {
        alerts.value[alertIndex].status = 'cleared'
      }
    })
    ElMessage.success('选中的告警已清除')
  }).catch(() => {
    // 取消操作
  })
}

// 分页处理
const handleSizeChange = (val: number) => {
  itemsPerPage.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

onMounted(() => {
  // 组件挂载时可以加载初始数据
})
</script>

<style scoped>
.alert-center {
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

.alert-stats {
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

.stat-icon.critical {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.stat-icon.major {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.stat-icon.minor {
  background: rgba(142, 113, 170, 0.2);
  color: #8e71aa;
}

.stat-icon.info {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
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

.alerts-card {
  border-radius: 8px;
  border: none;
}

.alerts-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
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

.table-controls {
  display: flex;
  gap: 10px;
}

.pagination-container {
  padding: 20px 0;
  display: flex;
  justify-content: center;
}
</style>