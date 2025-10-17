<template>
  <div class="settings-manager">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h3>Управление настройками</h3>
          <el-tag type="info" size="small">
            {{ Object.keys(settings).length }} настроек сохранено
          </el-tag>
        </div>
      </template>

      <div class="settings-content">
        <!-- Список сохраненных настроек -->
        <div class="settings-list">
          <div class="settings-section">
            <h4>Сохраненные настройки:</h4>
            <div class="settings-items">
              <el-tag
                v-for="(value, key) in settings"
                :key="key"
                size="small"
                class="setting-item"
              >
                {{ getSettingLabel(key) }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- Действия с настройками -->
        <div class="settings-actions">
          <el-divider content-position="left">
            <h4>Экспорт/Импорт</h4>
          </el-divider>

          <div class="action-buttons">
            <el-button
              type="primary"
              size="large"
              @click="exportSettings"
              :loading="exporting"
            >
              <el-icon><Download /></el-icon>
              Экспортировать настройки
            </el-button>

            <el-upload
              ref="upload"
              class="upload-settings"
              :auto-upload="false"
              :on-change="handleFileChange"
              :file-list="fileList"
              accept=".json"
            >
              <el-button size="large" type="success" :loading="importing">
                <el-icon><Upload /></el-icon>
                Импортировать настройки
              </el-button>
            </el-upload>
          </div>

          <el-alert
            v-if="importStatus"
            :title="importStatus.title"
            :type="importStatus.type"
            :description="importStatus.description"
            show-icon
            :closable="false"
            class="import-alert"
          />

          <el-divider content-position="left">
            <h4>Очистка данных</h4>
          </el-divider>

          <div class="danger-zone">
            <el-popconfirm
              confirm-button-text="Да, очистить"
              cancel-button-text="Отмена"
              :icon="InfoFilled"
              icon-color="#f56c6c"
              title="Вы уверены? Это действие нельзя отменить!"
              @confirm="clearAllSettings"
            >
              <template #reference>
                <el-button
                  type="danger"
                  size="large"
                  :loading="clearing"
                >
                  <el-icon><Delete /></el-icon>
                  Очистить все настройки
                </el-button>
              </template>
            </el-popconfirm>

            <p class="danger-description">
              Это действие удалит все сохраненные фильтры, сортировки и настройки приложения.
              Данные о сословиях и ревизиях не будут затронуты.
            </p>
          </div>
        </div>

        <!-- Статистика -->
        <div class="settings-stats">
          <el-divider content-position="left">
            <h4>Статистика</h4>
          </el-divider>

          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="Фильтры поселений">
              {{ settings[storageKeys.ESTATES_FILTERS] ? 'Сохранены' : 'Не сохранены' }}
            </el-descriptions-item>
            <el-descriptions-item label="Сортировка таблицы">
              {{ settings[storageKeys.ESTATES_SORTING] ? 'Сохранена' : 'Не сохранена' }}
            </el-descriptions-item>
            <el-descriptions-item label="Активная ревизия">
              {{ settings[storageKeys.ACTIVE_REVISION] ? 'Выбрана' : 'Не выбрана' }}
            </el-descriptions-item>
            <el-descriptions-item label="Активный тип сословия">
              {{ settings[storageKeys.ACTIVE_ESTATE_TYPE] ? 'Выбран' : 'Не выбран' }}
            </el-descriptions-item>
            <el-descriptions-item label="Настройки карты">
              {{ settings[storageKeys.MAP_SETTINGS] ? 'Сохранены' : 'Не сохранены' }}
            </el-descriptions-item>
            <el-descriptions-item label="Настройки таблицы">
              {{ settings[storageKeys.TABLE_SETTINGS] ? 'Сохранены' : 'Не сохранены' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>

    <!-- Диалог экспорта -->
    <el-dialog
      v-model="exportDialogVisible"
      title="Экспорт настроек"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="export-content">
        <el-alert
          title="Настройки готовы к экспорту"
          type="success"
          :closable="false"
          show-icon
          style="margin-bottom: 1rem;"
        />

        <div class="export-data">
          <pre>{{ exportData }}</pre>
        </div>
      </div>

      <template #footer>
        <el-button @click="exportDialogVisible = false">Закрыть</el-button>
        <el-button type="primary" @click="copyToClipboard">
          <el-icon><CopyDocument /></el-icon>
          Копировать в буфер
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  Download,
  Upload,
  Delete,
  InfoFilled,
  CopyDocument
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { storageService } from '@/services/storage.js'

export default {
  name: 'SettingsManager',
  components: {
    Download,
    Upload,
    Delete,
    InfoFilled,
    CopyDocument
  },
  data() {
    return {
      settings: {},
      exporting: false,
      importing: false,
      clearing: false,
      exportDialogVisible: false,
      exportData: '',
      importStatus: null,
      fileList: [],
      storageKeys: {
        ESTATES_FILTERS: 'tahisis_estates_filters',
        ESTATES_SORTING: 'tahisis_estates_sorting',
        ACTIVE_REVISION: 'tahisis_active_revision',
        ACTIVE_ESTATE_TYPE: 'tahisis_active_estate_type',
        MAP_SETTINGS: 'tahisis_map_settings',
        TABLE_SETTINGS: 'tahisis_table_settings'
      }
    }
  },
  mounted() {
    this.loadSettings()
  },
  methods: {
    loadSettings() {
      this.settings = storageService.exportSettings()
    },

    getSettingLabel(key) {
      const labels = {
        [this.storageKeys.ESTATES_FILTERS]: 'Фильтры поселений',
        [this.storageKeys.ESTATES_SORTING]: 'Сортировка таблицы',
        [this.storageKeys.ACTIVE_REVISION]: 'Активная ревизия',
        [this.storageKeys.ACTIVE_ESTATE_TYPE]: 'Активный тип сословия',
        [this.storageKeys.MAP_SETTINGS]: 'Настройки карты',
        [this.storageKeys.TABLE_SETTINGS]: 'Настройки таблицы'
      }
      return labels[key] || key
    },

    async exportSettings() {
      this.exporting = true

      try {
        const settings = storageService.exportSettings()

        if (Object.keys(settings).length === 0) {
          ElMessage.warning('Нет сохраненных настроек для экспорта')
          return
        }

        const exportData = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          settings: settings
        }

        this.exportData = JSON.stringify(exportData, null, 2)
        this.exportDialogVisible = true

        ElMessage.success('Настройки подготовлены для экспорта')
      } catch (error) {
        console.error('Error exporting settings:', error)
        ElMessage.error('Ошибка при экспорте настроек')
      } finally {
        this.exporting = false
      }
    },

    handleFileChange(file) {
      this.importSettings(file.raw)
    },

    async importSettings(file) {
      this.importing = true
      this.importStatus = null

      try {
        const text = await file.text()
        const importData = JSON.parse(text)

        // Проверяем формат файла
        if (!importData.settings) {
          throw new Error('Неверный формат файла настроек')
        }

        const success = storageService.importSettings(importData.settings)

        if (success) {
          this.importStatus = {
            type: 'success',
            title: 'Настройки успешно импортированы',
            description: `Импортировано ${Object.keys(importData.settings).length} настроек`
          }

          this.loadSettings() // Перезагружаем настройки
          ElMessage.success('Настройки успешно импортированы')

          // Очищаем список файлов
          this.fileList = []
        } else {
          throw new Error('Ошибка при импорте настроек')
        }
      } catch (error) {
        console.error('Error importing settings:', error)
        this.importStatus = {
          type: 'error',
          title: 'Ошибка импорта',
          description: error.message
        }
        ElMessage.error('Ошибка при импорте настроек: ' + error.message)
      } finally {
        this.importing = false
      }
    },

    async clearAllSettings() {
      this.clearing = true

      try {
        const success = storageService.clear()

        if (success) {
          this.settings = {}
          ElMessage.success('Все настройки очищены')
        } else {
          throw new Error('Ошибка при очистке настроек')
        }
      } catch (error) {
        console.error('Error clearing settings:', error)
        ElMessage.error('Ошибка при очистке настроек')
      } finally {
        this.clearing = false
      }
    },

    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.exportData)
        ElMessage.success('Данные скопированы в буфер обмена')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        ElMessage.error('Ошибка при копировании в буфер обмена')
      }
    }
  }
}
</script>

