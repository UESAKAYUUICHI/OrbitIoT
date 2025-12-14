<template>
  <div class="data-charts">
    <div class="charts-header">
      <h2>数据可视化</h2>
      <div class="time-filters">
        <el-radio-group v-model="selectedTimeRange" size="small">
          <el-radio-button 
            v-for="range in timeRanges" 
            :key="range.value"
            :label="range.value"
          >
            {{ range.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>
    
    <div class="charts-content">
      <!-- 主要图表区域 -->
      <el-card class="main-chart" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>设备数据趋势</span>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color temp"></div>
                <span>温度(°C)</span>
              </div>
              <div class="legend-item">
                <div class="legend-color humidity"></div>
                <span>湿度(%RH)</span>
              </div>
              <div class="legend-item">
                <div class="legend-color pressure"></div>
                <span>气压(hPa)</span>
              </div>
            </div>
          </div>
        </template>
        <div class="chart-wrapper">
          <div class="line-chart"></div>
        </div>
      </el-card>
      
      <!-- 辅助图表网格 -->
      <el-row :gutter="20" class="secondary-charts">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>设备状态分布</span>
              </div>
            </template>
            <div class="chart-wrapper">
              <div class="pie-chart">
                <div class="chart-center">
                  <div class="center-value">1,286</div>
                  <div class="center-label">总设备</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>告警类型分布</span>
              </div>
            </template>
            <div class="chart-wrapper">
              <div class="bar-chart"></div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>数据传输量</span>
              </div>
            </template>
            <div class="chart-wrapper">
              <div class="area-chart"></div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>设备在线率</span>
              </div>
            </template>
            <div class="chart-wrapper">
              <div class="gauge-chart">
                <div class="gauge-value">89.7%</div>
                <div class="gauge-label">在线率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 时间范围选项
const timeRanges = [
  { label: '近1小时', value: '1h' },
  { label: '近24小时', value: '24h' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' }
]

const selectedTimeRange = ref('24h')
</script>

<style scoped>
.data-charts {
  background: #f5f6fa;
}

.charts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.charts-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.main-chart {
  border-radius: 8px;
  border: none;
  margin-bottom: 20px;
}

.main-chart :deep(.el-card__header) {
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

.chart-legend {
  display: flex;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 5px;
}

.legend-color.temp {
  background: #409eff;
}

.legend-color.humidity {
  background: #67c23a;
}

.legend-color.pressure {
  background: #e6a23c;
}

.chart-wrapper {
  padding: 20px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.line-chart {
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><polyline points="0,250 50,200 100,220 150,180 200,190 250,150 300,170 350,130 400,140 450,100 500,120 550,80 600,100" fill="none" stroke="%23409eff" stroke-width="2"/><polyline points="0,200 50,180 100,190 150,170 200,180 250,160 300,170 350,150 400,160 450,140 500,150 550,130 600,140" fill="none" stroke="%2367c23a" stroke-width="2"/><polyline points="0,150 50,160 100,155 150,165 200,160 250,170 300,165 350,175 400,170 450,180 500,175 550,185 600,180" fill="none" stroke="%23e6a23c" stroke-width="2"/></svg>') center/contain no-repeat;
}

.secondary-charts {
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

.pie-chart {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: conic-gradient(
    #67c23a 0deg 120deg,
    #409eff 120deg 240deg,
    #e6a23c 240deg 360deg
  );
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-center {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.center-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.center-label {
  font-size: 0.8rem;
  color: #666;
}

.bar-chart {
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect x="20" y="150" width="30" height="100" fill="%23409eff"/><rect x="70" y="100" width="30" height="150" fill="%23f56c6c"/><rect x="120" y="180" width="30" height="70" fill="%23e6a23c"/><rect x="170" y="130" width="30" height="120" fill="%2367c23a"/><rect x="220" y="160" width="30" height="90" fill="%238e71aa"/></svg>') center/contain no-repeat;
}

.area-chart {
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><path d="M0,250 L100,200 L200,180 L300,150 L400,170 L500,140 L600,160 L600,300 L0,300 Z" fill="%23409eff" opacity="0.3"/><path d="M0,250 L100,200 L200,180 L300,150 L400,170 L500,140 L600,160" fill="none" stroke="%23409eff" stroke-width="2"/></svg>') center/contain no-repeat;
}

.gauge-chart {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: conic-gradient(
    #fef0f0 0deg 40deg,
    #fdf6ec 40deg 90deg,
    #f0f9ff 90deg 360deg
  );
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gauge-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.gauge-label {
  position: absolute;
  bottom: 45px;
  font-size: 0.9rem;
  color: #666;
}
</style>