import { createRouter, createWebHistory } from 'vue-router'
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
    component: PgComponentsDemo
  },
  {
    path: '/estate-types-upload',
    name: 'EstateTypesUpload',
    component: PgEstateTypesUpload
  },
  {
    path: '/revisions-upload',
    name: 'RevisionsUpload',
    component: PgRevisionsUpload
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router