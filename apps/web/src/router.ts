import { createRouter, createWebHistory } from 'vue-router'
import ProductsPage from './pages/ProductsPage.vue'
import StaticInfoPage from './pages/StaticInfoPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', name: 'dashboard', component: StaticInfoPage },
    { path: '/chat', name: 'chat', component: StaticInfoPage },
    { path: '/products', name: 'products', component: ProductsPage },
    { path: '/shopping', name: 'shopping', component: StaticInfoPage },
    { path: '/timeline', name: 'timeline', component: StaticInfoPage }
  ]
})
