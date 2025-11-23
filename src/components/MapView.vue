<template>
  <div class="map-view">
    <div class="map-controls">
      <el-radio-group v-model="mapProvider" size="small">
        <el-radio-button label="openlayers">OpenLayers</el-radio-button>
        <el-radio-button label="leaflet">Leaflet</el-radio-button>
      </el-radio-group>
      
      <vector-layers-control
        v-if="vectorLayers.length > 0"
        :vector-layers="vectorLayers"
        @layer-visibility-changed="handleLayerVisibilityChange"
      />

      <!-- Контрол для выбора режима отображения названий населённых пунктов -->
      <div style="display: flex; flex-direction: row; align-items: center; gap: 8px;">
        <label style="font-size: 12px; color: var(--text-secondary); margin: 0; padding: 0; font-weight: 500; white-space: nowrap;">
          Показывать имена нас.пунктов:
        </label>
        <el-select
          v-model="settlementNameMode"
          size="small"
          style="width: 180px;"
        >
          <el-option label="Нет" value="none" />
          <el-option label="Старые" value="old" />
          <el-option label="Современные" value="modern" />
        </el-select>
      </div>
    </div>

    <map-legend :estate-types-legend="estateTypesLegend" :force-expanded="isFullscreen" />

    <!-- Острой visible панель управления для fullscreen режима -->
    <div v-if="isFullscreen" class="fullscreen-controls">
      <div class="fullscreen-controls-inner">
        <!-- Заголовок панели -->
        <div class="controls-header">
          <el-icon><Setting /></el-icon>
          <span>Управление картой</span>
        </div>

        <!-- Секция 1: Выбор типа карты -->
        <div class="control-section">
          <div class="section-title">
            <el-icon><MapLocation /></el-icon>
            <span>Тип карты</span>
          </div>
          <el-radio-group v-model="mapProvider" size="small" class="map-provider-selector">
            <el-radio-button label="openlayers">OpenLayers</el-radio-button>
            <el-radio-button label="leaflet">Leaflet</el-radio-button>
          </el-radio-group>
        </div>

        <!-- Секция 2: Имена населенных пунктов -->
        <div class="control-section">
          <div class="section-title">
            <el-icon><Document /></el-icon>
            <span>Названия поселений</span>
          </div>
          <div class="settlement-names-control">
            <label class="control-label">Показывать:</label>
            <el-select
              v-model="settlementNameMode"
              size="small"
              style="width: 140px;"
              placeholder="Выберите режим"
            >
              <el-option label="Не показывать" value="none" />
              <el-option label="Старые названия" value="old" />
              <el-option label="Современные названия" value="modern" />
            </el-select>
          </div>
        </div>

        <!-- Секция 3: Векторные слои -->
        <div v-if="vectorLayers.length > 0" class="control-section">
          <div class="section-title">
            <el-icon><Management /></el-icon>
            <span>Векторные слои</span>
            <el-tag size="small" type="info">{{ visibleLayersCount }}/{{ vectorLayers.length }}</el-tag>
          </div>
          <div class="layers-container">
            <vector-layers-control
              :vector-layers="vectorLayers"
              @layer-visibility-changed="handleLayerVisibilityChange"
            />
          </div>
        </div>

        <!-- Секция 4: Краткая информация -->
        <div class="control-section info-section">
          <div class="info-item">
            <el-icon><Aim /></el-icon>
            <span>{{ settlementsCount }} поселений</span>
          </div>
          <div class="info-item">
            <el-icon><CircleClose /></el-icon>
            <span>{{ estateTypesCount }} типов сословий</span>
          </div>
        </div>
      </div>
    </div>

    <div class="map-container" :class="{ hidden: mapProvider !== 'leaflet' }">
      <LeafletMap
        ref="leafletMap"
        :settlements="settlements"
        :vector-layers="vectorLayers"
        :initial-center="effectiveCenter"
        :initial-zoom="effectiveZoom"
        :marker="marker"
        :settlement-name-mode="settlementNameMode"
        :is-active="mapProvider === 'leaflet'"
        @view-change="onLeafletViewChange"
        @fullscreen-change="onFullscreenChange"
      />
    </div>

    <div class="map-container" :class="{ hidden: mapProvider !== 'openlayers' }">
      <OpenLayersMap
        ref="olMap"
        :settlements="settlements"
        :vector-layers="vectorLayers"
        :initial-center="effectiveCenterOL"
        :initial-zoom="effectiveZoom"
        :marker="marker"
        :settlement-name-mode="settlementNameMode"
        :is-active="mapProvider === 'openlayers'"
        @view-change="onOLViewChange"
        @fullscreen-change="onFullscreenChange"
      />
    </div>
  </div>
