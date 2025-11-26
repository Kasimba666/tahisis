<template>
  <div ref="olMap" class="openlayers-map-container"></div>
</template>

<script>
import { Map as OLMap, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Heatmap from 'ol/layer/Heatmap'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import Polygon from 'ol/geom/Polygon'
import LineString from 'ol/geom/LineString'
import MultiPoint from 'ol/geom/MultiPoint'
import MultiPolygon from 'ol/geom/MultiPolygon'
import MultiLineString from 'ol/geom/MultiLineString'
import { Style, Circle, Fill, Stroke } from 'ol/style'
import { fromLonLat, transform } from 'ol/proj'
import Overlay from 'ol/Overlay'
import Control from 'ol/control/Control'
import FullScreen from 'ol/control/FullScreen'
import ScaleLine from 'ol/control/ScaleLine'
import { useMapMarkers } from '@/composables/useMapMarkers.js'
import { estateTypesService } from '@/services/estateTypes.js'
import { HomeFilled } from '@element-plus/icons-vue'
import { h, render } from 'vue'

export default {
  name: 'OpenLayersMap',
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
      default: () => [52.68, 55.42]
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
      vectorLayer: null,
      vectorLayersMap: new Map(),
      popupOverlay: null,
      tooltipOverlay: null,
      currentHighlightLayer: null,
      singleMarkerLayer: null,
      settlementLabelOverlays: [],
      heatmapLayer: null
    }
  },
  mounted() {
    console.log('=== OpenLayersMap MOUNTED ===')
    console.log('refs.olMap:', this.$refs.olMap)
    console.log('settlements prop:', this.settlements?.length || 0)
    console.log('isActive prop:', this.isActive)
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
      this.mapInstance.setTarget(null)
    }
  },
  methods: {
    initMap() {
      console.log('=== OpenLayersMap initMap ===')
      console.log('refs.olMap exists:', !!this.$refs.olMap)
      
      if (!this.$refs.olMap) {
        console.error('No olMap ref!')
        return
      }

      try {
        // Векторный слой для маркеров населённых пунктов
        this.vectorLayer = new VectorLayer({
          source: new VectorSource(),
          zIndex: 1000  // Маркеры населённых пунктов всегда поверх векторных слоёв
        })
        console.log('Vector layer created')

        this.mapInstance = new OLMap({
          target: this.$refs.olMap,
          layers: [
            new TileLayer({ source: new OSM() }),
            this.vectorLayer
          ],
          view: new View({
            center: fromLonLat(this.initialCenter),
            zoom: this.initialZoom
          })
        })
        console.log('Map instance created')

        this.createHomeButton()
        
        // Добавляем FullScreen контрол в левый верхний угол
        const fullScreenControl = new FullScreen({
          tipLabel: 'Полноэкранный режим'
        })
        this.mapInstance.addControl(fullScreenControl)

        // Добавляем ScaleLine контрол в левый нижний угол
        const scaleLineControl = new ScaleLine({
          target: null,
          units: 'metric'
        })
        this.mapInstance.addControl(scaleLineControl)

        this.createPopupOverlays()
        this.setupEventHandlers()

        // Добавляем обработчик событий полноэкранного режима
        this.setupFullscreenEvents()

        console.log('Calling updateMarkers with', this.settlements?.length || 0, 'settlements')
        this.updateMarkers()
        this.updateSingleMarker()
        this.loadVectorLayers()

        console.log('=== OpenLayersMap initialization complete ===')
      } catch (error) {
        console.error('Error in initMap:', error)
      }
    },

    createHomeButton() {
      const self = this
      
      // Создаём кнопку
      const button = document.createElement('button')
      button.title = 'Вернуться к исходному виду'
      button.type = 'button'
      
      // Рендерим иконку HomeFilled
      const iconContainer = document.createElement('div')
      iconContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;'
      const vnode = h(HomeFilled, { style: { width: '14px', height: '14px', color: '#409eff' } })
      render(vnode, iconContainer)
      button.appendChild(iconContainer)
      
      button.addEventListener('click', () => self.resetView(), false)
      
      // Создаём элемент контрола
      const element = document.createElement('div')
      element.className = 'ol-home ol-unselectable ol-control'
      element.appendChild(button)
      
      // Создаём контрол используя встроенный класс Control
      const homeControl = new Control({

        element: element
      })
      
      // Добавляем контрол на карту
      this.mapInstance.addControl(homeControl)
    },

    createPopupOverlays() {
      const { generateSettlementPopup } = useMapMarkers()

      // Popup
      const popupEl = document.createElement('div')
      popupEl.className = 'ol-popup'
      
      // Добавляем кнопку закрытия
      const closeBtn = document.createElement('button')
      closeBtn.className = 'ol-popup-close'
      closeBtn.innerHTML = '×'
      closeBtn.title = 'Закрыть'
      closeBtn.onclick = () => {
        this.popupOverlay.setPosition(undefined)
      }
      popupEl.appendChild(closeBtn)
      
      // Контейнер для контента
      const contentDiv = document.createElement('div')
      contentDiv.className = 'ol-popup-content'
      popupEl.appendChild(contentDiv)
      
      this.$refs.olMap.appendChild(popupEl)
      
      this.popupOverlay = new Overlay({
        element: popupEl,
        offset: [0, -10],
        positioning: 'bottom-center',
        stopEvent: true
      })
      this.mapInstance.addOverlay(this.popupOverlay)

      // Tooltip
      const tooltipEl = document.createElement('div')
      tooltipEl.className = 'ol-tooltip'
      this.$refs.olMap.appendChild(tooltipEl)

      this.tooltipOverlay = new Overlay({
        element: tooltipEl,
        offset: [0, -8],
        positioning: 'bottom-center',
        stopEvent: false
      })
      this.mapInstance.addOverlay(this.tooltipOverlay)
    },

    setupFullscreenEvents() {
      // Находим FullScreen контрол и добавляем обработчики событий
      const controls = this.mapInstance.getControls().getArray()
      const fullScreenControl = controls.find(control => control instanceof FullScreen)

      if (fullScreenControl) {
        // Слушаем события изменения полноэкранного режима
        fullScreenControl.on('enterfullscreen', () => {
          this.$emit('fullscreen-change', true)
        })

        fullScreenControl.on('leavefullscreen', () => {
          this.$emit('fullscreen-change', false)
        })
      }
    },

    setupEventHandlers() {
      const { generateSettlementPopup, generateSimpleSettlementPopup } = useMapMarkers()

      this.mapInstance.on('singleclick', (evt) => {
        let shown = false
        this.mapInstance.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
          // Проверяем, является ли слой слоем маркеров населённых пунктов (не векторным слоем)
          const isSettlementLayer = layer === this.vectorLayer

          if (isSettlementLayer) {
            const settlement = {
              name: feature.get('name') || '—',
              nameModern: feature.get('nameModern'),
              district: feature.get('district'),
              volost: feature.get('volost'),
              landowner: feature.get('landowner'),
              militaryUnit: feature.get('militaryUnit'),
              male: feature.get('male') || 0,
              female: feature.get('female') || 0,
              maleCount: feature.get('maleCount') || 0,
              femaleCount: feature.get('femaleCount') || 0,
              totalCount: feature.get('totalCount') || 0,
              estates: feature.get('estates') || []
            }

            const contentDiv = this.popupOverlay.getElement().querySelector('.ol-popup-content')
            // Используем простой popup если нет district (данные из SubtypeEstateDetails)
            if (!settlement.district) {
              contentDiv.innerHTML = generateSimpleSettlementPopup(settlement)
            } else {
              contentDiv.innerHTML = generateSettlementPopup(settlement)
            }

            // Добавляем обработчик для кнопки "Детали" программно
            const detailsBtn = contentDiv.querySelector('.popup-details-btn')
            if (detailsBtn) {
              detailsBtn.onclick = () => {
                console.log('OpenLayers popup: Details button clicked', settlement)
                window.dispatchEvent(new CustomEvent('show-settlement-details', {
                  detail: { settlement }
                }))
              }
            }

            this.popupOverlay.setPosition(evt.coordinate)
            shown = true
            return true
          }
          // Для векторных слоёв не показываем popup, только tooltip при наведении
        })

        if (!shown) {
          this.popupOverlay.setPosition(undefined)
        }
      })

      this.mapInstance.on('pointermove', (evt) => {
        const hit = this.mapInstance.hasFeatureAtPixel(evt.pixel)
        this.$refs.olMap.style.cursor = hit ? 'pointer' : 'default'

        if (hit) {
          let tooltipShown = false

          this.mapInstance.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
            // Проверяем, является ли слой векторным слоем (не маркерами населённых пунктов)
            const isVectorLayer = Array.from(this.vectorLayersMap.values()).includes(layer)

            if (isVectorLayer) {
              // Находим название слоя по layer объекту
              const layerEntry = Array.from(this.vectorLayersMap.entries()).find(([id, vectorLayer]) => vectorLayer === layer)
              if (layerEntry) {
                const [layerId, vectorLayer] = layerEntry
                const layerData = this.vectorLayers.find(l => l.id === layerId)
                if (layerData) {
                  this.tooltipOverlay.getElement().innerHTML = `
                    <div class="vector-layer-tooltip">
                      <div class="tooltip-name">${layerData.name}</div>
                    </div>
                  `
                  this.tooltipOverlay.setPosition(evt.coordinate)
                  tooltipShown = true
                  return true
                }
              }
            } else {
              // Обработка маркеров населённых пунктов
              const name = feature.get('name') || ''
              const district = feature.get('district') || ''
              this.tooltipOverlay.getElement().innerHTML = `
                <div class="settlement-tooltip">
                  <div class="tooltip-name">${name}</div>
                  <div class="tooltip-district">${district}</div>
                </div>
              `
              this.tooltipOverlay.setPosition(evt.coordinate)
              tooltipShown = true
              return true
            }
          })

          if (!tooltipShown) {
            this.tooltipOverlay.setPosition(undefined)
          }
        } else {
          this.tooltipOverlay.setPosition(undefined)
        }
      })

      this.mapInstance.on('moveend', () => {
        const view = this.mapInstance.getView()
        const center = transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326')
        const currentZoom = view.getZoom()
        console.log(`OpenLayers zoom: ${currentZoom}, center: [${center[1].toFixed(4)}, ${center[0].toFixed(4)}]`)

        this.$emit('view-change', {
          center: { lat: center[1], lng: center[0] },
          zoom: currentZoom
        })
      })
    },

    updateMarkers() {
      console.log('=== OpenLayers updateMarkers ===')
      console.log('vectorLayer exists:', !!this.vectorLayer)
      console.log('settlements length:', this.settlements?.length || 0)

      if (!this.vectorLayer) {
        console.warn('No vectorLayer in updateMarkers')
        return
      }

      const source = this.vectorLayer.getSource()
      source.clear()

      // Очищаем старые settlement labels
      this.clearSettlementLabels()

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
        console.log('Converted GeoJSON to array:', settlementsArray.length, 'settlements')
      } else if (Array.isArray(this.settlements)) {
        settlementsArray = this.settlements
        console.log('Using array directly:', settlementsArray.length, 'settlements')
      }

      let addedCount = 0
      settlementsArray.forEach(settlement => {
        if (settlement.lat && settlement.lon) {
          const lat = parseFloat(settlement.lat)
          const lon = parseFloat(settlement.lon)

          if (isNaN(lat) || isNaN(lon)) {
            console.warn('Invalid coordinates:', settlement)
            return
          }

          const [x, y] = fromLonLat([lon, lat])
          const estateTypes = settlement.estateTypes || []

          const feature = new Feature({
            geometry: new Point([x, y]),
            name: settlement.name,
            nameModern: settlement.nameModern,
            district: settlement.district,
            volost: settlement.volost,
            landowner: settlement.landowner,
            militaryUnit: settlement.militaryUnit,
            male: settlement.male,
            female: settlement.female,
            maleCount: settlement.maleCount,
            femaleCount: settlement.femaleCount,
            totalCount: settlement.totalCount,
            estates: settlement.estates || []
          })

          const styles = this.createMarkerStyle(estateTypes)
          feature.setStyle(styles)
          source.addFeature(feature)

          // Создаем текстовую label над маркером если settlementNameMode !== 'none'
          if (this.settlementNameMode !== 'none') {
            this.createSettlementTextLabel(settlement, [x, y])
          }

          addedCount++
        }
      })

      console.log('Added markers count:', addedCount)
      console.log('Total features in source:', source.getFeatures().length)
    },

    createMarkersWithDefaultStyle() {
      console.log('=== createMarkersWithDefaultStyle: Using gray default style ===')

      if (!this.vectorLayer) return

      const source = this.vectorLayer.getSource()
      source.clear()

      // Очищаем старые settlement labels
      this.clearSettlementLabels()

      // Создаем маркеры с серым цветом по умолчанию
      let settlementsArray = []
      if (this.settlements && this.settlements.type === 'FeatureCollection') {
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

      let addedCount = 0
      settlementsArray.forEach(settlement => {
        if (settlement.lat && settlement.lon) {
          const lat = parseFloat(settlement.lat)
          const lon = parseFloat(settlement.lon)

          if (isNaN(lat) || isNaN(lon)) return

          const [x, y] = fromLonLat([lon, lat])

          const feature = new Feature({
            geometry: new Point([x, y]),
            name: settlement.name,
            nameModern: settlement.nameModern,
            district: settlement.district,
            estates: settlement.estates || []
          })

          // СЕРЫЙ стиль по умолчанию
          const defaultStyle = new Style({
            image: new Circle({
              radius: 8,
              fill: new Fill({ color: 'transparent' }),
              stroke: new Stroke({ color: 'hsl(0, 0%, 60%)', width: 3 })
            })
          })

          feature.setStyle(defaultStyle)
          source.addFeature(feature)

          // Создаем текстовую label если включено
          if (this.settlementNameMode !== 'none') {
            this.createSettlementTextLabel(settlement, [x, y])
          }

          addedCount++
        }
      })

      console.log('Created default markers count:', addedCount)
    },

    updateSingleMarker() {
      if (!this.mapInstance) return

      // Удаляем предыдущий одиночный маркер если есть
      if (this.singleMarkerLayer) {
        this.mapInstance.removeLayer(this.singleMarkerLayer)
        this.singleMarkerLayer = null
      }

      // Если marker prop задан, создаём одиночный маркер
      if (this.marker && this.marker.lat && this.marker.lon) {
        const lat = parseFloat(this.marker.lat)
        const lon = parseFloat(this.marker.lon)

        if (isNaN(lat) || isNaN(lon)) return

        const [x, y] = fromLonLat([lon, lat])

        const markerFeature = new Feature({
          geometry: new Point([x, y]),
          name: this.marker.name || 'Населённый пункт'
        })

        // Стиль для одиночного маркера - синий круг
        const markerStyle = new Style({
          image: new Circle({
            radius: 10,
            fill: new Fill({ color: 'hsl(197, 100%, 50%)' }),
            stroke: new Stroke({
              color: 'white',
              width: 3
            })
          })
        })

        markerFeature.setStyle(markerStyle)

        const markerSource = new VectorSource({
          features: [markerFeature]
        })

        this.singleMarkerLayer = new VectorLayer({
          source: markerSource,
          zIndex: 2000  // Одиночный маркер всегда поверх всех
        })

        this.mapInstance.addLayer(this.singleMarkerLayer)
      }
    },

    createMarkerStyle(estateTypes) {
      if (!estateTypes || estateTypes.length === 0) {
        return new Style({
          image: new Circle({
            radius: 8,
            fill: new Fill({ color: 'transparent' }),
            stroke: new Stroke({ color: 'hsl(0, 0%, 60%)', width: 3 })
          })
        })
      }

      // Проверяем что у каждого типа есть цвет через сервис
      const estateTypesWithValidColors = estateTypes.filter(type => {
        if (!type.id) return false
        return estateTypesService.getColorById(type.id) !== null
      })

      // Если нет типов с валидными цветами, создаем серый маркер
      if (estateTypesWithValidColors.length === 0) {
        console.warn('No valid colors found for settlement estate types:', estateTypes)
        return new Style({
          image: new Circle({
            radius: 8,
            fill: new Fill({ color: 'transparent' }),
            stroke: new Stroke({ color: 'hsl(0, 0%, 60%)', width: 3 })
          })
        })
      }

      const totalPopulation = estateTypesWithValidColors.reduce((sum, type) => sum + type.population, 0)
      const minRadius = 2.5
      const maxRadius = 12
      const normalizedPopulation = Math.min(Math.max(totalPopulation - 10, 0) / 990, 1)
      const radius = minRadius + (maxRadius - minRadius) * normalizedPopulation

      if (estateTypesWithValidColors.length === 1) {
        const color = estateTypesService.getColorById(estateTypesWithValidColors[0].id) || 'hsl(0, 0%, 60%)'
        return new Style({
          image: new Circle({
            radius,
            fill: new Fill({ color: 'transparent' }),
            stroke: new Stroke({ color: color, width: 3 })
          })
        })
      }

      return new Style({
        renderer: (coordinates, state) => {
          const ctx = state.context
          const x = coordinates[0]
          const y = coordinates[1]

          ctx.save()
          ctx.translate(x, y)

          const segmentAngle = (2 * Math.PI) / estateTypesWithValidColors.length

          estateTypesWithValidColors.forEach((type, index) => {
            const color = estateTypesService.getColorById(type.id) || 'hsl(0, 0%, 60%)'
            const startAngle = -Math.PI / 2 + (index * segmentAngle)
            const endAngle = -Math.PI / 2 + ((index + 1) * segmentAngle)

            ctx.beginPath()
            ctx.arc(0, 0, radius, startAngle, endAngle, false)
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.lineCap = 'butt'
            ctx.stroke()
          })

          ctx.restore()
        }
      })
    },

    loadVectorLayers() {
      if (!this.mapInstance || this.vectorLayers.length === 0) return

      this.vectorLayers.forEach(layer => {
        if (!layer.file_url) return

        fetch(layer.file_url)
          .then(response => response.json())
          .then(geoJsonData => {
            const vectorSource = new VectorSource()
            const layerStyle = this.getLayerStyle(layer)

            const vectorLayer = new VectorLayer({
              source: vectorSource,
              style: layerStyle
            })

            if (geoJsonData.features) {
              geoJsonData.features.forEach(feature => {
                const olFeature = new Feature({
                  geometry: this.geoJsonToOL(feature.geometry)
                })
                vectorSource.addFeature(olFeature)
              })
            }

            this.vectorLayersMap.set(layer.id, vectorLayer)
            
            // Добавляем слой на карту только если visible=true
            if (layer.visible !== false) {
              this.mapInstance.addLayer(vectorLayer)
            }
          })
          .catch(error => console.error(`Error loading layer ${layer.name}:`, error))
      })
    },

    getLayerStyle(layer) {
      const { getLayerColor, hslToHsla } = useMapMarkers()
      
      // Если есть стиль в БД, используем его
      if (layer.style) {
        try {
          const style = typeof layer.style === 'string' ? JSON.parse(layer.style) : layer.style
          
          // Стиль для Point
          if (style.point) {
            return new Style({
              image: new Circle({
                radius: style.point.radius || 8,
                fill: new Fill({ color: style.point.fillColor || '#3388ff' }),
                stroke: new Stroke({
                  color: style.point.strokeColor || '#ffffff',
                  width: style.point.strokeWidth || 2
                })
              })
            })
          }
          
          // Стиль для LineString
          if (style.line) {
            const strokeColor = style.line.strokeColor || '#3388ff'
            const strokeOpacity = style.line.opacity !== undefined ? style.line.opacity : 0.7
            
            return new Style({
              stroke: new Stroke({
                color: hslToHsla(strokeColor, strokeOpacity),
                width: style.line.strokeWidth || 2
              })
            })
          }
          
          // Стиль для Polygon  
          if (style.polygon) {
            // Применяем opacity к strokeColor
            const strokeColor = style.polygon.strokeColor || '#3388ff'
            const strokeOpacity = style.polygon.opacity !== undefined ? style.polygon.opacity : 0.7
            
            return new Style({
              stroke: new Stroke({
                color: hslToHsla(strokeColor, strokeOpacity),
                width: style.polygon.strokeWidth || 2
              }),
              fill: new Fill({
                color: hslToHsla(style.polygon.fillColor || '#3388ff', style.polygon.fillOpacity || 0.3)
              })
            })
          }
        } catch (error) {
          console.error('Error parsing layer style:', error)
        }
      }
      
      // Стиль по умолчанию
      const layerColor = getLayerColor(layer.id)
      return new Style({
        stroke: new Stroke({ color: layerColor, width: 2 }),
        fill: new Fill({ color: hslToHsla(layerColor, 0.3) })
      })
    },

    geoJsonToOL(geometry) {
      if (!geometry) return null

      switch (geometry.type) {
        case 'Point':
          return new Point(fromLonLat(geometry.coordinates))
        case 'MultiPoint':
          return new MultiPoint(geometry.coordinates.map(coords => fromLonLat(coords)))
        case 'LineString':
          return new LineString(geometry.coordinates.map(coords => fromLonLat(coords)))
        case 'MultiLineString':
          return new MultiLineString(geometry.coordinates.map(line => line.map(coords => fromLonLat(coords))))
        case 'Polygon':
          return new Polygon(geometry.coordinates.map(ring => ring.map(coords => fromLonLat(coords))))
        case 'MultiPolygon':
          return new MultiPolygon(geometry.coordinates.map(polygon => polygon.map(ring => ring.map(coords => fromLonLat(coords)))))
        default:
          return null
      }
    },

    resetView() {
      if (this.mapInstance) {
        this.mapInstance.getView().setCenter(fromLonLat(this.initialCenter))
        this.mapInstance.getView().setZoom(this.initialZoom)
      }
    },

    syncView(center, zoom) {
      if (this.mapInstance && center && zoom) {
        this.mapInstance.getView().setCenter(fromLonLat([center.lng, center.lat]))
        this.mapInstance.getView().setZoom(zoom)
      }
    },

    updateSize() {
      if (this.mapInstance) {
        this.$nextTick(() => {
          this.mapInstance.updateSize()
        })
      }
    },

    highlightSettlement(lat, lon, name) {
      if (!this.mapInstance) return

      // Удаляем предыдущую обводку если есть
      this.clearHighlight()

      const coordinates = fromLonLat([lon, lat])

      // НЕ центрируем карту - оставляем в положении Home
      // Создаём пульсирующий круг с анимацией
      const pulseFeature = new Feature({
        geometry: new Point(coordinates)
      })

      // Параметры анимации
      let startTime = Date.now()
      const duration = 3000 // 3 секунды
      const baseRadius = 25
      const maxRadius = 35
      const minOpacity = 0.2
      const maxOpacity = 0.5

      const pulseSource = new VectorSource({ features: [pulseFeature] })
      const pulseLayer = new VectorLayer({ 
        source: pulseSource,
        zIndex: 1000 // Высокий z-index чтобы быть поверх всего
      })
      
      // Сохраняем ссылку на текущий слой
      this.currentHighlightLayer = pulseLayer
      this.mapInstance.addLayer(pulseLayer)

      // Анимация пульсации через requestAnimationFrame
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = (elapsed % 1000) / 1000 // Цикл каждую секунду
        
        // Синусоидальная пульсация
        const sin = Math.sin(progress * Math.PI * 2)
        const radius = baseRadius + (maxRadius - baseRadius) * (sin + 1) / 2
        const opacity = minOpacity + (maxOpacity - minOpacity) * (sin + 1) / 2

        // Обновляем стиль
        pulseFeature.setStyle(new Style({
          image: new Circle({
            radius: radius,
            fill: new Fill({ color: `hsla(197, 100%, 50%, ${opacity})` }),
            stroke: new Stroke({ 
              color: 'hsl(197, 100%, 50%)', 
              width: 3 
            })
          })
        }))

        // Продолжаем анимацию или удаляем слой
        if (elapsed < duration) {
          requestAnimationFrame(animate)
        } else {
          this.mapInstance.removeLayer(pulseLayer)
          // Очищаем ссылку если это всё ещё текущий слой
          if (this.currentHighlightLayer === pulseLayer) {
            this.currentHighlightLayer = null
          }
        }
      }

      // Запускаем анимацию
      requestAnimationFrame(animate)
    },

    clearHighlight() {
      if (this.currentHighlightLayer && this.mapInstance) {
        this.mapInstance.removeLayer(this.currentHighlightLayer)
        this.currentHighlightLayer = null
      }
    },

    toggleOsmLayer(visible) {
      if (!this.mapInstance) return

      // Находим OSM слой (TileLayer с OSM source)
      const layers = this.mapInstance.getLayers().getArray()
      const osmLayer = layers.find(layer => layer instanceof TileLayer && layer.getSource() instanceof OSM)

      if (osmLayer) {
        osmLayer.setVisible(visible)
      }
    },

    toggleHeatmapLayer(visible, settings = null) {
      console.log('OpenLayersMap: toggle heatmap visibility to', visible, 'settings:', settings)

      if (!this.mapInstance) return

      if (visible) {
        // Удаляем существующий heatmap слой если есть
        if (this.heatmapLayer) {
          this.mapInstance.removeLayer(this.heatmapLayer)
        }

        // Подготавливаем данные для тепловой карты
        const heatmapFeatures = this.prepareHeatmapFeatures()

        // Создаём тепловую карту с использованием ol/layer/Heatmap
        const heatmapSource = new VectorSource({
          features: heatmapFeatures
        })

        // Используем настройки или значения по умолчанию
        const radius = settings?.radius || 12
        const blur = settings?.blur || 20
        const intensity = settings?.intensity || 1.0
        const colorPalette = settings?.colorPalette || 'red-yellow'

        console.log(`Создаём heatmap с радиусом ${radius}px, размытием ${blur}px, интенсивностью ${intensity}, палитрой ${colorPalette}`)

        // Получаем градиент в зависимости от выбранной палитры
        const gradient = this.getHeatmapGradient(colorPalette)

        this.heatmapLayer = new Heatmap({
          source: heatmapSource,
          blur: blur,
          radius: radius,
          gradient: gradient,
          zIndex: 500      // под маркерами
        })

        // Применяем интенсивность к градиенту (номерверт weight features)
        if (intensity !== 1.0) {
          // Модифицируем веса features для интенсивности
          const features = heatmapSource.getFeatures()
          features.forEach(feature => {
            const weight = feature.get('weight')
            if (weight) {
              feature.set('weight', weight * intensity)
            }
          })
        }

        // Добавляем слой на карту
        this.mapInstance.addLayer(this.heatmapLayer)

        console.log(`Показать тепловую карту для ${heatmapFeatures.length} поселений`)
      } else {
        // Скрываем и удаляем тепловую карту
        if (this.heatmapLayer) {
          this.mapInstance.removeLayer(this.heatmapLayer)
          this.heatmapLayer = null
        }
        console.log('Скрыть тепловую карту поселений в OpenLayers')
      }
    },

    toggleLayerVisibility(layerId, visible) {
      // Специальная обработка для OSM
      if (layerId === 'osm') {
        this.toggleOsmLayer(visible)
        return
      }

      // Специальная обработка для тепловой карты
      if (layerId === 'heatmap') {
        this.toggleHeatmapLayer(visible)
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
        const view = this.mapInstance.getView()
        const center = transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326')
        return {
          center: { lat: center[1], lng: center[0] },
          zoom: view.getZoom()
        }
      }
      return null
    },

    getHeatmapGradient(palette) {
      // Возвращает массив цветов для градиента OpenLayers heatmap в формате CSS RGBA строк
      switch (palette) {
        case 'red-yellow':
          // Красно-жёлтый градиент (по умолчанию)
          return [
            'rgba(0, 0, 0, 0)',       // Прозрачный
            'rgba(255, 0, 0, 0.5)',   // Красный полупрозрачный
            'rgba(255, 255, 0, 0.8)', // Жёлтый
            'rgba(255, 255, 0, 1)'    // Жёлтый непрозрачный
          ]

        case 'blue-green':
          // Синий-зелёный градиент
          return [
            'rgba(0, 0, 0, 0)',         // Прозрачный
            'rgba(0, 0, 255, 0.5)',     // Синий полупрозрачный
            'rgba(0, 128, 128, 0.7)',   // Циан
            'rgba(0, 255, 0, 0.9)',     // Зелёный
            'rgba(128, 255, 128, 1)'    // Светло-зелёный
          ]

        case 'purple-orange':
          // Фиолетовый-оранжевый градиент
          return [
            'rgba(0, 0, 0, 0)',         // Прозрачный
            'rgba(128, 0, 128, 0.5)',   // Фиолетовый полупрозрачный
            'rgba(204, 51, 204, 0.7)', // Светло-фиолетовый
            'rgba(255, 128, 0, 0.9)',  // Оранжевый
            'rgba(255, 204, 0, 1)'     // Жёлто-оранжевый
          ]

        case 'blue-red':
          // Синий-красный градиент
          return [
            'rgba(0, 0, 0, 0)',           // Прозрачный
            'rgba(0, 0, 255, 0.5)',     // Синий полупрозрачный
            'rgba(51, 51, 255, 0.7)',  // Светло-синий
            'rgba(204, 51, 51, 0.8)',  // Светло-красный
            'rgba(255, 0, 0, 1)'       // Красный
          ]

        case 'green-red':
          // Зелёный-красный градиент
          return [
            'rgba(0, 0, 0, 0)',         // Прозрачный
            'rgba(0, 77, 0, 0.5)',      // Тёмно-зелёный полупрозрачный
            'rgba(0, 255, 0, 0.7)',     // Зелёный
            'rgba(255, 255, 0, 0.8)',   // Жёлтый
            'rgba(255, 0, 0, 0.9)',     // Красный
            'rgba(204, 0, 0, 1)'        // Тёмно-красный
          ]

        case 'viridis':
          // Viridis градиент (наиболее воспринимаемый для людей с цветовыми отклонениями)
          return [
            'rgba(0, 0, 0, 0)',           // Прозрачный
            'rgba(68, 1, 84, 0.5)',       // Тёмно-фиолетовый
            'rgba(33, 145, 140, 0.7)',    // Бирюзовый
            'rgba(107, 199, 148, 0.8)',   // Зелёный
            'rgba(253, 192, 6, 0.9)',     // Жёлтый
            'rgba(253, 231, 33, 1)'       // Светло-жёлтый
          ]

        default:
          // Красно-жёлтый по умолчанию
          return [
            'rgba(0, 0, 0, 0)',
            'rgba(255, 0, 0, 0.5)',
            'rgba(255, 255, 0, 0.8)',
            'rgba(255, 255, 0, 1)'
          ]
      }
    },

    createSettlementTextLabel(settlement, coordinates) {
      if (!this.mapInstance) return

      // Определяем название для отображения в зависимости от режима
      let displayName = ''
      if (this.settlementNameMode === 'old') {
        displayName = settlement.name || settlement.nameModern || ''
      } else if (this.settlementNameMode === 'modern') {
        displayName = settlement.nameModern || settlement.name || ''
      }

      if (!displayName) return

      // Создаем элемент для метки
      const labelEl = document.createElement('div')
      labelEl.className = 'settlement-label'
      labelEl.innerHTML = `
        <div class="settlement-label-content">
          <div class="label-name">${displayName}</div>
        </div>
      `
      this.$refs.olMap.appendChild(labelEl)

        // Создаем overlay с меткой
        // Центр маркера совпадает с координатами точки, максимальный радиус 12px
        // Размещаем labels выше маркера с дополнительными отступами 3px вверх и 3px вправо
        const labelOverlay = new Overlay({
          element: labelEl,
          position: coordinates,
          positioning: 'bottom-center',
          offset: [3, -21], // Отступ 21px вверх (>12px радиуса) + 3px вправо
          stopEvent: false
        })

      this.mapInstance.addOverlay(labelOverlay)
      this.settlementLabelOverlays.push(labelOverlay)
    },

    clearSettlementLabels() {
      if (!this.mapInstance) return

      // Удаляем все settlement label overlay'ы
      this.settlementLabelOverlays.forEach(overlay => {
        this.mapInstance.removeOverlay(overlay)
        const element = overlay.getElement()
        if (element && element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })

      this.settlementLabelOverlays = []
    },

    prepareHeatmapFeatures() {
      // Подготавливаем features для тепловой карты OpenLayers на основе количества населения
      let settlementsArray = []

      // Поддержка как массива, так и GeoJSON
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

      // Находим максимальное население для нормализации
      let maxPopulation = 0
      settlementsArray.forEach(settlement => {
        if (settlement.estateTypes && settlement.estateTypes.length > 0) {
          const totalPop = settlement.estateTypes.reduce((sum, type) => sum + (type.population || 0), 0)
          if (totalPop > maxPopulation) maxPopulation = totalPop
        }
      })

      // Создаём features в формате OpenLayers для heatmap
      const features = settlementsArray
        .filter(settlement => settlement.lat && settlement.lon)
        .map(settlement => {
          const lat = parseFloat(settlement.lat)
          const lng = parseFloat(settlement.lon)

          if (isNaN(lat) || isNaN(lng)) return null

          // Рассчитываем вес на основе населения (от 0.1 до 1.0)
          let weight = 0.1 // Минимальный вес

          if (settlement.estateTypes && settlement.estateTypes.length > 0) {
            const totalPop = settlement.estateTypes.reduce((sum, type) => sum + (type.population || 0), 0)

            // Нормализуем вес от 0.1 до 1.0
            if (maxPopulation > 0) {
              weight = Math.max(0.1, Math.min(1.0, 0.1 + (totalPop / maxPopulation) * 0.9))
            }
          }

          // Создаём feature с Point геометрией и weight
          const feature = new Feature({
            geometry: new Point(fromLonLat([lng, lat])),
            weight: weight
          })

          return feature
        })
        .filter(feature => feature !== null) // Убираем null значения

      console.log(`Подготовлено ${features.length} features для тепловой карты OpenLayers, max популяция: ${maxPopulation}`)
      return features
    },

    updateSettlementLabels() {
      console.log('=== OpenLayersMap updateSettlementLabels ===')
      console.log('settlementNameMode:', this.settlementNameMode)

      // Радикально проще - пересоздаем все labels
      this.clearSettlementLabels()

      // Получаем все феатуры из vectorLayer
      const source = this.vectorLayer.getSource()
      const features = source.getFeatures()

      features.forEach(feature => {
        if (feature.getGeometry() && feature.getGeometry() instanceof Point) {
          const coordinates = feature.getGeometry().getCoordinates()
          const settlement = {
            name: feature.get('name'),
            nameModern: feature.get('nameModern'),
            district: feature.get('district'),
            volost: feature.get('volost')
          }

          // Создаем label только если settlementNameMode !== 'none'
          if (this.settlementNameMode !== 'none') {
            this.createSettlementTextLabel(settlement, coordinates)
          }
        }
      })

      console.log(`Обновлены labels для ${features.length} фич`)
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
        this.updateSettlementLabels()
      }
    },
    vectorLayers: {
      handler(newLayers, oldLayers) {
        // Перезагружаем слои при изменении данных
        if (this.mapInstance && newLayers && newLayers.length > 0) {
          // Очищаем старые слои
          this.vectorLayersMap.forEach(layer => {
            this.mapInstance.removeLayer(layer)
          })
          this.vectorLayersMap.clear()

          // Загружаем новые
          this.loadVectorLayers()
        }
      },
      deep: true
    },
    isActive(newVal) {
      if (newVal) {
        this.updateSize()
      }
    }
  }
}
</script>

