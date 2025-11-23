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
}
</style>