</template>

<script>
import MapLegend from './MapLegend.vue'
import LeafletMap from './maps/LeafletMap.vue'
import OpenLayersMap from './maps/OpenLayersMap.vue'
import VectorLayersControl from './VectorLayersControl.vue'
import { vectorLayerService } from '@/services/vectorLayers.js'
import {
  Setting,
  MapLocation,
  Document,
  Management,
  Aim,
  CircleClose
} from '@element-plus/icons-vue'

export default {
  name: 'MapView',
  components: {
    MapLegend,
    LeafletMap,
    OpenLayersMap,
    VectorLayersControl
  },
  props: {
    settlements: {
      type: [Array, Object],
      default: () => []
    },
    geoJsonData: {
      type: Object,
      default: null
    },
    center: {
      type: Array,
      default: null
    },
    zoom: {
      type: Number,
      default: null
    },
    marker: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      mapProvider: 'openlayers',
      settlementNameMode: 'none',
      vectorLayers: [],
      isSyncing: false,
      isFullscreen: false
    }
  },
  computed: {
    effectiveCenter() {
      return this.center || [55.42, 52.68]
    },
    effectiveZoom() {
      return this.zoom || 8
    },
    effectiveCenterOL() {
      // OpenLayers использует [lon, lat] вместо [lat, lon]
      if (this.center) {
        return [this.center[1], this.center[0]]
      }
      return [52.68, 55.42]
    },
    estateTypesLegend() {
      // Поддержка как массива settlements, так и GeoJSON
      let settlementsArray = []
      if (this.settlements && this.settlements.type === 'FeatureCollection') {
        settlementsArray = this.settlements.features.map(f => f.properties)
      } else if (Array.isArray(this.settlements)) {
        settlementsArray = this.settlements
      } else {
        return []
      }

      if (settlementsArray.length === 0) {
        return []
      }

      const typesMap = new Map()
      
      settlementsArray.forEach(settlement => {
        if (settlement.estateTypes && settlement.estateTypes.length > 0) {
          settlement.estateTypes.forEach(type => {
            if (!typesMap.has(type.id)) {
              typesMap.set(type.id, {
                id: type.id,
                name: type.name,
                color: type.color
              })
            }
          })
        }
      })

      return Array.from(typesMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    },

    // Количество поселений
    settlementsCount() {
      if (this.settlements && Array.isArray(this.settlements)) {
        return this.settlements.length
      } else if (this.settlements && this.settlements.features) {
        return this.settlements.features.length
      }
      return 0
    },

    // Количество типов сословий
    estateTypesCount() {
      return this.estateTypesLegend.length
    },

    // Количество видимых слоев
    visibleLayersCount() {
      return this.vectorLayers.filter(layer => layer.visible !== false).length
    }
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.loadVectorLayers()
      }, 1000)
    })

    // Обработчик события "Показать на карте"
    window.addEventListener('show-settlement-on-map', this.handleShowOnMap)
    window.addEventListener('clear-settlement-highlight', this.handleClearHighlight)

    // Логирование props для отладки
    console.log('=== MapView mounted ===')
    console.log('Props received:', {
      settlements: this.settlements,
      geoJsonData: this.geoJsonData,
      center: this.center,
      zoom: this.zoom,
      marker: this.marker
    })
  },
  beforeUnmount() {
    window.removeEventListener('show-settlement-on-map', this.handleShowOnMap)
    window.removeEventListener('clear-settlement-highlight', this.handleClearHighlight)
  },
  methods: {
    loadVectorLayers() {
      vectorLayerService.getVectorLayers()
        .then((layers) => {
          this.vectorLayers = layers || []
        })
        .catch((error) => {
          console.error('Error loading vector layers:', error)
          this.vectorLayers = []
        })
    },

    onLeafletViewChange(view) {
      if (this.isSyncing) return
      console.log(`🔄 SYNC Leaflet -> OpenLayers: center [${view.center.lat.toFixed(4)}, ${view.center.lng.toFixed(4)}], zoom ${view.zoom}`)
      this.isSyncing = true

      if (this.$refs.olMap && view.center && view.zoom) {
        this.$refs.olMap.syncView(view.center, view.zoom)
      }

      setTimeout(() => {
        this.isSyncing = false
      }, 100)
    },

    onOLViewChange(view) {
      if (this.isSyncing) return
      console.log(`🔄 SYNC OpenLayers -> Leaflet: center [${view.center.lat.toFixed(4)}, ${view.center.lng.toFixed(4)}], zoom ${view.zoom}`)
      this.isSyncing = true

      if (this.$refs.leafletMap && view.center && view.zoom) {
        this.$refs.leafletMap.syncView(view.center, view.zoom)
      }

      setTimeout(() => {
        this.isSyncing = false
      }, 100)
    },

    handleShowOnMap(event) {
      console.log('=== MapView handleShowOnMap ===')
      console.log('Event detail:', event.detail)
      console.log('Current map provider:', this.mapProvider)
      console.log('Leaflet map ref:', this.$refs.leafletMap)
      console.log('OpenLayers map ref:', this.$refs.olMap)
      
      const { lat, lon, name } = event.detail
      
      if (this.mapProvider === 'leaflet' && this.$refs.leafletMap) {
        console.log('Calling leafletMap.highlightSettlement')
        this.$refs.leafletMap.highlightSettlement(lat, lon, name)
      } else if (this.mapProvider === 'openlayers' && this.$refs.olMap) {
        console.log('Calling olMap.highlightSettlement')
        this.$refs.olMap.highlightSettlement(lat, lon, name)
      } else {
        console.log('No map available or provider mismatch')
      }
    },

    handleClearHighlight() {
      if (this.mapProvider === 'leaflet' && this.$refs.leafletMap && typeof this.$refs.leafletMap.clearHighlight === 'function') {
        this.$refs.leafletMap.clearHighlight()
      } else if (this.mapProvider === 'openlayers' && this.$refs.olMap && typeof this.$refs.olMap.clearHighlight === 'function') {
        this.$refs.olMap.clearHighlight()
      }
    },

    handleLayerVisibilityChange(event) {
      const { layerId, visible } = event

      if (this.$refs.leafletMap && typeof this.$refs.leafletMap.toggleLayerVisibility === 'function') {
        this.$refs.leafletMap.toggleLayerVisibility(layerId, visible)
      }

      if (this.$refs.olMap && typeof this.$refs.olMap.toggleLayerVisibility === 'function') {
        this.$refs.olMap.toggleLayerVisibility(layerId, visible)
      }
    },

    onFullscreenChange(isFullscreen) {
      this.isFullscreen = isFullscreen
    }
  },
  watch: {
    mapProvider(newVal, oldVal) {
      this.$nextTick(() => {
        setTimeout(() => {
          if (newVal === 'leaflet' && this.$refs.leafletMap) {
            if (typeof this.$refs.leafletMap.invalidateSize === 'function') {
              this.$refs.leafletMap.invalidateSize()
            }
            // Синхронизируем позицию с OpenLayers
            if (this.$refs.olMap && typeof this.$refs.olMap.getView === 'function') {
              const olView = this.$refs.olMap.getView()
              if (olView && typeof this.$refs.leafletMap.syncView === 'function') {
                this.$refs.leafletMap.syncView(olView.center, olView.zoom)
              }
            }
          } else if (newVal === 'openlayers' && this.$refs.olMap) {
            if (typeof this.$refs.olMap.updateSize === 'function') {
              this.$refs.olMap.updateSize()
            }
            // Синхронизируем позицию с Leaflet
            if (this.$refs.leafletMap && typeof this.$refs.leafletMap.getView === 'function') {
              const leafletView = this.$refs.leafletMap.getView()
              if (leafletView && typeof this.$refs.olMap.syncView === 'function') {
                this.$refs.olMap.syncView(leafletView.center, leafletView.zoom)
              }
            }
          }
        }, 100)
      })
    },

    settlementNameMode(newVal) {
      this.$emit('update:settlement-name-mode', newVal)
    }
  }
}
</script>

