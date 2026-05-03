import { createApp } from 'vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './styles/main.scss'

// Импортируем картографические библиотеки глобально
import 'leaflet/dist/leaflet.css'
import 'ol/ol.css'
import 'leaflet.fullscreen'
import 'leaflet.fullscreen/Control.FullScreen.css'

import { estateTypesService } from '@/services/estateTypes.js'
// Импортируем сервисы
import { initializeVectorLayerService } from '@/services/vectorLayers.js'

import App from './App.vue'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(ElementPlus)

// Регистрируем все иконки Element Plus
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Инициализируем сервисы
initializeVectorLayerService()

// Загружаем цвета типов собственности
estateTypesService.loadEstateTypeColors().catch(error => {
  console.error('❌ Failed to load estate type colors:', error)
})

app.mount('#app')
