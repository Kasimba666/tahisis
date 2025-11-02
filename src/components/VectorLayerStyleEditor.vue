<template>
  <el-dialog
    v-model="visible"
    title="Редактор стилей слоя"
    width="600px"
    @close="handleClose"
  >
    <div class="style-editor">
      <div v-if="loading" class="loading">
        <el-icon class="is-loading"><loading /></el-icon>
        <span>Анализ GeoJSON...</span>
      </div>

      <div v-else-if="error" class="error">
        <el-alert type="error" :closable="false">
          {{ error }}
        </el-alert>
      </div>

      <div v-else class="style-form">
        <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
          <template #title>
            Тип геометрии: <strong>{{ geometryType }}</strong>
          </template>
          Найдено объектов: {{ featureCount }}
        </el-alert>

        <div class="style-content">
          <!-- Превью -->
          <div class="style-preview">
            <h4>Предпросмотр</h4>
            <div class="preview-container">
              <svg v-if="isPointGeometry" width="100" height="100" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  :r="styleConfig.radius * 2"
                  :fill="styleConfig.fillColor"
                  :stroke="styleConfig.strokeColor"
                  :stroke-width="styleConfig.strokeWidth"
                />
              </svg>
              
              <svg v-else-if="isLineGeometry" width="100" height="100" viewBox="0 0 100 100">
                <path
                  d="M 10 80 Q 40 20, 50 50 T 90 20"
                  fill="none"
                  :stroke="styleConfig.strokeColor"
                  :stroke-width="styleConfig.strokeWidth * 2"
                  :opacity="styleConfig.opacity"
                  stroke-linecap="round"
                />
              </svg>
              
              <svg v-else-if="isPolygonGeometry" width="100" height="100" viewBox="0 0 100 100">
                <polygon
                  points="50,10 90,30 80,70 20,70 10,30"
                  :fill="hexToRgba(styleConfig.fillColor, styleConfig.fillOpacity)"
                  :stroke="styleConfig.strokeColor"
                  :stroke-width="styleConfig.strokeWidth"
                  :opacity="styleConfig.opacity"
                />
              </svg>
            </div>
          </div>

          <!-- Общие настройки -->
          <el-form label-position="left" label-width="140px" class="style-settings">
          <!-- Для Point -->
          <template v-if="isPointGeometry">
            <el-form-item label="Цвет маркера">
              <el-color-picker v-model="styleConfig.fillColor" show-alpha />
            </el-form-item>
            <el-form-item label="Радиус">
              <el-slider v-model="styleConfig.radius" :min="2" :max="30" />
            </el-form-item>
            <el-form-item label="Цвет обводки">
              <el-color-picker v-model="styleConfig.strokeColor" show-alpha />
            </el-form-item>
            <el-form-item label="Толщина обводки">
              <el-slider v-model="styleConfig.strokeWidth" :min="0" :max="10" />
            </el-form-item>
          </template>

          <!-- Для LineString -->
          <template v-if="isLineGeometry">
            <el-form-item label="Цвет линии">
              <el-color-picker v-model="styleConfig.strokeColor" show-alpha />
            </el-form-item>
            <el-form-item label="Толщина линии">
              <el-slider v-model="styleConfig.strokeWidth" :min="1" :max="10" />
            </el-form-item>
            <el-form-item label="Прозрачность">
              <el-slider v-model="styleConfig.opacity" :min="0" :max="1" :step="0.1" />
            </el-form-item>
          </template>

          <!-- Для Polygon -->
          <template v-if="isPolygonGeometry">
            <el-form-item label="Цвет заливки">
              <el-color-picker v-model="styleConfig.fillColor" show-alpha />
            </el-form-item>
            <el-form-item label="Прозрачность заливки">
              <el-slider v-model="styleConfig.fillOpacity" :min="0" :max="1" :step="0.1" />
            </el-form-item>
            <el-form-item label="Цвет обводки">
              <el-color-picker v-model="styleConfig.strokeColor" show-alpha />
            </el-form-item>
            <el-form-item label="Толщина обводки">
              <el-slider v-model="styleConfig.strokeWidth" :min="0" :max="10" />
            </el-form-item>
            <el-form-item label="Прозрачность обводки">
              <el-slider v-model="styleConfig.opacity" :min="0" :max="1" :step="0.1" />
            </el-form-item>
          </template>
        </el-form>
        </div>

        <!-- Предпросмотр JSON -->
        <el-divider>Результирующий JSON стиля</el-divider>
        <pre class="json-preview">{{ JSON.stringify(styleJSON, null, 2) }}</pre>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">Отмена</el-button>
      <el-button type="primary" @click="handleSave" :disabled="loading || !!error">
        Сохранить
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'VectorLayerStyleEditor',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    layer: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'save'],
  data() {
    return {
      loading: false,
      error: null,
      geometryType: null,
      featureCount: 0,
      styleConfig: {
        // Point
        radius: 8,
        fillColor: '#3388ff',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        // LineString
        opacity: 0.7,
        // Polygon
        fillOpacity: 0.3
      }
    }
  },
  computed: {
    visible: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    isPointGeometry() {
      return this.geometryType === 'Point' || this.geometryType === 'MultiPoint'
    },
    isLineGeometry() {
      return this.geometryType === 'LineString' || this.geometryType === 'MultiLineString'
    },
    isPolygonGeometry() {
      return this.geometryType === 'Polygon' || this.geometryType === 'MultiPolygon'
    },
    styleJSON() {
      const style = {
        geometryType: this.geometryType
      }

      if (this.isPointGeometry) {
        style.point = {
          radius: this.styleConfig.radius,
          fillColor: this.styleConfig.fillColor,
          strokeColor: this.styleConfig.strokeColor,
          strokeWidth: this.styleConfig.strokeWidth
        }
      }

      if (this.isLineGeometry) {
        style.line = {
          strokeColor: this.styleConfig.strokeColor,
          strokeWidth: this.styleConfig.strokeWidth,
          opacity: this.styleConfig.opacity
        }
      }

      if (this.isPolygonGeometry) {
        style.polygon = {
          fillColor: this.styleConfig.fillColor,
          fillOpacity: this.styleConfig.fillOpacity,
          strokeColor: this.styleConfig.strokeColor,
          strokeWidth: this.styleConfig.strokeWidth,
          opacity: this.styleConfig.opacity
        }
      }

      return style
    }
  },
  watch: {
    layer: {
      handler(newLayer) {
        if (newLayer && this.visible) {
          this.analyzeGeoJSON()
        }
      },
      immediate: true
    },
    visible(newVal) {
      if (newVal && this.layer) {
        this.analyzeGeoJSON()
      }
    }
  },
  methods: {
    async analyzeGeoJSON() {
      console.log('=== VectorLayerStyleEditor analyzeGeoJSON ===')
      console.log('Layer prop:', this.layer)
      console.log('Layer ID:', this.layer?.id)
      console.log('Layer name:', this.layer?.name)
      console.log('Layer file_url:', this.layer?.file_url)
      
      if (!this.layer || !this.layer.file_url) {
        this.error = 'Отсутствует URL файла GeoJSON'
        return
      }

      this.loading = true
      this.error = null

      try {
        const response = await fetch(this.layer.file_url)
        if (!response.ok) {
          throw new Error('Не удалось загрузить GeoJSON файл')
        }

        const geoJSON = await response.json()

        if (!geoJSON.type || geoJSON.type !== 'FeatureCollection') {
          throw new Error('Неверный формат GeoJSON (требуется FeatureCollection)')
        }

        if (!geoJSON.features || geoJSON.features.length === 0) {
          throw new Error('GeoJSON не содержит объектов')
        }

        // Определяем тип геометрии первого объекта
        const firstFeature = geoJSON.features[0]
        this.geometryType = firstFeature.geometry.type
        this.featureCount = geoJSON.features.length

        // Загружаем существующий стиль если есть
        if (this.layer.style) {
          this.loadExistingStyle(this.layer.style)
        }

      } catch (err) {
        this.error = err.message
        console.error('Error analyzing GeoJSON:', err)
      } finally {
        this.loading = false
      }
    },

    loadExistingStyle(styleData) {
      try {
        const style = typeof styleData === 'string' ? JSON.parse(styleData) : styleData

        if (style.point) {
          this.styleConfig.radius = style.point.radius || 8
          this.styleConfig.fillColor = style.point.fillColor || '#3388ff'
          this.styleConfig.strokeColor = style.point.strokeColor || '#ffffff'
          this.styleConfig.strokeWidth = style.point.strokeWidth || 2
        }

        if (style.line) {
          this.styleConfig.strokeColor = style.line.strokeColor || '#3388ff'
          this.styleConfig.strokeWidth = style.line.strokeWidth || 2
          this.styleConfig.opacity = style.line.opacity || 0.7
        }

        if (style.polygon) {
          this.styleConfig.fillColor = style.polygon.fillColor || '#3388ff'
          this.styleConfig.fillOpacity = style.polygon.fillOpacity || 0.3
          this.styleConfig.strokeColor = style.polygon.strokeColor || '#3388ff'
          this.styleConfig.strokeWidth = style.polygon.strokeWidth || 2
          this.styleConfig.opacity = style.polygon.opacity || 0.7
        }
      } catch (err) {
        console.error('Error loading existing style:', err)
      }
    },

    handleSave() {
      console.log('=== VectorLayerStyleEditor handleSave ===')
      console.log('Saving style for layer ID:', this.layer?.id)
      console.log('Layer name:', this.layer?.name)
      console.log('Style JSON:', this.styleJSON)
      
      this.$emit('save', this.styleJSON)
      this.handleClose()
    },

    handleClose() {
      this.visible = false
    },

    hexToRgba(hex, alpha) {
      // Конвертирует HEX в RGBA
      if (!hex) return 'rgba(51, 136, 255, 0.3)'
      
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      
      return `rgba(${r}, ${g}, ${b}, ${alpha || 1})`
    }
  }
}
</script>

<style scoped lang="scss">
.style-editor {
  min-height: 200px;

  .loading, .error {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    gap: 12px;
  }

  .style-form {
    .style-content {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;

      .style-preview {
        flex-shrink: 0;
        
        h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .preview-container {
          width: 120px;
          height: 120px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          
          svg {
            display: block;
          }
        }
      }

      .style-settings {
        flex: 1;
      }
    }

    .json-preview {
      background: var(--bg-secondary);
      padding: 12px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      font-size: 12px;
      color: var(--text-primary);
      overflow-x: auto;
      max-height: 200px;
    }
  }
}
</style>
