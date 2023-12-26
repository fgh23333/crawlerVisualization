import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import introduction from '@/views/introduction.vue'
import political from '@/views/political.vue'
import examPage from '@/views/examPage.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    children: [
      {
        path: 'introduction',
        name: 'introduction',
        component: introduction
      },
      {
        path: 'political',
        name: 'political',
        component: political
      }
    ]
  },
  {
    path: '/examPage/:lesson/:id',
    name: 'examPage',
    component: examPage
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
