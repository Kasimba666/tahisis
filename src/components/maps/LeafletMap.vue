<template>
  <div ref="leafletMap" class="leaflet-map-container"></div>
</template>

<script>
import L from 'leaflet'
import { useMapMarkers } from '@/composables/useMapMarkers.js'
import { vectorLayerService } from '@/services/vectorLayers.js'
import { HomeFilled } from '@element-plus/icons-vue'
import { h, render } from 'vue'

export default {
  name: 'LeafletMap',
  props: {
    settlements: {
      type: [Array, Object],
      default: () => []
    },
    vectorLayers: {
      type: Array,
      default: () => []
    },
    initialCenter: {
      type: Array,
      default: () => [55.42, 52.68]
    },
    initialZoom: {
      type: Number,
      default: 8
    },
    marker: {
      type: Object,
      default: null
    },
    settlementNameMode: {
      type: String,
      default: 'none'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      mapInstance: null,
      markers: [],
      vectorLayersMap: new Map(),
      currentHighlightCircle: null,
      singleMarker: null,
      markerUpdateTimeout: null
    }
  },
  mounted() {
    console.log('=== LeafletMap mounted ===')
    console.log('Props received:', {
      settlements: this.settlements,
      vectorLayers: this.vectorLayers,
      initialCenter: this.initialCenter,
      initialZoom: this.initialZoom,
      marker: this.marker,
      isActive: this.isActive
    })

    this.$nextTick(() => {
      setTimeout(() => {
        this.initMap()
      }, 100)
    })
  },
  beforeUnmount() {
    if (this.mapInstance) {
      this.mapInstance.remove()
    }
  },
  methods: {
    initMap() {
      if (!this.$refs.leafletMap) return

      const { createConcentricCirclesMarker, generateSettlementPopup } = useMapMarkers()

      this.mapInstance = L.map(this.$refs.leafletMap, {
        center: this.initialCenter,
        zoom: this.initialZoom,
        fullscreenControl: {
          pseudoFullscreen: false
        }
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.mapInstance)

      // Кнопка Home с иконкой HomeFilled
      const self = this
      L.Control.HomeButton = L.Control.extend({
        onAdd: function(map) {
          const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control home-button')
          btn.title = 'Вернуться к исходному виду'
          btn.style.cssText = 'background: white; width: 30px; height: 30px; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; padding: 0;'
          
          // Рендерим иконку HomeFilled в кнопку
          const iconContainer = document.createElement('div')
          iconContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;'
          const vnode = h(HomeFilled, { style: { width: '16px', height: '16px', color: 'hsl(0, 0%, 27%)'} })
          render(vnode, iconContainer)
          btn.appendChild(iconContainer)
          
          btn.onclick = () => self.resetView()
          return btn
        }
      })
      new L.Control.HomeButton({ position: 'topleft' }).addTo(this.mapInstance)

      // События карты
      this.mapInstance.on('moveend zoomend', () => {
        const currentCenter = this.mapInstance.getCenter()
        const currentZoom = this.mapInstance.getZoom()
        console.log(`Leaflet zoom: ${currentZoom}, center: [${currentCenter.lat.toFixed(4)}, ${currentCenter.lng.toFixed(4)}]`)

        this.$emit('view-change', {
          center: currentCenter,
          zoom: currentZoom
        })
      })

      // Прерываем tooltip анимации перед зумом во избежание ошибок
      this.mapInstance.on('zoomanim', (e) => {
        // Закрываем все открытые tooltip во время анимации зума
        this.mapInstance.eachLayer((layer) => {
          if (layer.options && layer.options.pane === 'tooltipPane') {
            this.mapInstance.closeTooltip(layer)
          }
        })
      })

      // Обновляем позицию маркеров при изменении проекции карты
      this.mapInstance.on('viewreset', () => {
        console.log('Leaflet viewreset - invalidating size')
        this.mapInstance.invalidateSize()
        // Не пересоздаём маркеры, только корректируем позицию
      })

      // Обновляем маркеры только при изменении данных, не при каждом zoom/move
      // Это предотвращает проблемы с позиционированием

      // События полноэкранного режима
      this.mapInstance.on('fullscreenchange', () => {
        const isFullscreen = this.mapInstance.isFullscreen()
        this.$emit('fullscreen-change', isFullscreen)
      })

      this.updateMarkers()
      this.updateSingleMarker()
      this.loadVectorLayers()
    },

    updateMarkers() {
      if (!this.mapInstance) return

      const { createConcentricCirclesMarker, generateSettlementPopup, generateSimpleSettlementPopup } = useMapMarkers()

      this.markers.forEach(marker => marker.remove())
      this.markers = []

      // Поддержка как массива, так и GeoJSON
      let settlementsArray = []
      if (this.settlements && this.settlements.type === 'FeatureCollection') {
        // Обработка GeoJSON
        this.settlements.features.forEach(feature => {
          const settlement = {
            ...feature.properties,
            lat: feature.geometry.coordinates[1],
            lon: feature.geometry.coordinates[0]
          }
          settlementsArray.push(settlement)
        })
      } else if (Array.isArray(this.settlements)) {
        settlementsArray = this.settlements
      }

      settlementsArray.forEach(settlement => {
        if (settlement.lat && settlement.lon) {
          const lat = parseFloat(settlement.lat)
          const lon = parseFloat(settlement.lon)

          if (isNaN(lat) || isNaN(lon)) return

          const markerElement = createConcentricCirclesMarker(settlement.estateTypes || [])

          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: markerElement,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })

          // Определяем название для отображения в зависимости от режима
          let displayName = ''
          if (this.settlementNameMode === 'old') {
            displayName = settlement.name || settlement.nameModern || ''
          } else if (this.settlementNameMode === 'modern') {
            displayName = settlement.nameModern || settlement.name || ''
          }

          // Используем простой popup если нет district (данные из SubtypeEstateDetails)
          const popupContent = !settlement.district
            ? generateSimpleSettlementPopup(settlement)
            : generateSettlementPopup(settlement)

          const marker = L.marker([lat, lon], {
            icon: customIcon,
            zIndexOffset: 1000  // Маркеры населённых пунктов всегда поверх векторных слоёв
          })

          // Добавляем tooltip только если settlementNameMode !== 'none'
          if (this.settlementNameMode !== 'none') {
            marker.bindTooltip(`
              <div class="settlement-tooltip">
                <div class="tooltip-name">${displayName}</div>
              </div>
            `, {
              direction: 'top',
              offset: [0, -18],
              opacity: 0.95,
              className: 'custom-tooltip',
              permanent: true
            })
          }

          marker.bindPopup(popupContent)
          marker.addTo(this.mapInstance)

          // Добавляем обработчик для кнопки "Детали" программно (только для полного popup)
          if (settlement.district) {
            marker.on('popupopen', () => {
              const popup = marker.getPopup()
              if (popup) {
                const detailsBtn = popup.getElement().querySelector('.popup-details-btn')
                if (detailsBtn) {
                  detailsBtn.onclick = () => {
                    window.dispatchEvent(new CustomEvent('show-settlement-details', {
                      detail: { settlement }
                    }))
                  }
                }
              }
            })
          }

          this.markers.push(marker)
        }
      })
    },

    updateSingleMarker() {
      if (!this.mapInstance) return

      // Удаляем предыдущий одиночный маркер если есть
      if (this.singleMarker) {
        this.mapInstance.removeLayer(this.singleMarker)
        this.singleMarker = null
      }

      // Если marker prop задан, создаём одиночный маркер
      if (this.marker && this.marker.lat && this.marker.lon) {
        const lat = parseFloat(this.marker.lat)
        const lon = parseFloat(this.marker.lon)

        if (isNaN(lat) || isNaN(lon)) return

        // Создаём простой круглый маркер для деталей
        const markerElement = `
          <div style="
            width: 20px;
            height: 20px;
            background: hsl(197, 100%, 50%);
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          "></div>
        `

        const customIcon = L.divIcon({
          className: 'single-marker',
          html: markerElement,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        })

        this.singleMarker = L.marker([lat, lon], {
          icon: customIcon,
          zIndexOffset: 2000  // Одиночный маркер всегда поверх всех
        })
          .bindTooltip(`
            <div class="settlement-tooltip">
              <div class="tooltip-name">${this.marker.name || 'Населённый пункт'}</div>
            </div>
          `, {
            direction: 'top',
            offset: [0, -18],
            opacity: 0.95,
            className: 'custom-tooltip',
            permanent: false
          })
          .addTo(this.mapInstance)
      }
    },

    loadVectorLayers() {
      if (!this.mapInstance || this.vectorLayers.length === 0) return

      const { getLayerColor, hslToHsla } = useMapMarkers()

      this.vectorLayers.forEach(layer => {
        if (!layer.file_url) return

        fetch(layer.file_url)
          .then(response => response.json())
          .then(geoJsonData => {
            // Получаем стиль из БД или используем стандартный
            const layerStyle = this.getLayerStyle(layer)
            
            const vectorLayer = L.geoJSON(geoJsonData, {
              style: layerStyle
            })

            // Добавляем обработчики событий для отображения названия слоя при наведении
            let currentTooltip = null

            vectorLayer.on('mouseover', (e) => {
              // Закрываем предыдущий tooltip если есть
              if (currentTooltip) {
                this.mapInstance.closeTooltip(currentTooltip)
                currentTooltip = null
              }

              const tooltipContent = `
                <div class="vector-layer-tooltip">
                  <div class="tooltip-name">${layer.name}</div>
                </div>
              `

              currentTooltip = L.tooltip({
                direction: 'top',
                offset: [0, -10],
                opacity: 0.95,
                className: 'custom-tooltip',
                permanent: false
              }).setContent(tooltipContent)

              e.layer.bindTooltip(currentTooltip).openTooltip(e.latlng)
            })

            vectorLayer.on('mouseout', (e) => {
              if (currentTooltip) {
                this.mapInstance.closeTooltip(currentTooltip)
                currentTooltip = null
              }
            })

            this.vectorLayersMap.set(layer.id, vectorLayer)

            // Добавляем слой на карту только если visible=true
            if (layer.visible !== false) {
              vectorLayer.addTo(this.mapInstance)
            }
          })
          .catch(error => console.error(`Error loading layer ${layer.name}:`, error))
      })
    },

    getLayerStyle(layer) {
      const { getLayerColor } = useMapMarkers()

      console.log('=== LeafletMap getLayerStyle ===')
      console.log('Layer ID:', layer.id, 'Name:', layer.name)
      console.log('Layer style from DB:', layer.style)

      // Если есть стиль в БД, используем его
      if (layer.style) {
        try {
          const style = typeof layer.style === 'string' ? JSON.parse(layer.style) : layer.style
          console.log('Parsed style:', style)

          // Возвращаем стиль в зависимости от типа геометрии
          if (style.point) {
            const pointStyle = {
              color: style.point.strokeColor || '#ffffff',
              weight: style.point.strokeWidth || 2,
              fillColor: style.point.fillColor || '#3388ff',
              fillOpacity: 0.8,
              radius: style.point.radius || 8
            }
            console.log('Applying point style:', pointStyle)
            return pointStyle
          }

          if (style.line) {
            const lineStyle = {
              color: style.line.strokeColor || '#3388ff',
              weight: style.line.strokeWidth || 2,
              opacity: style.line.opacity || 0.7
            }
            console.log('Applying line style:', lineStyle)
            return lineStyle
          }

          if (style.polygon) {
            const polygonStyle = {
              color: style.polygon.strokeColor || '#3388ff',
              weight: style.polygon.strokeWidth || 2,
              opacity: style.polygon.opacity || 0.7,
              fillColor: style.polygon.fillColor || '#3388ff',
              fillOpacity: style.polygon.fillOpacity || 0.3
            }
            console.log('Applying polygon style:', polygonStyle)
            return polygonStyle
          }
        } catch (error) {
          console.error('Error parsing layer style:', error)
        }
      }

      // Стиль по умолчанию
      const defaultStyle = {
        color: getLayerColor(layer.id),
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.3
      }
      console.log('Applying default style:', defaultStyle)
      return defaultStyle
    },

    resetView() {
      if (this.mapInstance) {
        this.mapInstance.setView(this.initialCenter, this.initialZoom)
      }
    },

    syncView(center, zoom) {
      if (this.mapInstance && center && zoom) {
        this.mapInstance.setView([center.lat, center.lng], zoom)
      }
    },

    invalidateSize() {
      if (this.mapInstance) {
        this.$nextTick(() => {
          this.mapInstance.invalidateSize()
        })
      }
    },

    highlightSettlement(lat, lon, name) {
      if (!this.mapInstance) return

      // Удаляем предыдущий круг выделения если есть
      this.clearHighlight()

      // НЕ центрируем карту - оставляем в положении Home
      // Просто добавляем пульсирующий круг-выделение
      const pulseCircle = L.circle([lat, lon], {
        color: 'hsl(197, 100%, 50%)',
        fillColor: 'hsl(197, 100%, 50%)',
        fillOpacity: 0.3,
        radius: 150,
        className: 'pulse-circle'
      }).addTo(this.mapInstance)

      // Сохраняем ссылку на текущий круг
      this.currentHighlightCircle = pulseCircle

      // Удаляем круг через 3 секунды
      setTimeout(() => {
        if (this.currentHighlightCircle === pulseCircle) {
          this.mapInstance.removeLayer(pulseCircle)
          this.currentHighlightCircle = null
        }
      }, 3000)
    },

    clearHighlight() {
      if (this.currentHighlightCircle && this.mapInstance) {
        this.mapInstance.removeLayer(this.currentHighlightCircle)
        this.currentHighlightCircle = null
      }
    },

    toggleOsmLayer(visible) {
      if (!this.mapInstance) return
      
      // Находим OSM слой
      this.mapInstance.eachLayer((layer) => {
        if (layer instanceof L.TileLayer && layer.options.attribution && 
            layer.options.attribution.includes('OpenStreetMap')) {
          if (visible) {
            if (!this.mapInstance.hasLayer(layer)) {
              this.mapInstance.addLayer(layer)
            }
          } else {
            this.mapInstance.removeLayer(layer)
          }
        }
      })
    },

    toggleLayerVisibility(layerId, visible) {
      // Специальная обработка для OSM
      if (layerId === 'osm') {
        this.toggleOsmLayer(visible)
        return
      }

      const layer = this.vectorLayersMap.get(layerId)
      if (layer) {
        if (visible) {
          this.mapInstance.addLayer(layer)
        } else {
          this.mapInstance.removeLayer(layer)
        }
      }
    },

    getView() {
      if (this.mapInstance) {
        const center = this.mapInstance.getCenter()
        const zoom = this.mapInstance.getZoom()
        return {
          center: { lat: center.lat, lng: center.lng },
          zoom
        }
      }
      return null
    }
  },
  watch: {
    settlements: {
      handler() {
        this.updateMarkers()
      },
      deep: true
    },
    marker: {
      handler() {
        this.updateSingleMarker()
      },
      deep: true
    },
    settlementNameMode: {
      handler() {
        this.updateMarkers()
      }
    },
    vectorLayers: {
      handler(newLayers, oldLayers) {
        // Перезагружаем слои при изменении данных
        if (this.mapInstance && newLayers && newLayers.length > 0) {
          // Очищаем старые векторные слои
          this.vectorLayersMap.forEach(layer => {
            if (this.mapInstance.hasLayer(layer)) {
              this.mapInstance.removeLayer(layer)
            }
          })
          this.vectorLayersMap.clear()

          // Загружаем новые векторные слои
          this.loadVectorLayers()
        }
      },
      deep: true
    },
    isActive(newVal) {
      if (newVal) {
        this.invalidateSize()
      }
    }
  }
}
</script>

