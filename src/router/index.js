import { createRouter, createWebHistory } from 'vue-router'
import { state as authState } from '@/store/auth.js'
import PgHome from '@/pages/PgHome.vue'
import PgAbout from '@/pages/PgAbout.vue'
import PgServices from '@/pages/PgServices.vue'
import PgContact from '@/pages/PgContact.vue'
import PgComponentsDemo from '@/pages/PgComponentsDemo.vue'
import PgEstateTypes from '@/pages/PgEstateTypes.vue'
import PgEstateTypesUpload from '@/pages/PgEstateTypesUpload.vue'
import PgRevisionsUpload from '@/pages/PgRevisionsUpload.vue'
import PgEstatesList from '@/pages/PgEstatesList.vue'
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
    path: '/services',
    name: 'Services',
    component: PgServices
  },
  {
    path: '/contact',
    name: 'Contact',
    component: PgContact
  },
  {
    path: '/demo',
    name: 'ComponentsDemo',
    component: PgComponentsDemo,
    meta: {
      requireAuth: true
    }
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
    path: '/estate-types-upload',
    name: 'EstateTypesUpload',
    component: PgEstateTypesUpload,
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
    path: '/estates-list',
    name: 'EstatesList',
    component: PgEstatesList
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
