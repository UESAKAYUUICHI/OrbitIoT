<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>数据中心概览</h2>
    </div>
    <div class="dashboard-content">
      <!-- 关键指标卡片 -->
      <el-row :gutter="20" class="metrics-row">
        <el-col 
          v-for="(metric, index) in metrics" 
          :key="index" 
          :xs="24" 
          :sm="12" 
          :md="6"
        >
          <el-card class="metric-card" shadow="hover">
            <div class="metric-icon" :class="metric.colorClass">
              <el-icon :size="24">
                <component :is="metric.icon" />
              </el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-title">{{ metric.title }}</div>
              <div class="metric-value">{{ metric.value }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20" class="charts-row">
        <el-col :xs="24" :sm="24" :md="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>设备状态分布</span>
              </div>
            </template>
            <div class="chart-container">
              <div ref="pieChartRef" class="pie-chart-container"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>数据流量趋势</span>
              </div>
            </template>
            <div class="chart-container">
              <div ref="lineChartRef" class="line-chart-container"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 设备列表 -->
      <el-card class="devices-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>最新设备</span>
            <el-button link type="primary" @click="toggleDeviceList">
              {{ showAllDevices ? '收起' : '查看全部' }}
            </el-button>
          </div>
        </template>
        <el-table :data="displayDevices" style="width: 100%">
          <el-table-column prop="deviceId" label="设备ID" />
          <el-table-column prop="deviceName" label="设备名称" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag 
                :type="getTagType(scope.row.devStatus)"
                effect="plain"
              >
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="最后更新" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  Monitor, 
  Check, 
  Warning, 
  DataLine
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import axios from 'axios'

// 关键指标数据
const metrics = ref([
  {
    icon: Monitor,
    title: '设备总数',
    value: '0',
    colorClass: 'blue'
  },
  {
    icon: Check,
    title: '在线设备',
    value: '0',
    colorClass: 'green'
  },
  {
    icon: Warning,
    title: '告警数量',
    value: '0',
    colorClass: 'orange'
  },
  {
    icon: DataLine,
    title: '今日数据',
    value: '0',
    colorClass: 'purple'
  }
])

// 设备数据
const devices = ref([])
const deviceTotal = ref(0)
const lineChartRef = ref()
const pieChartRef = ref()
const showAllDevices = ref(false)

let lineChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

// 计算显示的设备列表
const displayDevices = computed(() => {
  if (showAllDevices.value) {
    return devices.value
  }
  return devices.value.slice(0, 5)
})

// 切换设备列表显示模式
const toggleDeviceList = () => {
  showAllDevices.value = !showAllDevices.value
}

// 获取标签类型
const getTagType = (status: number) => {
  switch (status) {
    case 0: return 'info'  // 离线
    case 1: return 'success'  // 在线
    case 2: return 'warning'  // 维护中
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: number) => {
  switch (status) {
    case 0: return '离线'
    case 1: return '在线'
    case 2: return '维护中'
    default: return '未知'
  }
}

// 格式化时间戳为日期字符串
const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0') + ' ' +
         String(date.getHours()).padStart(2, '0') + ':' +
         String(date.getMinutes()).padStart(2, '0') + ':' +
         String(date.getSeconds()).padStart(2, '0')
}

// 获取首页数据
const fetchHomePageData = async () => {
  try {
    const response = await axios.get('http://localhost:10721/homepage/getHomePageData?userID=1')
    
    if (response.data.code === 200 && response.data.ok) {
      const data = response.data.data
      
      // 更新关键指标数据
      metrics.value[0].value = data.deviceTotal.toString()
      metrics.value[1].value = data.deviceOnline.toString()
      metrics.value[2].value = data.waringTotal.toString()
      metrics.value[3].value = data.outputToday > 1000 ? (data.outputToday / 1000).toFixed(1) + 'K' : data.outputToday.toString()
      
      deviceTotal.value = data.deviceTotal
      
      // 更新设备状态分布图
      updatePieChart(data)
    }
  } catch (error) {
    console.error('获取首页数据失败:', error)
  }
}

// 更新设备状态分布图
const updatePieChart = (data: any) => {
  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 'bottom'
    },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { 
            value: data.deviceOnline, 
            name: '在线设备',
            itemStyle: { color: '#67c23a' }
          },
          { 
            value: data.deviceStatusOffline, 
            name: '离线设备',
            itemStyle: { color: '#409eff' }
          },
          { 
            value: data.deviceStatusFixing, 
            name: '维护中设备',
            itemStyle: { color: '#e6a23c' }
          }
        ]
      }
    ]
  }
  
  pieChart.setOption(option)
}

// 获取最新设备列表
const fetchLastDevices = async () => {
  try {
    const response = await axios.get('http://localhost:10721/homepage/getLastDevice?userID=1')
    
    if (response.data.code === 200 && response.data.ok) {
      // 处理设备数据，格式化时间
      devices.value = response.data.data.map((device: any) => ({
        ...device,
        updateTime: formatTimestamp(device.updateTime),
        status: getStatusText(device.devStatus)
      }))
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
  }
}

// 获取设备流量数据
const fetchDeviceFlow = async () => {
  try {
    const response = await axios.get('http://localhost:10721/homepage/getDeviceFlow?userID=1')
    
    if (response.data.code === 200 && response.data.ok) {
      const data = response.data.data
      
      // 准备图表数据
      const dates = data.map((item: any) => {
        const date = new Date(item.time)
        return `${date.getMonth() + 1}-${date.getDate()}`
      })
      
      const outputs = data.map((item: any) => item.output)
      
      // 初始化或更新折线图
      if (!lineChart) {
        lineChart = echarts.init(lineChartRef.value)
      }
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: dates
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => {
              if (value >= 1000000) {
                return (value / 1000000) + 'M'
              } else if (value >= 1000) {
                return (value / 1000) + 'K'
              }
              return value
            }
          }
        },
        series: [{
          data: outputs,
          type: 'line',
          smooth: true,
          areaStyle: {}
        }]
      }
      
      lineChart.setOption(option)
    }
  } catch (error) {
    console.error('获取设备流量数据失败:', error)
  }
}

// 页面加载时获取所有数据
onMounted(async () => {
  await Promise.all([
    fetchHomePageData(),
    fetchLastDevices(),
    fetchDeviceFlow()
  ])
})
</script>

<style scoped>
.dashboard {
  background: #f5f6fa;
}

.dashboard-header {
  margin-bottom: 20px;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.metrics-row {
  margin-bottom: 20px;
}

.metric-card {
  border-radius: 8px;
  border: none;
}

.metric-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}

.metric-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 15px;
}

.metric-icon.blue {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.metric-icon.green {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.metric-icon.orange {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.metric-icon.purple {
  background: rgba(142, 113, 170, 0.2);
  color: #8e71aa;
}

.metric-info {
  flex: 1;
}

.metric-title {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.deleted {
  display: none;
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

.pie-chart-container {
  width: 100%;
  height: 100%;
}

.line-chart-container {
  width: 100%;
  height: 100%;
}

.devices-card {
  border-radius: 8px;
  border: none;
}

.devices-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}
</style>
