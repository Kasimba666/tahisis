<template>
  <el-dialog
    v-model="visible"
    title="Карта с отфильтрованными данными"
    width="95%"
    :before-close="handleClose"
    class="map-geojson-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="map-geojson-viewer">
      <!-- Панель управления -->
      <div class="viewer-controls">
        <div class="stats-info">
          <el-space>
            <el-tag type="info">Поселений: {{ currentData?.features?.length || 0 }}</el-tag>
            <el-tag type="success">Отфильтрованные данные</el-tag>
            <el-tag v-if="currentData?.metadata?.filtered" type="warning">Фильтр применен</el-tag>
          </el-space>
        </div>

        <div class="view-controls">
          <el-space>
            <el-radio-group v-model="currentView" size="small">
              <el-radio-button label="map">Карта</el-radio-button>
              <el-radio-button label="json">GeoJSON</el-radio-button>
              <el-radio-button label="split">Разделить</el-radio-button>
            </el-radio-group>

            <el-divider direction="vertical" />

            <el-checkbox v-model="showBoundaries" @change="toggleBoundaries">
              Показать границы
            </el-checkbox>

            <el-select
              v-model="selectedBoundaryLayer"
              placeholder="Выберите слой"
              @change="loadBoundaryLayer"
              size="small"
              style="width: 200px"
              :loading="boundariesLoading"
            >
              <el-option
                v-for="layer in availableBoundaryLayers"
                :key="layer.id"
                :label="`${layer.name} (${layer.type_name || 'Неизвестный тип'})`"
                :value="layer.id"
              />
            </el-select>
          </el-space>
        </div>
      </div>

      <!-- Основная область отображения -->
      <div class="content-area" :class="{ 'split-view': currentView === 'split' }">
        <!-- Карта -->
        <div v-show="currentView === 'map' || currentView === 'split'" class="map-container">
          <div v-if="mapLoading" class="map-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>Загрузка карты...</p>
          </div>
          <div ref="mapContainer" class="map-wrapper"></div>
        </div>

        <!-- GeoJSON -->
        <div v-show="currentView === 'json' || currentView === 'split'" class="json-container">
          <div class="json-header">
            <h4>GeoJSON данные ({{ currentData?.features?.length || 0 }} объектов)</h4>
            <el-button-group>
              <el-button size="small" @click="copyGeoJsonToClipboard">
                <el-icon><CopyDocument /></el-icon>
                Копировать
              </el-button>
              <el-button size="small" @click="downloadGeoJson">
                <el-icon><Download /></el-icon>
                Скачать
              </el-button>
            </el-button-group>
          </div>
          <div class="json-content">
            <pre><code ref="geoJsonCode" class="json-code">{{ formattedGeoJson }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">Закрыть</el-button>
      <el-button type="primary" @click="refreshMap" :loading="mapLoading">
        Обновить карту
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { Loading, CopyDocument, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { supabase } from '@/services/supabase'
import L from 'leaflet'

export default {
  name: 'MapWithGeoJsonViewer',
  components: {
    Loading,
    CopyDocument,
    Download
  },
  data() {
    return {
      visible: false,
      currentData: null,
      currentView: 'map', // 'map', 'json', 'split' - по умолчанию только карта
      map: null,
      mapLoading: false,
      // Данные для границ
      showBoundaries: false,
      selectedBoundaryLayer: null,
      availableBoundaryLayers: [],
      boundariesLoading: false,
      boundaryLayers: new Map() // Хранилище загруженных слоев
    }
  },
  computed: {
    formattedGeoJson() {
      if (!this.currentData) return ''
      try {
        return JSON.stringify(this.currentData, null, 2)
      } catch (error) {
        console.error('Error formatting GeoJSON:', error)
        return 'Ошибка форматирования GeoJSON'
      }
    }
  },
  methods: {
    // Открытие диалога с данными
    open(settlementsData) {
      this.visible = true
      this.currentData = null
      this.loadData(settlementsData)
      // Загружаем доступные векторные слои для границ
      this.loadAvailableBoundaryLayers()
    },

    // Закрытие диалога
    handleClose() {
      this.visible = false
      this.currentData = null
      if (this.map) {
        this.map.remove()
        this.map = null
      }
    },

    // Загрузка данных и инициализация карты
    async loadData(settlementsData) {
      this.mapLoading = true

      try {
        console.log('=== MAP VIEWER DEBUG ===')
        console.log('Received settlements for map:', settlementsData?.length || 0)

        if (!settlementsData || settlementsData.length === 0) {
          throw new Error('Нет данных для отображения')
        }

        // Конвертируем данные в GeoJSON
        const geoJsonData = await this.convertToGeoJson(settlementsData)

        console.log('Converted to GeoJSON for map:', geoJsonData.features?.length || 0)

        this.currentData = geoJsonData

        // Инициализируем карту после небольшой задержки
        this.$nextTick(() => {
          this.initializeMap()
        })

      } catch (error) {
        console.error('Error loading map data:', error)
        ElMessage.error('Ошибка загрузки данных для карты: ' + error.message)
      } finally {
        this.mapLoading = false
      }
    },

    // Конвертация данных в GeoJSON для карты
    async convertToGeoJson(settlementsData) {
      const validSettlements = settlementsData.filter(s => s.lat && s.lon)

      const features = validSettlements.map(settlement => {
        // Подготавливаем данные о сословиях
        const estateTypes = this.prepareEstateTypes(settlement)

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [settlement.lon, settlement.lat]
          },
          properties: {
            id: settlement.settlement_id || settlement.id,
            name_old: settlement.settlement_name_old || settlement.name_old,
            name_modern: settlement.settlement_name_modern || settlement.name_modern,
            district_name: settlement.district_name,
            population: {
              male: settlement.male || 0,
              female: settlement.female || 0,
              total: settlement.total || 0
            },
            estate_types: estateTypes,
            filtered: true
          }
        }
      })

      return {
        type: 'FeatureCollection',
        features: features,
        crs: {
          type: 'name',
          properties: {
            name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
          }
        },
        metadata: {
          filtered: true,
          totalCount: settlementsData.length,
          exportedCount: features.length,
          exportedAt: new Date().toISOString()
        }
      }
    },

    // Подготовка данных о сословиях
    prepareEstateTypes(settlement) {
      if (!settlement.estates || !Array.isArray(settlement.estates)) {
        return []
      }

      const estateTypeMap = new Map()

      settlement.estates.forEach(estate => {
        const typeId = estate.Subtype_estate?.id_type_estate
        const subtypeId = estate.id_subtype_estate
        const fallbackTypeKey = estate.type_estate_name || 'Неизвестный тип'
        const fallbackSubtypeKey = estate.subtype_estate_name || 'Неизвестный подтип'
        const finalTypeId = typeId || fallbackTypeKey
        const finalSubtypeId = subtypeId || fallbackSubtypeKey
        const typeName = estate.type_estate_name || fallbackTypeKey
        const subtypeName = estate.subtype_estate_name || fallbackSubtypeKey

        if (!estateTypeMap.has(finalTypeId)) {
          estateTypeMap.set(finalTypeId, {
            type_id: typeId,
            type_name: typeName,
            type_color: estate.Subtype_estate?.Type_estate?.color || null,
            subtypes: new Map(),
            total_male: 0,
            total_female: 0,
            total_count: 0,
            religions: new Set()
          })
        }

        const typeData = estateTypeMap.get(finalTypeId)

        if (!typeData.subtypes.has(finalSubtypeId)) {
          typeData.subtypes.set(finalSubtypeId, {
            subtype_id: subtypeId,
            subtype_name: subtypeName,
            male: 0,
            female: 0,
            count: 0,
            religions: new Set()
          })
        }

        const subtypeData = typeData.subtypes.get(finalSubtypeId)
        subtypeData.male += estate.male || 0
        subtypeData.female += estate.female || 0
        subtypeData.count += 1

        typeData.total_male += estate.male || 0
        typeData.total_female += estate.female || 0
        typeData.total_count += 1
      })

      return Array.from(estateTypeMap.values()).map(typeData => ({
        type_id: typeData.type_id,
        type_name: typeData.type_name,
        type_color: typeData.type_color,
        total_male: typeData.total_male,
        total_female: typeData.total_female,
        total_count: typeData.total_count,
        subtypes: Array.from(typeData.subtypes.values()).map(subtypeData => ({
          subtype_id: subtypeData.subtype_id,
          subtype_name: subtypeData.subtype_name,
          male: subtypeData.male,
          female: subtypeData.female,
          count: subtypeData.count
        })).sort((a, b) => b.count - a.count)
      })).sort((a, b) => b.total_count - a.count)
    },

    // Инициализация карты Leaflet
    initializeMap() {
      if (!this.currentData || !this.$refs.mapContainer) return

      try {
        // Удаляем предыдущую карту если она есть
        if (this.map) {
          this.map.remove()
        }

        // Создаем новую карту
        this.map = L.map(this.$refs.mapContainer, {
          center: [55.7558, 52.4128], // Центр Татарстана
          zoom: 7,
          zoomControl: true
        })

        // Добавляем слой OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(this.map)

        // Подгоняем границы карты под точки
        if (this.currentData.features && this.currentData.features.length > 0) {
          const group = new L.featureGroup()
          this.currentData.features.forEach(feature => {
            if (feature.geometry && feature.geometry.coordinates) {
              L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]])
                .addTo(group)
            }
          })

          if (group.getLayers().length > 0) {
            this.map.fitBounds(group.getBounds().pad(0.1))
          }
        }

        // Добавляем точки на карту после инициализации
        setTimeout(() => {
          this.addPointsToMap()
        }, 100)

      } catch (error) {
        console.error('Error initializing map:', error)
        ElMessage.error('Ошибка инициализации карты')
      }
    },

    // Добавление точек на карту
    addPointsToMap() {
      if (!this.map || !this.currentData || !this.currentData.features) return

      this.currentData.features.forEach((feature, index) => {
        if (feature.geometry && feature.geometry.coordinates) {
          const [lng, lat] = feature.geometry.coordinates
          const props = feature.properties

          // Создаем popup с информацией
          const popupContent = `
            <div class="map-popup">
              <h4>${props.name_old}</h4>
              ${props.name_modern && props.name_modern !== props.name_old ? `<p><strong>Современное:</strong> ${props.name_modern}</p>` : ''}
              ${props.district_name ? `<p><strong>Район:</strong> ${props.district_name}</p>` : ''}
              <p><strong>Население:</strong> ${props.population.total} чел.</p>
              ${props.estate_types && props.estate_types.length > 0 ? `
                <div class="estate-types">
                  <strong>Сословия:</strong>
                  ${props.estate_types.map(type => `<div>• ${type.type_name}: ${type.total_count}</div>`).join('')}
                </div>
              ` : ''}
            </div>
          `

          // Создаем маркер
          const marker = L.marker([lat, lng], {
            title: props.name_old
          }).bindPopup(popupContent)

          marker.addTo(this.map)
        }
      })
    },

    // Обновление карты
    refreshMap() {
      if (this.currentData) {
        this.initializeMap()
      }
    },

    // Подсветка синтаксиса JSON
    highlightGeoJsonSyntax() {
      if (!this.$refs.geoJsonCode) return

      try {
        const jsonText = this.formattedGeoJson
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

        this.$refs.geoJsonCode.innerHTML = highlighted
      } catch (error) {
        console.warn('Error highlighting GeoJSON syntax:', error)
      }
    },

    // Копирование GeoJSON в буфер обмена
    async copyGeoJsonToClipboard() {
      try {
        const jsonContent = this.formattedGeoJson
        await navigator.clipboard.writeText(jsonContent)
        ElMessage.success('GeoJSON скопирован в буфер обмена')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        ElMessage.error('Ошибка копирования в буфер обмена')
      }
    },

    // Скачивание GeoJSON файла
    downloadGeoJson() {
      try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
        const fileName = `filtered_settlements_${timestamp}.geojson`

        const jsonContent = this.formattedGeoJson
        const blob = new Blob([jsonContent], { type: 'application/geo+json' })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        ElMessage.success(`GeoJSON сохранен как ${fileName}`)
      } catch (error) {
        console.error('Error downloading GeoJSON:', error)
        ElMessage.error('Ошибка скачивания GeoJSON')
      }
    },

    // Загрузка доступных векторных слоев
    async loadAvailableBoundaryLayers() {
      this.boundariesLoading = true

      try {
        const { data: layers, error } = await supabase
          .from('Vector_layer')
          .select(`
            id,
            name,
            file_path,
            file_url,
            mime_type,
            bbox,
            Type_vector_layer ( name )
          `)
          .not('file_path', 'is', null)

        if (error) throw error

        this.availableBoundaryLayers = layers.map(layer => ({
          id: layer.id,
          name: layer.name,
          file_path: layer.file_path,
          file_url: layer.file_url,
          mime_type: layer.mime_type,
          bbox: layer.bbox,
          type_name: layer.Type_vector_layer?.name || 'Неизвестный тип'
        }))

        console.log('Loaded boundary layers:', this.availableBoundaryLayers.length)

      } catch (error) {
        console.error('Error loading boundary layers:', error)
        ElMessage.error('Ошибка загрузки векторных слоев')
      } finally {
        this.boundariesLoading = false
      }
    },

    // Загрузка конкретного слоя границ
    async loadBoundaryLayer(layerId) {
      if (!layerId) return

      this.boundariesLoading = true

      try {
        // Проверяем, загружен ли уже этот слой
        if (this.boundaryLayers.has(layerId)) {
          console.log('Layer already loaded:', layerId)
          return
        }

        const layer = this.availableBoundaryLayers.find(l => l.id === layerId)
        if (!layer) {
          throw new Error('Слой не найден')
        }

        console.log('Loading boundary layer:', layer.name)

        // Получаем публичный URL файла
        const { data: urlData } = supabase.storage
          .from('vector-layers')
          .getPublicUrl(layer.file_path)

        if (!urlData.publicUrl) {
          throw new Error('Не удалось получить URL файла')
        }

        // Загружаем GeoJSON данные
        const response = await fetch(urlData.publicUrl)
        if (!response.ok) {
          throw new Error('Не удалось загрузить файл')
        }

        const geoJsonData = await response.json()

        // Сохраняем слой в хранилище
        this.boundaryLayers.set(layerId, {
          ...layer,
          geoJsonData: geoJsonData
        })

        // Добавляем на карту
        this.addBoundaryToMap(layerId, geoJsonData)

        ElMessage.success(`Слой "${layer.name}" добавлен на карту`)

      } catch (error) {
        console.error('Error loading boundary layer:', error)
        ElMessage.error('Ошибка загрузки слоя границ: ' + error.message)
        this.selectedBoundaryLayer = null
      } finally {
        this.boundariesLoading = false
      }
    },

    // Добавление границ на карту
    addBoundaryToMap(layerId, geoJsonData) {
      if (!this.map || !geoJsonData) return

      try {
        // Удаляем предыдущие границы если они есть
        this.map.eachLayer((layer) => {
          if (layer.options && layer.options.boundaryLayer) {
            this.map.removeLayer(layer)
          }
        })

        // Добавляем новые границы
        L.geoJSON(geoJsonData, {
          style: {
            color: 'hsl(27, 100%, 50%)',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.1
          },
          boundaryLayer: true
        }).addTo(this.map)

        console.log('Boundary layer added to map:', layerId)

      } catch (error) {
        console.error('Error adding boundary to map:', error)
        ElMessage.error('Ошибка добавления границ на карту')
      }
    },

    // Переключение видимости границ
    toggleBoundaries() {
      if (!this.showBoundaries) {
        // Скрываем все границы
        this.map.eachLayer((layer) => {
          if (layer.options && layer.options.boundaryLayer) {
            this.map.removeLayer(layer)
          }
        })
        this.selectedBoundaryLayer = null
      } else {
        // Показываем границы если выбран слой
        if (this.selectedBoundaryLayer) {
          const layerData = this.boundaryLayers.get(this.selectedBoundaryLayer)
          if (layerData) {
            this.addBoundaryToMap(this.selectedBoundaryLayer, layerData.geoJsonData)
          }
        }
      }
    }
  },

  watch: {
    currentView() {
      // Обновляем карту при переключении вида
      if (this.currentView === 'map' || this.currentView === 'split') {
        this.$nextTick(() => {
          if (this.map) {
            this.map.invalidateSize()
          } else {
            this.initializeMap()
          }
        })
      }
    }
  },

  mounted() {
    // Подсвечиваем синтаксис при монтировании
    this.$nextTick(() => {
      this.highlightGeoJsonSyntax()
    })
  }
}
</script>

