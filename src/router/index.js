import { createRouter, createWebHistory } from 'vue-router'
import { state as authState } from '@/store/auth.js'
import PgAbout from '@/pages/PgAbout.vue'
import PgEstateTypes from '@/pages/PgEstateTypes.vue'
import PgRevisionsUpload from '@/pages/PgRevisionsUpload.vue'
import PgEstatesList from '@/pages/PgEstatesList.vue'
import PgEstatesByType from '@/pages/PgEstatesByType.vue'
import PgSettlements from '@/pages/PgSettlements.vue'
import PgSettings from '@/pages/PgSettings.vue'
import PgVectorLayerTypes from '@/pages/PgVectorLayerTypes.vue'
import PgVectorLayers from '@/pages/PgVectorLayers.vue'

// Вспомогательная функция для работы с URL параметрами фильтров
const getFiltersFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const filtersParam = urlParams.get('filters')

  if (filtersParam) {
    try {
      return JSON.parse(decodeURIComponent(filtersParam))
    } catch (error) {
      console.error('Error parsing filters from URL:', error)
      return null
    }
  }

  return null
}

const setFiltersInURL = (filters) => {
  const url = new URL(window.location)
  if (filters && Object.keys(filters).length > 0) {
    url.searchParams.set('filters', encodeURIComponent(JSON.stringify(filters)))
  } else {
    url.searchParams.delete('filters')
  }
  window.history.replaceState({}, '', url)
}

// Функции для работы с параметрами mode и sorting
const getModeFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('mode') || 'estate' // По умолчанию 'estate' (По сословиям)
}

const setModeInURL = (mode) => {
  const url = new URL(window.location)
  if (mode && mode !== 'estate') {
    url.searchParams.set('mode', mode)
  } else {
    url.searchParams.delete('mode')
  }
  window.history.replaceState({}, '', url)
}

const getSortingFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const sortingParam = urlParams.get('sorting')

  if (sortingParam) {
    try {
      return JSON.parse(decodeURIComponent(sortingParam))
    } catch (error) {
      console.error('Error parsing sorting from URL:', error)
      return null
    }
  }

  return null
}

const setSortingInURL = (sorting) => {
  const url = new URL(window.location)
  if (sorting && sorting.column && sorting.order) {
    url.searchParams.set('sorting', encodeURIComponent(JSON.stringify(sorting)))
  } else {
    url.searchParams.delete('sorting')
  }
  window.history.replaceState({}, '', url)
}

// Функция для получения всех параметров из URL
const getAllParamsFromURL = () => {
  return {
    filters: getFiltersFromURL(),
    mode: getModeFromURL(),
    sorting: getSortingFromURL()
  }
}

// Функция для установки всех параметров в URL
const setAllParamsInURL = (params) => {
  const url = new URL(window.location)

  // Устанавливаем фильтры
  if (params.filters && Object.keys(params.filters).length > 0) {
    url.searchParams.set('filters', encodeURIComponent(JSON.stringify(params.filters)))
  } else {
    url.searchParams.delete('filters')
  }

  // Устанавливаем режим
  if (params.mode && params.mode !== 'estate') {
    url.searchParams.set('mode', params.mode)
  } else {
    url.searchParams.delete('mode')
  }

  // Устанавливаем сортировку
  if (params.sorting && params.sorting.column && params.sorting.order) {
    url.searchParams.set('sorting', encodeURIComponent(JSON.stringify(params.sorting)))
  } else {
    url.searchParams.delete('sorting')
  }

  window.history.replaceState({}, '', url)
}

const routes = [
  {
    path: '/',
    redirect: {name: 'About'},
  },
  {
    path: '/about',
    name: 'About',
    component: PgAbout
  },
  {
    path: '/estate-types',
    name: 'EstateTypes',
    component: PgEstateTypes,
    meta: {
      requireAuth: true
    }
  },
  {
    path: '/revisions-upload',
    name: 'RevisionsUpload',
    component: PgRevisionsUpload,
    meta: {
      requireAuth: true
    }
  },
  {
    path: '/estates',
    name: 'Estates',
    component: PgEstatesByType
  },
  {
    path: '/estates-list',
    name: 'EstatesList',
    component: PgEstatesList,
    meta: { dataMode: 'estate' }
  },
  {
    path: '/revisions',
    name: 'Revisions',
    component: PgEstatesList,
    meta: { dataMode: 'report' }
  },
  {
    path: '/settlements',
    name: 'Settlements',
    component: PgSettlements
  },
  {
    path: '/settings',
    name: 'Settings',
    component: PgSettings
  },
  {
    path: '/vector-layer-types',
    name: 'VectorLayerTypes',
    component: PgVectorLayerTypes,
    meta: {
      requireAuth: true
    }
  },
  {
    path: '/vector-layers',
    name: 'VectorLayers',
    component: PgVectorLayers,
    meta: {
      requireAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard для проверки аутентификации
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requireAuth)
  const isAuthenticated = authState.user !== null

  if (requiresAuth && !isAuthenticated) {
    // Перенаправляем на главную страницу с сообщением об ошибке
    next('/')
    // Здесь можно добавить показ сообщения об ошибке аутентификации
    // console.log('Доступ запрещен: требуется аутентификация')
  } else {
    next()
  }
})

export default router

// Экспортируем функции для работы с URL параметрами
export {
  getFiltersFromURL,
  setFiltersInURL,
  getModeFromURL,
  setModeInURL,
  getSortingFromURL,
  setSortingInURL,
  getAllParamsFromURL,
  setAllParamsInURL
}
