<template>
  <div class="map-view">
    <div class="map-controls">
      <el-radio-group v-model="mapProvider" size="small">
        <el-radio-button label="leaflet">Leaflet</el-radio-button>
        <el-radio-button label="openlayers">OpenLayers</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Легенда типов сословий -->
    <div v-if="estateTypesLegend.length > 0" class="map-legend-panel">
      <div class="legend-items">
        <div v-for="item in estateTypesLegend" :key="item.id" class="legend-item">
          <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
          <div class="legend-label">{{ item.name }}</div>
        </div>
      </div>
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
import { fromLonLat, transform, transformExtent } from 'ol/proj'
import Overlay from 'ol/Overlay'
import { vectorLayerService } from '@/services/vectorLayers.js'
import { mapSettings } from '@/store/mapSettings.js'
import { setLeafletView, setOpenLayersView } from '@/store/mapView.js'

export default {
  name: 'MapView',
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
      olVectorLayers: new Map(),
      isSyncingView: false,
      olPopupOverlay: null,
      olPopupEl: null
    }
  },
  computed: {
    // Формируем легенду на основе типов сословий, присутствующих на карте
    estateTypesLegend() {
      if (!this.settlements || this.settlements.length === 0) {
        return []
      }

      // Собираем уникальные типы сословий из всех населённых пунктов
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

      // Преобразуем в массив и сортируем по названию
      return Array.from(typesMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    }
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.initLeafletMap()
        this.initOpenLayersMap()

        setTimeout(() => {
          this.loadVectorLayers()
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
          btn.style.backgroundColor = 'hsl(0, 0%, 100%)'
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
        try {
          if (this.olMapInstance && !this.isSyncingView) {
            this.isSyncingView = true
            const center = this.leafletMapInstance.getCenter()
            const zoom = this.leafletMapInstance.getZoom()
            const olCenter = fromLonLat([center.lng, center.lat])
            this.olMapInstance.getView().setCenter(olCenter)
            this.olMapInstance.getView().setZoom(zoom)
          }
        } finally {
          this.isSyncingView = false
        }
        // sync shared view store
        try { setLeafletView(this.leafletMapInstance) } catch(e) {}
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
      // initial sync to view store
      try { setLeafletView(this.leafletMapInstance) } catch(e) {}
    },

    initOpenLayersMap() {
      if (!this.$refs.olMap) {
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
                stroke: new Stroke({ color: 'hsl(0, 0%, 100%)', width: 2 })
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
          background-color: hsl(0, 0%, 100%);
          width: 30px;
          height: 30px;
          font-size: 16px;
          line-height: 30px;
          text-align: center;
          cursor: pointer;
          border: none;
          border-radius: 4px;
          box-shadow: 0 2px 4px hsl(0, 0%, 0%, 0.3);
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

        // OpenLayers popup и tooltip overlays
        try {
          // Popup для клика
          this.olPopupEl = document.createElement('div')
          this.olPopupEl.className = 'ol-popup'
          this.$refs.olMap.appendChild(this.olPopupEl)
          this.olPopupOverlay = new Overlay({
            element: this.olPopupEl,
            offset: [0, -10],
            positioning: 'bottom-center',
            stopEvent: true
          })
          this.olMapInstance.addOverlay(this.olPopupOverlay)

          // Tooltip для наведения
          this.olTooltipEl = document.createElement('div')
          this.olTooltipEl.className = 'ol-tooltip'
          this.$refs.olMap.appendChild(this.olTooltipEl)
          this.olTooltipOverlay = new Overlay({
            element: this.olTooltipEl,
            offset: [0, -15],
            positioning: 'bottom-center',
            stopEvent: false
          })
          this.olMapInstance.addOverlay(this.olTooltipOverlay)

          this.olMapInstance.on('singleclick', (evt) => {
            let shown = false
            this.olMapInstance.forEachFeatureAtPixel(evt.pixel, (feature) => {
              // Получаем данные о settlement из feature
              const settlement = {
                name: feature.get('name') || '—',
                nameModern: feature.get('nameModern') || '—',
                district: feature.get('district') || '—',
                male: feature.get('male') || 0,
                female: feature.get('female') || 0,
                population: feature.get('population') || 0,
                estateTypes: feature.get('estateTypes') || [],
                religions: feature.get('religions') || [],
                estates: feature.get('estates') || []
              }
              
              this.olPopupEl.innerHTML = this.generateSettlementPopup(settlement)
              this.olPopupOverlay.setPosition(evt.coordinate)
              shown = true
              return true
            })
            if (!shown) {
              try { this.olPopupOverlay.setPosition(undefined) } catch(e) {}
            }
          })

          this.olMapInstance.on('pointermove', (evt) => {
            const hit = this.olMapInstance.hasFeatureAtPixel(evt.pixel)
            try { this.$refs.olMap.style.cursor = hit ? 'pointer' : 'default' } catch(e) {}
            
            // Показываем tooltip при наведении
            if (hit) {
              this.olMapInstance.forEachFeatureAtPixel(evt.pixel, (feature) => {
                const name = feature.get('name') || ''
                const district = feature.get('district') || ''
                const html = `
                  <div class="settlement-tooltip">
                    <div class="tooltip-name">${name}</div>
                    <div class="tooltip-district">${district || '—'}</div>
                  </div>
                `
                this.olTooltipEl.innerHTML = html
                this.olTooltipOverlay.setPosition(evt.coordinate)
                return true
              })
            } else {
              this.olTooltipOverlay.setPosition(undefined)
            }
          })
        } catch (e) {}

        // Синхронизация OpenLayers -> Leaflet
        this.olMapInstance.getView().on('change:center', () => {
          try {
            if (this.leafletMapInstance && !this.isSyncingView) {
              this.isSyncingView = true
              const center = this.olMapInstance.getView().getCenter()
              const zoom = this.olMapInstance.getView().getZoom()
              const geoCenter = transform(center, 'EPSG:3857', 'EPSG:4326')
              this.leafletMapInstance.setView([geoCenter[1], geoCenter[0]], zoom)
            }
          } finally {
            this.isSyncingView = false
          }
        })

        this.olMapInstance.getView().on('change:zoom', () => {
          try {
            if (this.leafletMapInstance && !this.isSyncingView) {
              this.isSyncingView = true
              const center = this.olMapInstance.getView().getCenter()
              const zoom = this.olMapInstance.getView().getZoom()
              const geoCenter = transform(center, 'EPSG:3857', 'EPSG:4326')
              this.leafletMapInstance.setView([geoCenter[1], geoCenter[0]], zoom)
            }
          } finally {
            this.isSyncingView = false
          }
        })

        // Обработка перемещения карты для обновления маркеров
        this.olMapInstance.on('moveend', () => {
          this.updateOpenLayersMarkers()
        })

        // Добавляем маркеры если есть данные
        this.updateOpenLayersMarkers()
      } catch (error) {
        // console.error('Error initializing OpenLayers map:', error)
      }
    },

    updateLeafletMarkers() {
      if (!this.leafletMapInstance) {
        return
      }

      // Удаляем старые маркеры
      this.leafletMarkers.forEach(marker => marker.remove())
      this.leafletMarkers = []

      if (this.settlements.length === 0) {
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
            return
          }

          // Создаём концентрические кружки для нескольких типов сословий
          const markerElement = this.createConcentricCirclesMarker(settlement.estateTypes || [])

          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: markerElement,
            iconSize: this.getMarkerSize(),
            iconAnchor: [this.getMarkerSize()[0] / 2, this.getMarkerSize()[1] / 2]
          })

          const marker = L.marker([lat, lon], { icon: customIcon })
            .bindTooltip(`
              <div class="settlement-tooltip">
                <div class="tooltip-name">${settlement.name}</div>
                <div class="tooltip-district">${settlement.district || '—'}</div>
              </div>
            `, {
              direction: 'top',
              offset: [0, -10],
              opacity: 0.95,
              className: 'custom-tooltip'
            })
            .bindPopup(this.generateSettlementPopup(settlement))
            .addTo(this.leafletMapInstance)

          this.leafletMarkers.push(marker)
          validMarkers++
        }
      })
    },

    updateOpenLayersMarkers() {
      if (!this.olVectorLayer || !this.olMapInstance) {
        return
      }

      const source = this.olVectorLayer.getSource()
      source.clear()

      if (this.settlements.length === 0) {
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
            return
          }

          // Конвертируем из EPSG:4326 в EPSG:3857 для OpenLayers
          const [x, y] = fromLonLat([lon, lat])

          const estateTypes = settlement.estateTypes || []

          const feature = new Feature({
            geometry: new Point([x, y]),
            name: settlement.name,
            nameModern: settlement.nameModern,
            district: settlement.district,
            male: settlement.male,
            female: settlement.female,
            population: settlement.population,
            estateTypes: estateTypes,
            religions: settlement.religions || [],
            estates: settlement.estates || []
          })

          // Создаём концентрические кружки через массив стилей
          const styles = this.createConcentricCirclesStylesOL(estateTypes)
          feature.setStyle(styles)

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
    loadVectorLayers() {
      console.log('Loading vector layers...')
      vectorLayerService.getVectorLayers()
        .then((layers) => {
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
        })
        .catch((error) => {
          console.error('Error loading vector layers:', error)
          this.vectorLayers = []
        })
    },

    loadVectorLayersOnMaps() {
      if (this.vectorLayers.length === 0) return

      // Загружаем файлы векторных слоев
      this.vectorLayers.forEach((layer) => {
        if (layer.file_url) {
          this.loadVectorLayerData(layer)
            .catch((error) => {
              console.error(`Error loading layer ${layer.name}:`, error)
            })
        }
      })
    },

    loadVectorLayerData(layer) {
      console.log(`Loading data for layer: ${layer.name}`)

      // Загружаем файл из Supabase Storage
      return fetch(layer.file_url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch ${layer.file_url}`)
          }
          return response.json()
        })
        .then((geoJsonData) => {
          console.log(`Loaded GeoJSON data for ${layer.name}:`, geoJsonData)

          // Отображаем на обеих картах
          this.displayVectorLayerOnLeaflet(layer, geoJsonData)
          this.displayVectorLayerOnOpenLayers(layer, geoJsonData)
        })
        .catch((error) => {
          console.error(`Error loading vector layer data for ${layer.name}:`, error)
          throw error
        })
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

    hslToHsla(hsl, alpha) {
      // Convert HSL to HSLA format
      if (hsl.startsWith('hsl(')) {
        return hsl.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`)
      }
      return hsl
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

    // Создание маркера в виде круговой диаграммы для Leaflet
    createConcentricCirclesMarker(estateTypes) {
      if (!estateTypes || estateTypes.length === 0) {
        return '<div class="pie-marker"><svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="transparent" stroke="hsl(0, 0%, 60%)" stroke-width="3"/></svg></div>'
      }

      // Вычисляем общее население для определения размера круга
      const totalPopulation = estateTypes.reduce((sum, type) => sum + type.population, 0)
      
      // Линейная нормализация радиуса по населению (минимум 2.5, максимум 12)
      const minRadius = 2.5
      const maxRadius = 12
      const minPopulation = 10  // Минимальное ожидаемое население
      const maxPopulation = 1000 // Максимальное ожидаемое население
      
      // Линейная нормализация
      const normalizedPopulation = Math.min(Math.max(totalPopulation - minPopulation, 0) / (maxPopulation - minPopulation), 1)
      const radius = minRadius + (maxRadius - minRadius) * normalizedPopulation
      
      const strokeWidth = 3
      const svgSize = (maxRadius + strokeWidth) * 2
      const center = svgSize / 2

      // Если только один тип - простой круг
      if (estateTypes.length === 1) {
        return `<div class="pie-marker"><svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}"><circle cx="${center}" cy="${center}" r="${radius}" fill="transparent" stroke="${estateTypes[0].color}" stroke-width="${strokeWidth}"/></svg></div>`
      }

      let svg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`
      
      // Делим окружность равномерно между типами
      const segmentAngle = 360 / estateTypes.length
      let currentAngle = -90 // Начинаем сверху

      estateTypes.forEach((type, index) => {
        const endAngle = currentAngle + segmentAngle

        // Конвертируем углы в радианы
        const startRad = (currentAngle * Math.PI) / 180
        const endRad = (endAngle * Math.PI) / 180

        // Вычисляем начальную и конечную точки дуги
        const x1 = center + radius * Math.cos(startRad)
        const y1 = center + radius * Math.sin(startRad)
        const x2 = center + radius * Math.cos(endRad)
        const y2 = center + radius * Math.sin(endRad)

        // Флаг большой дуги (если сегмент больше 180°)
        const largeArcFlag = segmentAngle > 180 ? 1 : 0

        // Создаём path для дуги
        const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`

        svg += `<path d="${pathData}" fill="none" stroke="${type.color}" stroke-width="${strokeWidth}" stroke-linecap="butt"/>`
        
        currentAngle = endAngle
      })

      svg += '</svg>'
      return `<div class="pie-marker">${svg}</div>`
    },

    // Создание стилей круговой диаграммы для OpenLayers
    createConcentricCirclesStylesOL(estateTypes) {
      if (!estateTypes || estateTypes.length === 0) {
        return new Style({
          image: new Circle({
            radius: 8,
            fill: new Fill({ color: 'transparent' }),
            stroke: new Stroke({ color: 'hsl(0, 0%, 60%)', width: 3 })
          })
        })
      }

      // Вычисляем общее население для определения размера круга
      const totalPopulation = estateTypes.reduce((sum, type) => sum + type.population, 0)
      
      // Линейная нормализация радиуса по населению (минимум 2.5, максимум 12)
      const minRadius = 2.5
      const maxRadius = 12
      const minPopulation = 10
      const maxPopulation = 1000
      
      // Линейная нормализация
      const normalizedPopulation = Math.min(Math.max(totalPopulation - minPopulation, 0) / (maxPopulation - minPopulation), 1)
      const radius = minRadius + (maxRadius - minRadius) * normalizedPopulation

      // Если только один тип - простой круг
      if (estateTypes.length === 1) {
        return new Style({
          image: new Circle({
            radius: radius,
            fill: new Fill({ color: 'transparent' }),
            stroke: new Stroke({ color: estateTypes[0].color, width: 3 })
          })
        })
      }

      // Для нескольких типов создаём SVG иконку
      const svgSize = Math.ceil((maxRadius + 4) * 2)
      const center = svgSize / 2
      const strokeWidth = 3

      // Создаем SVG с сегментами
      const segmentAngle = 360 / estateTypes.length
      let svgPaths = ''
      
      estateTypes.forEach((type, index) => {
        const startAngle = -90 + (index * segmentAngle)
        const endAngle = -90 + ((index + 1) * segmentAngle)

        const startRad = (startAngle * Math.PI) / 180
        const endRad = (endAngle * Math.PI) / 180

        const x1 = center + radius * Math.cos(startRad)
        const y1 = center + radius * Math.sin(startRad)
        const x2 = center + radius * Math.cos(endRad)
        const y2 = center + radius * Math.sin(endRad)

        const largeArcFlag = segmentAngle > 180 ? 1 : 0

        svgPaths += `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}" fill="none" stroke="${type.color}" stroke-width="${strokeWidth}" stroke-linecap="butt"/>`
      })

      const svg = `
        <svg width="${svgSize}" height="${svgSize}" xmlns="http://www.w3.org/2000/svg">
          ${svgPaths}
        </svg>
      `

      // Создаем Data URL из SVG
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(svgBlob)

      // Создаем иконку из SVG
      const img = new Image()
      img.src = url

      return new Style({
        image: new Circle({
          radius: svgSize / 2,
          fill: new Fill({
            color: 'transparent'
          })
        }),
        // Используем внешнюю иконку
        renderer: (coordinates, state) => {
          const ctx = state.context
          const pixelRatio = state.pixelRatio
          const x = coordinates[0]
          const y = coordinates[1]
          
          ctx.save()
          ctx.translate(x, y)
          ctx.scale(pixelRatio, pixelRatio)
          
          // Рисуем сегменты напрямую
          const segmentAngle = (2 * Math.PI) / estateTypes.length
          
          estateTypes.forEach((type, index) => {
            const startAngle = -Math.PI / 2 + (index * segmentAngle)
            const endAngle = -Math.PI / 2 + ((index + 1) * segmentAngle)

            ctx.beginPath()
            ctx.arc(0, 0, radius, startAngle, endAngle, false)
            ctx.strokeStyle = type.color
            ctx.lineWidth = strokeWidth
            ctx.lineCap = 'butt'
            ctx.stroke()
          })
          
          ctx.restore()
        }
      })
    },

    // Старый метод createConcentricCirclesMarker оставлен для совместимости
    createConcentricCirclesMarkerOld(settlement) {
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
    },

    // Отображение GeoJSON данных на Leaflet карте
    displayGeoJsonOnLeaflet(geoJsonData) {
      if (!this.leafletMapInstance || !geoJsonData) return

      // Удаляем существующие маркеры GeoJSON
      this.clearGeoJsonMarkers()

      try {
        console.log('Displaying GeoJSON on Leaflet:', geoJsonData)

        // Создаем слой GeoJSON для Leaflet
        this.leafletGeoJsonLayer = L.geoJSON(geoJsonData, {
          style: (feature) => {
            // Определяем цвет на основе типа сословия
            const estateTypes = feature.properties.estate_types || []
            const dominantType = estateTypes[0] // Берем первый тип как доминирующий
            const color = this.getEstateTypeColor(dominantType?.type_name || 'default')

            return {
              color: color,
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.4,
              fillColor: color
            }
          },
          pointToLayer: (feature, latlng) => {
            // Создаем кастомный маркер для точек
            const estateTypes = feature.properties.estate_types || []
            const markerElement = this.createEstateTypeMarker(feature.properties)

            return L.marker(latlng, {
              icon: L.divIcon({
                className: 'estate-type-marker',
                html: markerElement,
                iconSize: this.getMarkerSize(),
                iconAnchor: [this.getMarkerSize()[0] / 2, this.getMarkerSize()[1] / 2]
              })
            })
          },
          onEachFeature: (feature, layer) => {
            // Создаем подробный popup с информацией о населенном пункте
            const popupContent = this.generateSettlementPopupContent(feature.properties)
            layer.bindPopup(popupContent)
          }
        })

        // Добавляем слой на карту
        this.leafletGeoJsonLayer.addTo(this.leafletMapInstance)

        console.log(`Added ${geoJsonData.features?.length || 0} features to Leaflet map`)

        // Центрируем карту на данных если они есть
        if (geoJsonData.features && geoJsonData.features.length > 0) {
          const bounds = this.leafletGeoJsonLayer.getBounds()
          if (bounds.isValid()) {
            this.leafletMapInstance.fitBounds(bounds, { padding: [20, 20] })
          }
        }

      } catch (error) {
        console.error('Error displaying GeoJSON on Leaflet:', error)
      }
    },

    // Отображение GeoJSON данных на OpenLayers карте
    displayGeoJsonOnOpenLayers(geoJsonData) {
      if (!this.olMapInstance || !this.olVectorLayer || !geoJsonData) return

      // Очищаем существующие features
      this.clearGeoJsonMarkers()

      try {
        console.log('Displaying GeoJSON on OpenLayers:', geoJsonData)

        const source = this.olVectorLayer.getSource()
        const features = []

        // Обрабатываем каждый feature из GeoJSON
        geoJsonData.features.forEach((feature, index) => {
          try {
            const olFeature = new Feature({
              geometry: this.geoJsonGeometryToOpenLayers(feature.geometry),
              properties: feature.properties || {}
            })

            // Определяем стиль на основе типа сословия
            const estateTypes = feature.properties.estate_types || []
            const dominantType = estateTypes[0] // Берем первый тип как доминирующий
            const color = this.getEstateTypeColor(dominantType?.type_name || 'default')

            olFeature.setStyle(new Style({
              image: new Circle({
                radius: 8,
                fill: new Fill({ color: color }),
                stroke: new Stroke({ color: 'white', width: 2 })
              })
            }))

            features.push(olFeature)
            console.log(`Added feature ${index} to OpenLayers map`)

          } catch (featureError) {
            console.error(`Error adding feature ${index}:`, featureError)
          }
        })

        // Добавляем features на карту
        if (features.length > 0) {
          source.addFeatures(features)
          console.log(`Added ${features.length} features to OpenLayers map`)

          // Центрируем карту на данных
          const extent = source.getExtent()
          if (extent && extent[0] !== Infinity) {
            this.olMapInstance.getView().fit(extent, {
              padding: [20, 20, 20, 20],
              maxZoom: 15
            })
          }
        }

      } catch (error) {
        console.error('Error displaying GeoJSON on OpenLayers:', error)
      }
    },

    // Создание маркера на основе типов сословий
    createEstateTypeMarker(properties) {
      const estateTypes = properties.estate_types || []
      const population = properties.population || { total: 0 }

      if (estateTypes.length === 0) {
        return '<div class="marker-circle" style="background-color: hsl(0, 85%, 55%);"></div>'
      }

      // Если есть несколько типов сословий, создаем pie chart
      if (estateTypes.length > 1) {
        return this.createEstatePieChartMarker(estateTypes, population.total)
      } else {
        // Один тип - простой круг с цветом типа
        const color = this.getEstateTypeColor(estateTypes[0].type_name)
        return `<div class="marker-circle" style="background-color: ${color};"></div>`
      }
    },

    // Создание маркера в виде круговой диаграммы для нескольких типов сословий
    createEstatePieChartMarker(estateTypes, totalPopulation) {
      const radius = 10
      const centerX = radius
      const centerY = radius

      let svg = `<svg width="${radius * 2}" height="${radius * 2}" viewBox="0 0 ${radius * 2} ${radius * 2}">`

      // Создаем сектора для каждого типа сословия
      let currentAngle = 0
      estateTypes.forEach((estateType, index) => {
        const percentage = estateType.total_count / totalPopulation
        const angle = percentage * 360

        if (angle > 0) {
          const startAngle = currentAngle
          const endAngle = currentAngle + angle

          const startAngleRad = (startAngle - 90) * Math.PI / 180
          const endAngleRad = (endAngle - 90) * Math.PI / 180

          const x1 = centerX + radius * Math.cos(startAngleRad)
          const y1 = centerY + radius * Math.sin(startAngleRad)
          const x2 = centerX + radius * Math.cos(endAngleRad)
          const y2 = centerY + radius * Math.sin(endAngleRad)

          const largeArcFlag = angle > 180 ? 1 : 0
          const color = this.getEstateTypeColor(estateType.type_name)

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ')

          svg += `<path d="${pathData}" fill="${color}" stroke="white" stroke-width="1"/>`

          currentAngle += angle
        }
      })

      svg += '</svg>'
      return `<div class="estate-pie-chart-marker">${svg}</div>`
    },

    // Получение цвета для типа сословия
    getEstateTypeColor(estateType) {
      // Если передан объект с type_color, используем его
      if (typeof estateType === 'object' && estateType.type_color) {
        return estateType.type_color
      }

      // Если передано название, используем цвет из базы данных
      if (typeof estateType === 'string') {
        // В будущем здесь можно добавить логику для получения цвета по названию
        return this.getEstateTypeColorByName(estateType)
      }

      // Если передан ID, получаем цвет из кэша или загружаем
      if (typeof estateType === 'number' || (typeof estateType === 'object' && estateType.type_id)) {
        return this.getEstateTypeColorById(estateType)
      }

      return 'hsl(0, 0%, 60%)' // default color
    },

    // Получение цвета по названию типа сословия
    getEstateTypeColorByName(estateTypeName) {
      const colorMap = {
        'Крестьяне': 'hsl(0, 85%, 55%)',
        'Мещане': 'hsl(178, 63%, 52%)',
        'Дворяне': 'hsl(197, 65%, 55%)',
        'Духовенство': 'hsl(136, 33%, 65%)',
        'Купцы': 'hsl(48, 100%, 67%)',
        'Военные': 'hsl(282, 44%, 70%)',
        'Ремесленники': 'hsl(174, 38%, 70%)',
        'default': 'hsl(0, 0%, 60%)'
      }

      return colorMap[estateTypeName] || colorMap.default
    },

    // Получение цвета по ID типа сословия
    getEstateTypeColorById(estateType) {
      const typeId = typeof estateType === 'object' ? estateType.type_id : estateType

      // Если у объекта есть цвет, используем его
      if (typeof estateType === 'object' && estateType.type_color) {
        return estateType.type_color
      }

      // Генерируем цвет на основе ID (для обратной совместимости)
      const colors = [
        'hsl(0, 85%, 55%)', 'hsl(178, 63%, 52%)', 'hsl(197, 65%, 55%)',
        'hsl(136, 33%, 65%)', 'hsl(48, 100%, 67%)', 'hsl(282, 44%, 70%)',
        'hsl(174, 38%, 70%)', 'hsl(48, 100%, 67%)', 'hsl(262, 41%, 68%)',
        'hsl(204, 70%, 67%)'
      ]

      return colors[typeId % colors.length] || 'hsl(0, 0%, 60%)'
    },

    // Генерация popup для населённого пункта (новый формат)
    generateSettlementPopup(settlement) {
      const nameOld = settlement.name || '—'
      const nameModern = settlement.nameModern || '—'
      const district = settlement.district || '—'
      
      // Формируем детальный список сословий
      let estatesDetails = ''
      let totalSum = 0
      
      if (settlement.estates && settlement.estates.length > 0) {
        settlement.estates.forEach(estate => {
          const subtype = estate.subtype_estate_name || '—'
          const religion = estate.type_religion_name || '—'
          const male = estate.male || 0
          const female = estate.female || 0
          const total = estate.total || (male + female)
          totalSum += total
          
          estatesDetails += `<div class="popup-estate-item">${subtype}, ${religion}, М: ${male}, Ж: ${female}, Итого: ${total}</div>`
        })
        
        // Добавляем строку "Всего"
        estatesDetails += `<div class="popup-estate-total">Всего: ${totalSum}</div>`
      } else {
        estatesDetails = '<div class="popup-estate-item">Нет данных о сословиях</div>'
      }

      return `
        <div class="settlement-popup-new">
          <div class="popup-field">${nameOld}</div>
          ${nameModern !== '—' ? `<div class="popup-field popup-field-modern">${nameModern}</div>` : ''}
          <div class="popup-field">${district}</div>
          <div class="popup-estates">
            ${estatesDetails}
          </div>
          <div class="popup-actions">
            <button class="popup-details-btn" onclick="window.dispatchEvent(new CustomEvent('show-settlement-details', { detail: { settlement: ${JSON.stringify(settlement).replace(/"/g, '&quot;')} } }))">Детали</button>
          </div>
        </div>
      `
    },

    // Генерация содержимого popup для населенного пункта
    generateSettlementPopupContent(properties) {
      const nameOld = properties.name_old || '—'
      const nameModern = properties.name_modern || '—'
      const district = properties.district_name || '—'
      const population = properties.population || { total: 0, male: 0, female: 0 }
      const revisions = properties.revisions || []
      const estates = properties.estates || []
      const estateTypes = properties.estate_types || []

      let content = `
        <div class="settlement-popup">
          <h4>${nameOld}</h4>
          ${nameModern !== '—' ? `<p class="modern-name"><em>${nameModern}</em></p>` : ''}
          <p><strong>Район:</strong> ${district}</p>
          <div class="popup-section">
            <p><strong>Население:</strong> ${population.total} чел.</p>
            <p class="gender-stats">М: ${population.male} | Ж: ${population.female}</p>
          </div>
      `

      // Показываем ревизии
      if (revisions.length > 0) {
        content += '<div class="popup-section"><strong>Ревизии:</strong><br>'
        revisions.forEach(rev => {
          content += `<span class="revision-item">№${rev.number} (${rev.year}): ${rev.total} чел.</span><br>`
        })
        content += '</div>'
      }

      // Показываем сословия по типам
      if (estateTypes.length > 0) {
        content += '<div class="popup-section"><strong>Сословия по типам:</strong><br>'
        estateTypes.forEach(type => {
          const color = this.getEstateTypeColorByName(type.type_name)
          content += `<span class="estate-type-item"><span style="color: ${color};">■</span> ${type.type_name}: ${type.total} (М:${type.male}, Ж:${type.female})</span><br>`
        })
        content += '</div>'
      }

      // Показываем детальную информацию по сословиям
      if (estates.length > 0 && estates.length <= 10) {
        content += '<div class="popup-section"><strong>Детали сословий:</strong><br>'
        estates.forEach(estate => {
          content += `<span class="estate-detail">• ${estate.subtype_name} (${estate.religion_name}): ${estate.total}</span><br>`
        })
        content += '</div>'
      } else if (estates.length > 10) {
        content += `<div class="popup-section"><em>Всего сословий: ${estates.length}</em></div>`
      }

      content += '</div>'
      return content
    },

    // Очистка GeoJSON маркеров
    clearGeoJsonMarkers() {
      // Очищаем Leaflet
      if (this.leafletGeoJsonLayer) {
        this.leafletMapInstance.removeLayer(this.leafletGeoJsonLayer)
        this.leafletGeoJsonLayer = null
      }

      // Очищаем OpenLayers
      if (this.olVectorLayer) {
        this.olVectorLayer.getSource().clear()
      }
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
    },
    geoJsonData: {
      handler(newVal) {
        if (newVal && this.mapProvider === 'leaflet') {
          this.displayGeoJsonOnLeaflet(newVal)
        } else if (newVal && this.mapProvider === 'openlayers') {
          this.displayGeoJsonOnOpenLayers(newVal)
        }
      },
      deep: true,
      immediate: true
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
// OpenLayers popup styles for better readability (scoped → deep)
:deep(.ol-popup) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 10px;
  color: var(--text-primary);
}

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

  // Панель легенды
  .map-legend-panel {
    position: absolute;
    bottom: 15px;
    right: 10px;
    z-index: 1000;
    background: var(--bg-secondary);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    padding: 8px 12px;
    min-width: 150px;
    opacity: 0.9;
    transition: background-color 0.3s ease, border-color 0.3s ease, opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }

    .legend-items {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid var(--bg-primary);
          flex-shrink: 0;
        }

        .legend-label {
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.2;
        }
      }
    }
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

  .estate-pie-chart-marker {
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

  .estate-type-marker {
    display: block;
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.2);
    }
  }
}

