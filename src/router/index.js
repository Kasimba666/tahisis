import { createRouter, createWebHistory } from 'vue-router'
import { state as authState } from '@/store/auth.js'
import PgHome from '@/pages/PgHome.vue'
import PgAbout from '@/pages/PgAbout.vue'
import PgServices from '@/pages/PgServices.vue'
import PgContact from '@/pages/PgContact.vue'
import PgComponentsDemo from '@/pages/PgComponentsDemo.vue'
import PgEstateTypesUpload from '@/pages/PgEstateTypesUpload.vue'
import PgRevisionsUpload from '@/pages/PgRevisionsUpload.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: PgHome
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
    console.log('Доступ запрещен: требуется аутентификация')
  } else {
    next()
  }
})

export default router
