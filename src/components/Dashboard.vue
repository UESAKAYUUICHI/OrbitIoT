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
              <div class="metric-trend" :class="metric.trendClass">
                <el-icon v-if="metric.trendClass === 'positive'">
                  <ArrowUp />
                </el-icon>
                <el-icon v-else>
                  <ArrowDown />
                </el-icon>
                {{ metric.trend }}
              </div>
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
              <div class="pie-chart-demo">
                <div class="chart-center">
                  <div class="chart-label">设备状态</div>
                  <div class="chart-value">1,286</div>
                </div>
              </div>
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
              <div class="line-chart-demo"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 设备列表 -->
      <el-card class="devices-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>最新设备</span>
            <el-button link type="primary">查看全部</el-button>
          </div>
        </template>
        <el-table :data="devices" style="width: 100%">
          <el-table-column prop="id" label="设备ID" />
          <el-table-column prop="name" label="设备名称" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag 
                :type="getTagType(scope.row.statusClass)"
                effect="plain"
              >
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastUpdate" label="最后更新" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  Monitor, 
  Check, 
  Warning, 
  DataLine,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'

// 关键指标数据
const metrics = ref([
  {
    icon: Monitor,
    title: '设备总数',
    value: '1,286',
    trend: '12%',
    colorClass: 'blue',
    trendClass: 'positive'
  },
  {
    icon: Check,
    title: '在线设备',
    value: '1,154',
    trend: '8%',
    colorClass: 'green',
    trendClass: 'positive'
  },
  {
    icon: Warning,
    title: '告警数量',
    value: '23',
    trend: '5%',
    colorClass: 'orange',
    trendClass: 'negative'
  },
  {
    icon: DataLine,
    title: '今日数据',
    value: '2.4T',
    trend: '3%',
    colorClass: 'purple',
    trendClass: 'positive'
  }
])

// 设备数据
const devices = ref([
  {
    id: 'DEV1001',
    name: '温湿度传感器 1',
    status: '在线',
    statusClass: 'online',
    lastUpdate: '2025-12-14 10:16:31'
  },
  {
    id: 'DEV1002',
    name: '空气质量监测器',
    status: '在线',
    statusClass: 'online',
    lastUpdate: '2025-12-14 10:17:32'
  },
  {
    id: 'DEV1003',
    name: '智能电表',
    status: '离线',
    statusClass: 'offline',
    lastUpdate: '2025-12-14 09:45:22'
  },
  {
    id: 'DEV1004',
    name: '水压传感器',
    status: '在线',
    statusClass: 'online',
    lastUpdate: '2025-12-14 10:18:33'
  },
  {
    id: 'DEV1005',
    name: '光照度传感器',
    status: '维护中',
    statusClass: 'maintenance',
    lastUpdate: '2025-12-14 08:30:15'
  }
])

// 获取标签类型
const getTagType = (statusClass: string) => {
  switch (statusClass) {
    case 'online': return 'success'
    case 'offline': return 'danger'
    case 'maintenance': return 'warning'
    default: return 'info'
  }
}
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

.metric-trend {
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 3px;
}

.metric-trend.positive {
  color: #67c23a;
}

.metric-trend.negative {
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

.pie-chart-demo {
  width: 200px;
  height: 200px;
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
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.chart-label {
  font-size: 0.9rem;
  color: #666;
}

.chart-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.line-chart-demo {
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><polyline points="0,200 50,150 100,180 150,120 200,160 250,100 300,140 350,80 400,120" fill="none" stroke="%23409eff" stroke-width="2"/></svg>') center/contain no-repeat;
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