:deep(.settlement-popup) {
  min-width: 250px;
  max-width: 400px;

  h4 {
    margin: 0 0 4px 0;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
  }

  .modern-name {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: var(--text-secondary);
    font-style: italic;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border-color);
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

    &.gender-stats {
      font-size: 11px;
      color: var(--text-muted);
    }
  }

  .popup-section {
    margin: 8px 0;
    padding: 6px 0;
    border-top: 1px solid var(--border-color);

    &:first-child {
      border-top: none;
      padding-top: 0;
    }

    strong {
      color: var(--text-primary);
      font-weight: 600;
      font-size: 12px;
      display: block;
      margin-bottom: 4px;
    }

    .revision-item {
      display: block;
      font-size: 11px;
      color: var(--text-secondary);
      margin: 2px 0;
      line-height: 1.3;
    }

    .estate-type-item {
      display: block;
      font-size: 11px;
      color: var(--text-secondary);
      margin: 2px 0;
      line-height: 1.3;

      span {
        font-size: 14px;
        margin-right: 4px;
      }
    }

    .estate-detail {
      display: block;
      font-size: 10px;
      color: var(--text-muted);
      margin: 2px 0;
      line-height: 1.2;
    }

    em {
      font-size: 11px;
      color: var(--text-muted);
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

// Стили для tooltip (всплывающих подсказок)
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
      1px 1px 0 var(--bg-primary),
      -1px 0 0 var(--bg-primary),
      1px 0 0 var(--bg-primary),
      0 -1px 0 var(--bg-primary),
      0 1px 0 var(--bg-primary);
  }

  .tooltip-district {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    text-shadow: 
      -1px -1px 0 var(--bg-primary),
      1px -1px 0 var(--bg-primary),
      -1px 1px 0 var(--bg-primary),
      1px 1px 0 var(--bg-primary),
      -1px 0 0 var(--bg-primary),
      1px 0 0 var(--bg-primary),
      0 -1px 0 var(--bg-primary),
      0 1px 0 var(--bg-primary);
  }
}

// OpenLayers tooltip
:deep(.ol-tooltip) {
  background: transparent;
  border: none;
  padding: 2px 4px;
  pointer-events: none;
}

// Leaflet tooltip (перезаписываем стандартные стили)
:deep(.leaflet-tooltip.custom-tooltip) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  
  &::before {
    display: none;
  }
}

// Новый стиль popup
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

    &.popup-field-subtypes {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid var(--border-color);
    }

    &.popup-field-religion {
      font-size: 11px;
      color: var(--text-secondary);
      font-style: italic;
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

      &:active {
        transform: scale(0.98);
      }
    }
  }
}

// Leaflet popup - исправление фона для тёмной темы
:deep(.leaflet-popup-content-wrapper) {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

:deep(.leaflet-popup-tip) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
}
</style>
