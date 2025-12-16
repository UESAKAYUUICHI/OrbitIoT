<template>
  <div class="file-manager">
    <div class="management-header">
      <h2>文件管理</h2>
      <div class="controls">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索文件..." 
          style="width: 250px; margin-right: 10px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select 
          v-model="typeFilter" 
          placeholder="文件类型" 
          style="width: 120px; margin-right: 10px;"
          clearable
        >
          <el-option label="所有类型" value="" />
          <el-option label="固件" value="firmware" />
          <el-option label="文档" value="document" />
          <el-option label="配置" value="config" />
          <el-option label="日志" value="log" />
        </el-select>
        <el-button type="primary" @click="uploadFile">
          <el-icon><Upload /></el-icon>
          上传文件
        </el-button>
      </div>
    </div>
    
    <div class="management-content">
      <!-- 文件统计 -->
      <el-row :gutter="20" class="file-stats">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon primary">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ fileStats.total }}</div>
              <div class="stat-label">文件总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon success">
              <el-icon :size="24"><SetUp /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ fileStats.firmware }}</div>
              <div class="stat-label">固件文件</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon warning">
              <el-icon :size="24"><DocumentCopy /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ fileStats.document }}</div>
              <div class="stat-label">文档文件</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon info">
              <el-icon :size="24"><Files /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ fileStats.size }}</div>
              <div class="stat-label">总大小</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 文件列表 -->
      <el-card class="files-card" shadow="hover">
        <el-table 
          :data="filteredFiles" 
          style="width: 100%"
          stripe
          v-loading="loading"
        >
          <el-table-column prop="name" label="文件名">
            <template #default="scope">
              <div class="file-info">
                <el-icon class="file-icon" :size="20">
                  <component :is="getFileIcon(scope.row.type)" />
                </el-icon>
                <span>{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="120">
            <template #default="scope">
              <el-tag :type="getTypeTagType(scope.row.type)">
                {{ getTypeLabel(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="120" />
          <el-table-column prop="version" label="版本" width="100" />
          <el-table-column prop="deviceModel" label="适用设备" width="150" />
          <el-table-column prop="uploadTime" label="上传时间" width="180" />
          <el-table-column prop="uploader" label="上传者" width="120" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" type="primary" @click="downloadFile(scope.row)">
                下载
              </el-button>
              <el-button size="small" type="success" @click="viewFile(scope.row)">
                查看
              </el-button>
              <el-button size="small" type="danger" @click="deleteFile(scope.row)">
                删除
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
    
    <!-- 文件预览对话框 -->
    <el-dialog
      v-model="previewDialog.visible"
      :title="'文件预览 - ' + previewDialog.file.name"
      width="600px"
    >
      <div class="file-preview">
        <div v-if="previewDialog.file.type === 'document'" class="document-preview">
          <el-scrollbar height="400px">
            <div class="document-content">
              {{ previewDialog.file.content }}
            </div>
          </el-scrollbar>
        </div>
        <div v-else-if="previewDialog.file.type === 'firmware'" class="firmware-preview">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="文件名">{{ previewDialog.file.name }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ previewDialog.file.version }}</el-descriptions-item>
            <el-descriptions-item label="大小">{{ previewDialog.file.size }}</el-descriptions-item>
            <el-descriptions-item label="适用设备">{{ previewDialog.file.deviceModel }}</el-descriptions-item>
            <el-descriptions-item label="校验码">{{ previewDialog.file.checksum }}</el-descriptions-item>
            <el-descriptions-item label="上传时间">{{ previewDialog.file.uploadTime }}</el-descriptions-item>
            <el-descriptions-item label="说明">{{ previewDialog.file.description }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-else class="default-preview">
          <el-icon :size="64"><Document /></el-icon>
          <p>该文件类型不支持预览</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="previewDialog.visible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 文件上传对话框 -->
    <el-dialog
      v-model="uploadDialog.visible"
      title="上传文件"
      width="600px"
    >
      <el-form :model="uploadDialog.form" label-width="100px">
        <el-form-item label="选择文件：" required>
          <el-upload
            class="file-upload"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="true"
            :on-change="handleFileChange"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="文件类型：" required>
          <el-select v-model="uploadDialog.form.type" style="width: 100%;">
            <el-option label="固件" value="firmware" />
            <el-option label="文档" value="document" />
            <el-option label="配置" value="config" />
            <el-option label="日志" value="log" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用设备：">
          <el-select v-model="uploadDialog.form.deviceModel" style="width: 100%;" filterable>
            <el-option 
              v-for="model in deviceModels" 
              :key="model" 
              :label="model" 
              :value="model"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="版本：" v-if="uploadDialog.form.type === 'firmware'">
          <el-input v-model="uploadDialog.form.version" />
        </el-form-item>
        <el-form-item label="说明：">
          <el-input 
            v-model="uploadDialog.form.description" 
            type="textarea" 
            :rows="3" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveFile" :loading="uploadDialog.loading">上传</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Search,
  Upload,
  Document,
  SetUp,
  DocumentCopy,
  Files
} from '@element-plus/icons-vue'

// 文件数据
const files = ref([
  {
    id: 'FILE001',
    name: 'ths_sensor_v1.2.3.bin',
    type: 'firmware',
    size: '256 KB',
    version: 'v1.2.3',
    deviceModel: 'THS-100',
    uploadTime: '2025-12-14 10:30:22',
    uploader: 'admin',
    checksum: 'ABC123DEF456',
    description: '温湿度传感器固件更新',
    content: ''
  },
  {
    id: 'FILE002',
    name: '设备安装手册.pdf',
    type: 'document',
    size: '1.2 MB',
    version: '',
    deviceModel: '通用',
    uploadTime: '2025-12-10 14:20:00',
    uploader: 'admin',
    checksum: '',
    description: '设备安装和使用手册',
    content: '这是设备安装手册的内容...'
  },
  {
    id: 'FILE003',
    name: 'config_ths_prod.json',
    type: 'config',
    size: '2 KB',
    version: '',
    deviceModel: 'THS-100',
    uploadTime: '2025-12-05 11:30:00',
    uploader: 'admin',
    checksum: '',
    description: '生产环境配置文件',
    content: ''
  },
  {
    id: 'FILE004',
    name: 'aq_monitor_v2.1.0.bin',
    type: 'firmware',
    size: '512 KB',
    version: 'v2.1.0',
    deviceModel: 'AQ-200',
    uploadTime: '2025-12-01 09:45:00',
    uploader: 'admin',
    checksum: 'XYZ789UVW321',
    description: '空气质量监测器固件',
    content: ''
  },
  {
    id: 'FILE005',
    name: '系统维护日志.log',
    type: 'log',
    size: '5.6 MB',
    version: '',
    deviceModel: '系统',
    uploadTime: '2025-11-28 16:45:12',
    uploader: 'admin',
    checksum: '',
    description: '系统维护日志文件',
    content: '这是系统日志的内容...'
  }
])

// 设备型号
const deviceModels = ref([
  'THS-100',
  'AQ-200',
  'SW-300',
  'PLC-400',
  '通用'
])

// 状态和过滤
const searchQuery = ref('')
const typeFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)

// 对话框状态
const previewDialog = ref({
  visible: false,
  file: {} as any
})

const uploadDialog = ref({
  visible: false,
  loading: false,
  form: {
    file: null as File | null,
    type: 'document',
    deviceModel: '',
    version: '',
    description: ''
  }
})

// 文件统计
const fileStats = computed(() => {
  const firmwareCount = files.value.filter(f => f.type === 'firmware').length
  const documentCount = files.value.filter(f => f.type === 'document').length
  const configCount = files.value.filter(f => f.type === 'config').length
  const logCount = files.value.filter(f => f.type === 'log').length
  
  // 计算总大小（简化处理）
  const totalSize = files.value.reduce((acc, file) => {
    const sizeStr = file.size
    if (sizeStr.includes('KB')) {
      return acc + parseFloat(sizeStr) * 1024
    } else if (sizeStr.includes('MB')) {
      return acc + parseFloat(sizeStr) * 1024 * 1024
    } else if (sizeStr.includes('GB')) {
      return acc + parseFloat(sizeStr) * 1024 * 1024 * 1024
    }
    return acc
  }, 0)
  
  // 格式化总大小
  let formattedSize = ''
  if (totalSize < 1024) {
    formattedSize = totalSize + ' B'
  } else if (totalSize < 1024 * 1024) {
    formattedSize = (totalSize / 1024).toFixed(2) + ' KB'
  } else if (totalSize < 1024 * 1024 * 1024) {
    formattedSize = (totalSize / (1024 * 1024)).toFixed(2) + ' MB'
  } else {
    formattedSize = (totalSize / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }
  
  return {
    total: files.value.length,
    firmware: firmwareCount,
    document: documentCount,
    config: configCount,
    log: logCount,
    size: formattedSize
  }
})

// 计算过滤后的文件列表
const filteredFiles = computed(() => {
  let result = files.value
  
  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(file => 
      file.name.toLowerCase().includes(query) ||
      file.deviceModel.toLowerCase().includes(query) ||
      file.description.toLowerCase().includes(query)
    )
  }
  
  // 根据类型过滤
  if (typeFilter.value) {
    result = result.filter(file => file.type === typeFilter.value)
  }
  
  // 分页处理
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return result.slice(start, end)
})

// 计算总项目数
const totalItems = computed(() => {
  let result = files.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(file => 
      file.name.toLowerCase().includes(query) ||
      file.deviceModel.toLowerCase().includes(query) ||
      file.description.toLowerCase().includes(query)
    )
  }
  
  if (typeFilter.value) {
    result = result.filter(file => file.type === typeFilter.value)
  }
  
  return result.length
})

// 获取文件图标
const getFileIcon = (type: string) => {
  switch (type) {
    case 'firmware': return SetUp
    case 'document': return DocumentCopy
    case 'config': return Files
    case 'log': return Document
    default: return Document
  }
}

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  switch (type) {
    case 'firmware': return 'success'
    case 'document': return 'primary'
    case 'config': return 'warning'
    case 'log': return 'info'
    default: return ''
  }
}

