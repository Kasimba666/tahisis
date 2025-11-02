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
        <div class="layers-tree">
          <div v-if="layersByType.length === 0" class="empty-message">
            Нет доступных слоёв
          </div>
          <div
            v-for="typeGroup in layersByType"
            :key="typeGroup.typeId"
            class="type-group"
          >
            <div class="type-header">
              <el-checkbox
                v-model="typeGroup.allChecked"
                :indeterminate="typeGroup.indeterminate"
                @change="toggleTypeGroup(typeGroup)"
              >
                {{ typeGroup.typeName }}
              </el-checkbox>
            </div>
            <div class="layers-list">
              <div
                v-for="layer in typeGroup.layers"
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
    layersByType() {
      if (!this.vectorLayers || this.vectorLayers.length === 0) {
        return []
      }

      const grouped = new Map()

      this.vectorLayers.forEach(layer => {
        // Пропускаем слои без типа
        if (!layer.id_type_vector_layer || !layer.type_vector_layer_name) {
          return
        }

        const typeId = layer.id_type_vector_layer
        const typeName = layer.type_vector_layer_name

        if (!grouped.has(typeId)) {
          grouped.set(typeId, {
            typeId,
            typeName,
            layers: []
          })
        }

        const visible = this.layersState.has(layer.id) ? this.layersState.get(layer.id) : true

        grouped.get(typeId).layers.push({
          id: layer.id,
          name: layer.name,
          visible
        })
      })

      const result = Array.from(grouped.values()).map(typeGroup => {
        const visibleCount = typeGroup.layers.filter(l => l.visible).length
        const totalCount = typeGroup.layers.length

        return {
          ...typeGroup,
          allChecked: visibleCount === totalCount,
          indeterminate: visibleCount > 0 && visibleCount < totalCount
        }
      })

      return result.sort((a, b) => a.typeName.localeCompare(b.typeName))
    }
  },
  mounted() {
    this.vectorLayers.forEach(layer => {
      this.layersState.set(layer.id, true)
    })
  },
  methods: {
    toggleLayer(layer) {
      this.layersState.set(layer.id, layer.visible)
      this.$emit('layer-visibility-changed', {
        layerId: layer.id,
        visible: layer.visible
      })
    },

    toggleTypeGroup(typeGroup) {
      const newState = typeGroup.allChecked
      
      typeGroup.layers.forEach(layer => {
        layer.visible = newState
        this.layersState.set(layer.id, newState)
        this.$emit('layer-visibility-changed', {
          layerId: layer.id,
          visible: newState
        })
      })
    }
  },
  watch: {
    vectorLayers: {
      handler(newLayers) {
        newLayers.forEach(layer => {
          if (!this.layersState.has(layer.id)) {
            this.layersState.set(layer.id, true)
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
  .layers-tree {
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

    .type-group {
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .type-header {
        padding: 6px 12px;
        background-color: hsl(220, 15%, 18%);
        border-bottom: 1px solid hsl(220, 15%, 25%);
        
        .el-checkbox {
          font-weight: 600;
          font-size: 12px;
        }
      }

      .layers-list {
        padding: 2px 0;

        .layer-item {
          padding: 4px 12px 4px 28px;

          .el-checkbox {
            font-weight: 400;
            font-size: 11px;
          }

          &:hover {
            background-color: hsl(220, 15%, 22%);
          }
        }
      }
    }
  }
}
</style>
