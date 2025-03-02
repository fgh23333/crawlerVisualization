import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/theHome.vue'),
      children:[
        {
          path: '/',
          name: 'theHome',
          component: () => import('@/views/theHome.vue')
        }
      ]
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/about.vue')
    },
  ],
})

export default router
