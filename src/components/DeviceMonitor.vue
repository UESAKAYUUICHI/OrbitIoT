<template>
  <div class="device-monitor">
    <div class="monitor-header">
      <h2>设备监控</h2>
      <div class="controls">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索设备..." 
          style="width: 200px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select 
          v-model="statusFilter" 
          placeholder="所有状态" 
          style="width: 120px;"
        >
          <el-option label="所有状态" value="" />
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="维护中" value="maintenance" />
        </el-select>
      </div>
    </div>
    
    <div class="monitor-content">
      <!-- 设备状态概览 -->
      <el-row :gutter="20" class="status-overview">
        <el-col 
          v-for="(status, key) in deviceStatusSummary" 
          :key="key" 
          :xs="12" 
          :sm="6"
        >
          <el-card class="status-card" shadow="hover">
            <div class="status-icon" :class="key">
              <el-icon :size="24">
                <component :is="getStatusIcon(key)" />
              </el-icon>
            </div>
            <div class="status-info">
              <div class="status-count">{{ status.count }}</div>
              <div class="status-label">{{ status.label }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 设备列表 -->
      <el-card class="devices-card" shadow="hover">
        <el-table 
          :data="filteredDevices" 
          style="width: 100%"
          stripe
        >
          <el-table-column prop="id" label="设备ID" />
          <el-table-column prop="name" label="设备名称" />
          <el-table-column prop="location" label="位置" />
          <el-table-column prop="statusLabel" label="状态">
            <template #default="scope">
              <el-tag 
                :type="getTagType(scope.row.status)"
                effect="plain"
              >
                {{ scope.row.statusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastUpdate" label="最后更新" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" type="primary" link>详情</el-button>
              <el-button size="small" type="success" link>控制</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="itemsPerPage"
            :total="totalItems"
            :page-sizes="[5, 10, 20, 50]"
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
import { ref, computed } from 'vue'
import { 
  Search,
  Check,
  Close,
  Tools,
  Warning
} from '@element-plus/icons-vue'

// 设备数据
const devices = ref([
  {
    id: 'DEV1001',
    name: '温湿度传感器',
    location: 'A栋一楼',
    status: 'online',
    statusLabel: '在线',
    lastUpdate: '2025-12-14 10:30:22'
  },
  {
    id: 'DEV1002',
    name: '空气质量监测器',
    location: 'A栋二楼',
    status: 'online',
    statusLabel: '在线',
    lastUpdate: '2025-12-14 10:28:45'
  },
  {
    id: 'DEV1003',
    name: '智能电表',
    location: 'B栋配电室',
    status: 'offline',
    statusLabel: '离线',
    lastUpdate: '2025-12-14 09:15:33'
  },
  {
    id: 'DEV1004',
    name: '水压传感器',
    location: 'C栋水泵房',
    status: 'maintenance',
    statusLabel: '维护中',
    lastUpdate: '2025-12-14 08:42:11'
  },
  {
    id: 'DEV1005',
    name: '光照度传感器',
    location: '天台',
    status: 'online',
    statusLabel: '在线',
    lastUpdate: '2025-12-14 10:32:56'
  },
  {
    id: 'DEV1006',
    name: '红外人体感应器',
    location: 'A栋走廊',
    status: 'offline',
    statusLabel: '离线',
    lastUpdate: '2025-12-14 07:55:21'
  },
  {
    id: 'DEV1007',
    name: '烟雾报警器',
    location: 'B栋仓库',
    status: 'online',
    statusLabel: '在线',
    lastUpdate: '2025-12-14 10:25:17'
  },
  {
    id: 'DEV1008',
    name: '门禁控制器',
    location: '主入口',
    status: 'online',
    statusLabel: '在线',
    lastUpdate: '2025-12-14 10:18:44'
  }
])

// 搜索和过滤
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(5)

// 计算过滤后的设备列表
const filteredDevices = computed(() => {
  let result = devices.value
  
  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(device => 
      device.id.toLowerCase().includes(query) ||
      device.name.toLowerCase().includes(query) ||
      device.location.toLowerCase().includes(query)
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
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(device => 
      device.id.toLowerCase().includes(query) ||
      device.name.toLowerCase().includes(query) ||
      device.location.toLowerCase().includes(query)
    )
  }
  
  if (statusFilter.value) {
    result = result.filter(device => device.status === statusFilter.value)
  }
  
  return result.length
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage.value)
})

// 设备状态汇总
const deviceStatusSummary = computed(() => {
  const summary = {
    online: { count: 0, label: '在线设备' },
    offline: { count: 0, label: '离线设备' },
    maintenance: { count: 0, label: '维护中' },
    alert: { count: 0, label: '告警设备' }
  }
  
  devices.value.forEach(device => {
    if (summary[device.status]) {
      summary[device.status].count++
    }
  })
  
  return summary
})

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'online': return Check
    case 'offline': return Close
    case 'maintenance': return Tools
    case 'alert': return Warning
    default: return Warning
  }
}

// 获取标签类型
const getTagType = (status: string) => {
  switch (status) {
    case 'online': return 'success'
    case 'offline': return 'danger'
    case 'maintenance': return 'warning'
    default: return 'info'
  }
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
.device-monitor {
  background: #f5f6fa;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.monitor-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.status-overview {
  margin-bottom: 20px;
}

.status-card {
  border-radius: 8px;
  border: none;
}

.status-card :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  align-items: center;
}

.status-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 15px;
}

.status-icon.online {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.status-icon.offline {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.status-icon.maintenance {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.status-icon.alert {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.status-info {
  flex: 1;
}

.status-count {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

.status-label {
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
</style>