<style scoped lang="scss">
.map-geojson-dialog {
  .el-dialog__body {
    padding: 1rem;
  }
}

.map-geojson-viewer {
  height: 75vh;
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

    .view-controls {
      display: flex;
      gap: 0.5rem;
    }
  }

  .content-area {
    flex: 1;
    display: flex;
    gap: 1rem;
    min-height: 500px;

    &.split-view {
      .map-container,
      .json-container {
        flex: 1;
        min-width: 300px;
      }
    }

    .map-container {
      flex: 1;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      overflow: hidden;
      position: relative;

      .map-loading {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        gap: 1rem;
      }

      .map-wrapper {
        width: 100%;
        height: 100%;
        min-height: 400px;
      }
    }

    .json-container {
      flex: 1;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .json-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background-color: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);

        h4 {
          margin: 0;
          color: var(--text-primary);
        }
      }

      .json-content {
        flex: 1;
        overflow: auto;
        background-color: var(--bg-primary);
        padding: 1rem;

        pre {
          margin: 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          line-height: 1.4;

          .json-code {
            display: block;
          }
        }
      }
    }
  }
}

// Стили для подсветки синтаксиса JSON
.json-key {
  color: hsl(212, 92%, 44%);
  font-weight: 500;
}

.json-string {
  color: hsl(215, 81%, 23%);
}

.json-number {
  color: hsl(213, 95%, 35%);
}

.json-keyword {
  color: hsl(262, 71%, 59%);
  font-weight: 500;
}

// Стили для popup на карте
.map-popup {
  font-family: var(--font-family);
  max-width: 300px;

  h4 {
    margin: 0 0 0.5rem 0;
    color: var(--primary-color);
  }

  p {
    margin: 0.25rem 0;
    font-size: 0.9em;
  }

  .estate-types {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid hsl(0, 0%, 93%);

    div {
      font-size: 0.85em;
      margin: 0.1rem 0;
    }
  }
}

@media (max-width: 768px) {
  .map-geojson-viewer {
    .viewer-controls {
      flex-direction: column;
      align-items: stretch;

      .stats-info {
        justify-content: center;
      }

      .view-controls {
        justify-content: center;
      }
    }

    .content-area {
      flex-direction: column;

      &.split-view {
        .map-container,
        .json-container {
          min-height: 300px;
        }
      }
    }
  }
}
</style>