<style scoped lang="scss">
.leaflet-map-container {
  width: 100%;
  height: 100%;
}

// Анимация пульсации для круга выделения
@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

:deep(.pulse-circle) {
  animation: pulse 1s ease-in-out infinite;
}

// Стили для кнопки Home
:deep(.leaflet-control.home-button) {
  margin-top: 1px !important;
  border: 1px solid hsl(0, 0%, 27%) !important;
  transition: none !important;
  
  svg {
    width: 16px !important;
    height: 16px !important;
  }
}

:deep(.custom-marker) {
  background: transparent;
  border: none;

  .pie-marker {
    cursor: pointer;
    transition: transform 0.2s;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));

    &:hover {
      transform: scale(1.2);
    }

    svg {
      display: block;
    }
  }
}

:deep(.leaflet-tooltip.custom-tooltip) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  
  &::before {
    display: none;
  }
}

:deep(.settlement-tooltip) {
  padding: 2px 4px;
  background: transparent;
  border: none;
  font-size: 12px;
  pointer-events: none;
  font-weight: normal;

  .tooltip-name {
    font-weight: normal;
    color: black;
    margin-bottom: 1px;
    text-shadow: none;
  }

  .tooltip-district {
    font-size: 11px;
    font-weight: normal;
    color: black;
    text-shadow: none;
  }
}

