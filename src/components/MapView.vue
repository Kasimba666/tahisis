<template>
  <div class="map-view">
    <div class="map-controls" :class="{ fullscreen: isFullscreen }">
      <el-radio-group v-model="mapProvider" size="small">
        <el-radio-button label="openlayers">OpenLayers</el-radio-button>
        <el-radio-button label="leaflet">Leaflet</el-radio-button>
      </el-radio-group>

      <vector-layers-control
        v-if="vectorLayers.length > 0"
        :vector-layers="vectorLayers"
        :map-provider="mapProvider"
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

      <!-- Настройки тепловой карты (только для OpenLayers) -->
      <div
        v-if="mapProvider === 'openlayers' && isHeatmapVisible"
        class="heatmap-settings-panel"
      >
        <el-divider direction="vertical" style="height: 20px; margin: 0 8px;"></el-divider>

        <!-- Огонёк для переключения элементов управления тепловой картой -->
        <span
          @click="toggleHeatmapControls"
          class="heatmap-toggle-icon"
          :class="{ 'active': showHeatmapControls }"
          title="Настройки тепловой карты"
        >
          🔥
        </span>

        <!-- Элементы управления тепловой картой -->
        <transition name="fade">
          <div
            v-show="showHeatmapControls"
            class="heatmap-compact-controls"
          >
            <!-- Палитра -->
            <el-select
              v-model="heatmapSettings.colorPalette"
              size="small"
              style="width: 120px;"
              placeholder="Палитра"
              @change="updateHeatmapSettings"
            >
              <el-option
                v-for="palette in colorPalettes"
                :key="palette.value"
                :label="palette.label"
                :value="palette.value"
              />
            </el-select>

            <!-- Радиус -->
            <span class="control-item">
              <span class="control-label">R{{ heatmapSettings.radius }}</span>
              <el-slider
                v-model="heatmapSettings.radius"
                :min="5"
                :max="50"
                :step="1"
                size="small"
                style="width: 60px;"
                @change="updateHeatmapSettings"
              />
            </span>

            <!-- Размытие -->
            <span class="control-item">
              <span class="control-label">B{{ heatmapSettings.blur }}</span>
              <el-slider
                v-model="heatmapSettings.blur"
                :min="5"
                :max="100"
                :step="5"
                size="small"
                style="width: 60px;"
                @change="updateHeatmapSettings"
              />
            </span>

            <!-- Интенсивность -->
            <span class="control-item">
              <span class="control-label">{{ heatmapSettings.intensity.toFixed(1) }}x</span>
              <el-slider
                v-model="heatmapSettings.intensity"
                :min="0.1"
                :max="2.0"
                :step="0.1"
                size="small"
                style="width: 60px;"
                @change="updateHeatmapSettings"
              />
            </span>
          </div>
        </transition>
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

          <!-- Настройки тепловой карты (только для OpenLayers) -->
          <div v-if="mapProvider === 'openlayers' && isHeatmapVisible" class="heatmap-settings">
            <el-divider style="margin: 12px 0;"></el-divider>
            <div class="heatmap-section-title">🔥 Настройки тепловой карты</div>

            <div class="setting-row">
              <div class="setting-item">
                <label class="setting-label">Радиус:</label>
                <el-slider
                  v-model="heatmapSettings.radius"
                  :min="5"
                  :max="50"
                  :step="1"
                  size="small"
                  @change="updateHeatmapSettings"
                />
                <span class="setting-value">{{ heatmapSettings.radius }}</span>
              </div>
            </div>

            <div class="setting-row">
              <div class="setting-item">
                <label class="setting-label">Размытие:</label>
                <el-slider
                  v-model="heatmapSettings.blur"
                  :min="5"
                  :max="100"
                  :step="5"
                  size="small"
                  @change="updateHeatmapSettings"
                />
                <span class="setting-value">{{ heatmapSettings.blur }}</span>
              </div>
            </div>

            <div class="setting-row">
              <div class="setting-item">
                <label class="setting-label">Интенсивность:</label>
                <el-slider
                  v-model="heatmapSettings.intensity"
                  :min="0.1"
                  :max="2.0"
                  :step="0.1"
                  size="small"
                  @change="updateHeatmapSettings"
                />
                <span class="setting-value">{{ heatmapSettings.intensity.toFixed(1) }}x</span>
              </div>
            </div>
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
              :map-provider="mapProvider"
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
        :settlement-subtype-colors="settlementSubtypeColors"
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
    },
    settlementSubtypeColors: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      mapProvider: 'openlayers',
      settlementNameMode: 'none',
      vectorLayers: [],
      isSyncing: false,
      isFullscreen: false,
      isHeatmapVisible: false,
      isHeatmapCollapsed: true,
      showHeatmapControls: false,

      // Настройки тепловой карты
      heatmapSettings: {
        radius: 12,
        blur: 20,
        intensity: 1.0,
        colorPalette: 'red-yellow'
      },

      // Цветовые палитры для тепловой карты
      colorPalettes: [
        { value: 'red-yellow', label: 'Красный → Жёлтый' },
        { value: 'blue-green', label: 'Синий → Зелёный' },
        { value: 'purple-orange', label: 'Фиолетовый → Оранжевый' },
        { value: 'blue-red', label: 'Синий → Красный' },
        { value: 'green-red', label: 'Зелёный → Красный' },
        { value: 'viridis', label: 'Viridis' }
      ]
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

    // Признак того, что цвета загружены
    areColorsLoaded() {
      return Object.keys(this.settlementSubtypeColors || {}).length > 0
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

      // Обработка тепловой карты
      if (layerId === 'heatmap') {
        this.isHeatmapVisible = visible
      }

      if (this.mapProvider === 'leaflet' && this.$refs.leafletMap) {
        this.$refs.leafletMap.toggleLayerVisibility(layerId, visible)
      }

      if (this.mapProvider === 'openlayers' && this.$refs.olMap) {
        this.$refs.olMap.toggleLayerVisibility(layerId, visible)
      }
    },

    toggleHeatmapLayer(layerId, visible) {
      // Обработка тепловой карты - передаем на активную карту
      if (layerId === 'heatmap') {
        if (this.mapProvider === 'leaflet' && this.$refs.leafletMap && typeof this.$refs.leafletMap.toggleHeatmapLayer === 'function') {
          this.$refs.leafletMap.toggleHeatmapLayer(visible)
        }
        if (this.mapProvider === 'openlayers' && this.$refs.olMap && typeof this.$refs.olMap.toggleHeatmapLayer === 'function') {
          this.$refs.olMap.toggleHeatmapLayer(visible)
        }
      }
    },

    onFullscreenChange(isFullscreen) {
      this.isFullscreen = isFullscreen
    },

    updateHeatmapSettings() {
      console.log('=== MapView updateHeatmapSettings ===')
      console.log('New settings:', this.heatmapSettings)

      // Только для OpenLayers карты
      if (this.mapProvider === 'openlayers' && this.$refs.olMap && this.isHeatmapVisible) {
        // Одновременно выключаем и включаем обратно с новыми настройками
        this.$refs.olMap.toggleHeatmapLayer(false)
        setTimeout(() => {
          this.$refs.olMap.toggleHeatmapLayer(true, this.heatmapSettings)
        }, 100)
      }
    },

    toggleHeatmapControls() {
      this.showHeatmapControls = !this.showHeatmapControls

      // Если открываем элементы управления - автоматически включаем heatmap слой, если он еще не включен
      if (this.showHeatmapControls && !this.isHeatmapVisible) {
        console.log('Opening heatmap controls - auto-enabling heatmap layer')
        this.isHeatmapVisible = true
        // Эмитируем событие изменения видимости слоя
        this.$emit('layer-visibility-changed', {
          layerId: 'heatmap',
          visible: true
        })
      }
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
    },

    settlements: {
      handler() {
        // Обновляем тепловую карту если она включена и выбрана OpenLayers карта
        if (this.isHeatmapVisible && this.mapProvider === 'openlayers') {
          console.log('Обновление тепловой карты из-за изменения выборки settlements')
          this.$refs.olMap.toggleHeatmapLayer(false)
          setTimeout(() => {
            this.$refs.olMap.toggleHeatmapLayer(true, this.heatmapSettings)
          }, 100)
        }
      },
      deep: true
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

    // В fullscreen режиме делаем панель абсолютно позиционированной
    // чтобы она оставалась видимой поверх полноэкранной карты
    &.fullscreen {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1200; // Выше чем fullscreen панель элементов управления
      background-color: rgba(var(--bg-secondary-rgb, 217, 217, 217), 0.95); // hsl(0, 0%, 85%)
      backdrop-filter: blur(8px);
      border-bottom: 2px solid var(--accent-primary);
      border-radius: 0 0 8px 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    // Настройки тепловой карты в панели инструментов
    .heatmap-settings-panel {
      display: flex;
      align-items: center;
      gap: 4px;

      .heatmap-toggle-icon {
        font-size: 11px;
        cursor: pointer;
        user-select: none;
        padding: 2px 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        color: var(--text-secondary);

        &:hover {
          color: var(--accent-primary);
          background: rgba(var(--accent-primary-rgb), 0.1);
        }

        &.active {
          background: var(--accent-primary);
          color: white;
        }
      }

      .heatmap-popup {
        display: flex;
        flex-direction: column;
        gap: 4px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

        .heatmap-popup-row {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;

          .setting-label {
            font-weight: 600;
            font-size: 10px;
            color: var(--text-secondary);
            min-width: 60px;
          }

          :deep(.el-slider) {
            .el-slider__runway {
              background-color: var(--border-color);
              height: 3px;
            }

            .el-slider__button {
              width: 10px;
              height: 10px;
              border: 2px solid var(--accent-primary);
              background: var(--bg-primary);
            }

            &:hover .el-slider__button {
              transform: scale(1.1);
            }
          }
        }
      }
    }
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
      min-width: 260px;
      max-width: 350px;
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

      // Настройки тепловой карты
      .heatmap-settings {
        .heatmap-section-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          text-align: center;
          margin-bottom: 8px;
          padding: 4px 0;
        }

        .setting-row {
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }
        }

        .setting-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .setting-label {
            font-weight: 600;
            font-size: 11px;
            color: var(--text-secondary);
            min-width: 70px;
            text-align: right;
            flex-shrink: 0;
          }

          :deep(.el-slider) {
            flex: 1;
            margin: 0 6px;

            .el-slider__runway {
              background-color: var(--border-color);
              height: 4px;
            }

            .el-slider__button {
              width: 12px;
              height: 12px;
              border: 2px solid var(--accent-primary);
            }
          }

          .setting-value {
            font-weight: 600;
            font-size: 11px;
            color: var(--accent-primary);
            min-width: 45px;
            text-align: center;
            flex-shrink: 0;
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

  // Dropdown панель настроек тепловой карты
  .heatmap-dropdown {
    position: fixed;
    top: 30px;
    right: 20px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(12px);
    min-width: 300px;
    max-width: 400px;
    z-index: 1300;
    margin: 0;

    .heatmap-dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 8px 16px;
      border-bottom: 1px solid var(--border-color);

      .header-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .close-button {
        padding: 6px;
        margin: -6px;
        border-radius: 50%;

        &:hover {
          background: rgba(var(--accent-primary-rgb), 0.1);
        }

        .el-icon {
          font-size: 16px;
          color: var(--text-secondary);
        }
      }
    }

    .heatmap-setting-group {
      padding: 12px 16px;

      .setting-group-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 6px;
      }

      .setting-row {
        display: flex;
        gap: 12px;
        align-items: end;
        justify-content: center;
        padding-top: 8px;

        .setting-item-vertical {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;

          .setting-label-vertical {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-secondary);
            text-align: center;
            min-height: 32px;
            line-height: 1.2;
            display: flex;
            align-items: center;
          }

          :deep(.el-slider) {
            &:hover .el-slider__button {
              transform: scale(1.1);
            }

            &.is-vertical {
              .el-slider__runway {
                width: 4px;
              }

              .el-slider__button {
                width: 12px;
                height: 12px;
                left: 16px;
                border: 2px solid var(--accent-primary);
                background: var(--bg-primary);
              }
            }
          }

          .setting-value-vertical {
            font-size: 11px;
            font-weight: 600;
            color: var(--accent-primary);
            padding: 2px 4px;
            background: rgba(var(--accent-primary-rgb), 0.1);
            border-radius: 4px;
            min-width: 24px;
            text-align: center;
          }
        }
      }
    }

    .setting-row {
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  // Анимация панели настроек тепловой карты
  .heatmap-panel-enter-active,
  .heatmap-panel-leave-active {
    transition: all 0.2s ease-out;
  }

  .heatmap-panel-enter-from,
  .heatmap-panel-leave-to {
    opacity: 0;
    transform: translateY(-5px) scale(0.95);
  }

  .heatmap-panel-enter-to,
  .heatmap-panel-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  // Compact элементы управления тепловой картой в панели инструментов
  .heatmap-compact-controls {
    display: flex;
    align-items: center;
    gap: 12px;

    .control-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;

      .control-label {
        font-size: 9px;
        font-weight: 600;
        color: var(--text-secondary);
        text-align: center;
        white-space: nowrap;
      }

      :deep(.el-slider) {
        .el-slider__runway {
          background-color: var(--border-color);
          height: 2px;
        }

        .el-slider__button {
          width: 8px;
          height: 8px;
          border: 1px solid var(--accent-primary);
        }

        &:hover .el-slider__button {
          transform: scale(1.1);
        }
      }
    }
  }

  // Анимация для compact controls
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
  }
}
</style>
