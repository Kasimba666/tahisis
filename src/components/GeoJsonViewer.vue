<template>
  <el-dialog
    v-model="visible"
    :title="stats.currentSelection ? 'Экспорт текущей выборки в GeoJSON (для карты)' : 'Экспорт данных в GeoJSON'"
    width="90%"
    :before-close="handleClose"
    class="geojson-viewer-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="geojson-viewer">
      <!-- Панель управления -->
      <div class="viewer-controls">
        <div class="stats-info">
          <el-space>
            <el-tag type="info">Таблиц: {{ stats.totalTables }}</el-tag>
            <el-tag type="success">Записей: {{ stats.totalRecords }}</el-tag>
            <el-tag type="warning">Геотаблиц: {{ stats.geometryTables }}</el-tag>
            <el-tag v-if="stats.currentSelection" type="primary">Текущая выборка</el-tag>
          </el-space>
        </div>

        <div class="export-actions">
          <el-button-group>
            <el-button
              type="primary"
              size="small"
              @click="exportAllToFile"
              :loading="exporting"
              :disabled="Object.keys(geoJsonData).length === 0"
            >
              <el-icon><Download /></el-icon>
              Экспорт всех
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="copyToClipboard"
              :disabled="Object.keys(geoJsonData).length === 0"
            >
              <el-icon><CopyDocument /></el-icon>
              Копировать
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="showOnLeaflet"
              :disabled="Object.keys(geoJsonData).length === 0 || !currentGeoJsonData"
            >
              <el-icon><MapLocation /></el-icon>
              Показать на Leaflet
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="showOnOpenLayers"
              :disabled="Object.keys(geoJsonData).length === 0 || !currentGeoJsonData"
            >
              <el-icon><MapLocation /></el-icon>
              Показать на OpenLayers
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="refreshData"
              :loading="loading"
            >
              <el-icon><Refresh /></el-icon>
              Обновить
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- Выбор таблицы -->
      <div class="table-selector">
        <el-select
          v-model="selectedTable"
          placeholder="Выберите таблицу для просмотра"
          @change="onTableChange"
          style="width: 100%"
          size="small"
        >
          <el-option
            v-for="table in availableTables"
            :key="table.name"
            :label="`${table.name} (${table.count} записей)`"
            :value="table.name"
          />
        </el-select>
      </div>

      <!-- Отображение JSON -->
      <div class="json-container">
        <div v-if="loading" class="loading-state">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>Загрузка данных...</p>
        </div>

        <div v-else-if="Object.keys(geoJsonData).length === 0" class="empty-state">
          <el-empty description="Нет данных для отображения">
            <el-button type="primary" @click="loadData">Загрузить данные</el-button>
          </el-empty>
        </div>

        <div v-else-if="selectedTable && geoJsonData[selectedTable]" class="json-viewer">
          <!-- Метаданные -->
          <div class="table-metadata">
            <el-descriptions :column="2" size="small" border>
              <el-descriptions-item label="Таблица">
                {{ selectedTable }}
              </el-descriptions-item>
              <el-descriptions-item label="Записей">
                {{ geoJsonData[selectedTable]?.data?.metadata?.totalCount || geoJsonData[selectedTable]?.data?.features?.length || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="Экспортировано">
                {{ geoJsonData[selectedTable]?.data?.metadata?.exportedCount || geoJsonData[selectedTable]?.data?.features?.length || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="Время экспорта">
                {{ formatDate(geoJsonData[selectedTable]?.data?.metadata?.exportedAt) || formatDate(new Date()) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- JSON Viewer -->
          <div class="json-display">
            <pre><code ref="jsonCode" class="json-code">{{ formattedJson }}</code></pre>
          </div>
        </div>

        <div v-else class="no-selection-state">
          <el-empty description="Выберите таблицу для просмотра данных">
            <el-button type="primary" @click="selectedTable = availableTables[0]?.name">
              Выбрать первую таблицу
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">Закрыть</el-button>
      <el-button type="primary" @click="loadData" :loading="loading">
        Обновить данные
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { Download, CopyDocument, Refresh, Loading, MapLocation } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { dataExporter } from '@/services/dataExporter.js'

export default {
  name: 'GeoJsonViewer',
  components: {
    Download,
    CopyDocument,
    Refresh,
    Loading
  },
  data() {
    return {
      visible: false,
      loading: false,
      exporting: false,
      geoJsonData: {},
      selectedTable: null,
      stats: {
        totalTables: 0,
        totalRecords: 0,
        geometryTables: 0
      }
    }
  },
  computed: {
    availableTables() {
      return Object.keys(this.geoJsonData).map(tableName => {
        const data = this.geoJsonData[tableName]
        return {
          name: tableName,
          count: data?.data?.metadata?.totalCount || data?.data?.metadata?.exportedCount || data?.count || data?.data?.features?.length || 0
        }
      })
    },

    formattedJson() {
      if (!this.selectedTable || !this.geoJsonData[this.selectedTable]) {
        return ''
      }

      try {
        return JSON.stringify(this.geoJsonData[this.selectedTable], null, 2)
      } catch (error) {
        console.error('Error formatting JSON:', error)
        return 'Ошибка форматирования JSON'
      }
    },

    currentGeoJsonData() {
      if (!this.selectedTable || !this.geoJsonData[this.selectedTable]) {
        return null
      }
      return this.geoJsonData[this.selectedTable]
    }
  },
  methods: {
    // Открытие диалога
    open() {
      this.visible = true
      this.loadData()
    },

    // Закрытие диалога
    handleClose() {
      this.visible = false
      this.geoJsonData = {}
      this.selectedTable = null
    },

    // Загрузка данных из всех таблиц
    async loadData() {
      this.loading = true

      try {
        // console.log('Loading database statistics...')
        const stats = await dataExporter.getDatabaseStatistics()
        this.stats = stats

        // console.log('Exporting all tables to GeoJSON...')
        const exportResult = await dataExporter.exportAllTablesToGeoJSON()

        this.geoJsonData = exportResult.results

        // Выбираем первую таблицу по умолчанию
        if (this.availableTables.length > 0 && !this.selectedTable) {
          this.selectedTable = this.availableTables[0].name
        }

        // console.log('Export completed:', exportResult.summary)

        // Подсвечиваем синтаксис после загрузки
        this.$nextTick(() => {
          this.highlightSyntax()
        })

      } catch (error) {
        console.error('Error loading data:', error)
        ElMessage.error('Ошибка загрузки данных: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    // Загрузка данных текущей выборки населенных пунктов
    async loadSettlementsData(settlementsData) {
      console.log('=== LOAD SETTLEMENTS DATA START ===')

      try {
        console.log('=== GEOJSON VIEWER DEBUG ===')
        console.log('Received settlements data count:', settlementsData?.length || 0)
        console.log('Sample settlement names:', settlementsData?.slice(0, 3).map(s => s.settlement_name_old) || 'No data')

        if (!settlementsData || settlementsData.length === 0) {
          throw new Error('Нет данных для экспорта')
        }

        console.log('Exporting current settlements selection to GeoJSON...')

        const exportResult = await dataExporter.exportSettlementsToGeoJSON(settlementsData)

        if (exportResult.success) {
          console.log('=== EXPORT RESULT DEBUG ===')
          console.log('Export result count:', exportResult.count)
          console.log('Export result data features:', exportResult.data?.features?.length || 0)

          // ЗАПОМИНАЕМ текущие данные ПЕРЕД очисткой
          const currentData = this.geoJsonData
          const currentTable = this.selectedTable
          const currentStats = this.stats

          console.log('=== BEFORE CLEARING ===')
          console.log('Current geoJsonData keys:', Object.keys(currentData))
          console.log('Current selected table:', currentTable)

          // Очищаем предыдущие данные ПЕРЕД установкой новых
          this.geoJsonData = {}

          console.log('=== AFTER CLEARING ===')
          console.log('geoJsonData keys after clear:', Object.keys(this.geoJsonData))

          // Создаем объект ТОЛЬКО с отфильтрованными данными
          this.geoJsonData = {
            'Settlement': exportResult.data
          }

          this.selectedTable = 'Settlement'

          // Обновляем статистику для текущей выборки
          this.stats = {
            totalTables: 1,
            totalRecords: exportResult.count,
            geometryTables: 1,
            currentSelection: true,
            originalCount: exportResult.count
          }

          console.log('=== FINAL VIEWER STATE ===')
          console.log('geoJsonData keys:', Object.keys(this.geoJsonData))
          console.log('Settlement data features:', this.geoJsonData['Settlement']?.features?.length || 0)
          console.log('Selected table:', this.selectedTable)
          console.log('Stats totalRecords:', this.stats.totalRecords)

          console.log('Settlements export completed:', exportResult)

          // Подсвечиваем синтаксис после загрузки
          this.$nextTick(() => {
            console.log('=== HIGHLIGHT SYNTAX DEBUG ===')
            console.log('formattedJson length:', this.formattedJson?.length || 0)
            console.log('jsonCode element:', !!this.$refs.jsonCode)
            this.highlightSyntax()
          })
        } else {
          throw new Error(exportResult.error)
        }

      } catch (error) {
        console.error('Error loading settlements data:', error)
        ElMessage.error('Ошибка загрузки данных населенных пунктов: ' + error.message)
      }
    },

    // Обновление данных
    async refreshData() {
      await this.loadData()
    },

    // Обработка изменения выбранной таблицы
    onTableChange(tableName) {
      this.selectedTable = tableName
      this.$nextTick(() => {
        this.highlightSyntax()
      })
    },

    // Подсветка синтаксиса JSON
    highlightSyntax() {
      if (!this.$refs.jsonCode) return

      try {
        const jsonText = this.formattedJson
        if (!jsonText) return

        // Простая подсветка синтаксиса JSON
        const highlighted = jsonText
          .replace(/(".*?")(:)/g, '<span class="json-key">$1</span>$2')
          .replace(/(: )(".*?")/g, '$1<span class="json-string">$2</span>')
          .replace(/(: )(.*?)(,|\n|\})/g, (match, p1, p2, p3) => {
            if (p2 === 'true' || p2 === 'false' || p2 === 'null') {
              return `${p1}<span class="json-keyword">${p2}</span>${p3}`
            }
            if (!isNaN(p2)) {
              return `${p1}<span class="json-number">${p2}</span>${p3}`
            }
            return match
          })

        this.$refs.jsonCode.innerHTML = highlighted
      } catch (error) {
        console.warn('Error highlighting JSON syntax:', error)
      }
    },

    // Экспорт всех данных в файл
    async exportAllToFile() {
      this.exporting = true

      try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
        const fileName = `database_export_${timestamp}.json`

        // Создаем объект с данными всех таблиц
        const exportData = {
          metadata: {
            exportedAt: new Date().toISOString(),
            totalTables: this.stats.totalTables,
            totalRecords: this.stats.totalRecords,
            summary: this.stats
          },
          tables: this.geoJsonData
        }

        const jsonContent = JSON.stringify(exportData, null, 2)
        const blob = new Blob([jsonContent], { type: 'application/json' })

        // Создаем ссылку для скачивания
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        ElMessage.success(`Данные экспортированы в файл ${fileName}`)
      } catch (error) {
        console.error('Error exporting data:', error)
        ElMessage.error('Ошибка экспорта данных')
      } finally {
        this.exporting = false
      }
    },

    // Копирование в буфер обмена
    async copyToClipboard() {
      try {
        const jsonContent = this.formattedJson
        await navigator.clipboard.writeText(jsonContent)
        ElMessage.success('Данные скопированы в буфер обмена')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        ElMessage.error('Ошибка копирования в буфер обмена')
      }
    },

    // Показать данные на Leaflet карте
    showOnLeaflet() {
      if (this.currentGeoJsonData) {
        console.log('Showing data on Leaflet map:', this.currentGeoJsonData)
        this.$emit('show-on-map', {
          provider: 'leaflet',
          data: this.currentGeoJsonData
        })
        ElMessage.success('Данные отправлены на Leaflet карту')
      }
    },

    // Показать данные на OpenLayers карте
    showOnOpenLayers() {
      if (this.currentGeoJsonData) {
        console.log('Showing data on OpenLayers map:', this.currentGeoJsonData)
        this.$emit('show-on-map', {
          provider: 'openlayers',
          data: this.currentGeoJsonData
        })
        ElMessage.success('Данные отправлены на OpenLayers карту')
      }
    },

    // Форматирование даты
    formatDate(dateString) {
      return new Date(dateString).toLocaleString('ru-RU')
    }
  },

  mounted() {
    // Подсвечиваем синтаксис при монтировании
    this.$nextTick(() => {
      this.highlightSyntax()
    })
  }
}
</script>

<style scoped lang="scss">
.geojson-viewer-dialog {
  .el-dialog__body {
    padding: 1rem;
  }
}

.geojson-viewer {
  height: 70vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .viewer-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;

    .stats-info {
      display: flex;
      gap: 0.5rem;
    }

    .export-actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  .table-selector {
    .el-select {
      width: 100%;
    }
  }

  .json-container {
    flex: 1;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow: hidden;

    .loading-state,
    .empty-state,
    .no-selection-state {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 1rem;
    }

    .json-viewer {
      height: 100%;
      display: flex;
      flex-direction: column;

      .table-metadata {
        padding: 0.5rem;
        background-color: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);

        :deep(.el-descriptions) {
          .el-descriptions__label {
            background-color: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
          }

          .el-descriptions__content {
            background-color: var(--bg-primary) !important;
            color: var(--text-secondary) !important;
          }
        }
      }

      .json-display {
        flex: 1;
        overflow: auto;
        background-color: hsl(210, 36%, 96%);
        padding: 1rem;
        position: relative;

        // Кастомный скроллбар
        &::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        &::-webkit-scrollbar-track {
          background: hsl(210, 20%, 90%);
          border-radius: 6px;
        }

        &::-webkit-scrollbar-thumb {
          background: hsl(210, 14%, 65%);
          border-radius: 6px;
          border: 2px solid hsl(210, 20%, 90%);

          &:hover {
            background: hsl(210, 14%, 55%);
          }

          &:active {
            background: hsl(210, 14%, 45%);
          }
        }

        &::-webkit-scrollbar-corner {
          background: hsl(210, 20%, 90%);
        }

        // Для Firefox
        scrollbar-width: thin;
        scrollbar-color: hsl(210, 14%, 65%) hsl(210, 20%, 90%);

        pre {
          margin: 0;
          font-family: 'Consolas', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: hsl(210, 11%, 15%);
          background-color: hsl(0, 0%, 100%);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid hsl(210, 20%, 88%);
          box-shadow: 0 1px 3px hsla(210, 14%, 45%, 0.08);
          min-height: 100%;

          .json-code {
            display: block;
            white-space: pre-wrap;
            word-break: break-word;
          }
        }
      }
    }
  }
}

// Стили для подсветки синтаксиса JSON с улучшенными HSL цветами
:deep(.json-key) {
  color: hsl(291, 64%, 42%);
  font-weight: 600;
}

:deep(.json-string) {
  color: hsl(119, 34%, 47%);
}

:deep(.json-number) {
  color: hsl(221, 87%, 60%);
  font-weight: 500;
}

:deep(.json-keyword) {
  color: hsl(291, 64%, 42%);
  font-weight: 600;
  font-style: italic;
}

:deep(.json-bracket) {
  color: hsl(0, 0%, 40%);
  font-weight: bold;
}

:deep(.json-comma) {
  color: hsl(0, 0%, 50%);
}

@media (max-width: 768px) {
  .geojson-viewer {
    .viewer-controls {
      flex-direction: column;
      align-items: stretch;

      .stats-info {
        justify-content: center;
      }

      .export-actions {
        justify-content: center;
      }
    }
  }
}
</style>
