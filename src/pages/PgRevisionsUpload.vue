<template>
  <main class="PgRevisionsUpload">
    <div class="page-header">
      <h1>Загрузка ревизий</h1>
      <p>Импорт данных ревизий из Excel файлов с расширенными возможностями фильтрации</p>
    </div>

    <div class="demo-section">
      <div class="demo-card table-demo">
        <div class="excel-upload-section">
          <h3>Загрузка Excel файла</h3>
          <div class="upload-controls">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :show-file-list="true"
              :on-change="handleFileChange"
              :before-remove="handleFileRemove"
              accept=".xlsx,.xls"
              drag
              class="excel-uploader"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                Перетащите Excel файл сюда или <em>нажмите для выбора</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  Поддерживаются файлы .xlsx и .xls размером до 10MB
                </div>
              </template>
            </el-upload>

            <div class="upload-actions" v-if="uploadedFile">
              <el-button type="primary" @click="parseExcelFile" :loading="isParsingFile">
                <el-icon><DocumentAdd /></el-icon>
                Загрузить данные в таблицу
              </el-button>
              <el-button @click="previewExcelFile" :loading="isParsingFile" v-if="!showPreview">
                <el-icon><View /></el-icon>
                Предварительный просмотр
              </el-button>
              <el-button @click="downloadSampleFile" type="success">
                <el-icon><Download /></el-icon>
                Скачать пример файла
              </el-button>
              <el-button @click="clearUploadedData" type="warning" v-if="tableData.length > 0">
                <el-icon><RefreshLeft /></el-icon>
                Очистить данные
              </el-button>
            </div>
          </div>

          <div v-if="excelFileInfo" class="file-info">
            <el-alert
              :title="`Файл: ${excelFileInfo.name}`"
              type="info"
              :description="`Размер: ${formatFileSize(excelFileInfo.size)} | Листов: ${excelFileInfo.sheets} | Строк: ${excelFileInfo.rows}`"
              show-icon
              :closable="false"
            />
          </div>
        </div>

        <div v-if="showPreview && excelPreviewData.length > 0" class="excel-preview-section">
          <div class="preview-header">
            <h3>
              <el-icon><View /></el-icon>
              Предварительный просмотр Excel файла
            </h3>
            <div class="preview-actions">
              <el-button @click="hidePreview" size="small">
                <el-icon><Close /></el-icon>
              </el-button>
              <el-button type="primary" @click="parseExcelFile" size="small">
                <el-icon><Check /></el-icon>
                Импортировать данные
              </el-button>
            </div>
          </div>

          <div class="preview-info">
            <el-alert
              title="Предварительный просмотр данных из Excel файла"
              :description="`Найдено ${excelPreviewData.length - 1} строк данных (исключая заголовки). Проверьте корректность данных перед импортом.`"
              type="info"
              show-icon
              :closable="false"
            />
          </div>

          <div class="preview-table-container">
            <el-table
              :data="excelPreviewData.slice(1, 21)"
              class="excel-preview-table"
              stripe
              border
              height="400"
              :header-cell-style="{ backgroundColor: 'var(--accent-primary)', color: 'white' }"
            >
              <el-table-column
                v-for="(header, index) in excelPreviewData[0]"
                :key="index"
                :prop="`col${index}`"
                :label="header || `Колонка ${index + 1}`"
                :width="getColumnWidth(header)"
                show-overflow-tooltip
              >
                <template #default="scope">
                  <div class="preview-cell" :class="getCellClass(header, scope.row[`col${index}`])">
                    {{ formatPreviewCell(header, scope.row[`col${index}`]) }}
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div v-if="excelPreviewData.length > 21" class="preview-pagination-info">
              <el-alert
                :title="`Показаны первые 20 строк из ${excelPreviewData.length - 1} доступных`"
                type="warning"
                :closable="false"
              />
            </div>
          </div>

          <div class="column-mapping-section">
            <h4>Автоматическое сопоставление колонок:</h4>
            <div class="mapping-grid">
              <div v-for="(header, index) in excelPreviewData[0]" :key="index" class="mapping-item">
                <div class="excel-column">
                  <strong>{{ header || `Колонка ${index + 1}` }}</strong>
                </div>
                <el-icon class="mapping-arrow"><Right /></el-icon>
                <div class="target-field" :class="getTargetFieldClass(header)">
                  {{ getTargetField(header) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="table-filters">
          <div class="filter-row">
            <div class="filter-item">
              <label>Поиск по имени:</label>
              <el-input
                v-model="tableFilters.name"
                placeholder="Введите имя"
                clearable
                @input="filterTable"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>

            <div class="filter-item">
              <label>Отдел:</label>
              <el-select
                v-model="tableFilters.department"
                placeholder="Выберите отдел"
                clearable
                @change="filterTable"
              >
                <el-option label="Все отделы" value="" />
                <el-option label="IT" value="IT" />
                <el-option label="Дизайн" value="Дизайн" />
                <el-option label="Управление" value="Управление" />
                <el-option label="Аналитика" value="Аналитика" />
                <el-option label="Маркетинг" value="Маркетинг" />
                <el-option label="Продажи" value="Продажи" />
                <el-option label="HR" value="HR" />
              </el-select>
            </div>

            <div class="filter-item">
              <label>Статус:</label>
              <el-select
                v-model="tableFilters.status"
                placeholder="Выберите статус"
                clearable
                @change="filterTable"
              >
                <el-option label="Все статусы" value="" />
                <el-option label="Активен" value="Активен" />
                <el-option label="Неактивен" value="Неактивен" />
                <el-option label="В отпуске" value="В отпуске" />
              </el-select>
            </div>
          </div>
        </div>

        <div v-if="tableData.length === 0" class="empty-table-message">
          <el-empty description="Нет данных для отображения">
            <template #image>
              <el-icon size="60" color="var(--text-muted)">
                <DocumentAdd />
              </el-icon>
            </template>
            <template #description>
              <p>Загрузите Excel файл для отображения данных в таблице</p>
            </template>
            <el-button type="primary" @click="downloadSampleFile">
              <el-icon><Download /></el-icon>
              Скачать пример файла
            </el-button>
          </el-empty>
        </div>

        <el-table
          v-else
          :data="paginatedData"
          class="advanced-table"
          stripe
          border
          height="500"
          :header-cell-style="{ backgroundColor: 'var(--accent-primary)', color: 'white' }"
        >
          <el-table-column prop="id" label="ID" width="60" sortable />
          <el-table-column prop="name" label="Имя" width="160" sortable show-overflow-tooltip>
            <template #default="scope">
              <strong>{{ scope.row.name }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="position" label="Должность" width="180" sortable show-overflow-tooltip />
          <el-table-column prop="department" label="Отдел" width="120" sortable>
            <template #default="scope">
              <el-tag size="small" :type="getDepartmentType(scope.row.department)">
                {{ scope.row.department }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="experience" label="Опыт" width="80" sortable>
            <template #default="scope">
              {{ scope.row.experience }} лет
            </template>
          </el-table-column>
          <el-table-column prop="salary" label="Зарплата" width="140" sortable>
            <template #default="scope">
              <span class="salary-text">{{ formatSalary(scope.row.salary) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="skills" label="Навыки" width="200" show-overflow-tooltip>
            <template #default="scope">
              <div class="skills-container">
                <el-tag
                  v-for="skill in (scope.row.skills || []).slice(0, 2)"
                  :key="skill"
                  size="small"
                  type="info"
                  style="margin-right: 4px; margin-bottom: 2px;"
                >
                  {{ skill }}
                </el-tag>
                <span v-if="(scope.row.skills || []).length > 2" class="text-muted">
                  +{{ (scope.row.skills || []).length - 2 }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="Статус" width="100" sortable>
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastLogin" label="Последний вход" width="140" sortable>
            <template #default="scope">
              <span class="date-text">{{ formatDate(scope.row.lastLogin) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Действия" width="120" fixed="right">
            <template #default="scope">
              <el-button size="small" type="primary" @click="viewEmployee(scope.row)">
                <el-icon><View /></el-icon>
              </el-button>
              <el-button size="small" type="danger" @click="deleteEmployee(scope.row.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-pagination">
          <el-pagination
            v-if="tableData.length > 0"
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredData.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>

        <div class="table-stats">
          <div v-if="tableData.length === 0" class="no-stats">
            <el-alert
              title="Статистика недоступна"
              description="Загрузите данные из Excel файла для просмотра статистики"
              type="info"
              :closable="false"
              show-icon
            />
          </div>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-number">{{ filteredData.length }}</div>
                <div class="stat-label">Всего сотрудников</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-number">{{ getActiveEmployees() }}</div>
                <div class="stat-label">Активных</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-number">{{ getAverageSalary() }}</div>
                <div class="stat-label">Средняя зарплата</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-number">{{ getDepartmentCount() }}</div>
                <div class="stat-label">Отделов</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { ref, computed } from 'vue'
import { Search, UploadFilled, DocumentAdd, View, Download, RefreshLeft, Close, Check, Right, Delete } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'

export default {
  name: 'RevisionsUpload',
  components: {
    Search,
    UploadFilled,
    DocumentAdd,
    View,
    Download,
    RefreshLeft,
    Close,
    Check,
    Right,
    Delete
  },
  setup() {
    const tableFilters = ref({
      name: '',
      department: '',
      status: ''
    })

    const tableData = ref([])
    const uploadedFile = ref(null)
    const isParsingFile = ref(false)
    const showPreview = ref(false)
    const excelPreviewData = ref([])
    const excelFileInfo = ref(null)
    const filteredData = ref([])
    const currentPage = ref(1)
    const pageSize = ref(20)

    const paginatedData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredData.value.filter(item => item != null).slice(start, end)
    })

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

    const filterTable = () => {
      let filtered = [...tableData.value]

      if (tableFilters.value.name) {
        filtered = filtered.filter(item =>
          item.name && item.name.toLowerCase().includes(tableFilters.value.name.toLowerCase())
        )
      }

      if (tableFilters.value.department) {
        filtered = filtered.filter(item => item.department === tableFilters.value.department)
      }

      if (tableFilters.value.status) {
        filtered = filtered.filter(item => item.status === tableFilters.value.status)
      }

      filteredData.value = filtered
    }

    const handleFileChange = (file) => {
      uploadedFile.value = file
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })

            excelFileInfo.value = {
              name: file.name,
              size: file.size,
              sheets: workbook.SheetNames.length,
              rows: 0
            }

            workbook.SheetNames.forEach(sheetName => {
              const worksheet = workbook.Sheets[sheetName]
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
              excelFileInfo.value.rows += jsonData.length
            })

          } catch (error) {
            ElMessage.error('Ошибка при чтении файла: ' + error.message)
          }
        }
        reader.readAsArrayBuffer(file.raw)
      }
    }

    const handleFileRemove = () => {
      uploadedFile.value = null
      showPreview.value = false
      excelFileInfo.value = null
      excelPreviewData.value = []
    }

    const parseExcelFile = () => {
      if (!uploadedFile.value) {
        ElMessage.warning('Пожалуйста, выберите файл для загрузки')
        return
      }

      isParsingFile.value = true

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          if (jsonData.length < 2) {
            ElMessage.error('Файл должен содержать как минимум заголовки и одну строку данных')
            return
          }

          const headers = jsonData[0]
          const rows = jsonData.slice(1)

          const newTableData = rows.map((row, index) => {
            const item = { id: index + 1 }

            headers.forEach((header, colIndex) => {
              const value = row[colIndex] || ''

              if (header && typeof header === 'string') {
                const lowerHeader = header.toLowerCase()
                if (lowerHeader.includes('имя') || lowerHeader.includes('name')) {
                  item.name = value
                } else if (lowerHeader.includes('должность') || lowerHeader.includes('position')) {
                  item.position = value
                } else if (lowerHeader.includes('отдел') || lowerHeader.includes('department')) {
                  item.department = value
                } else if (lowerHeader.includes('опыт') || lowerHeader.includes('experience')) {
                  item.experience = parseInt(value) || 0
                } else if (lowerHeader.includes('зарплата') || lowerHeader.includes('salary')) {
                  item.salary = parseInt(value) || 0
                } else if (lowerHeader.includes('статус') || lowerHeader.includes('status')) {
                  item.status = value
                } else if (lowerHeader.includes('вход') || lowerHeader.includes('login')) {
                  item.lastLogin = value
                } else if (lowerHeader.includes('навык') || lowerHeader.includes('skill')) {
                  item.skills = value ? value.split(',').map(s => s.trim()) : []
                } else {
                  item[header] = value
                }
              }
            })

            if (!item.name) item.name = `Сотрудник ${index + 1}`
            if (!item.position) item.position = 'Не указано'
            if (!item.department) item.department = 'Не указано'
            if (!item.experience) item.experience = 0
            if (!item.salary) item.salary = 0
            if (!item.status) item.status = 'Активен'
            if (!item.lastLogin) item.lastLogin = new Date().toISOString().split('T')[0]
            if (!item.skills) item.skills = []

            return item
          }).filter(item => item.name && item.name !== '')

          tableData.value = newTableData
          filteredData.value = [...newTableData]
          showPreview.value = false

          ElMessage.success(`Успешно загружено ${newTableData.length} записей из Excel файла`)

        } catch (error) {
          ElMessage.error('Ошибка при обработке файла: ' + error.message)
        } finally {
          isParsingFile.value = false
        }
      }

      reader.readAsArrayBuffer(uploadedFile.value.raw)
    }

    const previewExcelFile = () => {
      if (!uploadedFile.value) {
        ElMessage.warning('Пожалуйста, выберите файл для предварительного просмотра')
        return
      }

      isParsingFile.value = true

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          const previewData = jsonData.map(row => {
            const rowData = {}
            row.forEach((cell, index) => {
              rowData[`col${index}`] = cell
            })
            return rowData
          })

          excelPreviewData.value = jsonData
          showPreview.value = true

        } catch (error) {
          ElMessage.error('Ошибка при предварительном просмотре: ' + error.message)
        } finally {
          isParsingFile.value = false
        }
      }

      reader.readAsArrayBuffer(uploadedFile.value.raw)
    }

    const hidePreview = () => {
      showPreview.value = false
    }

    const downloadSampleFile = () => {
      const sampleData = [
        ['Имя', 'Должность', 'Отдел', 'Опыт', 'Зарплата', 'Навыки', 'Статус', 'Последний вход'],
        ['Иван Петров', 'Frontend Developer', 'IT', 3, 120000, 'Vue.js, JavaScript, CSS', 'Активен', '2024-01-15'],
        ['Мария Сидорова', 'UI/UX Designer', 'Дизайн', 5, 110000, 'Figma, Photoshop, Sketch', 'Активен', '2024-01-14'],
        ['Алексей Иванов', 'Backend Developer', 'IT', 4, 130000, 'Node.js, Python, MongoDB', 'Активен', '2024-01-13'],
        ['Елена Козлова', 'Project Manager', 'Управление', 6, 140000, 'Agile, Scrum, Jira', 'В отпуске', '2024-01-10']
      ]

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(sampleData)
      XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники')
      XLSX.writeFile(wb, 'sample_employees.xlsx')

      ElMessage.success('Образец файла скачан')
    }

    const clearUploadedData = () => {
      tableData.value = []
      filteredData.value = []
      uploadedFile.value = null
      showPreview.value = false
      excelFileInfo.value = null
      excelPreviewData.value = []

      tableFilters.value = {
        name: '',
        department: '',
        status: ''
      }

      ElMessage.success('Все данные очищены')
    }

    const formatFileSize = (size) => {
      return (size / 1024 / 1024).toFixed(2) + ' MB'
    }

    const getColumnWidth = (header) => {
      if (!header) return 120

      const headerStr = header.toString().toLowerCase()
      if (headerStr.includes('имя') || headerStr.includes('name')) return 160
      if (headerStr.includes('должность') || headerStr.includes('position')) return 180
      if (headerStr.includes('отдел') || headerStr.includes('department')) return 120
      if (headerStr.includes('навык') || headerStr.includes('skill')) return 200
      if (headerStr.includes('зарплата') || headerStr.includes('salary')) return 140

      return 150
    }

    const getCellClass = (header, value) => {
      if (!value) return 'empty-cell'

      const headerStr = header ? header.toString().toLowerCase() : ''
      if (headerStr.includes('статус') || headerStr.includes('status')) {
        return `status-${value.toLowerCase().replace(/\s+/g, '-')}`
      }
      if (headerStr.includes('зарплата') || headerStr.includes('salary')) {
        return 'salary-cell'
      }

      return 'data-cell'
    }

    const formatPreviewCell = (header, value) => {
      if (!value) return ''

      const headerStr = header ? header.toString().toLowerCase() : ''
      if (headerStr.includes('зарплата') || headerStr.includes('salary')) {
        const numValue = parseInt(value)
        if (!isNaN(numValue)) {
          return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
          }).format(numValue)
        }
      }

      return value.toString()
    }

    const getTargetField = (header) => {
      if (!header) return 'Не определено'

      const lowerHeader = header.toString().toLowerCase()
      if (lowerHeader.includes('имя') || lowerHeader.includes('name')) return 'Имя сотрудника'
      if (lowerHeader.includes('должность') || lowerHeader.includes('position')) return 'Должность'
      if (lowerHeader.includes('отдел') || lowerHeader.includes('department')) return 'Отдел'
      if (lowerHeader.includes('опыт') || lowerHeader.includes('experience')) return 'Опыт работы'
      if (lowerHeader.includes('зарплата') || lowerHeader.includes('salary')) return 'Зарплата'
      if (lowerHeader.includes('навык') || lowerHeader.includes('skill')) return 'Навыки'
      if (lowerHeader.includes('статус') || lowerHeader.includes('status')) return 'Статус'
      if (lowerHeader.includes('вход') || lowerHeader.includes('login')) return 'Последний вход'

      return 'Дополнительное поле'
    }

    const getTargetFieldClass = (header) => {
      if (!header) return 'unmapped'

      const lowerHeader = header.toString().toLowerCase()
      const knownFields = ['имя', 'name', 'должность', 'position', 'отдел', 'department',
                          'опыт', 'experience', 'зарплата', 'salary', 'навык', 'skill',
                          'статус', 'status', 'вход', 'login']

      const isKnown = knownFields.some(field => lowerHeader.includes(field))
      return isKnown ? 'mapped' : 'unmapped'
    }

    const getDepartmentType = (department) => {
      switch (department) {
        case 'IT': return 'primary'
        case 'Дизайн': return 'success'
        case 'Управление': return 'warning'
        case 'Аналитика': return 'info'
        case 'Маркетинг': return 'danger'
        default: return ''
      }
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString('ru-RU')
    }

    const viewEmployee = (employee) => {
      ElMessage.info(`Просмотр сотрудника: ${employee.name}`)
    }

    const deleteEmployee = (id) => {
      const index = tableData.value.findIndex(item => item.id === id)
      if (index > -1) {
        tableData.value.splice(index, 1)
        filterTable()
        ElMessage.success('Сотрудник удален')
      }
    }

    const handleSizeChange = (newSize) => {
      pageSize.value = newSize
      currentPage.value = 1
    }

    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage
    }

    const getActiveEmployees = () => {
      return filteredData.value.filter(emp => emp.status === 'Активен').length
    }

    const getAverageSalary = () => {
      if (filteredData.value.length === 0) return '0 ₽'
      const total = filteredData.value.reduce((sum, emp) => sum + (emp.salary || 0), 0)
      const average = total / filteredData.value.length
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
      }).format(average)
    }

    const getDepartmentCount = () => {
      const departments = new Set(filteredData.value.map(emp => emp.department))
      return departments.size
    }

    return {
      tableFilters,
      tableData,
      uploadedFile,
      isParsingFile,
      showPreview,
      excelPreviewData,
      excelFileInfo,
      paginatedData,
      filteredData,
      currentPage,
      pageSize,
      formatSalary,
      getStatusType,
      filterTable,
      handleFileChange,
      handleFileRemove,
      parseExcelFile,
      previewExcelFile,
      hidePreview,
      downloadSampleFile,
      clearUploadedData,
      formatFileSize,
      getColumnWidth,
      getCellClass,
      formatPreviewCell,
      getTargetField,
      getTargetFieldClass,
      getDepartmentType,
      formatDate,
      viewEmployee,
      deleteEmployee,
      handleSizeChange,
      handleCurrentChange,
      getActiveEmployees,
      getAverageSalary,
      getDepartmentCount
    }
  }
}
</script>

<style scoped>
.PgRevisionsUpload {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.demo-section {
  margin-bottom: 40px;
}

.demo-card {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.table-demo {
  width: 100%;
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
  margin-bottom: 20px;
}

.text-muted {
  color: #999;
  font-size: 12px;
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
