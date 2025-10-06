<template>
  <div class="map-view">
    <div class="map-controls">
      <el-radio-group v-model="mapProvider" size="small">
        <el-radio-button label="leaflet">Leaflet</el-radio-button>
        <el-radio-button label="openlayers">OpenLayers</el-radio-button>
      </el-radio-group>
    </div>
    
    <div ref="leafletMap" class="map-container" :class="{ hidden: mapProvider !== 'leaflet' }"></div>
    <div ref="olMap" class="map-container" :class="{ hidden: mapProvider !== 'openlayers' }"></div>
  </div>
</template>

<script>
import L from 'leaflet'
import { Map as OLMap, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Style, Circle, Fill, Stroke } from 'ol/style'
import { fromLonLat, transform } from 'ol/proj'

export default {
  name: 'MapView',
  props: {
    settlements: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      mapProvider: 'leaflet',
      leafletMapInstance: null,
      olMapInstance: null,
      leafletMarkers: [],
      olVectorLayer: null,
      initialBounds: null,
      initialExtent: null
    }
  },
  mounted() {
    console.log('MapView mounted, checking containers...')
    // Даем время на отрисовку контейнеров
    this.$nextTick(() => {
      // Простая инициализация без ResizeObserver
      setTimeout(() => {
        console.log('Simple initialization attempt...')
        console.log('Leaflet container:', this.$refs.leafletMap)
        console.log('OpenLayers container:', this.$refs.olMap)

        if (this.$refs.leafletMap) {
          console.log('Leaflet container dimensions:', this.$refs.leafletMap.getBoundingClientRect())
        }
        if (this.$refs.olMap) {
          console.log('OpenLayers container dimensions:', this.$refs.olMap.getBoundingClientRect())
        }

        this.initLeafletMap()
        this.initOpenLayersMap()
      }, 500)
    })
  },
  beforeUnmount() {
    if (this.leafletMapInstance) {
      this.leafletMapInstance.remove()
    }
    if (this.olMapInstance) {
      this.olMapInstance.setTarget(null)
    }
  },
  methods: {
    initializeMapsWhenVisible() {
      const checkVisibility = () => {
        if (this.$refs.leafletMap && this.$refs.olMap) {
          const leafletRect = this.$refs.leafletMap.getBoundingClientRect()
          const olRect = this.$refs.olMap.getBoundingClientRect()

          console.log('Container sizes:', {
            leaflet: `${leafletRect.width}x${leafletRect.height}`,
            openlayers: `${olRect.width}x${olRect.height}`
          })

          // Проверяем что хотя бы один контейнер видим
          if (leafletRect.width > 0 && leafletRect.height > 0) {
            console.log('Initializing Leaflet map...')
            this.initLeafletMap()
            return true
          } else if (olRect.width > 0 && olRect.height > 0) {
            console.log('Initializing OpenLayers map...')
            this.initOpenLayersMap()
            return true
          }
        }
        return false
      }

      // Проверяем сразу
      if (!checkVisibility()) {
        // Если не видимы, ждем изменения размеров
        let attempts = 0
        const maxAttempts = 50 // 5 секунд максимум

        const observer = new ResizeObserver(() => {
          attempts++
          if (checkVisibility() || attempts >= maxAttempts) {
            observer.disconnect()
          }
        })

        if (this.$refs.leafletMap) observer.observe(this.$refs.leafletMap)
        if (this.$refs.olMap) observer.observe(this.$refs.olMap)

        // Fallback через setTimeout
        setTimeout(() => {
          if (attempts < maxAttempts) {
            checkVisibility()
            observer.disconnect()
          }
        }, 2000)
      }
    },

    initLeafletMap() {
      if (!this.$refs.leafletMap) {
        console.error('Leaflet map container not found')
        return
      }
      
      try {
        // Инициализация Leaflet карты
        this.leafletMapInstance = L.map(this.$refs.leafletMap, {
          center: [55.7558, 37.6173], // Москва по умолчанию
          zoom: 6,
          fullscreenControl: {
            pseudoFullscreen: false
          }
        })

        // Добавляем тайловый слой OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(this.leafletMapInstance)
        
        // Добавляем кнопку Home для возврата к исходному виду
        const self = this
        L.Control.HomeButton = L.Control.extend({
          onAdd: function(map) {
            const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-home')
            btn.innerHTML = '🏠'
            btn.title = 'Вернуться к исходному виду'
            btn.style.backgroundColor = 'white'
            btn.style.width = '30px'
            btn.style.height = '30px'
            btn.style.fontSize = '16px'
            btn.style.lineHeight = '30px'
            btn.style.textAlign = 'center'
            btn.style.cursor = 'pointer'
            btn.style.border = 'none'
            btn.onclick = function() {
              if (self.initialBounds) {
                self.leafletMapInstance.fitBounds(self.initialBounds, { padding: [50, 50] })
              }
            }
            return btn
          }
        })
        
        new L.Control.HomeButton({ position: 'topleft' }).addTo(this.leafletMapInstance)

        console.log('Leaflet map initialized successfully')

        // Добавляем маркеры если есть данные
        this.updateLeafletMarkers()
      } catch (error) {
        console.error('Error initializing Leaflet map:', error)
      }
    },

    initOpenLayersMap() {
      if (!this.$refs.olMap) {
        console.error('OpenLayers map container not found')
        return
      }
      
      try {
        // Создаем векторный слой для маркеров
        this.olVectorLayer = new VectorLayer({
          source: new VectorSource(),
          style: new Style({
            image: new Circle({
              radius: 7,
              fill: new Fill({ color: 'hsl(0, 85%, 55%)' }),
              stroke: new Stroke({ color: 'white', width: 2 })
            })
          })
        })

        // Инициализация OpenLayers карты
        this.olMapInstance = new OLMap({
          target: this.$refs.olMap,
          layers: [
            new TileLayer({
              source: new OSM()
            }),
            this.olVectorLayer
          ],
          view: new View({
            center: fromLonLat([37.6173, 55.7558]), // Москва
            zoom: 6
          })
        })

        console.log('OpenLayers map initialized successfully')

        // Добавляем маркеры если есть данные
        this.updateOpenLayersMarkers()
      } catch (error) {
        console.error('Error initializing OpenLayers map:', error)
      }
    },

    updateLeafletMarkers() {
      if (!this.leafletMapInstance) return

      // Удаляем старые маркеры
      this.leafletMarkers.forEach(marker => marker.remove())
      this.leafletMarkers = []

      if (this.settlements.length === 0) return

      // Добавляем новые маркеры
      const bounds = []
      
      this.settlements.forEach(settlement => {
        if (settlement.lat && settlement.lon) {
          // Конвертируем из EPSG:3857 в EPSG:4326 (WGS84)
          const [lon, lat] = transform([settlement.lon, settlement.lat], 'EPSG:3857', 'EPSG:4326')
          
          console.log('Converting coords:', settlement.lat, settlement.lon, '->', lat, lon)
          
          // Создаем красный круглый маркер
          const redIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div class="marker-circle"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })
          
          const marker = L.marker([lat, lon], { icon: redIcon })
            .bindPopup(`
              <div class="settlement-popup">
                <h4>${settlement.name}</h4>
                <p><strong>Регион:</strong> Татарстан</p>
                <p><strong>Район:</strong> ${settlement.district || '—'}</p>
                ${settlement.population ? `<p><strong>Административная единица 1:</strong> Актанышская волость 3-го приписного участка</p>` : ''}
                ${settlement.population ? `<p><strong>Население:</strong> ${settlement.population}</p>` : ''}
              </div>
            `)
            .addTo(this.leafletMapInstance)
          
          this.leafletMarkers.push(marker)
          bounds.push([lat, lon])
        }
      })

      // Подгоняем карту под маркеры
      if (bounds.length > 0) {
        this.leafletMapInstance.fitBounds(bounds, { padding: [50, 50] })
        // Сохраняем исходные границы для кнопки Home
        if (!this.initialBounds) {
          this.initialBounds = bounds
        }
      }
    },

    updateOpenLayersMarkers() {
      if (!this.olVectorLayer) return

      const source = this.olVectorLayer.getSource()
      source.clear()

      if (this.settlements.length === 0) return

      const features = []

      this.settlements.forEach(settlement => {
        if (settlement.lat && settlement.lon) {
          // Координаты уже в EPSG:3857, создаем Point напрямую
          const feature = new Feature({
            geometry: new Point([settlement.lon, settlement.lat]),
            name: settlement.name,
            district: settlement.district,
            population: settlement.population
          })
          features.push(feature)
        }
      })

      source.addFeatures(features)

      // Подгоняем карту под маркеры
      if (features.length > 0) {
        const extent = source.getExtent()
        this.olMapInstance.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          maxZoom: 12
        })
        // Сохраняем исходный extent для кнопки Home
        if (!this.initialExtent) {
          this.initialExtent = extent
        }
      }

      // Добавляем popup при клике
      this.olMapInstance.on('click', (evt) => {
        const feature = this.olMapInstance.forEachFeatureAtPixel(evt.pixel, (f) => f)
        if (feature) {
          const coordinates = feature.getGeometry().getCoordinates()
          const name = feature.get('name')
          const district = feature.get('district')
          const population = feature.get('population')
          
          // Здесь можно добавить popup, пока просто логируем
          console.log('Clicked settlement:', { name, district, population })
        }
      })
    }
  },
  watch: {
    settlements: {
      handler(newVal) {
        console.log('Settlements updated:', newVal)
        this.updateLeafletMarkers()
        this.updateOpenLayersMarkers()
        
        // Обновляем размер карт после добавления маркеров
        this.$nextTick(() => {
          if (this.leafletMapInstance && this.$refs.leafletMap) {
            const rect = this.$refs.leafletMap.getBoundingClientRect()
            if (rect.width > 0 && rect.height > 0) {
              this.leafletMapInstance.invalidateSize()
            }
          }
          if (this.olMapInstance && this.$refs.olMap) {
            const rect = this.$refs.olMap.getBoundingClientRect()
            if (rect.width > 0 && rect.height > 0) {
              this.olMapInstance.updateSize()
            }
          }
        })
      },
      deep: true,
      immediate: true
    },
    mapProvider() {
      // Обновляем размер карт при переключении
      this.$nextTick(() => {
        setTimeout(() => {
          if (this.mapProvider === 'leaflet' && this.leafletMapInstance && this.$refs.leafletMap) {
            // Проверяем что контейнер видим
            const rect = this.$refs.leafletMap.getBoundingClientRect()
            if (rect.width > 0 && rect.height > 0) {
              this.leafletMapInstance.invalidateSize()
            }
          } else if (this.mapProvider === 'openlayers' && this.olMapInstance && this.$refs.olMap) {
            // Проверяем что контейнер видим
            const rect = this.$refs.olMap.getBoundingClientRect()
            if (rect.width > 0 && rect.height > 0) {
              this.olMapInstance.updateSize()
            }
          }
        }, 100)
      })
    }
  },
  activated() {
    // Обновляем размер карт когда компонент становится активным
    this.$nextTick(() => {
      if (this.leafletMapInstance && this.$refs.leafletMap) {
        const rect = this.$refs.leafletMap.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          this.leafletMapInstance.invalidateSize()
        }
      }
      if (this.olMapInstance && this.$refs.olMap) {
        const rect = this.$refs.olMap.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          this.olMapInstance.updateSize()
        }
      }
    })
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

    &.hidden {
      display: none;
    }
  }
}

// Стили для кастомных маркеров
:deep(.custom-marker) {
  background: transparent;
  border: none;
  
  .marker-circle {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: hsl(0, 85%, 55%);
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: transform 0.2s;
    
    &:hover {
      transform: scale(1.2);
    }
  }
}

:deep(.settlement-popup) {
  min-width: 200px;
  
  h4 {
    margin: 0 0 8px 0;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 4px;
  }
  
  p {
    margin: 4px 0;
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.4;
    
    strong {
      color: var(--text-primary);
      font-weight: 500;
    }
  }
}
</style>
