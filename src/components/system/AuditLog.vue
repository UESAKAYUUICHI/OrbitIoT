<template>
  <div class="audit-log">
    <div class="management-header">
      <h2>审计日志</h2>
      <div class="controls">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 250px; margin-right: 10px;"
        />
        <el-input
          v-model="searchQuery"
          placeholder="搜索操作者或操作..."
          style="width: 250px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="exportLogs">
          <el-icon><Download /></el-icon>
          导出日志
        </el-button>
      </div>
    </div>

    <div class="management-content">
      <el-card class="logs-card" shadow="hover">
        <el-table
          :data="filteredLogs"
          style="width: 100%"
          stripe
          v-loading="loading"
        >
          <el-table-column prop="id" label="日志ID" width="100" />
          <el-table-column prop="operator" label="操作者" width="120" />
          <el-table-column prop="action" label="操作类型" width="150">
            <template #default="scope">
              <el-tag :type="getActionTagType(scope.row.action)">
                {{ scope.row.action }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="resource" label="资源" />
          <el-table-column prop="description" label="操作详情" />
          <el-table-column prop="ipAddress" label="IP地址" width="150" />
          <el-table-column prop="timestamp" label="操作时间" width="180" />
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
import { ref, computed } from 'vue'
import { Search, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 审计日志数据
const auditLogs = ref([
  {
    id: 'LOG001',
    operator: 'admin',
    action: 'CREATE',
    resource: '项目管理',
    description: '创建新项目: 智慧城市项目',
    ipAddress: '192.168.1.100',
    timestamp: '2025-12-14 10:30:22'
  },
  {
    id: 'LOG002',
    operator: 'admin',
    action: 'UPDATE',
    resource: '设备管理',
    description: '更新设备状态: 温湿度传感器-001',
    ipAddress: '192.168.1.100',
    timestamp: '2025-12-14 11:15:42'
  },
  {
    id: 'LOG003',
    operator: 'admin',
    action: 'DELETE',
    resource: '产品管理',
    description: '删除产品: PLC-400 工业控制器',
    ipAddress: '192.168.1.100',
    timestamp: '2025-12-14 14:22:18'
  },
  {
    id: 'LOG004',
    operator: 'admin',
    action: 'LOGIN',
    resource: '系统认证',
    description: '用户登录系统',
    ipAddress: '192.168.1.100',
    timestamp: '2025-12-14 09:15:33'
  },
  {
    id: 'LOG005',
    operator: 'admin',
    action: 'CREATE',
    resource: '用户管理',
    description: '创建新用户: operator01',
    ipAddress: '192.168.1.100',
    timestamp: '2025-12-14 16:45:12'
  }
])

// 状态和过滤
const searchQuery = ref('')
const dateRange = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)

// 计算过滤后的日志列表
const filteredLogs = computed(() => {
  let result = auditLogs.value

  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(log =>
      log.operator.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.resource.toLowerCase().includes(query) ||
      log.description.toLowerCase().includes(query)
    )
  }

  // 分页处理
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return result.slice(start, end)
})

// 计算总日志数
const totalItems = computed(() => {
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    return auditLogs.value.filter(log =>
      log.operator.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.resource.toLowerCase().includes(query) ||
      log.description.toLowerCase().includes(query)
    ).length
  }
  return auditLogs.value.length
})

// 获取操作类型标签类型
const getActionTagType = (action: string) => {
  switch (action.toUpperCase()) {
    case 'CREATE': return 'success'
    case 'UPDATE': return 'primary'
    case 'DELETE': return 'danger'
    case 'LOGIN': return 'warning'
    case 'LOGOUT': return 'info'
    default: return 'info'
  }
}

// 导出日志
const exportLogs = () => {
  ElMessage.success('日志导出功能已触发')
  // 实际项目中这里会实现导出逻辑
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
.audit-log {
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

.logs-card {
  border-radius: 8px;
  border: none;
}

.logs-card :deep(.el-card__body) {
  padding: 0;
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}
</style>