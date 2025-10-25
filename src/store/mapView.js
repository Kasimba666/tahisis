import { reactive } from 'vue'

// Compact shared store for current map view
export const mapView = reactive({
  center: { lat: null, lon: null },
  zoom: null,
  // bounds as [[south, west], [north, east]] in EPSG:4326
  bounds: null,
  provider: null
})

const STORAGE_KEY = 'tahisis_map_view'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const v = JSON.parse(raw)
    if (v && v.center) mapView.center = v.center
    if (typeof v.zoom === 'number') mapView.zoom = v.zoom
    if (v.bounds) mapView.bounds = v.bounds
    if (v.provider) mapView.provider = v.provider
  } catch (e) {
    // noop
  }
}

function saveToStorage() {
  try {
    const v = {
      center: mapView.center,
      zoom: mapView.zoom,
      bounds: mapView.bounds,
      provider: mapView.provider
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  } catch (e) {
    // noop
  }
}

export function setLeafletView(map) {
  if (!map) return
  try {
    const c = map.getCenter()
    const z = map.getZoom()
    const b = map.getBounds()
    mapView.center = { lat: c.lat, lon: c.lng }
    mapView.zoom = z
    mapView.bounds = [[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]]
    mapView.provider = 'leaflet'
    saveToStorage()
  } catch (e) {
    // noop
  }
}

export function setOpenLayersView(centerLonLat, zoom, extent4326) {
  try {
    if (centerLonLat && typeof centerLonLat[0] === 'number' && typeof centerLonLat[1] === 'number') {
      mapView.center = { lat: centerLonLat[1], lon: centerLonLat[0] }
    }
    if (typeof zoom === 'number') {
      mapView.zoom = zoom
    }
    if (extent4326 && extent4326.length === 4) {
      const [minLon, minLat, maxLon, maxLat] = extent4326
      mapView.bounds = [[minLat, minLon], [maxLat, maxLon]]
    }
    mapView.provider = 'openlayers'
    saveToStorage()
  } catch (e) {
    // noop
  }
}

// initialize from storage on load
loadFromStorage()
