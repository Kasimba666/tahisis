<template>
  <el-dropdown
    trigger="click"
    placement="bottom-start"
    :popper-class="'vector-layers-dropdown'"
  >
    <el-button size="small" class="layers-button">
      <span class="button-content">
        <i class="icon">🗺️</i>
        <span class="text">Слои</span>
        <i class="arrow">▼</i>
      </span>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <div class="layers-list">
          <div v-if="layersList.length === 0" class="empty-message">
            Нет доступных слоёв
          </div>
          <div
            v-for="layer in layersList"
            :key="layer.id"
            class="layer-item"
          >
            <el-checkbox
              v-model="layer.visible"
              @change="toggleLayer(layer)"
            >
              {{ layer.name }}
            </el-checkbox>
          </div>
        </div>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script>
export default {
  name: 'VectorLayersControl',
  props: {
    vectorLayers: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      layersState: new Map()
    }
  },
  computed: {
    layersList() {
      const layers = []
      
      // Добавляем виртуальный слой "OpenStreetMap"
      const osmVisible = this.layersState.has('osm') 
        ? this.layersState.get('osm') 
        : true // По умолчанию включена
        
      layers.push({
        id: 'osm',
        name: '🗺️ OpenStreetMap',
        visible: osmVisible
      })

      // Добавляем обычные векторные слои
      if (this.vectorLayers && this.vectorLayers.length > 0) {
        const vectorLayersList = this.vectorLayers.map(layer => {
          const visible = this.layersState.has(layer.id) 
            ? this.layersState.get(layer.id) 
            : (layer.visible !== false)

          return {
            id: layer.id,
            name: layer.name,
            visible
          }
        }).sort((a, b) => a.name.localeCompare(b.name))
        
        layers.push(...vectorLayersList)
      }

      return layers
    }
  },
  mounted() {
    // Инициализируем состояние слоёв на основе значения visible из БД
    this.vectorLayers.forEach(layer => {
      this.layersState.set(layer.id, layer.visible !== false) // По умолчанию true, если не указано
    })
  },
  methods: {
    toggleLayer(layer) {
      this.layersState.set(layer.id, layer.visible)
      this.$emit('layer-visibility-changed', {
        layerId: layer.id,
        visible: layer.visible
      })
    }
  },
  watch: {
    vectorLayers: {
      handler(newLayers) {
        newLayers.forEach(layer => {
          if (!this.layersState.has(layer.id)) {
            // Для новых слоёв используем значение visible из БД
            this.layersState.set(layer.id, layer.visible !== false)
          }
        })
      },
      deep: true
    }
  }
}
</script>

<style scoped lang="scss">
.layers-button {
  .button-content {
    display: flex;
    align-items: center;
    gap: 4px;

    .icon {
      font-size: 14px;
    }

    .text {
      font-size: 12px;
      font-weight: 500;
    }

    .arrow {
      font-size: 10px;
      margin-left: 2px;
    }
  }
}

:deep(.vector-layers-dropdown) {
  .layers-list {
    max-height: 400px;
    overflow-y: auto;
    padding: 4px 0;
    min-width: 200px;

    .empty-message {
      padding: 8px 12px;
      color: var(--text-muted);
      font-size: 12px;
      text-align: center;
    }

    .layer-item {
      padding: 6px 12px;

      .el-checkbox {
        font-weight: 400;
        font-size: 12px;
      }

      &:hover {
        background-color: hsl(220, 15%, 22%);
      }
    }
  }
}
</style>
