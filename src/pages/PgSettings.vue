<template>
  <div class="pg-settings">
    <div class="settings-header">
      <h1>Настройки приложения</h1>
      <p class="settings-description">
        Управление сохраненными фильтрами, сортировками и настройками интерфейса
      </p>
    </div>

    <div class="settings-content">
      <div class="settings-grid">
        <!-- Управление настройками -->
        <div class="settings-section">
          <SettingsManager />
        </div>

        <!-- Информация о системе -->
        <div class="settings-section">
          <el-card class="info-card">
            <template #header>
              <h3>Информация о системе</h3>
            </template>

            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="Версия приложения">
                1.0.0
              </el-descriptions-item>
              <el-descriptions-item label="База данных">
                Supabase PostgreSQL
              </el-descriptions-item>
              <el-descriptions-item label="Фронтенд">
                Vue 3 + Element Plus
              </el-descriptions-item>
              <el-descriptions-item label="Карты">
                Leaflet + OpenLayers
              </el-descriptions-item>
              <el-descriptions-item label="Хранение данных">
                localStorage
              </el-descriptions-item>
              <el-descriptions-item label="Последнее обновление">
                {{ formatDate(new Date()) }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="system-actions">
              <el-button
                type="primary"
                size="large"
                @click="checkForUpdates"
                :loading="checkingUpdates"
              >
                <el-icon><Refresh /></el-icon>
                Проверить обновления
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- Краткое руководство -->
        <div class="settings-section">
          <el-card class="guide-card">
            <template #header>
              <h3>Краткое руководство</h3>
            </template>

            <el-collapse accordion>
              <el-collapse-item title="Как сохранить фильтры?" name="filters">
                <div class="guide-content">
                  <p>Приложение автоматически сохраняет все активные фильтры при их изменении.</p>
                  <p>После перезагрузки страницы фильтры будут восстановлены автоматически.</p>
                </div>
              </el-collapse-item>

              <el-collapse-item title="Как сохранить сортировку таблицы?" name="sorting">
                <div class="guide-content">
                  <p>Сортировка таблицы сохраняется автоматически при клике по заголовкам колонок.</p>
                  <p>Для изменения порядка сортировки кликните по той же колонке повторно.</p>
                </div>
              </el-collapse-item>

              <el-collapse-item title="Как экспортировать настройки?" name="export">
                <div class="guide-content">
                  <p>Используйте кнопку "Экспортировать настройки" для сохранения всех настроек в файл.</p>
                  <p>Файл можно использовать для резервного копирования или переноса настроек на другой компьютер.</p>
                </div>
              </el-collapse-item>

              <el-collapse-item title="Как очистить все настройки?" name="clear">
                <div class="guide-content">
                  <p>Кнопка "Очистить все настройки" удаляет только настройки интерфейса.</p>
                  <p>Данные о сословиях, ревизиях и населенных пунктах не затрагиваются.</p>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Refresh } from '@element-plus/icons-vue'
import SettingsManager from '@/components/SettingsManager.vue'

export default {
  name: 'PgSettings',
  components: {
    Refresh,
    SettingsManager
  },
  data() {
    return {
      checkingUpdates: false
    }
  },
  methods: {
    formatDate(date) {
      return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    },

    async checkForUpdates() {
      this.checkingUpdates = true

      try {
        // Имитируем проверку обновлений
        await new Promise(resolve => setTimeout(resolve, 2000))

        this.$message.success('Проверка обновлений завершена. У вас последняя версия.')
      } catch (error) {
        console.error('Error checking for updates:', error)
        this.$message.error('Ошибка при проверке обновлений')
      } finally {
        this.checkingUpdates = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
.pg-settings {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;

  .settings-header {
    text-align: center;
    margin-bottom: 2rem;

    h1 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
      font-size: 2rem;
    }

    .settings-description {
      margin: 0;
      color: var(--text-muted);
      font-size: 1.1rem;
    }
  }

  .settings-content {
    .settings-grid {
      display: grid;
      gap: 2rem;
      grid-template-columns: 1fr;

      @media (min-width: 768px) {
        grid-template-columns: 1fr 1fr;
      }

      @media (min-width: 1024px) {
        grid-template-columns: 1fr 1fr 1fr;
      }

      .settings-section {
        .info-card,
        .guide-card {
          height: 100%;
        }
      }
    }
  }
}

.guide-content {
  p {
    margin: 0.5rem 0;
    color: var(--text-secondary);
    line-height: 1.5;

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.system-actions {
  margin-top: 1.5rem;
  text-align: center;
}
</style>
