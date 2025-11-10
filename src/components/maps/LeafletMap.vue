<template>
  <div ref="leafletMap" class="leaflet-map-container"></div>
</template>

<script>
import L from 'leaflet'
import { useMapMarkers } from '@/composables/useMapMarkers.js'
import { vectorLayerService } from '@/services/vectorLayers.js'

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
      currentHighlightCircle: null
    }
  },
  mounted() {
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

      // Кнопка Home
      const self = this
      L.Control.HomeButton = L.Control.extend({
        onAdd: function(map) {
          const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control')
          btn.innerHTML = '🏠'
          btn.title = 'Вернуться к исходному виду'
          btn.style.cssText = 'background: white; width: 30px; height: 30px; cursor: pointer; border: none;'
          btn.onclick = () => self.resetView()
          return btn
        }
      })
      new L.Control.HomeButton({ position: 'topleft' }).addTo(this.mapInstance)

      // События карты
      this.mapInstance.on('moveend zoomend', () => {
        this.$emit('view-change', {
          center: this.mapInstance.getCenter(),
          zoom: this.mapInstance.getZoom()
        })
      })

      this.updateMarkers()
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

          // Используем простой popup если нет district (данные из SubtypeEstateDetails)
          const popupContent = !settlement.district 
            ? generateSimpleSettlementPopup(settlement)
            : generateSettlementPopup(settlement)

          const marker = L.marker([lat, lon], { 
            icon: customIcon,
            zIndexOffset: 1000  // Маркеры населённых пунктов всегда поверх векторных слоёв
          })
            .bindTooltip(`
              <div class="settlement-tooltip">
                <div class="tooltip-name">${settlement.name}</div>
                <div class="tooltip-district">${settlement.district || '—'}</div>
              </div>
            `, {
              direction: 'top',
              offset: [0, -18],
              opacity: 0.95,
              className: 'custom-tooltip',
              permanent: false
            })
            .bindPopup(popupContent)
            .addTo(this.mapInstance)

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
      
      // Если есть стиль в БД, используем его
      if (layer.style) {
        try {
          const style = typeof layer.style === 'string' ? JSON.parse(layer.style) : layer.style
          
          // Возвращаем стиль в зависимости от типа геометрии
          if (style.point) {
            return {
              color: style.point.strokeColor || '#ffffff',
              weight: style.point.strokeWidth || 2,
              fillColor: style.point.fillColor || '#3388ff',
              fillOpacity: 0.8,
              radius: style.point.radius || 8
            }
          }
          
          if (style.line) {
            return {
              color: style.line.strokeColor || '#3388ff',
              weight: style.line.strokeWidth || 2,
              opacity: style.line.opacity || 0.7
            }
          }
          
          if (style.polygon) {
            return {
              color: style.polygon.strokeColor || '#3388ff',
              weight: style.polygon.strokeWidth || 2,
              opacity: style.polygon.opacity || 0.7,
              fillColor: style.polygon.fillColor || '#3388ff',
              fillOpacity: style.polygon.fillOpacity || 0.3
            }
          }
        } catch (error) {
          console.error('Error parsing layer style:', error)
        }
      }
      
      // Стиль по умолчанию
      return {
        color: getLayerColor(layer.id),
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.3
      }
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

    toggleLayerVisibility(layerId, visible) {
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

  .tooltip-name {
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 1px;
    text-shadow: 
      -1px -1px 0 var(--bg-primary),
      1px -1px 0 var(--bg-primary),
      -1px 1px 0 var(--bg-primary),
      1px 1px 0 var(--bg-primary);
  }

  .tooltip-district {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
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
