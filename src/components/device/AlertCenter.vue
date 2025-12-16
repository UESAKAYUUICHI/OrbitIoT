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
              <div class="stat-value">{{ alertStats.alertDanger }}</div>
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
              <div class="stat-value">{{ alertStats.alertWarning }}</div>
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
              <div class="stat-value">{{ alertStats.alertResolved }}</div>
              <div class="stat-label">已解决</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><Message /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ alertStats.alertTotal }}</div>
              <div class="stat-label">告警总数</div>
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
          <el-table-column prop="deviceName" label="设备名称" />
          <el-table-column prop="level" label="级别" width="100">
            <template #default="scope">
              <el-tag :type="getLevelTagType(scope.row.level)">
                {{ getLevelLabel(scope.row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="告警描述" />
          <el-table-column prop="timestamp" label="触发时间" width="180" />
          <el-table-column prop="resolveTime" label="解决时间" width="180" />
          <el-table-column prop="status" label="当前状态" width="100">
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
import axios from 'axios'

// API基础地址
const BASE_URL = 'http://localhost:10721'

// 过滤和分页
const levelFilter = ref('')
const deviceFilter = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)
const selectedAlerts = ref([])
const total = ref(0)

// 头部统计数据
const alertStats = ref({
  alertTotal: 0,
  alertResolved: 0,
  alertDanger: 0,
  alertWarning: 0
})

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
const alerts = ref<any[]>([])

// 计算过滤后的告警
const filteredAlerts = computed(() => {
  // 注意：在与后端联调时，过滤应该在后端完成，这里仅用于前端临时过滤
  return alerts.value
})

// 计算分页数据
const paginatedAlerts = computed(() => {
  // 注意：分页已经在后端完成，这里直接返回数据
  return filteredAlerts.value
})

// 计算总项目数
const totalItems = computed(() => {
  return total.value
})

// 格式化时间
const formatDateTime = (dateTimeArray: number[] | null) => {
  if (!dateTimeArray || dateTimeArray.length < 5) return '-'
  
  // 根据数组长度判断格式
  if (dateTimeArray.length >= 6) {
    // 包含秒 [year, month, day, hour, minute, second]
    return `${dateTimeArray[0]}-${String(dateTimeArray[1]).padStart(2, '0')}-${String(dateTimeArray[2]).padStart(2, '0')} ${String(dateTimeArray[3]).padStart(2, '0')}:${String(dateTimeArray[4]).padStart(2, '0')}:${String(dateTimeArray[5]).padStart(2, '0')}`
  } else {
    // 不包含秒 [year, month, day, hour, minute]
    return `${dateTimeArray[0]}-${String(dateTimeArray[1]).padStart(2, '0')}-${String(dateTimeArray[2]).padStart(2, '0')} ${String(dateTimeArray[3]).padStart(2, '0')}:${String(dateTimeArray[4]).padStart(2, '0')}:00`
  }
}

// 获取头部统计数据
const fetchAlertStats = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/alertFront/head`, {
      params: {
        userId: 1 // 示例用户ID，实际应用中应该从登录信息中获取
      }
    })
    
    if (response.data.ok) {
      alertStats.value = response.data.data
    } else {
      ElMessage.error(response.data.message || '获取告警统计数据失败')
    }
  } catch (error: any) {
    console.error('获取告警统计数据失败:', error)
    if (error.response) {
      console.error('错误响应:', error.response)
      ElMessage.error(`获取告警统计数据失败: ${error.response.status} ${error.response.statusText}`)
    } else if (error.request) {
      console.error('无响应:', error.request)
      ElMessage.error('无法连接到服务器，请检查后端服务是否运行')
    } else {
      console.error('请求错误:', error.message)
      ElMessage.error(`请求错误: ${error.message}`)
    }
  }
}

// 获取告警数据
const fetchAlerts = async () => {
  loading.value = true
  try {
    // 先检查基础URL是否可达
    const response = await axios.get(`${BASE_URL}/alert/pageUserDeviceAlerts`, {
      params: {
        userId: 1, // 示例用户ID，实际应用中应该从登录信息中获取
        current: currentPage.value,
        size: itemsPerPage.value
      }
    })
    
    if (response.data.ok) {
      // 映射后端数据到前端需要的格式
      alerts.value = response.data.data.records.map((item: any) => ({
        id: item.alertId,
        deviceId: item.deviceId,
        deviceName: item.deviceName,
        level: item.level,
        message: item.message,
        timestamp: formatDateTime(item.triggeredAt), // 触发时间
        resolveTime: formatDateTime(item.resolvedAt), // 解决时间
        status: item.resolved === 1 ? 'cleared' : 'active' // 根据resolved字段判断状态
      }))
      
      total.value = response.data.data.total
    } else {
      ElMessage.error(response.data.message || '获取告警数据失败')
    }
  } catch (error: any) {
    console.error('获取告警数据失败:', error)
    // 提供更多错误信息以便调试
    if (error.response) {
      // 请求已发出，但服务器响应了一个状态码不在2xx范围内的状态码
      console.error('错误响应:', error.response)
      ElMessage.error(`获取告警数据失败: ${error.response.status} ${error.response.statusText}`)
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('无响应:', error.request)
      ElMessage.error('无法连接到服务器，请检查后端服务是否运行')
    } else {
      // 发送请求时发生了某些事情
      console.error('请求错误:', error.message)
      ElMessage.error(`请求错误: ${error.message}`)
    }
  } finally {
    loading.value = false
  }
}

// 刷新告警
const refreshAlerts = () => {
  fetchAlertStats()
  fetchAlerts()
}

// 获取级别标签类型
const getLevelTagType = (level: string) => {
  switch (level) {
    case 'critical': return 'danger'
    case 'warning': return 'warning' // 后端使用warning而不是major
    case 'minor': return 'info'
    case 'info': return 'primary'
    default: return ''
  }
}

// 获取级别标签文本
const getLevelLabel = (level: string) => {
  switch (level) {
    case 'critical': return '紧急'
    case 'warning': return '重要' // 后端使用warning而不是major
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
const acknowledgeAlert = async (alert: any) => {
  ElMessageBox.confirm(
    `确定要确认告警 "${alert.message}" 吗？`,
    '确认告警',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 调用后端接口更新告警状态
      const response = await axios.post(`${BASE_URL}/alert/updateAlert`, {
        id: alert.id,
        status: 'acknowledged'
      })
      
      if (response.data.ok) {
        // 更新本地状态
        const alertIndex = alerts.value.findIndex(a => a.id === alert.id)
        if (alertIndex !== -1) {
          alerts.value[alertIndex].status = 'acknowledged'
        }
        ElMessage.success('告警已确认')
      } else {
        ElMessage.error(response.data.message || '确认告警失败')
      }
    } catch (error: any) {
      console.error('确认告警失败:', error)
      if (error.response) {
        ElMessage.error(`确认告警失败: ${error.response.status} ${error.response.statusText}`)
      } else if (error.request) {
        ElMessage.error('无法连接到服务器，请检查网络连接')
      } else {
        ElMessage.error(`请求错误: ${error.message}`)
      }
    }
  }).catch(() => {
    // 取消操作
  })
}

// 清除告警
const clearAlert = async (alert: any) => {
  ElMessageBox.confirm(
    `确定要清除告警 "${alert.message}" 吗？`,
    '清除告警',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 调用后端接口更新告警状态
      const response = await axios.post(`${BASE_URL}/alert/updateAlert`, {
        id: alert.id,
        status: 'cleared'
      })
      
      if (response.data.ok) {
        // 更新本地状态
        const alertIndex = alerts.value.findIndex(a => a.id === alert.id)
        if (alertIndex !== -1) {
          alerts.value[alertIndex].status = 'cleared'
        }
        ElMessage.success('告警已清除')
      } else {
        ElMessage.error(response.data.message || '清除告警失败')
      }
    } catch (error: any) {
      console.error('清除告警失败:', error)
      if (error.response) {
        ElMessage.error(`清除告警失败: ${error.response.status} ${error.response.statusText}`)
      } else if (error.request) {
        ElMessage.error('无法连接到服务器，请检查网络连接')
      } else {
        ElMessage.error(`请求错误: ${error.message}`)
      }
    }
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
  ).then(async () => {
    try {
      let successCount = 0
      // 更新选中告警的状态
      for (const alert of selectedAlerts.value) {
        const response = await axios.post(`${BASE_URL}/alert/updateAlert`, {
          id: alert.id,
          status: 'acknowledged'
        })
        
        if (response.data.ok) {
          const alertIndex = alerts.value.findIndex(a => a.id === alert.id)
          if (alertIndex !== -1 && alerts.value[alertIndex].status === 'active') {
            alerts.value[alertIndex].status = 'acknowledged'
            successCount++
          }
        }
      }
      
      ElMessage.success(`成功确认 ${successCount} 个告警`)
      // 清空选择
      selectedAlerts.value = []
    } catch (error: any) {
      console.error('批量确认告警失败:', error)
      if (error.response) {
        ElMessage.error(`批量确认告警失败: ${error.response.status} ${error.response.statusText}`)
      } else if (error.request) {
        ElMessage.error('无法连接到服务器，请检查网络连接')
      } else {
        ElMessage.error(`请求错误: ${error.message}`)
      }
    }
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
  ).then(async () => {
    try {
      let successCount = 0
      // 更新选中告警的状态
      for (const alert of selectedAlerts.value) {
        const response = await axios.post(`${BASE_URL}/alert/updateAlert`, {
          id: alert.id,
          status: 'cleared'
        })
        
        if (response.data.ok) {
          const alertIndex = alerts.value.findIndex(a => a.id === alert.id)
          if (alertIndex !== -1) {
            alerts.value[alertIndex].status = 'cleared'
            successCount++
          }
        }
      }
      
      ElMessage.success(`成功清除 ${successCount} 个告警`)
      // 清空选择
      selectedAlerts.value = []
    } catch (error: any) {
      console.error('批量清除告警失败:', error)
      if (error.response) {
        ElMessage.error(`批量清除告警失败: ${error.response.status} ${error.response.statusText}`)
      } else if (error.request) {
        ElMessage.error('无法连接到服务器，请检查网络连接')
      } else {
        ElMessage.error(`请求错误: ${error.message}`)
      }
    }
  }).catch(() => {
    // 取消操作
  })
}

// 分页处理
const handleSizeChange = (val: number) => {
  itemsPerPage.value = val
  currentPage.value = 1
  fetchAlerts()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchAlerts()
}

onMounted(() => {
  // 组件挂载时加载初始数据
  fetchAlertStats()
  fetchAlerts()
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