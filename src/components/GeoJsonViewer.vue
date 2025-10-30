<template>
  <el-dialog
    v-model="visible"
    title="Экспорт в GeoJSON"
    width="90%"
    :before-close="handleClose"
    class="geojson-viewer-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="geojson-viewer">
      <!-- Кнопки действий -->
      <div class="viewer-controls">
        <el-button-group>
          <el-button
            type="primary"
            size="small"
            @click="exportToFile"
            :loading="exporting"
            :disabled="!formattedJson"
          >
            <el-icon><Download /></el-icon>
            Экспорт
          </el-button>
          <el-button
            type="success"
            size="small"
            @click="copyToClipboard"
            :disabled="!formattedJson"
          >
            <el-icon><CopyDocument /></el-icon>
            Копировать
          </el-button>
        </el-button-group>
      </div>

      <!-- JSON Viewer -->
      <div class="json-display">
        <div v-if="loading" class="loading-state">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>Загрузка данных...</p>
        </div>
        <div v-else-if="!formattedJson" class="empty-state">
          <el-empty description="Нет данных для отображения" />
        </div>
        <pre v-else><code ref="jsonCode" class="json-code">{{ formattedJson }}</code></pre>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">Закрыть</el-button>
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
      geoJsonData: null
    }
  },
  computed: {
    formattedJson() {
      if (!this.geoJsonData) {
        return ''
      }

      try {
        return JSON.stringify(this.geoJsonData, null, 2)
      } catch (error) {
        console.error('Error formatting JSON:', error)
        return 'Ошибка форматирования JSON'
      }
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
      this.geoJsonData = null
    },


    // Загрузка данных текущей выборки населенных пунктов
    loadSettlementsData(settlementsData) {
      return dataExporter.exportSettlementsToGeoJSON(settlementsData)
        .then((exportResult) => {
          if (exportResult.success) {
            this.geoJsonData = exportResult.data

            // Подсвечиваем синтаксис после загрузки
            this.$nextTick(() => {
              this.highlightSyntax()
            })
          } else {
            throw new Error(exportResult.error)
          }
        })
        .catch((error) => {
          console.error('Error loading settlements data:', error)
          ElMessage.error('Ошибка загрузки данных: ' + error.message)
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

    // Экспорт данных в файл
    exportToFile() {
      this.exporting = true

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      const fileName = `geojson_export_${timestamp}.json`

      const jsonContent = JSON.stringify(this.geoJsonData, null, 2)
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
      this.exporting = false
    },

    // Копирование в буфер обмена
    copyToClipboard() {
      navigator.clipboard.writeText(this.formattedJson)
        .then(() => {
          ElMessage.success('Данные скопированы в буфер обмена')
        })
        .catch((error) => {
          console.error('Error copying to clipboard:', error)
          ElMessage.error('Ошибка копирования в буфер обмена')
        })
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
    gap: 0.5rem;
  }

  .json-display {
    flex: 1;
    overflow: auto;
    background-color: hsl(210, 36%, 96%);
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;

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

    .loading-state,
    .empty-state {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 1rem;
    }

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

</style>