:deep(.vector-layer-tooltip) {
  padding: 2px 4px;
  background: transparent;
  border: none;
  font-size: 12px;
  pointer-events: none;

  .tooltip-name {
    font-weight: 700;
    color: var(--text-primary);
    text-shadow:
      -1px -1px 0 var(--bg-primary),
      1px -1px 0 var(--bg-primary),
      -1px 1px 0 var(--bg-primary),
      1px 1px 0 var(--bg-primary);
  }
}

:deep(.leaflet-popup-content-wrapper) {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

:deep(.leaflet-popup-tip) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
}

:deep(.settlement-popup-new) {
  min-width: 200px;
  max-width: 300px;

  .popup-field {
    margin: 2px 0;
    font-size: 12px;
    color: var(--text-primary);
    line-height: 1.3;

    &.popup-field-modern {
      font-style: italic;
      color: var(--text-secondary);
      font-size: 11px;
    }
  }

  .popup-estates {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid var(--border-color);
    max-height: 200px;
    overflow-y: auto;

    .popup-estate-item {
      font-size: 11px;
      color: var(--text-secondary);
      margin: 2px 0;
      line-height: 1.4;
      padding: 2px 0;
    }

    .popup-estate-total {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid var(--border-color);
    }
  }

  .popup-actions {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
    text-align: center;

    .popup-details-btn {
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 500;
      color: var(--text-primary);
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--bg-hover);
        border-color: var(--accent-primary);
      }
    }
  }
}
</style>