<style scoped lang="scss">
.openlayers-map-container {
  width: 100%;
  height: 100%;
}

// Анимация пульсации для круга выделения в OpenLayers
@keyframes pulse-openlayers {
  0% {
    opacity: 1;
    r: 25;
  }
  50% {
    opacity: 0.5;
    r: 30;
  }
  100% {
    opacity: 1;
    r: 25;
  }
}

// Применение анимации к canvas OpenLayers
:deep(canvas) {
  animation: none;
}

// Стили для кнопки Home (встроенный контрол)
:deep(.ol-home) {
  top: 52px;
  left: 0.5em;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.375em;
    height: 1.375em;
    padding: 0;
    background-color: hsl(0, 0%, 100%);
    border: none;
    border-radius: 2px;
    color: white;
    font-size: 1.14em;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.6);
    }

    &:focus {
      outline: none;
    }
  }
}

// Стили для кнопки FullScreen - размещаем слева под Home
:deep(.ol-full-screen) {
  top: 82px;  // Под кнопкой Home (52px + ~30px высота кнопки)
  left: 0.5em;  // По левому краю как Home
  right: auto;  // Отменяем стандартное right

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
}

:deep(.ol-popup) {
  position: relative;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 10px;
  color: var(--text-primary);
}

:deep(.ol-popup-close) {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--text-primary);
  }
}

