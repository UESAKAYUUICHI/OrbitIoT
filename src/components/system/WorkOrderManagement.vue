<template>
  <div class="work-order-management">
    <div class="management-header">
      <h2>工单管理</h2>
      <div class="controls">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索工单..." 
          style="width: 250px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select 
          v-model="statusFilter" 
          placeholder="工单状态" 
          style="width: 120px; margin-right: 10px;"
          clearable
        >
          <el-option label="所有状态" value="" />
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-select 
          v-model="priorityFilter" 
          placeholder="优先级" 
          style="width: 120px; margin-right: 10px;"
          clearable
        >
          <el-option label="所有优先级" value="" />
          <el-option label="紧急" value="critical" />
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
        <el-button type="primary" @click="addWorkOrder">
          <el-icon><Plus /></el-icon>
          创建工单
        </el-button>
      </div>
    </div>
    
    <div class="management-content">
      <!-- 工单统计 -->
      <el-row :gutter="20" class="work-order-stats">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon primary">
              <el-icon :size="24"><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ workOrderStats.total }}</div>
              <div class="stat-label">工单总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon warning">
              <el-icon :size="24"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ workOrderStats.pending }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><Tools /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ workOrderStats.processing }}</div>
              <div class="stat-label">处理中</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon success">
              <el-icon :size="24"><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ workOrderStats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 工单列表 -->
      <el-card class="work-orders-card" shadow="hover">
        <el-table 
          :data="filteredWorkOrders" 
          style="width: 100%"
          stripe
          v-loading="loading"
        >
          <el-table-column prop="id" label="工单ID" width="120" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="deviceName" label="关联设备" width="150" />
          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="scope">
              <el-tag :type="getPriorityTagType(scope.row.priority)">
                {{ getPriorityLabel(scope.row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assignee" label="负责人" width="120" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column prop="completeTime" label="完成时间" width="180" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" type="primary" @click="viewWorkOrder(scope.row)">
                查看详情
              </el-button>
              <el-button 
                size="small" 
                type="success" 
                @click="processWorkOrder(scope.row)"
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
    
    <!-- 工单详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      :title="'工单详情 - ' + detailDialog.workOrder.title"
      width="700px"
    >
      <el-form :model="detailDialog.workOrder" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工单ID：">
              <span>{{ detailDialog.workOrder.id }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级：">
              <el-tag :type="getPriorityTagType(detailDialog.workOrder.priority)">
                {{ getPriorityLabel(detailDialog.workOrder.priority) }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态：">
              <el-tag :type="getStatusTagType(detailDialog.workOrder.status)">
                {{ getStatusLabel(detailDialog.workOrder.status) }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人：">
              <span>{{ detailDialog.workOrder.assignee }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="关联设备：">
          <span>{{ detailDialog.workOrder.deviceName }}</span>
        </el-form-item>
        <el-form-item label="问题描述：">
          <el-input 
            v-model="detailDialog.workOrder.description" 
            type="textarea" 
            :rows="3" 
            readonly
          />
        </el-form-item>
        <el-form-item label="处理记录：" v-if="detailDialog.workOrder.processRecords.length > 0">
          <el-table :data="detailDialog.workOrder.processRecords" style="width: 100%">
            <el-table-column prop="time" label="处理时间" width="180" />
            <el-table-column prop="operator" label="处理人" width="100" />
            <el-table-column prop="action" label="处理动作" />
          </el-table>
        </el-form-item>
        <el-form-item label="解决方案：" v-if="detailDialog.workOrder.solution">
          <el-input 
            v-model="detailDialog.workOrder.solution" 
            type="textarea" 
            :rows="3" 
            readonly
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="processWorkOrder(detailDialog.workOrder)"
            :disabled="detailDialog.workOrder.status !== 'pending'"
            v-if="detailDialog.workOrder.status === 'pending' || detailDialog.workOrder.status === 'processing'"
          >
            {{ detailDialog.workOrder.status === 'pending' ? '开始处理' : '完成工单' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 创建/编辑工单对话框 -->
    <el-dialog
      v-model="workOrderDialog.visible"
      :title="workOrderDialog.isEdit ? '编辑工单' : '创建工单'"
      width="600px"
    >
      <el-form :model="workOrderDialog.form" label-width="100px">
        <el-form-item label="标题：" required>
          <el-input v-model="workOrderDialog.form.title" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联设备：" required>
              <el-select v-model="workOrderDialog.form.deviceId" style="width: 100%;">
                <el-option 
                  v-for="device in devices" 
                  :key="device.id" 
                  :label="device.name" 
                  :value="device.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级：" required>
              <el-select v-model="workOrderDialog.form.priority" style="width: 100%;">
                <el-option label="紧急" value="critical" />
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="问题描述：" required>
          <el-input 
            v-model="workOrderDialog.form.description" 
            type="textarea" 
            :rows="3" 
          />
        </el-form-item>
        <el-form-item label="备注：">
          <el-input 
            v-model="workOrderDialog.form.remark" 
            type="textarea" 
            :rows="2" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="workOrderDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveWorkOrder">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Search,
  Plus,
  Tickets,
  Warning,
  Tools,
  Check
} from '@element-plus/icons-vue'

// 工单数据
const workOrders = ref([
  {
    id: 'WO20251214001',
    title: '温湿度传感器温度异常',
    deviceId: 'DEV001THS',
    deviceName: '温湿度传感器-001',
    priority: 'high',
    status: 'pending',
    assignee: '张三',
    description: '设备温度持续高于阈值，需要检查设备是否故障',
    createTime: '2025-12-14 10:30:22',
    completeTime: '',
    remark: '',
    solution: '',
    processRecords: []
  },
  {
    id: 'WO20251214002',
    title: '空气质量监测器通信中断',
    deviceId: 'DEV004AQ',
    deviceName: '空气质量监测器-001',
    priority: 'critical',
    status: 'processing',
    assignee: '李四',
    description: '设备无法正常上报数据，可能为网络或设备故障',
    createTime: '2025-12-14 09:15:33',
    completeTime: '',
    remark: '',
    solution: '',
    processRecords: [
      {
        time: '2025-12-14 09:30:45',
        operator: '李四',
        action: '已接单，正在前往现场'
      }
    ]
  },
  {
    id: 'WO20251214003',
    title: '水浸传感器维护',
    deviceId: 'DEV006SW',
    deviceName: '水浸传感器-001',
    priority: 'medium',
    status: 'completed',
    assignee: '王五',
    description: '定期维护保养',
    createTime: '2025-12-10 14:20:00',
    completeTime: '2025-12-10 16:45:12',
    remark: '',
    solution: '已完成设备清洁和电池更换',
    processRecords: [
      {
        time: '2025-12-10 14:30:22',
        operator: '王五',
        action: '已接单'
      },
      {
        time: '2025-12-10 16:45:12',
        operator: '王五',
        action: '完成维护并关闭工单'
      }
    ]
  },
  {
    id: 'WO20251214004',
    title: '设备安装调试',
    deviceId: 'DEV005AQ',
    deviceName: '空气质量监测器-002',
    priority: 'low',
    status: 'cancelled',
    assignee: '',
    description: '新设备安装后的调试工作',
    createTime: '2025-12-05 11:30:00',
    completeTime: '',
    remark: '项目延期，暂时取消',
    solution: '',
    processRecords: [
      {
        time: '2025-12-10 09:15:33',
        operator: '系统',
        action: '因项目延期取消工单'
      }
    ]
  }
])

// 设备数据
const devices = ref([
  { id: 'DEV001THS', name: '温湿度传感器-001' },
  { id: 'DEV002THS', name: '温湿度传感器-002' },
  { id: 'DEV003THS', name: '温湿度传感器-003' },
  { id: 'DEV004AQ', name: '空气质量监测器-001' },
  { id: 'DEV005AQ', name: '空气质量监测器-002' },
  { id: 'DEV006SW', name: '水浸传感器-001' }
])

// 状态和过滤
const searchQuery = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)

// 对话框状态
const detailDialog = ref({
  visible: false,
  workOrder: {} as any
})

const workOrderDialog = ref({
  visible: false,
  isEdit: false,
  form: {
    id: '',
    title: '',
    deviceId: '',
    priority: 'medium',
    description: '',
    remark: ''
  }
})

// 工单统计
const workOrderStats = computed(() => {
  return {
    total: workOrders.value.length,
    pending: workOrders.value.filter(wo => wo.status === 'pending').length,
    processing: workOrders.value.filter(wo => wo.status === 'processing').length,
    completed: workOrders.value.filter(wo => wo.status === 'completed').length
  }
})

// 计算过滤后的工单列表
const filteredWorkOrders = computed(() => {
  let result = workOrders.value
  
  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(workOrder => 
      workOrder.id.toLowerCase().includes(query) ||
      workOrder.title.toLowerCase().includes(query) ||
      workOrder.deviceName.toLowerCase().includes(query) ||
      workOrder.assignee.toLowerCase().includes(query)
    )
  }
  
  // 根据状态过滤
  if (statusFilter.value) {
    result = result.filter(workOrder => workOrder.status === statusFilter.value)
  }
  
  // 根据优先级过滤
  if (priorityFilter.value) {
    result = result.filter(workOrder => workOrder.priority === priorityFilter.value)
  }
  
  // 分页处理
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return result.slice(start, end)
})

// 计算总项目数
const totalItems = computed(() => {
  let result = workOrders.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(workOrder => 
      workOrder.id.toLowerCase().includes(query) ||
      workOrder.title.toLowerCase().includes(query) ||
      workOrder.deviceName.toLowerCase().includes(query) ||
      workOrder.assignee.toLowerCase().includes(query)
    )
  }
  
  if (statusFilter.value) {
    result = result.filter(workOrder => workOrder.status === statusFilter.value)
  }
  
  if (priorityFilter.value) {
    result = result.filter(workOrder => workOrder.priority === priorityFilter.value)
  }
  
  return result.length
})

// 获取优先级标签类型
const getPriorityTagType = (priority: string) => {
  switch (priority) {
    case 'critical': return 'danger'
    case 'high': return 'warning'
    case 'medium': return 'primary'
    case 'low': return 'info'
    default: return ''
  }
}

// 获取优先级标签文本
const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'critical': return '紧急'
    case 'high': return '高'
    case 'medium': return '中'
    case 'low': return '低'
    default: return priority
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'processing': return 'primary'
    case 'completed': return 'success'
    case 'cancelled': return 'info'
    default: return ''
  }
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return '待处理'
    case 'processing': return '处理中'
    case 'completed': return '已完成'
    case 'cancelled': return '已取消'
    default: return status
  }
}

// 查看工单详情
const viewWorkOrder = (workOrder: any) => {
  detailDialog.value.workOrder = { ...workOrder }
  detailDialog.value.visible = true
}

// 处理工单
const processWorkOrder = (workOrder: any) => {
  if (workOrder.status === 'pending') {
    workOrder.status = 'processing'
    workOrder.assignee = '管理员'
    workOrder.processRecords.push({
      time: new Date().toLocaleString(),
      operator: '管理员',
      action: '开始处理工单'
    })
  } else if (workOrder.status === 'processing') {
    workOrder.status = 'completed'
    workOrder.completeTime = new Date().toLocaleString()
    workOrder.solution = '问题已解决'
    workOrder.processRecords.push({
      time: new Date().toLocaleString(),
      operator: '管理员',
      action: '完成工单处理'
    })
  }
  
  if (detailDialog.value.visible) {
    detailDialog.value.visible = false
  }
}

// 创建工单
const addWorkOrder = () => {
  workOrderDialog.value.isEdit = false
  workOrderDialog.value.form = {
    id: '',
    title: '',
    deviceId: '',
    priority: 'medium',
    description: '',
    remark: ''
  }
  workOrderDialog.value.visible = true
}

// 保存工单
const saveWorkOrder = () => {
  // 获取设备名称
  const device = devices.value.find(d => d.id === workOrderDialog.value.form.deviceId)
  
  if (workOrderDialog.value.isEdit) {
    // 编辑工单逻辑
    const index = workOrders.value.findIndex(wo => wo.id === workOrderDialog.value.form.id)
    if (index > -1) {
      workOrders.value[index] = {
        ...workOrders.value[index],
        ...workOrderDialog.value.form,
        deviceName: device ? device.name : ''
      }
    }
  } else {
    // 创建新工单
    const newWorkOrder = {
      id: 'WO' + new Date().getTime(),
      title: workOrderDialog.value.form.title,
      deviceId: workOrderDialog.value.form.deviceId,
      deviceName: device ? device.name : '',
      priority: workOrderDialog.value.form.priority,
      status: 'pending',
      assignee: '',
      description: workOrderDialog.value.form.description,
      createTime: new Date().toLocaleString(),
      completeTime: '',
      remark: workOrderDialog.value.form.remark,
      solution: '',
      processRecords: []
    }
    workOrders.value.unshift(newWorkOrder)
  }
  
  ElMessage.success('工单已保存')
  workOrderDialog.value.visible = false
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
.work-order-management {
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

.work-order-stats {
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

.work-orders-card {
  border-radius: 8px;
  border: none;
}

.work-orders-card :deep(.el-card__body) {
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