<style scoped lang="scss">
.map-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;

  .map-controls {
    padding: 3px;
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
    z-index: 1000;
  }

  .map-container {
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
    height: 100%;
    width: 100%;

    &.hidden {
      display: none;
    }
  }

  // Панель управления для fullscreen режима
  .fullscreen-controls {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 1100; // Выше чем карта, ниже чем элементы карты

    .fullscreen-controls-inner {
      background-color: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(12px);
      border: 2px solid var(--accent-primary);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 240px;
      max-width: 320px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.2),
        0 2px 8px rgba(0, 0, 0, 0.1);

      // Анимация появления/исчезновения
      transition: all 0.4s ease-out;
      opacity: 0;
      transform: translateY(-15px) scale(0.95);

      // Заголовок панели
      .controls-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 8px;
        margin-bottom: 8px;
        border-bottom: 2px solid var(--accent-primary);

        .el-icon {
          font-size: 18px;
          color: var(--accent-primary);
        }

        span {
          font-weight: 700;
          font-size: 14px;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      // Секции управления
      .control-section {
        padding: 8px;
        background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
        border-radius: 8px;
        border: 1px solid var(--border-color);

        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          gap: 8px;

          .el-icon {
            font-size: 16px;
            color: var(--accent-primary);
            flex-shrink: 0;
          }

          span {
            font-weight: 600;
            font-size: 13px;
            color: var(--text-primary);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            flex: 1;
          }

          .el-tag {
            font-size: 10px;
            flex-shrink: 0;
          }
        }

        // Стили для секции слоев
        &.layers-container {
          max-height: 150px;
          overflow-y: auto;

          &::-webkit-scrollbar {
            width: 6px;
          }

          &::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
          }

          &::-webkit-scrollbar-thumb {
            background: var(--accent-primary);
            border-radius: 3px;

            &:hover {
              background: var(--accent-secondary);
            }
          }
        }
      }

      // Специальный стиль для селектора карт
      .map-provider-selector {
        width: 100%;

        :deep(.el-radio-group) {
          display: flex;
          width: 100%;

          .el-radio-button {
            flex: 1;

            &:first-child {
              border-radius: 6px 0 0 6px;
            }

            &:last-child {
              border-radius: 0 6px 6px 0;
            }

            .el-radio-button__inner {
              border: none;
              background: var(--bg-tertiary);
              color: var(--text-secondary);
              font-weight: 600;
              font-size: 12px;
              padding: 8px 12px;
              width: 100%;
              text-align: center;
              transition: all 0.2s ease;

              &:hover {
                background: var(--accent-primary);
                color: white;
              }

              &.is-active {
                background: var(--accent-primary);
                color: white;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
            }
          }
        }
      }

      // Секция информации
      .info-section {
        background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
        border-color: var(--accent-primary);
        color: white;

        .info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 0;
          font-size: 12px;

          .el-icon {
            font-size: 14px;
            opacity: 0.9;
          }

          span {
            font-weight: 500;
            color: inherit;
          }

          &:not(:last-child) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.3);
            margin-bottom: 4px;
          }
        }
      }

      // Размещение элементов управления
      .settlement-names-control {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: space-between;

        .control-label {
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 12px;
          white-space: nowrap;
          margin: 0;
          min-width: fit-content;
        }

        :deep(.el-select) {
          flex: 1;
          min-width: 120px;
        }
      }

      // Масштабирование кнопок для fullscreen
      :deep(.el-radio-group) {
        font-size: 12px;

        .el-radio-button__inner {
          font-size: 12px;
          padding: 6px 12px;
        }
      }

      // Векторные слои контроль в fullscreen
      :deep(.vector-layers-control) {
        background-color: transparent;

        .layer-item {
          font-size: 12px;
          padding: 6px 8px;
          margin: 2px 0;
          background: var(--bg-primary);
          border-radius: 4px;
          border: 1px solid transparent;

          &:hover {
            background: rgba(var(--accent-primary-rgb, 0.1), 0.8);
            border-color: var(--accent-primary);
          }

          .layer-toggle {
            font-size: 11px;
            font-weight: 600;
          }

          .layer-name {
            font-weight: 500;
          }
        }
      }
    }

    // Анимационные состояния
    &.v-enter-active,
    &.v-leave-active {
      transition: all 0.4s ease-out;
    }

    &.v-enter-from,
    &.v-leave-to {
      opacity: 0;
      transform: translateY(-15px) scale(0.95);
    }

    &.v-enter-to,
    &.v-leave-from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  // Убедимся что fullscreen панель всегда видна
  :deep(.leaflet-container:has(.leaflet-fullscreen-button)) ~ .fullscreen-controls,
  :deep(.ol-viewport:has(.ol-fullscreen)) ~ .fullscreen-controls {
    .fullscreen-controls-inner {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  }
}
</style>
