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
      // Исходные параметры вида карт
      initialCenter: [55.42, 52.68], // [latitude, longitude] для Leaflet
      initialCenterOl: [52.68, 55.42], // [longitude, latitude] для OpenLayers
      initialZoom: 8,
      // Данные для векторных слоев
      vectorLayers: [],
      visibleLayers: [],
      activePanels: [],
      leafletVectorLayers: new Map(), // Храним слои Leaflet по ID
      olVectorLayers: new Map() // Храним слои OpenLayers по ID
    }
  },
  async mounted() {
    console.log('MapView mounted, checking containers...')

    // Даем время на отрисовку контейнеров
    this.$nextTick(() => {
      setTimeout(() => {
        console.log('Initializing maps...')
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

        // Загружаем векторные слои после инициализации карт
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
          center: [55.42, 52.68],
          zoom: 8,
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
              // Возврат к сохраненным исходным параметрам
              self.leafletMapInstance.setView(self.initialCenter, self.initialZoom)
            }
            return btn
          }
        })
        
        new L.Control.HomeButton({ position: 'topleft' }).addTo(this.leafletMapInstance)

        // Добавляем синхронизацию с OpenLayers картой
        this.leafletMapInstance.on('moveend zoomend', () => {
          if (this.olMapInstance && this.mapProvider === 'leaflet') {
            const center = this.leafletMapInstance.getCenter()
            const zoom = this.leafletMapInstance.getZoom()

            // Конвертируем координаты Leaflet в OpenLayers формат
            const olCenter = fromLonLat([center.lng, center.lat])
            this.olMapInstance.getView().setCenter(olCenter)
            this.olMapInstance.getView().setZoom(zoom)
          }
        })

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
            center: fromLonLat([52.68, 55.42]),
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
          // Возврат к сохраненным исходным параметрам для OpenLayers
          this.olMapInstance.getView().setCenter(fromLonLat(this.initialCenterOl))
          this.olMapInstance.getView().setZoom(this.initialZoom)
        }

        this.$refs.olMap.appendChild(homeButton)

        console.log('OpenLayers map initialized successfully')

        // Добавляем маркеры если есть данные
        this.updateOpenLayersMarkers()
      } catch (error) {
        console.error('Error initializing OpenLayers map:', error)
      }
    },

    updateLeafletMarkers() {
      if (!this.leafletMapInstance) {
        console.warn('Leaflet map not initialized yet')
        return
      }

      // Удаляем старые маркеры
      this.leafletMarkers.forEach(marker => marker.remove())
      this.leafletMarkers = []

      if (this.settlements.length === 0) {
        console.log('No settlements to display')
        return
      }

      console.log('Adding markers for settlements:', this.settlements.length)

      // Добавляем новые маркеры
      this.settlements.forEach((settlement, index) => {
        if (settlement.lat && settlement.lon) {
          // Координаты уже в EPSG:4326 (WGS84), используем напрямую
          const lat = parseFloat(settlement.lat)
          const lon = parseFloat(settlement.lon)

          console.log(`Settlement ${index}:`, settlement.name, 'Coords:', lat, lon)

          // Проверяем корректность координат
          if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            console.warn('Invalid coordinates for settlement:', settlement.name, lat, lon)
            return
          }

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
        } else {
          console.warn('Settlement without coordinates:', settlement.name)
        }
      })

      console.log('Added markers for settlements:', this.settlements.length)
    },

    updateOpenLayersMarkers() {
      if (!this.olVectorLayer || !this.olMapInstance) {
        console.warn('OpenLayers map or vector layer not initialized')
        return
      }

      const source = this.olVectorLayer.getSource()
      source.clear()

      if (this.settlements.length === 0) {
        console.log('No settlements to display on OpenLayers')
        return
      }

      console.log('Adding OpenLayers markers for settlements:', this.settlements.length)

      const features = []
      const validCoords = []

      this.settlements.forEach((settlement, index) => {
        if (settlement.lat && settlement.lon) {
          const lat = parseFloat(settlement.lat)
          const lon = parseFloat(settlement.lon)

          console.log(`OpenLayers Settlement ${index}:`, settlement.name, 'Coords:', lat, lon)

          // Проверяем корректность координат
          if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            console.warn('Invalid coordinates for OpenLayers settlement:', settlement.name, lat, lon)
            return
          }

          // Конвертируем из EPSG:4326 в EPSG:3857 для OpenLayers
          const [x, y] = fromLonLat([lon, lat])
          console.log(`Converted coords: ${lon}, ${lat} -> ${x}, ${y}`)

          const feature = new Feature({
            geometry: new Point([x, y]),
            name: settlement.name,
            district: settlement.district,
            population: settlement.population
          })
          features.push(feature)
          validCoords.push([x, y])
        } else {
          console.warn('Settlement without coordinates for OpenLayers:', settlement.name)
        }
      })

      if (features.length > 0) {
        source.addFeatures(features)
        console.log(`Added ${features.length} features to OpenLayers`)
      } else {
        console.warn('No valid coordinates found for OpenLayers settlements')
      }

      // Добавляем popup при клике
      this.olMapInstance.on('click', (evt) => {
        const feature = this.olMapInstance.forEachFeatureAtPixel(evt.pixel, (f) => f)
        if (feature) {
          const coordinates = feature.getGeometry().getCoordinates()
          const name = feature.get('name')
          const district = feature.get('district')
          const population = feature.get('population')

          console.log('Clicked OpenLayers settlement:', { name, district, population, coordinates })
        }
      })
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
      // Генерируем цвет на основе ID слоя
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
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

    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    // Метод для обновления векторных слоев (вызывается из родительского компонента)
    async refreshVectorLayers() {
      console.log('=== REFRESHING VECTOR LAYERS ===')
      console.log('Refreshing vector layers...')
      await this.loadVectorLayers()
    },

    // Диагностический метод для проверки данных
    async diagnoseData() {
      console.log('=== DIAGNOSIS STARTED ===')

      // Проверяем векторные слои
      try {
        const layers = await vectorLayerService.getVectorLayers()
        console.log('Vector layers from service:', layers)
      } catch (error) {
        console.error('Error getting vector layers:', error)
      }

      // Проверяем данные о поселениях
      console.log('Current settlements prop:', this.settlements)
      console.log('Settlements length:', this.settlements?.length || 0)

      // Проверяем инициализацию карт
      console.log('Leaflet map initialized:', !!this.leafletMapInstance)
      console.log('OpenLayers map initialized:', !!this.olMapInstance)
      console.log('Vector layers count:', this.vectorLayers?.length || 0)

      console.log('=== DIAGNOSIS COMPLETED ===')
    },

    // Метод для возврата карт к исходным параметрам
    resetMapViews() {
      if (this.leafletMapInstance) {
        this.leafletMapInstance.setView(this.initialCenter, this.initialZoom)
      }
      if (this.olMapInstance) {
        this.olMapInstance.getView().setCenter(fromLonLat(this.initialCenterOl))
        this.olMapInstance.getView().setZoom(this.initialZoom)
      }
    }
  },
  watch: {
    settlements: {
      handler(newVal) {
        console.log('=== SETTLEMENTS WATCHER ===')
        console.log('Settlements updated:', newVal)
        console.log('Settlements length:', newVal?.length || 0)
        console.log('First settlement:', newVal?.[0])
        if (newVal?.[0]) {
          console.log('First settlement coords:', newVal[0].lat, newVal[0].lon)
          console.log('First settlement name:', newVal[0].name)
        }

        this.updateLeafletMarkers()
        this.updateOpenLayersMarkers()

        // Возвращаем карты к исходным параметрам при обновлении данных
        this.resetMapViews()

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
