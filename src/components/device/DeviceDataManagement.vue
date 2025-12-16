<template>
  <div class="device-data-management">
    <div class="management-header">
      <h2>设备数据管理</h2>
      <div class="controls">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px; margin-right: 10px;"
          value-format="YYYY-MM-DD"
        />
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
        <el-select 
          v-model="dataTypeFilter" 
          placeholder="数据类型" 
          style="width: 150px; margin-right: 10px;"
          clearable
        >
          <el-option label="所有类型" value="" />
          <el-option label="温度" value="temperature" />
          <el-option label="湿度" value="humidity" />
          <el-option label="压力" value="pressure" />
          <el-option label="电压" value="voltage" />
        </el-select>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>
    
    <div class="management-content">
      <!-- 数据统计 -->
      <el-row :gutter="20" class="data-stats">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon primary">
              <el-icon :size="24"><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dataStats.total }}</div>
              <div class="stat-label">数据点总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon success">
              <el-icon :size="24"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dataStats.average }}</div>
              <div class="stat-label">平均值</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon warning">
              <el-icon :size="24"><Top /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dataStats.max }}</div>
              <div class="stat-label">最大值</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><Bottom /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dataStats.min }}</div>
              <div class="stat-label">最小值</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 图表区域 -->
      <el-row :gutter="20" class="charts-row">
        <el-col :span="24">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>数据趋势图</span>
                <el-radio-group v-model="chartPeriod" size="small">
                  <el-radio-button label="hour">小时</el-radio-button>
                  <el-radio-button label="day">天</el-radio-button>
                  <el-radio-button label="week">周</el-radio-button>
                  <el-radio-button label="month">月</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-container large">
              <div ref="lineChartRef" style="width: 100%; height: 400px;"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 数据表格 -->
      <el-card class="data-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>历史数据列表</span>
            <div class="table-controls">
              <el-button type="primary" plain @click="exportData">
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>
            </div>
          </div>
        </template>
        <el-table 
          :data="paginatedData" 
          style="width: 100%"
          stripe
          v-loading="loading"
        >
          <el-table-column prop="id" label="数据ID" width="120" />
          <el-table-column prop="deviceName" label="设备名称" />
          <el-table-column prop="dataType" label="数据类型" width="120">
            <template #default="scope">
              <el-tag :type="getDataTypeTagType(scope.row.dataType)">
                {{ getDataTypeLabel(scope.row.dataType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="value" label="数值" width="120" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="timestamp" label="采集时间" width="180" />
          <el-table-column prop="location" label="位置" />
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { 
  Refresh,
  DataAnalysis,
  TrendCharts,
  Top,
  Bottom,
  Download
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 图表引用
const lineChartRef = ref<HTMLDivElement | null>(null)
let lineChart: any = null

// 过滤和分页
const dateRange = ref([])
const deviceFilter = ref('')
const dataTypeFilter = ref('')
const chartPeriod = ref('day')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)

// 设备数据
const devices = ref([
  { id: 'DEV001THS', name: '温湿度传感器-001' },
  { id: 'DEV002THS', name: '温湿度传感器-002' },
  { id: 'DEV003THS', name: '温湿度传感器-003' },
  { id: 'DEV004AQ', name: '空气质量监测器-001' },
  { id: 'DEV005AQ', name: '空气质量监测器-002' },
  { id: 'DEV006SW', name: '水浸传感器-001' }
])

// 历史数据
const historyData = ref([
  {
    id: 'DATA001',
    deviceId: 'DEV001THS',
    deviceName: '温湿度传感器-001',
    dataType: 'temperature',
    value: 25.6,
    unit: '°C',
    timestamp: '2025-12-14 10:30:22',
    location: 'A栋一楼'
  },
  {
    id: 'DATA002',
    deviceId: 'DEV001THS',
    deviceName: '温湿度传感器-001',
    dataType: 'humidity',
    value: 65.2,
    unit: '%RH',
    timestamp: '2025-12-14 10:30:22',
    location: 'A栋一楼'
  },
  {
    id: 'DATA003',
    deviceId: 'DEV002THS',
    deviceName: '温湿度传感器-002',
    dataType: 'temperature',
    value: 24.8,
    unit: '°C',
    timestamp: '2025-12-14 10:28:45',
    location: 'A栋二楼'
  },
  {
    id: 'DATA004',
    deviceId: 'DEV002THS',
    deviceName: '温湿度传感器-002',
    dataType: 'humidity',
    value: 62.5,
    unit: '%RH',
    timestamp: '2025-12-14 10:28:45',
    location: 'A栋二楼'
  },
  {
    id: 'DATA005',
    deviceId: 'DEV004AQ',
    deviceName: '空气质量监测器-001',
    dataType: 'pm25',
    value: 32.6,
    unit: 'μg/m³',
    timestamp: '2025-12-14 10:25:17',
    location: 'A栋大厅'
  },
  {
    id: 'DATA006',
    deviceId: 'DEV001THS',
    deviceName: '温湿度传感器-001',
    dataType: 'temperature',
    value: 25.4,
    unit: '°C',
    timestamp: '2025-12-14 10:20:12',
    location: 'A栋一楼'
  },
  {
    id: 'DATA007',
    deviceId: 'DEV001THS',
    deviceName: '温湿度传感器-001',
    dataType: 'humidity',
    value: 64.8,
    unit: '%RH',
    timestamp: '2025-12-14 10:20:12',
    location: 'A栋一楼'
  },
  {
    id: 'DATA008',
    deviceId: 'DEV003THS',
    deviceName: '温湿度传感器-003',
    dataType: 'temperature',
    value: 26.1,
    unit: '°C',
    timestamp: '2025-12-14 10:18:33',
    location: 'B栋配电室'
  }
])

// 数据统计
const dataStats = computed(() => {
  const filtered = filteredData.value
  if (filtered.length === 0) return { total: 0, average: 0, max: 0, min: 0 }
  
  const values = filtered.map(item => item.value)
  const total = filtered.length
  const average = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
  const max = Math.max(...values)
  const min = Math.min(...values)
  
  return {
    total,
    average,
    max,
    min
  }
})

// 计算过滤后的数据
const filteredData = computed(() => {
  let result = historyData.value
  
  // 根据设备过滤
  if (deviceFilter.value) {
    result = result.filter(data => data.deviceId === deviceFilter.value)
  }
  
  // 根据数据类型过滤
  if (dataTypeFilter.value) {
    result = result.filter(data => data.dataType === dataTypeFilter.value)
  }
  
  // 根据日期范围过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value
    result = result.filter(data => {
      const dataDate = new Date(data.timestamp)
      return dataDate >= new Date(startDate) && dataDate <= new Date(endDate)
    })
  }
  
  return result
})

// 计算分页数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredData.value.slice(start, end)
})