:deep(.ol-popup-content) {
  padding-right: 16px;
}

:deep(.ol-tooltip) {
  background: transparent;
  border: none;
  padding: 2px 4px;
  pointer-events: none;
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
    color: var(--text-primary);
    margin-bottom: 1px;
    text-shadow: none;
  }

  .tooltip-district {
    font-size: 11px;
    font-weight: normal;
    color: var(--text-primary);
    text-shadow: none;
  }
}

:deep(.vector-layer-tooltip) {
  .tooltip-name {
    font-weight: 700;
    color: var(--text-primary);
    text-shadow: -1px -1px 0 var(--bg-primary), 1px -1px 0 var(--bg-primary), -1px 1px 0 var(--bg-primary), 1px 1px 0 var(--bg-primary);
  }
}

:deep(.settlement-popup-new) {
  min-width: 200px;
  max-width: 300px;

  .popup-field {
    margin: 2px 0;
    font-size: 12px;
    color: var(--text-primary);

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

:deep(.settlement-label) {
  position: absolute;
  padding: 0;
  background: transparent;
  border: none;
  pointer-events: none;
  font-size: 12px;
  font-weight: normal;
  z-index: 2000;

  .settlement-label-content {
    text-align: center;
    white-space: nowrap;

    .label-name {
      font-weight: normal;
      color: var(--text-primary);
      text-shadow: none;
      margin: 0;
    }
  }
}
</style>
