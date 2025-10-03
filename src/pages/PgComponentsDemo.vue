<template>
  <main class="EstateTypesUpload">
    <div class="page-header">
      <h1>Демо Element Plus компонентов</h1>
      <p>Примеры различных компонентов с интеграцией тем</p>
    </div>
    
    <!-- Секция Input компонентов -->
    <div class="demo-section">
      <h2>Input компоненты</h2>
      <div class="demo-grid">
        <div class="demo-card">
          <h4>Обычный Input</h4>
          <el-input v-model="inputValue" placeholder="Введите текст" />
        </div>
        
        <div class="demo-card">
          <h4>Input с иконкой</h4>
          <el-input v-model="inputWithIcon" placeholder="Поиск">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="demo-card">
          <h4>Password Input</h4>
          <el-input v-model="passwordValue" type="password" placeholder="Пароль" show-password />
        </div>
        
        <div class="demo-card">
          <h4>Textarea</h4>
          <el-input 
            v-model="textareaValue" 
            type="textarea" 
            :rows="3"
            placeholder="Многострочный текст"
          />
        </div>
        
        <div class="demo-card">
          <h4>Number Input</h4>
          <el-input-number v-model="numberValue" :min="1" :max="100" />
        </div>
        
        <div class="demo-card">
          <h4>Input с размерами</h4>
          <div class="size-demo">
            <el-input v-model="sizeDemo" size="large" placeholder="Large" />
            <el-input v-model="sizeDemo" placeholder="Default" />
            <el-input v-model="sizeDemo" size="small" placeholder="Small" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Секция Table -->
    <div class="demo-section">
      <h2>Таблица сотрудников IT-компании</h2>
      <div class="demo-card table-demo">
        <div class="table-controls">
          <span>Цвет фона строк:</span>
          <el-color-picker v-model="tableRowColor" @change="updateTableStyle" show-alpha />
          <el-button @click="resetTableColor" size="small">Сбросить</el-button>
        </div>
        
        <el-table 
          :data="tableData" 
          :style="tableStyle"
          class="custom-table"
          stripe
          border
        >
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="Имя" width="160" />
          <el-table-column prop="position" label="Должность" width="180" />
          <el-table-column prop="department" label="Отдел" width="120" />
          <el-table-column prop="experience" label="Опыт" width="80">
            <template #default="scope">
              {{ scope.row.experience }} лет
            </template>
          </el-table-column>
          <el-table-column prop="salary" label="Зарплата" width="140">
            <template #default="scope">
              {{ formatSalary(scope.row.salary) }}
            </template>
          </el-table-column>
          <el-table-column prop="skills" label="Навыки" width="200">
            <template #default="scope">
              <el-tag 
                v-for="skill in scope.row.skills.slice(0, 2)" 
                :key="skill" 
                size="small" 
                style="margin-right: 4px;"
              >
                {{ skill }}
              </el-tag>
              <span v-if="scope.row.skills.length > 2" class="text-muted">
                +{{ scope.row.skills.length - 2 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="Статус">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastLogin" label="Последний вход" width="140" />
        </el-table>
      </div>
    </div>
    
  </main>
</template>

<script>
import { ref, computed, nextTick } from 'vue'
import { Search } from '@element-plus/icons-vue'

export default {
  name: 'ComponentsDemo',
  components: {
    Search
  },
  setup() {
    const inputValue = ref('')
    const inputWithIcon = ref('')
    const passwordValue = ref('')
    const textareaValue = ref('')
    const numberValue = ref(1)
    const sizeDemo = ref('')
    
    const tableRowColor = ref('#ffffff')

    const tableData = ref([])
    
    const tableStyle = computed(() => ({
      '--el-table-row-hover-bg-color': tableRowColor.value
    }))
    
    const paginatedData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredData.value.filter(item => item != null).slice(start, end)
    })
    
    const updateTableStyle = () => {
      // Update table style
    }
    
    const resetTableColor = () => {
      tableRowColor.value = '#ffffff'
    }
    
    const formatSalary = (salary) => {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(salary)
    }
    
    const getStatusType = (status) => {
      switch (status) {
        case 'Активен': return 'success'
        case 'Неактивен': return 'danger'
        case 'В отпуске': return 'warning'
        default: return 'info'
      }
    }
    
    
    return {
      inputValue,
      inputWithIcon,
      passwordValue,
      textareaValue,
      numberValue,
      sizeDemo,
      tableRowColor,
      tableData,
      tableStyle,
      updateTableStyle,
      resetTableColor,
      formatSalary,
      getStatusType
    }
  }
}
</script>

<style scoped>
.EstateTypesUpload {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.demo-section {
  margin-bottom: 40px;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.demo-card {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.table-demo {
  width: 100%;
}

.table-controls {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-filters {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-item label {
  font-weight: 500;
  font-size: 14px;
}

.advanced-table {
  width: 100%;
}

.size-demo {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.text-muted {
  color: #999;
  font-size: 12px;
}

.advanced-table {
  width: 100%;
  margin-bottom: 20px;
}

.skills-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
}

.salary-text {
  font-weight: 600;
  color: var(--success);
}

.date-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.table-pagination {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.table-stats {
  margin-top: 20px;
  padding: 20px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
}

.stat-card {
  text-align: center;
  padding: 15px;
  background-color: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.excel-upload-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-secondary);
}

.upload-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.upload-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.excel-uploader {
  width: 100%;
}

.file-info {
  margin-top: 15px;
}

.excel-preview-section {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-primary);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.preview-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-info {
  margin-bottom: 15px;
}

.preview-table-container {
  margin-bottom: 20px;
}

.excel-preview-table {
  width: 100%;
}

.preview-pagination-info {
  margin-top: 10px;
}

.preview-cell {
  padding: 4px;
  border-radius: 4px;
}

.preview-cell.empty-cell {
  background-color: var(--bg-tertiary);
  color: var(--text-muted);
  font-style: italic;
}

.preview-cell.salary-cell {
  font-weight: 600;
  color: var(--success);
}

.preview-cell.status-активен {
  color: var(--success);
  font-weight: 500;
}

.preview-cell.status-неактивен {
  color: var(--error);
  font-weight: 500;
}

.preview-cell.status-в-отпуске {
  color: var(--warning);
  font-weight: 500;
}

.column-mapping-section {
  padding: 15px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
}

.mapping-grid {
  display: grid;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background-color: var(--bg-primary);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.excel-column {
  flex: 1;
  font-family: monospace;
  background-color: var(--bg-tertiary);
  padding: 4px 8px;
  border-radius: 4px;
}

.mapping-arrow {
  color: var(--accent-primary);
}

.empty-table-message {
  text-align: center;
  padding: 40px 20px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  margin: 20px 0;
}

.no-stats {
  margin-bottom: 20px;
}

.target-field {
  flex: 1;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.target-field.mapped {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--success);
  border: 1px solid var(--success);
}

.target-field.unmapped {
  background-color: rgba(255, 152, 0, 0.1);
  color: var(--warning);
  border: 1px solid var(--warning);
}

@media (max-width: 768px) {
  .upload-actions {
    flex-direction: column;
  }
  
  .preview-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .mapping-item {
    flex-direction: column;
    text-align: center;
  }
  
  .mapping-arrow {
    transform: rotate(90deg);
  }
}
</style>