<template>
  <div class="digital-twin-display">
    <!-- 顶部标题栏 -->
    <div class="header">
      <div class="header-left">
        <h1 class="title">全局数字孪生监控大屏</h1>
        <div class="system-status">
          <div class="status-indicator online"></div>
          <div class="status-text">系统运行正常</div>
        </div>
      </div>
      <div class="header-center">
        <div class="time">{{ currentTime }}</div>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          @click="$emit('exit-fullscreen')"
          size="small"
          round
        >
          <el-icon><Back /></el-icon>
          返回主页
        </el-button>
      </div>
    </div>

    <!-- 主要指标概览 -->
    <div class="metrics-overview">
      <div class="metric-card primary">
        <div class="card-header">
          <el-icon class="card-icon"><Lightning /></el-icon>
          <div class="card-title">
            <h3>实时用电量</h3>
            <div class="trend" :class="powerTrend > 0 ? 'up' : 'down'">
              <el-icon v-if="powerTrend > 0"><Top /></el-icon>
              <el-icon v-else><Bottom /></el-icon>
              {{ Math.abs(powerTrend) }}%
            </div>
          </div>
        </div>
        <div class="card-content">
          <div class="value">{{ currentPower }}<span class="unit">kW</span></div>
        </div>
        <div class="card-footer">
          <span>峰值: {{ peakPower }} kW</span>
          <span>谷值: {{ valleyPower }} kW</span>
        </div>
      </div>

      <div class="metric-card secondary">
        <div class="card-header">
          <el-icon class="card-icon"><Coin /></el-icon>
          <div class="card-title">
            <h3>日发电量</h3>
            <div class="trend" :class="energyTrend > 0 ? 'up' : 'down'">
              <el-icon v-if="energyTrend > 0"><Top /></el-icon>
              <el-icon v-else><Bottom /></el-icon>
              {{ Math.abs(energyTrend) }}%
            </div>
          </div>
        </div>
        <div class="card-content">
          <div class="value">{{ dailyEnergy }}<span class="unit">kWh</span></div>
        </div>
        <div class="card-footer">
          <span>目标: {{ energyTarget }} kWh</span>
          <span>完成率: {{ energyCompletion }}%</span>
        </div>
      </div>

      <div class="metric-card warning">
        <div class="card-header">
          <el-icon class="card-icon"><Warning /></el-icon>
          <div class="card-title">
            <h3>故障率</h3>
            <div class="status" :class="faultRate < 1 ? 'normal' : 'alert'">
              {{ faultRate < 1 ? '正常' : '异常' }}
            </div>
          </div>
        </div>
        <div class="card-content">
          <div class="value">{{ faultRate }}<span class="unit">%</span></div>
        </div>
        <div class="card-footer">
          <span>今日故障: {{ dailyFaults }} 次</span>
          <span>MTBF: {{ mtbf }} 小时</span>
        </div>
      </div>

      <div class="metric-card device">
        <div class="card-header">
          <el-icon class="card-icon"><Monitor /></el-icon>
          <div class="card-title">
            <h3>设备统计</h3>
            <div class="status online">
              在线: {{ onlineDevices }}
            </div>
          </div>
        </div>
        <div class="card-content">
          <div class="value">{{ deviceCount }}<span class="unit">台</span></div>
        </div>
        <div class="card-footer">
          <span>告警: {{ alertDevices }} 台</span>
          <span>离线: {{ offlineDevices }} 台</span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-container large">
        <div class="chart-header">
          <h2>电网实时状态监控</h2>
          <div class="legend">
            <span class="legend-item"><span class="color-box green"></span>变电站A</span>
            <span class="legend-item"><span class="color-box yellow"></span>变电站B</span>
            <span class="legend-item"><span class="color-box red"></span>变电站C</span>
            <span class="legend-item"><span class="color-box blue"></span>变电站D</span>
          </div>
        </div>
        <div class="chart-wrapper" ref="gridChartRef"></div>
      </div>

      <div class="chart-container medium">
        <div class="chart-header">
          <h2>用电量趋势</h2>
        </div>
        <div class="chart-wrapper" ref="lineChartRef"></div>
      </div>

      <div class="chart-container medium">
        <div class="chart-header">
          <h2>设备类型分布</h2>
        </div>
        <div class="chart-wrapper" ref="barChartRef"></div>
      </div>
      
      <div class="chart-container small">
        <div class="chart-header">
          <h2>负载率分析</h2>
        </div>
        <div class="chart-wrapper" ref="gaugeChartRef"></div>
      </div>
      
      <div class="chart-container small">
        <div class="chart-header">
          <h2>能耗分布</h2>
        </div>
        <div class="chart-wrapper" ref="energyChartRef"></div>
      </div>
    </div>

    <!-- 底部信息区域 -->
    <div class="bottom-section">
      <div class="alerts-panel">
        <div class="panel-header">
          <h2>实时告警</h2>
          <span class="alert-count">{{ alarms.length }}</span>
        </div>
        <div class="alerts-list">
          <div 
            v-for="(alarm, index) in alarms" 
            :key="index" 
            class="alert-item"
            :class="alarm.type"
          >
            <div class="alert-icon">
              <el-icon v-if="alarm.type === 'critical'"><CircleClose /></el-icon>
              <el-icon v-else><Warning /></el-icon>
            </div>
            <div class="alert-content">
              <div class="alert-time">{{ alarm.time }}</div>
              <div class="alert-desc">{{ alarm.description }}</div>
            </div>
            <div class="alert-action">
              <el-button size="small" type="primary">处理</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="devices-panel">
        <div class="panel-header">
          <h2>设备状态概览</h2>
        </div>
        <div class="devices-grid">
          <div 
            v-for="(device, index) in devices" 
            :key="index" 
            class="device-item"
            :class="device.status"
          >
            <div class="device-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="device-info">
              <div class="device-name">{{ device.name }}</div>
              <div class="device-status">
                <span class="status-dot" :class="device.status"></span>
                <span>{{ getStatusText(device.status) }}</span>
              </div>
              <div class="device-data">
                <div class="data-row">
                  <span class="label">功率:</span>
                  <span class="value">{{ device.power }} kW</span>
                </div>
                <div class="data-row">
                  <span class="label">温度:</span>
                  <span class="value">{{ device.temperature }}°C</span>
                </div>
                <div class="data-row">
                  <span class="label">负载:</span>
                  <span class="value">{{ device.load }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="stats-panel">
        <div class="panel-header">
          <h2>运营统计</h2>
        </div>
        <div class="stats-content">
          <div class="stat-item">
            <div class="stat-label">本月发电量</div>
            <div class="stat-value">{{ monthlyEnergy }}<span class="unit">kWh</span></div>
          </div>
          <div class="stat-item">
            <div class="stat-label">年度发电量</div>
            <div class="stat-value">{{ annualEnergy }}<span class="unit">MWh</span></div>
          </div>
          <div class="stat-item">
            <div class="stat-label">设备利用率</div>
            <div class="stat-value">{{ utilization }}<span class="unit">%</span></div>
          </div>
          <div class="stat-item">
            <div class="stat-label">运维成本</div>
            <div class="stat-value">{{ maintenanceCost }}<span class="unit">万元</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import * as echarts from 'echarts';
import { 
  Lightning, 
  Warning, 
  Connection, 
  Coin,
  Monitor,
  CircleClose,
  Top,
  Bottom,
  Back
} from '@element-plus/icons-vue'

// 定义事件
const emit = defineEmits(['exit-fullscreen']);

// 时间显示
const currentTime = ref(new Date().toLocaleString('zh-CN'));

// 模拟实时数据（替换为WebSocket数据源）
const currentPower = ref(12500);
const peakPower = ref(15200);
const valleyPower = ref(8700);
const dailyEnergy = ref(284500);
const energyTarget = ref(300000);
const energyCompletion = ref(95);
const faultRate = ref(0.5);
const dailyFaults = ref(3);
const mtbf = ref(120);
const deviceCount = ref(128);
const onlineDevices = ref(118);
const alertDevices = ref(5);
const offlineDevices = ref(5);
const powerTrend = ref(1.2);
const energyTrend = ref(2.3);
const monthlyEnergy = ref(8500000);
const annualEnergy = ref(98000);
const utilization = ref(87);
const maintenanceCost = ref(125);

const alarms = ref([
  { time: '13:10', description: '变电站A电压异常', type: 'critical' },
  { time: '13:12', description: '线路B过载', type: 'warning' },
  { time: '13:15', description: '设备C温度过高', type: 'critical' },
  { time: '13:18', description: '传感器D通信中断', type: 'warning' },
  { time: '13:22', description: '断路器E动作频繁', type: 'warning' }
]);

const devices = ref([
  { name: '变电站A', status: 'online', power: 4200, temperature: 36, load: 85 },
  { name: '变电站B', status: 'online', power: 3800, temperature: 32, load: 78 },
  { name: '变电站C', status: 'warning', power: 4500, temperature: 45, load: 92 },
  { name: '变电站D', status: 'offline', power: 0, temperature: 25, load: 0 },
  { name: '线路A', status: 'online', power: 2100, temperature: 28, load: 65 },
  { name: '线路B', status: 'online', power: 1900, temperature: 26, load: 60 }
]);

// 获取设备状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'online': return '在线';
    case 'warning': return '警告';
    case 'offline': return '离线';
    default: return '未知';
  }
};

