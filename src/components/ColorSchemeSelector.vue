<template>
  <div class="color-scheme-selector">
    <el-card class="color-scheme-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>Цвета типов сословий</span>
          <el-button size="small" text @click="resetToDefaults">
            Сбросить к стандартным
          </el-button>
        </div>
      </template>

      <!-- Цвета типов сословий -->
      <div class="estate-colors-grid">
        <div
          v-for="(color, estateType) in localSettings.estateTypeColors"
          :key="estateType"
          v-if="estateType !== 'default'"
          class="estate-color-item"
        >
          <span class="estate-name">{{ estateType }}</span>
          <el-color-picker
            v-model="localSettings.estateTypeColors[estateType]"
            size="small"
            show-alpha
            @change="onEstateColorChange(estateType, $event)"
          />
          <span class="color-value">{{ color }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import {
  mapSettings,
  setEstateTypeColor,
  loadEstateTypeColors,
  saveEstateTypeColor
} from '@/store/mapSettings.js'
import { ElMessage } from 'element-plus'

export default {
  name: 'ColorSchemeSelector',
  setup() {
    const localSettings = ref({ ...mapSettings })

    const onEstateColorChange = async (estateType, color) => {
      // Сохраняем цвет в базу данных
      const success = await saveEstateTypeColor(estateType, color)
      if (success) {
        setEstateTypeColor(estateType, color)
        ElMessage.success(`Цвет для "${estateType}" обновлен`)
      } else {
        ElMessage.error(`Ошибка сохранения цвета для "${estateType}"`)
      }
    }

    const resetToDefaults = async () => {
      // Загружаем актуальные цвета из базы данных
      await loadEstateTypeColors()
      // Обновляем локальные настройки после загрузки цветов
      localSettings.value = { ...mapSettings }
    }

    // Загружаем цвета при монтировании компонента
    onMounted(async () => {
      await loadEstateTypeColors()
      // Обновляем локальные настройки после загрузки цветов
      localSettings.value = { ...mapSettings }
    })

    return {
      localSettings,
      onEstateColorChange,
      resetToDefaults
    }
  }
}
</script>

<style scoped lang="scss">
.color-scheme-selector {
  .color-scheme-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
  }

  .estate-colors-grid {
    display: grid;
    gap: 12px;
  }

  .estate-color-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background-color: var(--bg-tertiary);
    border-radius: 4px;

    .estate-name {
      min-width: 120px;
      font-size: 14px;
    }

    .color-value {
      font-family: monospace;
      font-size: 12px;
      color: var(--text-secondary);
      margin-left: auto;
    }
  }
}

// Кастомные стили для цветового селектора
:deep(.el-color-picker) {
  .el-color-picker__trigger {
    border: 1px solid var(--border-color);
    width: 32px;
    height: 32px;

    &:hover {
      border-color: var(--accent-primary);
    }
  }
}
</style>
