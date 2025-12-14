<template>
  <div class="statistical-analysis">
    <div class="analysis-header">
      <h2>统计分析</h2>
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
          v-model="deviceType" 
          placeholder="设备类型" 
          style="width: 150px; margin-right: 10px;"
          clearable
        >
          <el-option label="所有设备" value="" />
          <el-option label="传感器" value="sensor" />
          <el-option label="控制器" value="controller" />
          <el-option label="监测器" value="monitor" />
        </el-select>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>
    
    <div class="analysis-content">
      <!-- 数据概览 -->
      <el-row :gutter="20" class="data-overview">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-icon primary">
              <el-icon :size="24"><DataAnalysis /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-title">总数据量</div>
              <div class="overview-value">12.8T</div>
              <div class="overview-trend positive">
                <el-icon><Top /></el-icon>
                12.5%
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-icon success">
              <el-icon :size="24"><Monitor /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-title">活跃设备</div>
              <div class="overview-value">1,154</div>
              <div class="overview-trend positive">
                <el-icon><Top /></el-icon>
                8.2%
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-icon warning">
              <el-icon :size="24"><Warning /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-title">告警次数</div>
              <div class="overview-value">126</div>
              <div class="overview-trend negative">
                <el-icon><Bottom /></el-icon>
                5.3%
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card" shadow="hover">
            <div class="overview-icon info">
              <el-icon :size="24"><Connection /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-title">平均在线率</div>
              <div class="overview-value">92.6%</div>
              <div class="overview-trend positive">
                <el-icon><Top /></el-icon>
                2.1%
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 图表区域 -->
      <el-row :gutter="20" class="charts-row">
        <el-col :xs="24" :sm="24" :md="16">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>设备数据趋势</span>
                <el-radio-group v-model="chartPeriod" size="small">
                  <el-radio-button label="day">日</el-radio-button>
                  <el-radio-button label="week">周</el-radio-button>
                  <el-radio-button label="month">月</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-container large">
              <div class="line-chart"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>设备类型分布</span>
              </div>
            </template>
            <div class="chart-container">
              <div class="pie-chart">
                <div class="chart-center">
                  <div class="center-value">1,286</div>
                  <div class="center-label">总设备</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" class="charts-row">
        <el-col :xs="24" :sm="24" :md="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>告警统计</span>
              </div>
            </template>
            <div class="chart-container">
              <div class="bar-chart"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>在线率趋势</span>
              </div>
            </template>
            <div class="chart-container">
              <div class="area-chart"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 数据报表 -->
      <el-card class="report-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>详细数据报表</span>
            <div class="report-controls">
              <el-button type="primary" plain>
                <el-icon><Download /></el-icon>
                导出Excel
              </el-button>
            </div>
          </div>
        </template>
        <el-table :data="reportData" style="width: 100%" stripe>
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="deviceCount" label="设备总数" />
          <el-table-column prop="activeCount" label="活跃设备" />
          <el-table-column prop="onlineRate" label="在线率" />
          <el-table-column prop="dataVolume" label="数据量" />
          <el-table-column prop="alertCount" label="告警次数" />
          <el-table-column prop="avgResponseTime" label="平均响应时间(ms)" />
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="reportPage"
            v-model:page-size="reportPageSize"
            :total="reportTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="handleReportSizeChange"
            @current-change="handleReportCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  Refresh,
  DataAnalysis,
  Monitor,
  Warning,
  Connection,
  Top,
  Bottom,
  Download
} from '@element-plus/icons-vue'

// 数据
const dateRange = ref([])
const deviceType = ref('')
const chartPeriod = ref('week')
const reportPage = ref(1)
const reportPageSize = ref(10)

