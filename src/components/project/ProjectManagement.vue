<template>
  <div class="project-management">
    <div class="management-header">
      <h2>项目管理</h2>
      <div class="controls">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索项目..." 
          style="width: 250px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="addProject">
          <el-icon><Plus /></el-icon>
          添加项目
        </el-button>
      </div>
    </div>
    
    <div class="management-content">
      <!-- 项目统计图表 -->
      <el-row :gutter="20" class="project-charts">
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>项目年均发电量</span>
              </div>
            </template>
            <div class="chart-container">
              <div ref="yearlyChartRef" style="width: 100%; height: 300px;"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>项目日均发电量</span>
              </div>
            </template>
            <div class="chart-container">
              <div ref="dailyChartRef" style="width: 100%; height: 300px;"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 项目统计 -->
      <el-row :gutter="20" class="project-stats">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon primary">
              <el-icon :size="24"><Management /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ projectStats.total }}</div>
              <div class="stat-label">项目总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon success">
              <el-icon :size="24"><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ projectStats.active }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon warning">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ projectStats.pending }}</div>
              <div class="stat-label">待启动</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><Finished /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ projectStats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 项目列表 -->
      <el-card class="projects-card" shadow="hover">
        <el-table 
          :data="filteredProjects" 
          style="width: 100%"
          stripe
          v-loading="loading"
          @row-click="viewProjectProducts"
        >
          <el-table-column prop="id" label="项目ID" width="100" />
          <el-table-column prop="name" label="项目名称" />
          <el-table-column prop="description" label="项目描述" />
          <el-table-column label="关联产品" width="200">
            <template #default="scope">
              <el-tag
                v-for="product in getProjectProducts(scope.row.id)"
                :key="product.id"
                type="primary"
                style="margin-right: 5px; margin-bottom: 5px;"
              >
                {{ product.name }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deviceCount" label="设备数" width="100" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" type="primary" @click.stop="viewProjectProducts(scope.row)">
                查看产品
              </el-button>
              <el-button size="small" type="success" @click.stop="editProject(scope.row)">
                编辑
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
    
    <!-- 添加/编辑项目对话框 -->
    <el-dialog
      v-model="projectDialog.visible"
      :title="projectDialog.isEdit ? '编辑项目' : '添加项目'"
      width="600px"
    >
      <el-form :model="projectDialog.form" label-width="100px">
        <el-form-item label="项目名称：" required>
          <el-input v-model="projectDialog.form.name" />
        </el-form-item>
        <el-form-item label="项目描述：">
          <el-input 
            v-model="projectDialog.form.description" 
            type="textarea" 
            :rows="3" 
          />
        </el-form-item>
        <el-form-item label="项目状态：">
          <el-select v-model="projectDialog.form.status" style="width: 100%;">
            <el-option label="进行中" value="active" />
            <el-option label="待启动" value="pending" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间：">
          <el-date-picker 
            v-model="projectDialog.form.startTime" 
            type="datetime" 
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="预计完成时间：">
          <el-date-picker 
            v-model="projectDialog.form.endTime" 
            type="datetime" 
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="projectDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveProject">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { 
  Search,
  Plus,
  Management,
  Check,
  Clock,
  Finished
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 项目数据
const projects = ref([
  {
    id: 'PROJ001',
    name: '智慧城市项目',
    description: '建设城市基础设施智能化管理系统',
    productCount: 2,
    deviceCount: 5,
    status: 'active',
    createTime: '2025-01-15 09:30:00',
    startTime: '2025-01-20 00:00:00',
    endTime: '2026-01-20 00:00:00'
  },
  {
    id: 'PROJ002',
    name: '工业物联网项目',
    description: '工厂生产设备远程监控系统',
    productCount: 2,
    deviceCount: 1,
    status: 'active',
    createTime: '2025-03-10 14:20:00',
    startTime: '2025-03-15 00:00:00',
    endTime: '2026-03-15 00:00:00'
  }
])

// 产品数据
const products = ref([
  {
    id: 'PROD001',
    name: 'THS-100 温湿度传感器',
    projectId: 'PROJ001',
    deviceModel: 'THS-100',
    deviceCount: 3,
    status: 'active',
    key: 'ths-100',
    description: '高精度温湿度传感器，适用于室内外环境监测',
    createTime: '2025-01-20 10:30:00'
  },
  {
    id: 'PROD002',
    name: 'AQ-200 空气质量监测器',
    projectId: 'PROJ001',
    deviceModel: 'AQ-200',
    deviceCount: 2,
    status: 'active',
    key: 'aq-200',
    description: '多功能空气质量监测器，检测PM2.5、CO2等指标',
    createTime: '2025-02-15 14:20:00'
  },
  {
    id: 'PROD003',
    name: 'SW-300 水浸传感器',
    projectId: 'PROJ002',
    deviceModel: 'SW-300',
    deviceCount: 1,
    status: 'active',
    key: 'sw-300',
    description: '工业级水浸传感器，防水等级IP67',
    createTime: '2025-03-10 09:45:00'
  },
  {
    id: 'PROD004',
    name: 'PLC-400 工业控制器',
    projectId: 'PROJ002',
    deviceModel: 'PLC-400',
    deviceCount: 0,
    status: 'developing',
    key: 'plc-400',
    description: '高性能工业控制器，支持多种通讯协议',
    createTime: '2025-11-05 11:30:00'
  }
])

// 图表引用
const yearlyChartRef = ref<HTMLDivElement | null>(null)
const dailyChartRef = ref<HTMLDivElement | null>(null)
let yearlyChart: any = null
let dailyChart: any = null

// 状态和过滤
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)

// 对话框状态
const projectDialog = ref({
  visible: false,
  isEdit: false,
  form: {
    id: '',
    name: '',
    description: '',
    status: 'pending',
    startTime: '',
    endTime: ''
  }
})

// 项目统计
const projectStats = computed(() => {
  return {
    total: projects.value.length,
    active: projects.value.filter(p => p.status === 'active').length,
    pending: projects.value.filter(p => p.status === 'pending').length,
    completed: projects.value.filter(p => p.status === 'completed').length
  }
})

// 计算过滤后的项目列表
const filteredProjects = computed(() => {
  let result = projects.value
  
  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(project => 
      project.id.toLowerCase().includes(query) ||
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    )
  }
  
  // 分页处理
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return result.slice(start, end)
})