// ECharts图表实例
const gridChartRef = ref<HTMLElement | null>(null);
const lineChartRef = ref<HTMLElement | null>(null);
const barChartRef = ref<HTMLElement | null>(null);
const gaugeChartRef = ref<HTMLElement | null>(null);
const energyChartRef = ref<HTMLElement | null>(null);

let gridChart: echarts.ECharts | null = null;
let lineChart: echarts.ECharts | null = null;
let barChart: echarts.ECharts | null = null;
let gaugeChart: echarts.ECharts | null = null;
let energyChart: echarts.ECharts | null = null;
let updateInterval: number | null = null;
let timeInterval: number | null = null;

onMounted(() => {
  // 初始化图表
  initCharts();
  
  // 更新时间显示
  timeInterval = window.setInterval(() => {
    currentTime.value = new Date().toLocaleString('zh-CN');
  }, 1000);
  
  // 模拟实时数据更新（每5秒）
  updateInterval = window.setInterval(() => {
    updateData();
  }, 5000);
});

const initCharts = () => {
  initGridChart();
  initLineChart();
  initBarChart();
  initGaugeChart();
  initEnergyChart();
};

const initGridChart = () => {
  if (gridChartRef.value) {
    gridChart = echarts.init(gridChartRef.value);
    
    const gridData = [
      { value: 12500, name: '变电站A' },
      { value: 9800, name: '变电站B' },
      { value: 15200, name: '变电站C' },
      { value: 8700, name: '变电站D' }
    ];
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} kW ({d}%)'
      },
      series: [
        {
          name: '用电量',
          type: 'pie',
          radius: ['50%', '80%'],
          center: ['50%', '55%'],
          data: gridData,
          itemStyle: {
            borderRadius: 5,
            borderColor: '#0f172a',
            borderWidth: 2,
            color: (params: any) => {
              const colors = ['#4ade80', '#f59e0b', '#ef4444', '#3b82f6'];
              return colors[params.dataIndex % colors.length];
            }
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            color: '#e2e8f0',
            fontSize: 14
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: '#94a3b8'
            }
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          }
        }
      ]
    };
    
    gridChart.setOption(option);
  }
};

