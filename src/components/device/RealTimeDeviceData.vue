<template>
  <div class="realtime-device-data">
    <div class="management-header">
      <h2>实时设备数据监控</h2>
      <div class="controls">
        <el-select 
          v-model="selectedDevice" 
          placeholder="选择设备" 
          style="width: 250px; margin-right: 10px;"
          filterable
          @change="onDeviceChange"
        >
          <el-option 
            v-for="device in devices" 
            :key="device.id" 
            :label="device.name" 
            :value="device.id"
          />
        </el-select>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>
    
    <div class="management-content" v-if="selectedDevice">
      <!-- 实时数据概览 -->
      <el-row :gutter="20" class="data-overview">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-icon temperature">
              <el-icon :size="24"><Sunny /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-label">温度</div>
              <div class="overview-value">{{ currentData.temperature }}°C</div>
              <div class="overview-status" :class="getTemperatureStatus(currentData.temperature)">
                {{ getTemperatureStatusText(currentData.temperature) }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-icon humidity">
              <el-icon :size="24"><Umbrella /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-label">湿度</div>
              <div class="overview-value">{{ currentData.humidity }}%</div>
              <div class="overview-status" :class="getHumidityStatus(currentData.humidity)">
                {{ getHumidityStatusText(currentData.humidity) }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-icon pressure">
              <el-icon :size="24"><ScaleToOriginal /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-label">气压</div>
              <div class="overview-value">{{ currentData.pressure }} hPa</div>
              <div class="overview-status normal">
                正常
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-icon battery">
              <el-icon :size="24"><Eleme /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-label">电量</div>
              <div class="overview-value">{{ currentData.battery }}%</div>
              <div class="overview-status" :class="getBatteryStatus(currentData.battery)">
                {{ getBatteryStatusText(currentData.battery) }}
              </div>
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
                <span>实时数据趋势</span>
                <el-radio-group v-model="timeRange" size="small" @change="onTimeRangeChange">
                  <el-radio-button label="1h">最近1小时</el-radio-button>
                  <el-radio-button label="6h">最近6小时</el-radio-button>
                  <el-radio-button label="12h">最近12小时</el-radio-button>
                  <el-radio-button label="24h">最近24小时</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-container large">
              <div ref="lineChartRef" style="width: 100%; height: 400px;"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" class="charts-row">
        <el-col :xs="24" :sm="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>温度分布</span>
              </div>
            </template>
            <div class="chart-container">
              <div ref="tempGaugeRef" style="width: 100%; height: 300px;"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>湿度分布</span>
              </div>
            </template>
            <div class="chart-container">
              <div ref="humidityGaugeRef" style="width: 100%; height: 300px;"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 实时数据表格 -->
      <el-card class="data-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>详细数据</span>
            <div class="table-controls">
              <el-button type="primary" plain @click="exportData">
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>
            </div>
          </div>
        </template>
        <el-table 
          :data="detailedData" 
          style="width: 100%"
          stripe
          v-loading="loading"
        >
          <el-table-column prop="parameter" label="参数" />
          <el-table-column prop="value" label="当前值" />
          <el-table-column prop="unit" label="单位" />
          <el-table-column prop="min" label="最小值" />
          <el-table-column prop="max" label="最大值" />
          <el-table-column prop="average" label="平均值" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="getParameterStatusType(scope.row.status)">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    
    <div class="no-device-selected" v-else>
      <el-empty description="请选择一个设备以查看实时数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { 
  Refresh,
  Download,
  Sunny,
  Umbrella,
  ScaleToOriginal,
  Eleme
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 图表引用
const lineChartRef = ref<HTMLDivElement | null>(null)
const tempGaugeRef = ref<HTMLDivElement | null>(null)
const humidityGaugeRef = ref<HTMLDivElement | null>(null)

let lineChart: any = null
let tempGauge: any = null
let humidityGauge: any = null

// 数据
const selectedDevice = ref('')
const timeRange = ref('1h')
const loading = ref(false)

// 设备列表
const devices = ref([
  { id: 'DEV001THS', name: '温湿度传感器-001' },
  { id: 'DEV002THS', name: '温湿度传感器-002' },
  { id: 'DEV003THS', name: '温湿度传感器-003' },
  { id: 'DEV004AQ', name: '空气质量监测器-001' },
  { id: 'DEV005AQ', name: '空气质量监测器-002' },
  { id: 'DEV006SW', name: '水浸传感器-001' }
])

// 当前设备数据
const currentData = ref({
  temperature: 25.6,
  humidity: 62.3,
  pressure: 1013.25,
  battery: 87,
  timestamp: new Date().toLocaleString('zh-CN')
})

// 详细数据
const detailedData = ref([
  { parameter: '温度', value: 25.6, unit: '°C', min: 22.1, max: 28.7, average: 24.8, status: '正常' },
  { parameter: '湿度', value: 62.3, unit: '%RH', min: 55.2, max: 68.9, average: 61.4, status: '正常' },
  { parameter: '大气压力', value: 1013.25, unit: 'hPa', min: 1010.12, max: 1015.67, average: 1012.89, status: '正常' },
  { parameter: '电池电量', value: 87, unit: '%', min: 82, max: 95, average: 89, status: '正常' },
  { parameter: '信号强度', value: -65, unit: 'dBm', min: -78, max: -52, average: -62, status: '良好' },
  { parameter: '数据上传频率', value: 60, unit: '秒', min: 60, max: 60, average: 60, status: '稳定' }
])

// 温度状态判断
const getTemperatureStatus = (temp: number) => {
  if (temp > 30) return 'high'
  if (temp < 18) return 'low'
  return 'normal'
}

const getTemperatureStatusText = (temp: number) => {
  if (temp > 30) return '过高'
  if (temp < 18) return '过低'
  return '正常'
}

// 湿度状态判断
const getHumidityStatus = (humidity: number) => {
  if (humidity > 70) return 'high'
  if (humidity < 40) return 'low'
  return 'normal'
}

const getHumidityStatusText = (humidity: number) => {
  if (humidity > 70) return '过高'
  if (humidity < 40) return '过低'
  return '正常'
}

// 电量状态判断
const getBatteryStatus = (battery: number) => {
  if (battery > 80) return 'normal'
  if (battery > 30) return 'low'
  return 'critical'
}

const getBatteryStatusText = (battery: number) => {
  if (battery > 80) return '充足'
  if (battery > 30) return '较低'
  return '严重不足'
}

// 参数状态类型
const getParameterStatusType = (status: string) => {
  if (status === '正常' || status === '稳定' || status === '良好') return 'success'
  if (status === '较低') return 'warning'
  return 'danger'
}

// 刷新数据
const refreshData = () => {
  loading.value = true
  // 模拟数据加载
  setTimeout(() => {
    // 更新当前数据
    currentData.value = {
      temperature: 20 + Math.random() * 15,
      humidity: 45 + Math.random() * 30,
      pressure: 1000 + Math.random() * 30,
      battery: 70 + Math.random() * 29,
      timestamp: new Date().toLocaleString('zh-CN')
    }
    
    // 更新详细数据
    detailedData.value[0].value = parseFloat(currentData.value.temperature.toFixed(1))
    detailedData.value[1].value = parseFloat(currentData.value.humidity.toFixed(1))
    detailedData.value[2].value = parseFloat(currentData.value.pressure.toFixed(2))
    detailedData.value[3].value = Math.round(currentData.value.battery)
    
    loading.value = false
    ElMessage.success('数据已刷新')
    nextTick(() => {
      initCharts()
    })
  }, 500)
}

// 导出数据
const exportData = () => {
  ElMessage.success('数据导出功能已触发')
}

// 设备切换
const onDeviceChange = () => {
  nextTick(() => {
    initCharts()
  })
}

// 时间范围切换
const onTimeRangeChange = () => {
  nextTick(() => {
    initCharts()
  })
}

// 初始化图表
const initCharts = () => {
  // 初始化折线图
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
    
    const hours = timeRange.value === '1h' ? 60 : 
                 timeRange.value === '6h' ? 60 * 6 : 
                 timeRange.value === '12h' ? 60 * 12 : 60 * 24
    
    for (let i = 60; i >= 0; i--) {
      const date = new Date(now.getTime() - i * (hours / 60) * 60000)
      dates.push(date.toTimeString().substr(0, 5))
      temperatureData.push(20 + Math.random() * 15) // 20-35度
      humidityData.push(45 + Math.random() * 30) // 45%-75%
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
  
  // 初始化温度仪表盘
  if (tempGaugeRef.value) {
    if (tempGauge) {
      tempGauge.dispose()
    }
    
    tempGauge = echarts.init(tempGaugeRef.value)
    
    const option = {
      tooltip: {
        formatter: '{a} <br/>{b} : {c}°C'
      },
      series: [
        {
          name: '温度',
          type: 'gauge',
          detail: { formatter: '{value}°C' },
          data: [{ value: currentData.value.temperature, name: '温度' }],
          axisLine: {
            lineStyle: {
              color: [
                [0.2, '#67C23A'],
                [0.8, '#409EFF'],
                [1, '#F56C6C']
              ]
            }
          }
        }
      ]
    }
    
    tempGauge.setOption(option)
  }
  
  // 初始化湿度仪表盘
  if (humidityGaugeRef.value) {
    if (humidityGauge) {
      humidityGauge.dispose()
    }
    
    humidityGauge = echarts.init(humidityGaugeRef.value)
    
    const option = {
      tooltip: {
        formatter: '{a} <br/>{b} : {c}%'
      },
      series: [
        {
          name: '湿度',
          type: 'gauge',
          detail: { formatter: '{value}%' },
          data: [{ value: currentData.value.humidity, name: '湿度' }],
          axisLine: {
            lineStyle: {
              color: [
                [0.3, '#F56C6C'],
                [0.7, '#67C23A'],
                [1, '#409EFF']
              ]
            }
          }
        }
      ]
    }
    
    humidityGauge.setOption(option)
  }
}

// 窗口大小改变时重置图表大小
const resizeCharts = () => {
  if (lineChart) {
    lineChart.resize()
  }
  if (tempGauge) {
    tempGauge.resize()
  }
  if (humidityGauge) {
    humidityGauge.resize()
  }
}

onMounted(() => {
  nextTick(() => {
    initCharts()
    window.addEventListener('resize', resizeCharts)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  if (lineChart) {
    lineChart.dispose()
  }
  if (tempGauge) {
    tempGauge.dispose()
  }
  if (humidityGauge) {
    humidityGauge.dispose()
  }
})
</script>

<style scoped>
.realtime-device-data {
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

.data-overview {
  margin-bottom: 20px;
}

.overview-card {
  border-radius: 8px;
  border: none;
}

.overview-card :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  align-items: center;
}

.overview-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 15px;
}

.overview-icon.temperature {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.overview-icon.humidity {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.overview-icon.pressure {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.overview-icon.battery {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.overview-info {
  flex: 1;
}

.overview-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.overview-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.overview-status {
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.overview-status.normal {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.overview-status.high,
.overview-status.low {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.overview-status.critical {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
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
  height: 300px;
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

.no-device-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}
</style>