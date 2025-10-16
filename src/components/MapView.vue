<template>
  <div class="map-view">
    <div class="map-controls">
      <el-radio-group v-model="mapProvider" size="small">
        <el-radio-button label="leaflet">Leaflet</el-radio-button>
        <el-radio-button label="openlayers">OpenLayers</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Панель управления векторными слоями на карте -->
    <div class="map-layers-panel">
      <el-collapse v-model="activePanels" @change="handlePanelChange">
        <el-collapse-item title="Слои" name="vector-layers">
          <div class="layers-list">
            <el-checkbox-group v-model="visibleLayers" @change="updateLayerVisibility">
              <div v-for="layer in vectorLayers" :key="layer.id" class="layer-item">
                <el-checkbox :label="layer.id" class="layer-checkbox">
                  {{ layer.name }}
                </el-checkbox>
              </div>
            </el-checkbox-group>

            <div v-if="vectorLayers.length === 0" class="no-layers">
              Нет загруженных векторных слоев
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
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
import Polygon from 'ol/geom/Polygon'
import LineString from 'ol/geom/LineString'
import MultiPoint from 'ol/geom/MultiPoint'
import MultiPolygon from 'ol/geom/MultiPolygon'
import MultiLineString from 'ol/geom/MultiLineString'
import { Style, Circle, Fill, Stroke } from 'ol/style'
import { fromLonLat, transform } from 'ol/proj'
import { vectorLayerService } from '@/services/vectorLayers.js'
import { mapSettings } from '@/store/mapSettings.js'

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
      initialCenter: [55.42, 52.68], // [lat, lon] для Leaflet
      initialCenterOl: [52.68, 55.42], // [lon, lat] для OpenLayers (до конвертации)
      initialZoom: 8,
      vectorLayers: [],
      visibleLayers: [],
      activePanels: [],
      leafletVectorLayers: new Map(),
      olVectorLayers: new Map()
    }
  },
  async mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.initLeafletMap()
        this.initOpenLayersMap()

        setTimeout(async () => {
          await this.loadVectorLayers()
        }, 1000)
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


    initLeafletMap() {
      if (!this.$refs.leafletMap) {
        return
      }

      this.leafletMapInstance = L.map(this.$refs.leafletMap, {
        center: [55.42, 52.68],
        zoom: 8,
        fullscreenControl: {
          pseudoFullscreen: false
        }
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.leafletMapInstance)

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
            // Синхронизируем центрирование между картами
            if (self.mapProvider === 'leaflet') {
              // Центрируем Leaflet карту
              self.leafletMapInstance.setView([55.42, 52.68], 8)

              // Синхронизируем с OpenLayers картой
              if (self.olMapInstance) {
                self.olMapInstance.getView().setCenter(fromLonLat([52.68, 55.42]))
                self.olMapInstance.getView().setZoom(8)
              }
            }
          }
          return btn
        }
      })

      new L.Control.HomeButton({ position: 'topleft' }).addTo(this.leafletMapInstance)

      // Синхронизация перемещения и масштабирования между картами
      this.leafletMapInstance.on('moveend zoomend', () => {
        if (this.olMapInstance && this.mapProvider === 'leaflet') {
          const center = this.leafletMapInstance.getCenter()
          const zoom = this.leafletMapInstance.getZoom()
          const olCenter = fromLonLat([center.lng, center.lat])
          this.olMapInstance.getView().setCenter(olCenter)
          this.olMapInstance.getView().setZoom(zoom)
        }
      })

      // Обработка перемещения карты для обновления маркеров
      this.leafletMapInstance.on('move', () => {
        // Обновляем маркеры при перемещении карты
        this.updateLeafletMarkers()
      })

      // Обработка изменения масштаба
      this.leafletMapInstance.on('zoom', () => {
        // Обновляем маркеры при изменении масштаба
        this.updateLeafletMarkers()
      })

      this.updateLeafletMarkers()
    },

    initOpenLayersMap() {
      if (!this.$refs.olMap) {
        console.error('OpenLayers map container not found')
        return
      }
      
      try {
        // Создаем векторный слой для маркеров с динамическими стилями
        this.olVectorLayer = new VectorLayer({
          source: new VectorSource(),
          style: (feature) => {
            // Получаем цвет для маркера на основе типа сословия
            const estateType = feature.get('estateType') || 'default'
            const markerColor = mapSettings.estateTypeColors[estateType] || mapSettings.estateTypeColors.default || 'hsl(0, 85%, 55%)'

            return new Style({
              image: new Circle({
                radius: 8,
                fill: new Fill({ color: markerColor }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            })
          }
        })

        // Инициализация OpenLayers карты с правильными координатами
        // fromLonLat([longitude, latitude]) -> [52.68, 55.42]
        this.olMapInstance = new OLMap({
          target: this.$refs.olMap,
          layers: [
            new TileLayer({
              source: new OSM()
            }),
            this.olVectorLayer
          ],
          view: new View({
            center: fromLonLat([52.68, 55.42]), // [lon, lat] -> конвертируется в проекцию карты
            zoom: 8,
          })
        })

        // Добавляем кнопку Home для возврата к исходному виду
        const homeButton = document.createElement('button')
        homeButton.innerHTML = '🏠'
        homeButton.title = 'Вернуться к исходному виду'
        homeButton.style.cssText = `
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 1000;
          background-color: white;
          width: 30px;
          height: 30px;
          font-size: 16px;
          line-height: 30px;
          text-align: center;
          cursor: pointer;
          border: none;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `
        homeButton.onclick = () => {
          // Синхронизируем центрирование между картами
          if (this.mapProvider === 'openlayers') {
            // Центрируем OpenLayers карту
            this.olMapInstance.getView().setCenter(fromLonLat([52.68, 55.42]))
            this.olMapInstance.getView().setZoom(8)

            // Синхронизируем с Leaflet картой
            if (this.leafletMapInstance) {
              this.leafletMapInstance.setView([55.42, 52.68], 8)
            }
          }
        }

        this.$refs.olMap.appendChild(homeButton)

        // Синхронизация перемещения и масштабирования между картами
        this.olMapInstance.getView().on('change:center', () => {
          if (this.leafletMapInstance && this.mapProvider === 'openlayers') {
            const center = this.olMapInstance.getView().getCenter()
            const zoom = this.olMapInstance.getView().getZoom()
            // Конвертируем из проекции карты обратно в географические координаты
            const geoCenter = transform(center, 'EPSG:3857', 'EPSG:4326')
            this.leafletMapInstance.setView([geoCenter[1], geoCenter[0]], zoom)
          }
        })

        this.olMapInstance.getView().on('change:zoom', () => {
          if (this.leafletMapInstance && this.mapProvider === 'openlayers') {
            const center = this.olMapInstance.getView().getCenter()
            const zoom = this.olMapInstance.getView().getZoom()
            // Конвертируем из проекции карты обратно в географические координаты
            const geoCenter = transform(center, 'EPSG:3857', 'EPSG:4326')
            this.leafletMapInstance.setView([geoCenter[1], geoCenter[0]], zoom)
          }
        })

        // Обработка перемещения карты для обновления маркеров
        this.olMapInstance.on('moveend', () => {
          this.updateOpenLayersMarkers()
        })

        // Добавляем маркеры если есть данные
        this.updateOpenLayersMarkers()
      } catch (error) {
        console.error('Error initializing OpenLayers map:', error)
      }
    },

    updateLeafletMarkers() {
      if (!this.leafletMapInstance) {
        console.log('Leaflet map instance not ready')
        return
      }

      console.log('Updating Leaflet markers, settlements count:', this.settlements?.length || 0)

      // Удаляем старые маркеры
      this.leafletMarkers.forEach(marker => marker.remove())
      this.leafletMarkers = []

      if (this.settlements.length === 0) {
        console.log('No settlements to display')
        return
      }

      let validMarkers = 0

      // Добавляем новые маркеры
      this.settlements.forEach((settlement, index) => {
        if (settlement.lat && settlement.lon) {
          const lat = parseFloat(settlement.lat)
          const lon = parseFloat(settlement.lon)

          // Проверяем корректность координат
          if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            console.warn(`Invalid coordinates for ${settlement.name}:`, { lat, lon })
            return
          }

          console.log(`Creating marker ${index + 1} for ${settlement.name}:`, { lat, lon })

          // Создаем маркер в зависимости от режима отображения
          const markerElement = this.createMarkerElement(settlement)

          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: markerElement,
            iconSize: this.getMarkerSize(),
            iconAnchor: [this.getMarkerSize()[0] / 2, this.getMarkerSize()[1] / 2]
          })

          const marker = L.marker([lat, lon], { icon: customIcon })
            .bindPopup(`
              <div class="settlement-popup">
                <h4>${settlement.name}</h4>
                <p><strong>Регион:</strong> Татарстан</p>
                <p><strong>Район:</strong> ${settlement.district || '—'}</p>
                ${settlement.population ? `<p><strong>Население:</strong> ${settlement.population}</p>` : ''}
              </div>
            `)
            .addTo(this.leafletMapInstance)

          this.leafletMarkers.push(marker)
          validMarkers++
        }
      })

      console.log(`Created ${validMarkers} valid markers out of ${this.settlements.length} settlements`)
    },

    updateOpenLayersMarkers() {
      if (!this.olVectorLayer || !this.olMapInstance) {
        console.log('OpenLayers map or vector layer not ready')
        return
      }

      console.log('Updating OpenLayers markers, settlements count:', this.settlements?.length || 0)

      const source = this.olVectorLayer.getSource()
      source.clear()

      if (this.settlements.length === 0) {
        console.log('No settlements to display on OpenLayers')
        return
      }

      const features = []
      let validMarkers = 0

      this.settlements.forEach((settlement, index) => {
        if (settlement.lat && settlement.lon) {
          const lat = parseFloat(settlement.lat)
          const lon = parseFloat(settlement.lon)

          // Проверяем корректность координат
          if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            console.warn(`Invalid coordinates for ${settlement.name}:`, { lat, lon })
            return
          }

          console.log(`Creating OpenLayers feature ${index + 1} for ${settlement.name}:`, { lat, lon })

          // Конвертируем из EPSG:4326 в EPSG:3857 для OpenLayers
          const [x, y] = fromLonLat([lon, lat])

          const feature = new Feature({
            geometry: new Point([x, y]),
            name: settlement.name,
            district: settlement.district,
            population: settlement.population,
            estateType: 'default' // В будущем здесь будет определение типа сословия
          })
          features.push(feature)
          validMarkers++
        }
      })

      if (features.length > 0) {
        source.addFeatures(features)
        console.log(`Added ${validMarkers} features to OpenLayers map`)
      } else {
        console.log('No valid features to add to OpenLayers map')
      }
    },

    // Методы для работы с векторными слоями
    async loadVectorLayers() {
      try {
        console.log('Loading vector layers...')
        const layers = await vectorLayerService.getVectorLayers()
        console.log('Raw loaded vector layers:', layers)
        console.log('Layers count:', layers?.length || 0)

        this.vectorLayers = layers || []
        console.log('Final vector layers:', this.vectorLayers)

        // По умолчанию показываем все слои
        this.visibleLayers = this.vectorLayers.map(layer => layer.id)
        console.log('Visible layers:', this.visibleLayers)

        // Загружаем и отображаем векторные слои на картах
        if (this.vectorLayers.length > 0) {
          this.loadVectorLayersOnMaps()
        } else {
          console.warn('No vector layers found to load')
        }
      } catch (error) {
        console.error('Error loading vector layers:', error)
        this.vectorLayers = []
      }
    },

    async loadVectorLayersOnMaps() {
      if (this.vectorLayers.length === 0) return

      // Загружаем файлы векторных слоев
      for (const layer of this.vectorLayers) {
        if (layer.file_url) {
          try {
            await this.loadVectorLayerData(layer)
          } catch (error) {
            console.error(`Error loading layer ${layer.name}:`, error)
          }
        }
      }
    },

    async loadVectorLayerData(layer) {
      try {
        console.log(`Loading data for layer: ${layer.name}`)

        // Загружаем файл из Supabase Storage
        const response = await fetch(layer.file_url)
        if (!response.ok) {
          throw new Error(`Failed to fetch ${layer.file_url}`)
        }

        const geoJsonData = await response.json()
        console.log(`Loaded GeoJSON data for ${layer.name}:`, geoJsonData)

        // Отображаем на обеих картах
        this.displayVectorLayerOnLeaflet(layer, geoJsonData)
        this.displayVectorLayerOnOpenLayers(layer, geoJsonData)

      } catch (error) {
        console.error(`Error loading vector layer data for ${layer.name}:`, error)
      }
    },

    displayVectorLayerOnLeaflet(layer, geoJsonData) {
      if (!this.leafletMapInstance) return

      // Удаляем существующий слой если он есть
      const existingLayer = this.leafletVectorLayers.get(layer.id)
      if (existingLayer) {
        this.leafletMapInstance.removeLayer(existingLayer)
      }

      try {
        // Создаем слой GeoJSON для Leaflet
        const vectorLayer = L.geoJSON(geoJsonData, {
          style: {
            color: this.getLayerColor(layer.id),
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.3
          },
          onEachFeature: (feature, layer) => {
            // Добавляем popup для каждого объекта
            if (feature.properties) {
              const popupContent = this.generatePopupContent(feature.properties)
              layer.bindPopup(popupContent)
            }
          }
        })

        // Сохраняем слой
        this.leafletVectorLayers.set(layer.id, vectorLayer)

        // Добавляем на карту если слой видим
        if (this.visibleLayers.includes(layer.id)) {
          vectorLayer.addTo(this.leafletMapInstance)
        }

        console.log(`Added vector layer ${layer.name} to Leaflet map`)

      } catch (error) {
        console.error(`Error displaying layer ${layer.name} on Leaflet:`, error)
      }
    },

    displayVectorLayerOnOpenLayers(layer, geoJsonData) {
      if (!this.olMapInstance) return

      // Удаляем существующий слой если он есть
      const existingLayer = this.olVectorLayers.get(layer.id)
      if (existingLayer) {
        this.olMapInstance.removeLayer(existingLayer)
      }

      try {
        // Создаем векторный источник для OpenLayers
        const vectorSource = new VectorSource({
          features: []
        })

        // Определяем цвет для слоя
        const layerColor = this.getLayerColor(layer.id)

        // Создаем векторный слой
        const vectorLayer = new VectorLayer({
          source: vectorSource,
          style: new Style({
            stroke: new Stroke({
              color: layerColor,
              width: 2
            }),
            fill: new Fill({
              color: this.hexToRgba(layerColor, 0.3)
            })
          })
        })

        // Добавляем features из GeoJSON с правильной конвертацией координат
        if (geoJsonData.features) {
          geoJsonData.features.forEach((feature, index) => {
            try {
              const olFeature = new Feature({
                geometry: this.geoJsonGeometryToOpenLayers(feature.geometry),
                properties: feature.properties || {}
              })
              vectorSource.addFeature(olFeature)
              console.log(`Added feature ${index} from layer ${layer.name} to OpenLayers`)
            } catch (featureError) {
              console.error(`Error adding feature ${index} from layer ${layer.name}:`, featureError)
            }
          })
        }

        // Сохраняем слой
        this.olVectorLayers.set(layer.id, vectorLayer)

        // Добавляем на карту если слой видим
        if (this.visibleLayers.includes(layer.id)) {
          this.olMapInstance.addLayer(vectorLayer)
          console.log(`Added vector layer ${layer.name} to OpenLayers map, features count:`, vectorSource.getFeatures().length)
        } else {
          console.log(`Layer ${layer.name} is not visible, not adding to map`)
        }

      } catch (error) {
        console.error(`Error displaying layer ${layer.name} on OpenLayers:`, error)
      }
    },

    updateLayerVisibility() {
      console.log('Updating layer visibility:', this.visibleLayers)

      // Обновляем видимость на Leaflet
      this.leafletVectorLayers.forEach((layer, layerId) => {
        if (this.visibleLayers.includes(layerId)) {
          if (!this.leafletMapInstance.hasLayer(layer)) {
            layer.addTo(this.leafletMapInstance)
          }
        } else {
          if (this.leafletMapInstance.hasLayer(layer)) {
            this.leafletMapInstance.removeLayer(layer)
          }
        }
      })

      // Обновляем видимость на OpenLayers
      this.olVectorLayers.forEach((layer, layerId) => {
        if (this.visibleLayers.includes(layerId)) {
          if (!this.olMapInstance.getLayers().getArray().includes(layer)) {
            this.olMapInstance.addLayer(layer)
          }
        } else {
          if (this.olMapInstance.getLayers().getArray().includes(layer)) {
            this.olMapInstance.removeLayer(layer)
          }
        }
      })
    },

    getLayerColor(layerId) {
      // Генерируем цвет на основе ID слоя в HSL формате
      const colors = [
        'hsl(0, 85%, 55%)', 'hsl(178, 63%, 52%)', 'hsl(197, 65%, 55%)', 'hsl(136, 33%, 65%)', 'hsl(48, 100%, 67%)',
        'hsl(282, 44%, 70%)', 'hsl(174, 38%, 70%)', 'hsl(48, 100%, 67%)', 'hsl(262, 41%, 68%)', 'hsl(204, 70%, 67%)'
      ]
      return colors[layerId % colors.length]
    },

    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    },

    geoJsonGeometryToOpenLayers(geometry) {
      if (!geometry || !geometry.type) {
        console.warn('Invalid geometry:', geometry)
        return null
      }

      try {
        switch (geometry.type) {
          case 'Point':
            return new Point(fromLonLat(geometry.coordinates))

          case 'MultiPoint':
            return new MultiPoint(geometry.coordinates.map(coords => fromLonLat(coords)))

          case 'LineString':
            return new LineString(geometry.coordinates.map(coords => fromLonLat(coords)))

          case 'MultiLineString':
            return new MultiLineString(
              geometry.coordinates.map(line =>
                line.map(coords => fromLonLat(coords))
              )
            )

          case 'Polygon':
            return new Polygon(
              geometry.coordinates.map(ring =>
                ring.map(coords => fromLonLat(coords))
              )
            )

          case 'MultiPolygon':
            return new MultiPolygon(
              geometry.coordinates.map(polygon =>
                polygon.map(ring =>
                  ring.map(coords => fromLonLat(coords))
                )
              )
            )

          case 'GeometryCollection':
            console.warn('GeometryCollection not fully supported yet')
            // Возвращаем первый объект геометрии
            if (geometry.geometries && geometry.geometries.length > 0) {
              return this.geoJsonGeometryToOpenLayers(geometry.geometries[0])
            }
            return null

          default:
            console.warn('Unsupported geometry type:', geometry.type)
            return null
        }
      } catch (error) {
        console.error('Error converting geometry:', error, geometry)
        return null
      }
    },

    generatePopupContent(properties) {
      // Генерируем содержимое popup из свойств объекта
      let content = '<div class="vector-layer-popup">'

      Object.keys(properties).forEach(key => {
        content += `<p><strong>${key}:</strong> ${properties[key]}</p>`
      })

      content += '</div>'
      return content
    },

    handlePanelChange(panels) {
      console.log('Panel change:', panels)
    },



    // Метод для возврата карт к исходным параметрам
    resetMapViews() {
      // Центрируем Leaflet карту
      if (this.leafletMapInstance) {
        this.leafletMapInstance.setView([55.42, 52.68], 8)
      }

      // Центрируем OpenLayers карту
      if (this.olMapInstance) {
        this.olMapInstance.getView().setCenter(fromLonLat([52.68, 55.42]))
        this.olMapInstance.getView().setZoom(8)
      }
    },

    // Создание элемента маркера в зависимости от режима отображения
    createMarkerElement(settlement) {
      // Используем настройки карты для определения режима отображения
      switch (mapSettings.colorMode) {
        case 'pie_chart':
          return this.createPieChartMarker(settlement)
        case 'concentric_circles':
          return this.createConcentricCirclesMarker(settlement)
        default:
          // Для других режимов возвращаем простой круг
          return '<div class="marker-circle"></div>'
      }
    },

    // Получение размера маркера в зависимости от настроек
    getMarkerSize() {
      const baseSize = 14
      const sizeMultiplier = this.getSizeMultiplier()

      return [baseSize * sizeMultiplier, baseSize * sizeMultiplier]
    },

    // Получение множителя размера маркера
    getSizeMultiplier() {
      // Используем настройки карты для определения размера маркера
      switch (mapSettings.display.markerSize) {
        case 'small':
          return 0.7
        case 'medium':
          return 1
        case 'large':
          return 1.5
        default:
          return 1
      }
    },

    // Создание маркера в виде круговой диаграммы
    createPieChartMarker(settlement) {
      // Для демонстрации создаем маркер с несколькими цветовыми секторами
      // В будущем здесь будет логика для анализа данных о типах сословий в поселении

      const colors = ['hsl(0, 85%, 55%)', 'hsl(178, 63%, 52%)', 'hsl(197, 65%, 55%)', 'hsl(136, 33%, 65%)', 'hsl(48, 100%, 67%)']
      const segments = colors.length
      const radius = 10
      const centerX = radius
      const centerY = radius

      let svg = `<svg width="${radius * 2}" height="${radius * 2}" viewBox="0 0 ${radius * 2} ${radius * 2}">`

      // Создаем сектора круговой диаграммы
      for (let i = 0; i < segments; i++) {
        const startAngle = (i / segments) * 360
        const endAngle = ((i + 1) / segments) * 360

        const startAngleRad = (startAngle - 90) * Math.PI / 180
        const endAngleRad = (endAngle - 90) * Math.PI / 180

        const x1 = centerX + radius * Math.cos(startAngleRad)
        const y1 = centerY + radius * Math.sin(startAngleRad)
        const x2 = centerX + radius * Math.cos(endAngleRad)
        const y2 = centerY + radius * Math.sin(endAngleRad)

        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ')

        svg += `<path d="${pathData}" fill="${colors[i]}" stroke="white" stroke-width="1"/>`
      }

      // Добавляем центральный круг для лучшего вида
      svg += `<circle cx="${centerX}" cy="${centerY}" r="2" fill="white" stroke="hsl(0, 0%, 80%)" stroke-width="1"/>`

      svg += '</svg>'

      return `<div class="pie-chart-marker">${svg}</div>`
    },

    // Создание маркера в виде концентрических окружностей
    createConcentricCirclesMarker(settlement) {
      // Для демонстрации создаем маркер с несколькими концентрическими кольцами
      // В будущем здесь будет логика для анализа данных о типах сословий в поселении

      const colors = ['hsl(0, 85%, 55%)', 'hsl(178, 63%, 52%)', 'hsl(197, 65%, 55%)', 'hsl(136, 33%, 65%)']
      const ringCount = Math.min(colors.length, 4) // Максимум 4 кольца для наглядности
      const baseRadius = 8
      const spacing = 6 // Расстояние между кольцами

      let svg = `<svg width="${(baseRadius + spacing * (ringCount - 1)) * 2}" height="${(baseRadius + spacing * (ringCount - 1)) * 2}" viewBox="0 0 ${(baseRadius + spacing * (ringCount - 1)) * 2} ${(baseRadius + spacing * (ringCount - 1)) * 2}">`

      const centerX = baseRadius + spacing * (ringCount - 1)
      const centerY = baseRadius + spacing * (ringCount - 1)

      // Создаем концентрические окружности (от внешнего к внутреннему)
      for (let i = ringCount - 1; i >= 0; i--) {
        const radius = baseRadius + spacing * i
        const strokeWidth = Math.max(2, 4 - i) // Уменьшаем толщину для внутренних колец

        svg += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${colors[ringCount - 1 - i]}" stroke-width="${strokeWidth}" opacity="0.8"/>`
      }

      // Добавляем центральный круг
      svg += `<circle cx="${centerX}" cy="${centerY}" r="3" fill="${colors[colors.length - 1]}" stroke="white" stroke-width="2"/>`

      svg += '</svg>'

      return `<div class="concentric-circles-marker">${svg}</div>`
    }
  },
  watch: {
    settlements: {
      handler(newVal) {
        console.log('=== MAPVIEW SETTLEMENTS WATCHER ===')
        console.log('MapView received settlements:', newVal)
        console.log('Settlements count:', newVal?.length || 0)

        if (newVal && newVal.length > 0) {
          console.log('First settlement:', newVal[0])
          console.log('Sample coordinates:', {
            name: newVal[0].name,
            lat: newVal[0].lat,
            lon: newVal[0].lon,
            district: newVal[0].district
          })
        }

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

  // Панель управления слоями на карте
  .map-layers-panel {
    position: absolute;
    top: 35px;
    right: 10px;
    z-index: 1000;
    background: var(--bg-secondary);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    opacity: 0.8;
    transition: background-color 0.3s ease, border-color 0.3s ease, opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }

    :deep(.el-collapse) {
      border: none;
      background: transparent;
    }

    :deep(.el-collapse-item__header) {
      background-color: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 2px 8px 2px 20px !important;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
      height: auto !important;
      line-height: 1 !important;
      min-width: 70px;
      position: relative;
      transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;

      &:hover {
        background-color: var(--bg-hover);
      }

      .el-collapse-item__arrow {
        margin: 0 !important;
        padding: 0 !important;
        font-size: 10px;
        left: 6px !important;
        right: auto !important;
        top: 50% !important;
        transform: translateY(-50%) rotate(90deg);
        position: absolute;
        color: var(--text-primary);
        transition: transform 0.3s ease, color 0.3s ease;
      }
    }

    :deep(.el-collapse-item__header.is-active) {
      .el-collapse-item__arrow {
        transform: translateY(-50%) rotate(-90deg);
      }
    }

    :deep(.el-collapse-item__wrap) {
      background: var(--bg-secondary);
      border: none;
      border-radius: 0 0 6px 6px;
      margin-top: 4px;
      margin-right: 0;
      transition: background-color 0.3s ease;
    }

    :deep(.el-collapse-item__content) {
      padding: 8px;
      background: transparent;
      margin-right: 0;
    }

    .layers-list {
      max-height: 200px;
      overflow-y: auto;

      .layer-item {
        margin-bottom: 0px;

        :deep(.el-checkbox) {
          width: 100%;

          .el-checkbox__input {
            margin-right: 8px;
          }

          .el-checkbox__label {
            width: 100%;
            padding: 0 8px;
            border-radius: 4px;
            cursor: pointer;

            &:hover {
              background-color: var(--bg-hover);
            }
          }
        }

        .layer-info {
          .layer-name {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 2px;
          }

          .layer-type {
            font-size: 10px;
            color: var(--text-secondary);
            margin-bottom: 2px;
          }

          .layer-meta {
            font-size: 10px;
            color: var(--text-muted);
          }
        }
      }

      .no-layers {
        padding: 12px;
        text-align: center;
        color: var(--text-muted);
        font-size: 12px;
        font-style: italic;
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

    // Обеспечиваем корректное масштабирование карт в ограниченных контейнерах
    :deep(.leaflet-container),
    :deep(.ol-viewport) {
      height: 100% !important;
      width: 100% !important;
    }

    // Для Leaflet карты
    :deep(.leaflet-map-pane),
    :deep(.leaflet-tile),
    :deep(.leaflet-marker-icon),
    :deep(.leaflet-marker-shadow),
    :deep(.leaflet-tile-container),
    :deep(.leaflet-pane),
    :deep(.leaflet-objects-pane) {
      max-height: none !important;
    }

    // Для OpenLayers карты
    :deep(.ol-overlaycontainer-stopevent),
    :deep(.ol-viewport canvas) {
      max-height: none !important;
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

  .pie-chart-marker {
    display: block;
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.2);
    }

    svg {
      display: block;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
  }

  .concentric-circles-marker {
    display: block;
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.2);
    }

    svg {
      display: block;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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

:deep(.vector-layer-popup) {
  min-width: 150px;

  p {
    margin: 4px 0;
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1.3;

    strong {
      color: var(--text-primary);
      font-weight: 500;
    }
  }
}
</style>