const initLineChart = () => {
  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value);
    
    // 生成24小时数据
    const hours = [];
    const powerData = [];
    for (let i = 0; i < 24; i++) {
      hours.push(`${i}:00`);
      powerData.push(Math.floor(8000 + Math.random() * 7000));
    }
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '5%',
        right: '5%',
        top: '15%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#4b5563' } },
        axisLabel: { color: '#9ca3af' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#4b5563' } },
        axisLabel: { color: '#9ca3af' },
        splitLine: { lineStyle: { color: '#374151' } }
      },
      series: [{
        data: powerData,
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#60a5fa',
          width: 3
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.5)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0)' }
          ])
        }
      }]
    };
    
    lineChart.setOption(option);
  }
};

const initBarChart = () => {
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value);
    
    const deviceTypes = ['变压器', '断路器', '电容器', '继电器', '传感器'];
    const counts = [24, 42, 18, 32, 12];
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '5%',
        right: '5%',
        top: '15%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: deviceTypes,
        axisLine: { lineStyle: { color: '#4b5563' } },
        axisLabel: { color: '#9ca3af' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#4b5563' } },
        axisLabel: { color: '#9ca3af' },
        splitLine: { lineStyle: { color: '#374151' } }
      },
      series: [{
        data: counts,
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#60a5fa' }
          ])
        },
        barWidth: '60%'
      }]
    };
    
    barChart.setOption(option);
  }
};