<style scoped lang="scss">
.settings-manager {
  .settings-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .settings-content {
    .settings-list {
      margin-bottom: 2rem;

      .settings-section {
        h4 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
          font-size: 1rem;
        }

        .settings-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;

          .setting-item {
            background-color: var(--accent-primary);
            color: white;
            border: none;
          }
        }
      }
    }

    .settings-actions {
      .action-buttons {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;

        .upload-settings {
          :deep(.el-upload) {
            width: 100%;
          }
        }
      }

      .import-alert {
        margin-bottom: 1rem;
      }

      .danger-zone {
        .danger-description {
          margin: 0.5rem 0 0 0;
          color: var(--text-muted);
          font-size: 0.875rem;
          line-height: 1.4;
        }
      }
    }

    .settings-stats {
      margin-top: 2rem;

      :deep(.el-descriptions) {
        .el-descriptions__label {
          background-color: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
          font-weight: 500;
        }

        .el-descriptions__content {
          background-color: var(--bg-primary) !important;
          color: var(--text-secondary) !important;
        }
      }
    }
  }

  .export-content {
    .export-data {
      background-color: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 1rem;
      max-height: 400px;
      overflow-y: auto;

      pre {
        margin: 0;
        color: var(--text-primary);
        font-size: 0.875rem;
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }
}

@media (max-width: 768px) {
  .settings-manager {
    .settings-content {
      .settings-actions {
        .action-buttons {
          flex-direction: column;
        }
      }
    }
  }
}
</style>
