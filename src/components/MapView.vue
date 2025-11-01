<template>
  <div class="map-view">
    <div class="map-controls">
      <el-radio-group v-model="mapProvider" size="small">
        <el-radio-button label="leaflet">Leaflet</el-radio-button>
        <el-radio-button label="openlayers">OpenLayers</el-radio-button>
      </el-radio-group>
    </div>

    <map-legend :estate-types-legend="estateTypesLegend" />

    <div class="map-container" :class="{ hidden: mapProvider !== 'leaflet' }">
      <LeafletMap
        ref="leafletMap"
        :settlements="settlements"
        :vector-layers="vectorLayers"
        :initial-center="[55.42, 52.68]"
        :initial-zoom="8"
        :is-active="mapProvider === 'leaflet'"
        @view-change="onLeafletViewChange"
      />
    </div>

    <div class="map-container" :class="{ hidden: mapProvider !== 'openlayers' }">
      <OpenLayersMap
        ref="olMap"
        :settlements="settlements"
        :vector-layers="vectorLayers"
        :initial-center="[52.68, 55.42]"
        :initial-zoom="8"
        :is-active="mapProvider === 'openlayers'"
        @view-change="onOLViewChange"
      />
    </div>
  </div>
</template>

<script>
import MapLegend from './MapLegend.vue'
import LeafletMap from './maps/LeafletMap.vue'
import OpenLayersMap from './maps/OpenLayersMap.vue'
import { vectorLayerService } from '@/services/vectorLayers.js'

export default {
  name: 'MapView',
  components: {
    MapLegend,
    LeafletMap,
    OpenLayersMap
  },
  props: {
    settlements: {
      type: Array,
      default: () => []
    },
    geoJsonData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      mapProvider: 'leaflet',
      vectorLayers: [],
      isSyncing: false
    }
  },
  computed: {
    estateTypesLegend() {
      if (!this.settlements || this.settlements.length === 0) {
        return []
      }

      const typesMap = new Map()
      
      this.settlements.forEach(settlement => {
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
      // Очищаем highlight на текущей активной карте
      if (this.mapProvider === 'leaflet' && this.$refs.leafletMap && typeof this.$refs.leafletMap.clearHighlight === 'function') {
        this.$refs.leafletMap.clearHighlight()
      } else if (this.mapProvider === 'openlayers' && this.$refs.olMap && typeof this.$refs.olMap.clearHighlight === 'function') {
        this.$refs.olMap.clearHighlight()
      }
    }
  },
  watch: {
    mapProvider(newVal) {
      this.$nextTick(() => {
        setTimeout(() => {
          if (newVal === 'leaflet' && this.$refs.leafletMap && typeof this.$refs.leafletMap.invalidateSize === 'function') {
            this.$refs.leafletMap.invalidateSize()
          } else if (newVal === 'openlayers' && this.$refs.olMap && typeof this.$refs.olMap.updateSize === 'function') {
            this.$refs.olMap.updateSize()
          }
        }, 100)
      })
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