const initGaugeChart = () => {
  if (gaugeChartRef.value) {
    gaugeChart = echarts.init(gaugeChartRef.value);
    
    const option = {
      tooltip: {
        formatter: '{a} <br/>{b} : {c}%'
      },
      series: [
        {
          name: '负载率',
          type: 'gauge',
          progress: {
            show: true,
            width: 18
          },
          axisLine: {
            lineStyle: {
              width: 18,
              color: [
                [0.3, '#67e0e3'],
                [0.7, '#37a2da'],
                [1, '#fd666d']
              ]
            }
          },
          axisTick: {
            show: false
          },
          splitLine: {
            length: 15,
            lineStyle: {
              width: 2,
              color: '#999'
            }
          },
          axisLabel: {
            distance: 25,
            color: '#999',
            fontSize: 10
          },
          anchor: {
            show: true,
            showAbove: true,
            size: 25,
            itemStyle: {
              borderWidth: 10
            }
          },
          title: {
            show: false
          },
          detail: {
            valueAnimation: true,
            fontSize: 20,
            formatter: '{value}%',
            color: 'inherit'
          },
          data: [
            {
              value: 75,
              name: '平均负载率'
            }
          ]
        }
      ]
    };
    
    gaugeChart.setOption(option);
  }
};

const initEnergyChart = () => {
  if (energyChartRef.value) {
    energyChart = echarts.init(energyChartRef.value);
    
    const energyData = [
      { value: 35, name: '照明' },
      { value: 25, name: '空调' },
      { value: 20, name: '生产设备' },
      { value: 15, name: '办公设备' },
      { value: 5, name: '其他' }
    ];
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}kWh ({d}%)'
      },
      legend: {
        show: false
      },
      series: [
        {
          name: '能耗分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: energyData,
          itemStyle: {
            borderRadius: 5,
            borderColor: '#0f172a',
            borderWidth: 2,
            color: (params: any) => {
              const colors = ['#4ade80', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
              return colors[params.dataIndex % colors.length];
            }
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            color: '#e2e8f0',
            fontSize: 10
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: '#94a3b8'
            }
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold'
            }
          }
        }
      ]
    };
    
    energyChart.setOption(option);
  }
};