// 计算总项目数
const totalItems = computed(() => {
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    return projects.value.filter(project => 
      project.id.toLowerCase().includes(query) ||
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    ).length
  }
  return projects.value.length
})

// 获取项目关联的产品
const getProjectProducts = (projectId: string) => {
  return products.value.filter(product => product.projectId === projectId)
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'pending': return 'warning'
    case 'completed': return 'info'
    default: return ''
  }
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return '进行中'
    case 'pending': return '待启动'
    case 'completed': return '已完成'
    default: return status
  }
}

// 查看项目产品
const viewProjectProducts = (project: any) => {
  // 发送事件到父组件，通知切换到产品管理页面
  const event = new CustomEvent('navigate-to-products', { detail: project });
  window.dispatchEvent(event);
}

// 添加项目
const addProject = () => {
  projectDialog.value.isEdit = false
  projectDialog.value.form = {
    id: '',
    name: '',
    description: '',
    status: 'pending',
    startTime: '',
    endTime: ''
  }
  projectDialog.value.visible = true
}

// 编辑项目
const editProject = (project: any) => {
  projectDialog.value.isEdit = true
  projectDialog.value.form = { ...project }
  projectDialog.value.visible = true
}

// 保存项目
const saveProject = () => {
  projectDialog.value.visible = false
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
  if (yearlyChartRef.value) {
    yearlyChart = echarts.init(yearlyChartRef.value)
    const yearlyOption = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value} kWh'
        }
      },
      series: [{
        data: [890, 920, 950, 1000, 1050, 1100, 1150, 1120, 1080, 1030, 960, 910],
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.1)'
        }
      }]
    }
    yearlyChart.setOption(yearlyOption)
  }

  if (dailyChartRef.value) {
    dailyChart = echarts.init(dailyChartRef.value)
    const dailyOption = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['1', '5', '10', '15', '20', '25', '30']
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value} kWh'
        }
      },
      series: [{
        data: [120, 132, 101, 134, 90, 230, 210],
        type: 'bar',
        itemStyle: {
          color: '#67C23A'
        }
      }]
    }
    dailyChart.setOption(dailyOption)
  }
}

// 窗口大小改变时重置图表大小
const resizeCharts = () => {
  if (yearlyChart) {
    yearlyChart.resize()
  }
  if (dailyChart) {
    dailyChart.resize()
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
.project-management {
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

.project-charts {
  margin-bottom: 20px;
}

.project-stats {
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

.projects-card {
  border-radius: 8px;
  border: none;
}

.projects-card :deep(.el-card__body) {
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