// 报表示例数据
const reportData = ref([
  {
    date: '2025-12-01',
    deviceCount: 1280,
    activeCount: 1150,
    onlineRate: '89.8%',
    dataVolume: '256GB',
    alertCount: 12,
    avgResponseTime: 45
  },
  {
    date: '2025-12-02',
    deviceCount: 1282,
    activeCount: 1152,
    onlineRate: '89.9%',
    dataVolume: '268GB',
    alertCount: 8,
    avgResponseTime: 42
  },
  {
    date: '2025-12-03',
    deviceCount: 1283,
    activeCount: 1154,
    onlineRate: '90.0%',
    dataVolume: '275GB',
    alertCount: 5,
    avgResponseTime: 40
  },
  {
    date: '2025-12-04',
    deviceCount: 1284,
    activeCount: 1155,
    onlineRate: '90.1%',
    dataVolume: '282GB',
    alertCount: 7,
    avgResponseTime: 43
  },
  {
    date: '2025-12-05',
    deviceCount: 1285,
    activeCount: 1156,
    onlineRate: '90.2%',
    dataVolume: '290GB',
    alertCount: 6,
    avgResponseTime: 41
  },
  {
    date: '2025-12-06',
    deviceCount: 1285,
    activeCount: 1120,
    onlineRate: '87.2%',
    dataVolume: '210GB',
    alertCount: 15,
    avgResponseTime: 55
  },
  {
    date: '2025-12-07',
    deviceCount: 1286,
    activeCount: 1158,
    onlineRate: '90.3%',
    dataVolume: '295GB',
    alertCount: 4,
    avgResponseTime: 39
  }
])

const reportTotal = ref(30)

// 刷新数据
const refreshData = () => {
  ElMessage.success('统计数据已刷新')
}

// 报表分页处理
const handleReportSizeChange = (val: number) => {
  reportPageSize.value = val
  reportPage.value = 1
}

const handleReportCurrentChange = (val: number) => {
  reportPage.value = val
}
</script>

<style scoped>
.statistical-analysis {
  background: #f5f6fa;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.analysis-header h2 {
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

.overview-icon.primary {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.overview-icon.success {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.overview-icon.warning {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.overview-icon.info {
  background: rgba(142, 113, 170, 0.2);
  color: #8e71aa;
}

.overview-info {
  flex: 1;
}

.overview-title {
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

.overview-trend {
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 3px;
}

.overview-trend.positive {
  color: #67c23a;
}

.overview-trend.negative {
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
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 4px;
}

.chart-container.large {
  height: 350px;
}

.line-chart {
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><polyline points="0,300 50,250 100,270 150,210 200,220 250,180 300,200 350,160 400,170 450,130 500,150 550,110 600,130" fill="none" stroke="%23409eff" stroke-width="2"/><polyline points="0,280 50,260 100,270 150,250 200,260 250,240 300,250 350,230 400,240 450,220 500,230 550,210 600,220" fill="none" stroke="%2367c23a" stroke-width="2"/></svg>') center/contain no-repeat;
}

.pie-chart {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: conic-gradient(
    #409eff 0deg 100deg,
    #67c23a 100deg 220deg,
    #e6a23c 220deg 280deg,
    #8e71aa 280deg 360deg
  );
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-center {
  width: 90px;
  height: 90px;
  background: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.center-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
}

.center-label {
  font-size: 0.9rem;
  color: #666;
}

.bar-chart {
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect x="20" y="200" width="30" height="150" fill="%23409eff"/><rect x="70" y="150" width="30" height="200" fill="%23f56c6c"/><rect x="120" y="180" width="30" height="170" fill="%23e6a23c"/><rect x="170" y="130" width="30" height="220" fill="%2367c23a"/><rect x="220" y="160" width="30" height="190" fill="%238e71aa"/></svg>') center/contain no-repeat;
}

.area-chart {
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><path d="M0,300 L100,250 L200,230 L300,200 L400,220 L500,190 L600,210 L600,350 L0,350 Z" fill="%23409eff" opacity="0.3"/><path d="M0,300 L100,250 L200,230 L300,200 L400,220 L500,190 L600,210" fill="none" stroke="%23409eff" stroke-width="2"/></svg>') center/contain no-repeat;
}

.report-card {
  border-radius: 8px;
  border: none;
}

.report-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.report-controls {
  display: flex;
  gap: 10px;
}

.pagination-container {
  padding: 20px 0;
  display: flex;
  justify-content: center;
}
</style>