// 计算总项目数
const totalItems = computed(() => {
  return filteredData.value.length
})

// 刷新数据
const refreshData = () => {
  loading.value = true
  // 模拟数据加载
  setTimeout(() => {
    loading.value = false
    nextTick(() => {
      initCharts()
    })
  }, 500)
}

// 导出数据
const exportData = () => {
  ElMessage.success('数据导出功能已触发')
}

// 获取数据类型标签类型
const getDataTypeTagType = (dataType: string) => {
  switch (dataType) {
    case 'temperature': return 'success'
    case 'humidity': return 'primary'
    case 'pressure': return 'warning'
    case 'voltage': return 'info'
    default: return ''
  }
}

// 获取数据类型标签文本
const getDataTypeLabel = (dataType: string) => {
  switch (dataType) {
    case 'temperature': return '温度'
    case 'humidity': return '湿度'
    case 'pressure': return '压力'
    case 'voltage': return '电压'
    default: return dataType
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

// 初始化图表
const initCharts = () => {
  if (lineChartRef.value) {
    if (lineChart) {
      lineChart.dispose()
    }
    
    lineChart = echarts.init(lineChartRef.value)
    
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
    
    lineChart.setOption(option)
  }
}

// 窗口大小改变时重置图表大小
const resizeCharts = () => {
  if (lineChart) {
    lineChart.resize()
  }
}

onMounted(() => {
  nextTick(() => {
    initCharts()
    window.addEventListener('resize', resizeCharts)
  })
})
</script>

<style scoped>
.device-data-management {
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

.data-stats {
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

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
  border: none;
}

.chart-card :deep(.el-card__header) {
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

.chart-container {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 4px;
}

.chart-container.large {
  height: 400px;
}

.data-card {
  border-radius: 8px;
  border: none;
}

.data-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
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