const updateData = () => {
  // 更新指标数据
  currentPower.value = parseFloat((currentPower.value + Math.random() * 200 - 100).toFixed(0));
  dailyEnergy.value = parseFloat((dailyEnergy.value + Math.random() * 1000).toFixed(0));
  faultRate.value = parseFloat((Math.random() * 2).toFixed(2));
  carbonEmission.value = parseFloat((carbonEmission.value + Math.random() * 150 - 75).toFixed(0));
  powerTrend.value = parseFloat((Math.random() * 3 - 1.5).toFixed(1));
  energyTrend.value = parseFloat((Math.random() * 4 - 2).toFixed(1));
  carbonTrend.value = parseFloat((Math.random() * 2 - 1).toFixed(1));
  
  // 更新设备统计数据
  const totalDevices = 120 + Math.floor(Math.random() * 10);
  const online = totalDevices - Math.floor(Math.random() * 10);
  deviceCount.value = totalDevices;
  onlineDevices.value = online;
  
  // 更新告警（随机新增）
  if (Math.random() > 0.7) {
    const types = ['warning', 'critical'];
    const type = types[Math.floor(Math.random() * types.length)];
    alarms.value.unshift({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: `设备${String.fromCharCode(65 + Math.floor(Math.random() * 10))}${['温度过高', '电压异常', '通信中断'][Math.floor(Math.random() * 3)]}`,
      type
    });
    
    if (alarms.value.length > 8) alarms.value.pop();
  }
  
  // 更新设备状态
  devices.value.forEach(device => {
    // 随机更新设备状态
    if (Math.random() > 0.8) {
      const statuses = ['online', 'warning', 'offline'];
      device.status = statuses[Math.floor(Math.random() * statuses.length)];
    }
    
    // 更新设备数据
    device.power = parseFloat((device.power + Math.random() * 200 - 100).toFixed(0));
    device.temperature = parseFloat((device.temperature + Math.random() * 5 - 2.5).toFixed(1));
    device.load = Math.min(100, Math.max(0, parseFloat((device.load + Math.random() * 10 - 5).toFixed(1))));
  });
  
  // 更新图表
  if (gridChart) {
    const gridData = [
      { value: parseFloat((12500 + Math.random() * 3000 - 1500).toFixed(0)), name: '变电站A' },
      { value: parseFloat((9800 + Math.random() * 3000 - 1500).toFixed(0)), name: '变电站B' },
      { value: parseFloat((15200 + Math.random() * 3000 - 1500).toFixed(0)), name: '变电站C' },
      { value: parseFloat((8700 + Math.random() * 3000 - 1500).toFixed(0)), name: '变电站D' }
    ];
    
    gridChart.setOption({
      series: [{ data: gridData }]
    });
  }
  
  if (lineChart) {
    // 更新折线图数据
    const newData = [];
    for (let i = 0; i < 24; i++) {
      newData.push(Math.floor(8000 + Math.random() * 7000));
    }
    
    lineChart.setOption({
      series: [{ data: newData }]
    });
  }
  
  if (barChart) {
    // 更新柱状图数据
    const newCounts = [24, 42, 18, 32, 12].map(count => 
      Math.max(0, count + Math.floor(Math.random() * 10 - 5))
    );
    
    barChart.setOption({
      series: [{ data: newCounts }]
    });
  }
  
  if (gaugeChart) {
    gaugeChart.setOption({
      series: [{
        data: [{
          value: Math.min(100, Math.max(0, parseFloat((75 + Math.random() * 10 - 5).toFixed(1)))),
          name: '平均负载率'
        }]
      }]
    });
  }
  
  if (energyChart) {
    const energyData = [
      { value: 30 + Math.random() * 10, name: '照明' },
      { value: 20 + Math.random() * 10, name: '空调' },
      { value: 15 + Math.random() * 10, name: '生产设备' },
      { value: 10 + Math.random() * 10, name: '办公设备' },
      { value: 5 + Math.random() * 5, name: '其他' }
    ];
    
    energyChart.setOption({
      series: [{ data: energyData }]
    });
  }
};

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  if (gridChart) {
    gridChart.dispose();
  }
  if (lineChart) {
    lineChart.dispose();
  }
  if (barChart) {
    barChart.dispose();
  }
  if (gaugeChart) {
    gaugeChart.dispose();
  }
  if (energyChart) {
    energyChart.dispose();
  }
});
</script>