// 获取类型标签文本
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'firmware': return '固件'
    case 'document': return '文档'
    case 'config': return '配置'
    case 'log': return '日志'
    default: return type
  }
}

// 查看文件
const viewFile = (file: any) => {
  previewDialog.value.file = { ...file }
  previewDialog.value.visible = true
}

// 下载文件
const downloadFile = (file: any) => {
}

// 删除文件
const deleteFile = (file: any) => {
  ElMessageBox.confirm(
    `确定要删除文件 "${file.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = files.value.findIndex(f => f.id === file.id)
    if (index > -1) {
      files.value.splice(index, 1)
      ElMessage.success('文件已删除')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 上传文件
const uploadFile = () => {
  uploadDialog.value.form = {
    file: null,
    type: 'document',
    deviceModel: '',
    version: '',
    description: ''
  }
  uploadDialog.value.visible = true
}

// 处理文件选择
const handleFileChange = (file: any) => {
  uploadDialog.value.form.file = file.raw
}

// 保存文件
const saveFile = () => {
  uploadDialog.value.loading = true
  
  // 模拟上传过程
  setTimeout(() => {
    uploadDialog.value.loading = false
    
    if (uploadDialog.value.form.file) {
      const newFile = {
        id: 'FILE' + new Date().getTime(),
        name: uploadDialog.value.form.file.name,
        type: uploadDialog.value.form.type,
        size: formatFileSize(uploadDialog.value.form.file.size),
        version: uploadDialog.value.form.version,
        deviceModel: uploadDialog.value.form.deviceModel || '通用',
        uploadTime: new Date().toLocaleString(),
        uploader: 'admin',
        checksum: '',
        description: uploadDialog.value.form.description,
        content: ''
      }
      
      files.value.unshift(newFile)
      ElMessage.success('文件上传成功')
      uploadDialog.value.visible = false
    }
  }, 1000)
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return bytes + ' B'
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB'
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
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
</script>

<style scoped>
.file-manager {
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

.file-stats {
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

.files-card {
  border-radius: 8px;
  border: none;
}

.files-card :deep(.el-card__body) {
  padding: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  color: #409eff;
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

.file-preview {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.document-preview {
  width: 100%;
}

.document-content {
  white-space: pre-wrap;
  line-height: 1.6;
}

.firmware-preview {
  width: 100%;
}

.default-preview {
  text-align: center;
  color: #999;
}

.default-preview p {
  margin-top: 10px;
}

.file-upload :deep(.el-upload-dragger) {
  width: 100%;
}
</style>