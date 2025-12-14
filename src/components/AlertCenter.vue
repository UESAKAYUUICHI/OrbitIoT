<template>
  <div class="alert-center">
    <div class="alerts-header">
      <h2>告警中心</h2>
      <div class="controls">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索告警..." 
          style="width: 200px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select 
          v-model="levelFilter" 
          placeholder="告警级别" 
          style="width: 120px; margin-right: 10px;"
          clearable
        >
          <el-option label="所有级别" value="" />
          <el-option label="紧急" value="critical" />
          <el-option label="重要" value="major" />
          <el-option label="一般" value="minor" />
          <el-option label="提示" value="info" />
        </el-select>
        <el-select 
          v-model="statusFilter" 
          placeholder="处理状态" 
          style="width: 120px; margin-right: 10px;"
          clearable
        >
          <el-option label="所有状态" value="" />
          <el-option label="未处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已处理" value="resolved" />
        </el-select>
        <el-button type="primary" @click="refreshAlerts">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <div class="alerts-content">
      <!-- 告警统计 -->
      <el-row :gutter="20" class="alerts-summary">
        <el-col :xs="12" :sm="6">
          <el-card class="summary-card" shadow="hover">
            <div class="summary-icon critical">
              <el-icon :size="24"><Bell /></el-icon>
            </div>
            <div class="summary-info">
              <div class="summary-count">{{ alertStats.critical }}</div>
              <div class="summary-label">紧急告警</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="summary-card" shadow="hover">
            <div class="summary-icon major">
              <el-icon :size="24"><Warning /></el-icon>
            </div>
            <div class="summary-info">
              <div class="summary-count">{{ alertStats.major }}</div>
              <div class="summary-label">重要告警</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="summary-card" shadow="hover">
            <div class="summary-icon minor">
              <el-icon :size="24"><InfoFilled /></el-icon>
            </div>
            <div class="summary-info">
              <div class="summary-count">{{ alertStats.minor }}</div>
              <div class="summary-label">一般告警</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="summary-card" shadow="hover">
            <div class="summary-icon info">
              <el-icon :size="24"><Message /></el-icon>
            </div>
            <div class="summary-info">
              <div class="summary-count">{{ alertStats.info }}</div>
              <div class="summary-label">提示信息</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 告警列表 -->
      <el-card class="alerts-card" shadow="hover">
        <el-table 
          :data="filteredAlerts" 
          style="width: 100%"
          stripe
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="告警ID" width="120" />
          <el-table-column prop="deviceName" label="设备名称" />
          <el-table-column prop="type" label="告警类型" />
          <el-table-column prop="level" label="告警级别" width="100">
            <template #default="scope">
              <el-tag :type="getLevelTagType(scope.row.level)">
                {{ getLevelLabel(scope.row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="time" label="告警时间" width="180" />
          <el-table-column prop="status" label="处理状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button 
                size="small" 
                type="primary" 
                @click="viewAlertDetail(scope.row)"
              >
                查看详情
              </el-button>
              <el-button 
                size="small" 
                type="success" 
                @click="handleAlert(scope.row)"
                :disabled="scope.row.status !== 'pending'"
              >
                处理
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
    
    <!-- 告警详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="'告警详情 - ' + currentAlert.id"
      width="600px"
    >
      <el-form :model="currentAlert" label-width="100px">
        <el-form-item label="告警ID：">
          <span>{{ currentAlert.id }}</span>
        </el-form-item>
        <el-form-item label="设备名称：">
          <span>{{ currentAlert.deviceName }}</span>
        </el-form-item>
        <el-form-item label="告警类型：">
          <span>{{ currentAlert.type }}</span>
        </el-form-item>
        <el-form-item label="告警级别：">
          <el-tag :type="getLevelTagType(currentAlert.level)">
            {{ getLevelLabel(currentAlert.level) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="告警时间：">
          <span>{{ currentAlert.time }}</span>
        </el-form-item>
        <el-form-item label="处理状态：">
          <el-tag :type="getStatusTagType(currentAlert.status)">
            {{ getStatusLabel(currentAlert.status) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="告警描述：">
          <el-alert
            :title="currentAlert.description"
            :type="getLevelTagType(currentAlert.level)"
            :closable="false"
          />
        </el-form-item>
        <el-form-item label="处理记录：" v-if="currentAlert.processRecords.length > 0">
          <el-table :data="currentAlert.processRecords" style="width: 100%">
            <el-table-column prop="time" label="处理时间" width="180" />
            <el-table-column prop="operator" label="处理人" width="100" />
            <el-table-column prop="action" label="处理动作" />
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="handleAlert(currentAlert)"
            :disabled="currentAlert.status !== 'pending'"
            v-if="currentAlert.status === 'pending' || currentAlert.status === 'processing'"
          >
            处理告警
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Search,
  Refresh,
  Bell,
  Warning,
  InfoFilled,
  Message
} from '@element-plus/icons-vue'

// 告警数据
const alerts = ref([
  {
    id: 'ALT20251214001',
    deviceName: '温湿度传感器 1',
    type: '温度过高',
    level: 'critical',
    time: '2025-12-14 10:30:22',
    status: 'pending',
    description: '设备温度超过阈值(35°C)，当前温度为37.5°C',
    processRecords: []
  },
  {
    id: 'ALT20251214002',
    deviceName: '空气质量监测器',
    type: 'PM2.5超标',
    level: 'major',
    time: '2025-12-14 10:28:45',
    status: 'processing',
    description: 'PM2.5浓度超过安全值，当前值为85μg/m³',
    processRecords: [
      {
        time: '2025-12-14 10:35:12',
        operator: '张三',
        action: '已通知相关人员处理'
      }
    ]
  },
  {
    id: 'ALT20251214003',
    deviceName: '智能电表',
    type: '通信中断',
    level: 'minor',
    time: '2025-12-14 09:15:33',
    status: 'resolved',
    description: '设备无法正常通信，可能由于网络问题导致',
    processRecords: [
      {
        time: '2025-12-14 09:30:45',
        operator: '李四',
        action: '重启设备后恢复正常'
      }
    ]
  },
  {
    id: 'ALT20251214004',
    deviceName: '水压传感器',
    type: '压力异常',
    level: 'major',
    time: '2025-12-14 08:42:11',
    status: 'pending',
    description: '水压低于正常范围，当前值为0.15MPa',
    processRecords: []
  },
  {
    id: 'ALT20251214005',
    deviceName: '门禁控制器',
    type: '非法访问尝试',
    level: 'critical',
    time: '2025-12-14 07:55:21',
    status: 'pending',
    description: '检测到多次非法刷卡尝试，已被系统拦截',
    processRecords: []
  },
  {
    id: 'ALT20251214006',
    deviceName: '烟雾报警器',
    type: '设备自检失败',
    level: 'info',
    time: '2025-12-14 06:30:15',
    status: 'resolved',
    description: '设备定期自检失败，需要维护',
    processRecords: [
      {
        time: '2025-12-14 08:15:22',
        operator: '王五',
        action: '已完成设备维护，恢复正常'
      }
    ]
  }
])

// 过滤和分页
const searchQuery = ref('')
const levelFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const dialogVisible = ref(false)
const currentAlert = ref({} as any)
const selectedAlerts = ref([])

// 告警统计
const alertStats = computed(() => {
  const stats = {
    critical: 0,
    major: 0,
    minor: 0,
    info: 0
  }
  
  alerts.value.forEach(alert => {
    if (stats.hasOwnProperty(alert.level)) {
      stats[alert.level as keyof typeof stats]++
    }
  })
  
  return stats
})

// 计算过滤后的告警列表
const filteredAlerts = computed(() => {
  let result = alerts.value
  
  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(alert => 
      alert.id.toLowerCase().includes(query) ||
      alert.deviceName.toLowerCase().includes(query) ||
      alert.type.toLowerCase().includes(query)
    )
  }
  
  // 根据级别过滤
  if (levelFilter.value) {
    result = result.filter(alert => alert.level === levelFilter.value)
  }
  
  // 根据状态过滤
  if (statusFilter.value) {
    result = result.filter(alert => alert.status === statusFilter.value)
  }
  
  // 分页处理
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return result.slice(start, end)
})

// 计算总项目数
const totalItems = computed(() => {
  let result = alerts.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(alert => 
      alert.id.toLowerCase().includes(query) ||
      alert.deviceName.toLowerCase().includes(query) ||
      alert.type.toLowerCase().includes(query)
    )
  }
  
  if (levelFilter.value) {
    result = result.filter(alert => alert.level === levelFilter.value)
  }
  
  if (statusFilter.value) {
    result = result.filter(alert => alert.status === statusFilter.value)
  }
  
  return result.length
})

// 获取级别标签类型
const getLevelTagType = (level: string) => {
  switch (level) {
    case 'critical': return 'danger'
    case 'major': return 'warning'
    case 'minor': return 'info'
    case 'info': return ''
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
    case 'pending': return 'danger'
    case 'processing': return 'warning'
    case 'resolved': return 'success'
    default: return ''
  }
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return '未处理'
    case 'processing': return '处理中'
    case 'resolved': return '已处理'
    default: return status
  }
}

// 刷新告警
const refreshAlerts = () => {
  // 模拟刷新操作
  console.log('刷新告警数据')
  ElMessage.success('告警数据已刷新')
}

// 查看告警详情
const viewAlertDetail = (alert: any) => {
  currentAlert.value = { ...alert }
  dialogVisible.value = true
}

// 处理告警
const handleAlert = (alert: any) => {
  if (alert.status === 'pending') {
    alert.status = 'processing'
    alert.processRecords.push({
      time: new Date().toLocaleString(),
      operator: '管理员',
      action: '开始处理告警'
    })
    ElMessage.success('告警已标记为处理中')
  } else if (alert.status === 'processing') {
    alert.status = 'resolved'
    alert.processRecords.push({
      time: new Date().toLocaleString(),
      operator: '管理员',
      action: '告警处理完成'
    })
    ElMessage.success('告警已标记为已处理')
  }
  
  if (dialogVisible.value) {
    dialogVisible.value = false
  }
}

// 处理选择变化
const handleSelectionChange = (val: any[]) => {
  selectedAlerts.value = val
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
.alert-center {
  background: #f5f6fa;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.alerts-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.alerts-summary {
  margin-bottom: 20px;
}

.summary-card {
  border-radius: 8px;
  border: none;
}

.summary-card :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  align-items: center;
}

.summary-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 15px;
}

.summary-icon.critical {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.summary-icon.major {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.summary-icon.minor {
  background: rgba(142, 113, 170, 0.2);
  color: #8e71aa;
}

.summary-icon.info {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.summary-info {
  flex: 1;
}

.summary-count {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

.summary-label {
  font-size: 0.9rem;
  color: #666;
}

.alerts-card {
  border-radius: 8px;
  border: none;
}

.alerts-card :deep(.el-card__body) {
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