<style scoped>
.digital-twin-display {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 15px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #0c1427 0%, #162038 100%);
  color: #e2e8f0;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 顶部标题栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: rgba(15, 23, 42, 0.7);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(to right, #60a5fa, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-indicator.online {
  background: #34d399;
  box-shadow: 0 0 8px #34d399;
}

.status-text {
  color: #34d399;
  font-weight: 500;
  font-size: 0.9rem;
}

.header-center .time {
  font-size: 1rem;
  color: #94a3b8;
}

.header-right {
  display: flex;
  align-items: center;
}

/* 指标概览 */
.metrics-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 15px;
}

.metric-card {
  background: linear-gradient(145deg, #1a2740, #0f1a2e);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(56, 103, 180, 0.2);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  border-color: rgba(96, 165, 250, 0.4);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.card-title {
  flex: 1;
}

.card-header h3 {
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
}

.card-icon {
  font-size: 20px;
  margin-top: 2px;
}

.primary .card-icon {
  color: #34d399;
}

.secondary .card-icon {
  color: #fbbf24;
}

.warning .card-icon {
  color: #f59e0b;
}

.info .card-icon {
  color: #60a5fa;
}

.device .card-icon {
  color: #8b5cf6;
}

.card-content .value {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(to right, #e2e8f0, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.unit {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-left: 3px;
}

.trend {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.8rem;
  font-weight: 600;
}

.trend.up {
  color: #34d399;
}

.trend.down {
  color: #ef4444;
}

.status {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  font-weight: 600;
}

.status.normal {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.status.alert {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.online {
  font-size: 0.7rem;
  background: rgba(56, 130, 246, 0.2);
  color: #60a5fa;
  padding: 2px 8px;
  border-radius: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: auto;
}

/* 图表区域 */
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
  margin-bottom: 15px;
  flex: 1;
  min-height: 0;
}

.chart-container {
  background: linear-gradient(145deg, #1a2740, #0f1a2e);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  padding: 12px;
  border: 1px solid rgba(56, 103, 180, 0.2);
  display: flex;
  flex-direction: column;
}

.chart-container.large {
  grid-row: span 2;
}

.chart-container.small {
  grid-column: span 1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart-header h2 {
  margin: 0;
  font-size: 1rem;
  color: #e2e8f0;
  font-weight: 600;
}

.legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  color: #94a3b8;
}

.color-box {
  width: 8px;
  height: 8px;
  border-radius: 1px;
}

.color-box.green {
  background: #4ade80;
}

.color-box.yellow {
  background: #f59e0b;
}

.color-box.red {
  background: #ef4444;
}

.color-box.blue {
  background: #3b82f6;
}

.chart-wrapper {
  flex: 1;
  min-height: 0;
}

/* 底部信息区域 */
.bottom-section {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.8fr;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.panel-header h2 {
  margin: 0;
  font-size: 1rem;
  color: #e2e8f0;
  font-weight: 600;
}

.alert-count {
  background: #ef4444;
  color: white;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

/* 告警面板 */
.alerts-panel {
  background: linear-gradient(145deg, #1a2740, #0f1a2e);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  padding: 12px;
  border: 1px solid rgba(56, 103, 180, 0.2);
  display: flex;
  flex-direction: column;
}

.alerts-list {
  flex: 1;
  overflow-y: auto;
}

.alerts-list::-webkit-scrollbar {
  width: 4px;
}

.alerts-list::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 2px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  font-size: 0.85rem;
}

.alert-item:hover {
  transform: translateX(3px);
  border-color: rgba(255, 255, 255, 0.1);
}

.alert-item.critical {
  background: rgba(239, 68, 68, 0.1);
}

.alert-item.warning {
  background: rgba(245, 158, 11, 0.1);
}

.alert-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-item.critical .alert-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.alert-item.warning .alert-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.alert-content {
  flex: 1;
}

.alert-time {
  color: #60a5fa;
  font-weight: 600;
  margin-bottom: 3px;
  font-size: 0.75rem;
}

.alert-desc {
  color: #e2e8f0;
  font-weight: 500;
}

.alert-action {
  flex-shrink: 0;
}

/* 设备面板 */
.devices-panel {
  background: linear-gradient(145deg, #1a2740, #0f1a2e);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  padding: 12px;
  border: 1px solid rgba(56, 103, 180, 0.2);
  display: flex;
  flex-direction: column;
}

.devices-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  overflow-y: auto;
}

.devices-grid::-webkit-scrollbar {
  width: 4px;
}

.devices-grid::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 2px;
}

.device-item {
  background: rgba(30, 41, 59, 0.6);
  border-radius: 8px;
  padding: 10px;
  border: 1px solid rgba(56, 103, 180, 0.2);
  transition: all 0.3s ease;
  display: flex;
  gap: 8px;
  font-size: 0.8rem;
}

.device-item:hover {
  transform: translateY(-2px);
  border-color: rgba(96, 165, 250, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.device-item.online {
  border-left: 3px solid #34d399;
}

.device-item.warning {
  border-left: 3px solid #f59e0b;
}

.device-item.offline {
  border-left: 3px solid #64748b;
}

.device-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: rgba(56, 130, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #60a5fa;
  flex-shrink: 0;
  font-size: 16px;
}

.device-info {
  flex: 1;
}

.device-name {
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 5px;
  font-size: 0.85rem;
}

.device-status {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
  font-size: 0.75rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.online {
  background: #34d399;
}

.status-dot.warning {
  background: #f59e0b;
}

.status-dot.offline {
  background: #64748b;
}

.data-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 3px;
}

.label {
  color: #94a3b8;
}

.value {
  color: #e2e8f0;
  font-weight: 500;
}

/* 统计面板 */
.stats-panel {
  background: linear-gradient(145deg, #1a2740, #0f1a2e);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  padding: 12px;
  border: 1px solid rgba(56, 103, 180, 0.2);
  display: flex;
  flex-direction: column;
}

.stats-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  overflow-y: auto;
}

.stats-content::-webkit-scrollbar {
  width: 4px;
}

.stats-content::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 2px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 8px;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e2e8f0;
  background: linear-gradient(to right, #60a5fa, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 响应式设计 */
@media (max-width: 1600px) {
  .metrics-overview {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .metric-card:nth-child(4),
  .metric-card:nth-child(5) {
    grid-column: span 2;
  }
  
  .charts-section {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
    height: auto;
  }
  
  .chart-container.large {
    grid-row: span 1;
  }
  
  .bottom-section {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .stats-panel {
    grid-column: span 2;
  }
}

@media (max-width: 1200px) {
  .metrics-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .metric-card:nth-child(4),
  .metric-card:nth-child(5) {
    grid-column: span 1;
  }
  
  .devices-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metrics-overview {
    grid-template-columns: 1fr;
  }
  
  .metric-card {
    grid-column: span 1 !important;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    grid-column: span 1 !important;
  }
}

/* 动画效果 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.alert-item.critical {
  animation: pulse 2s infinite;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.metric-card {
  animation: fadeIn 0.3s ease-out forwards;
}

.metric-card:nth-child(2) {
  animation-delay: 0.05s;
}

.metric-card:nth-child(3) {
  animation-delay: 0.1s;
}

.metric-card:nth-child(4) {
  animation-delay: 0.15s;
}

.metric-card:nth-child(5) {
  animation-delay: 0.2s;
}
</style>