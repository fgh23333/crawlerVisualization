import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    children: [
      {
        path: 'subject/:lesson',
        name: 'subject',
        component: () => import('@/views/subject.vue')
      },
      {
        path: 'rightWrong/:lesson',
        name: 'rightWrong',
        component: () => import('@/views/rightWrong.vue')
      },
      {
        path: 'singleChoice/:lesson',
        name: 'singleChoice',
        component: () => import('@/views/singleChoice.vue')
      },
      {
        path: 'multipleChoice/:lesson',
        name: 'multipleChoice',
        component: () => import('@/views/multipleChoice.vue')
      },
      {
        path: 'fillingBlank/:lesson',
        name: 'fillingBlank',
        component: () => import('@/views/fillingBlank.vue')
      },
      {
        path: 'favorites',
        name: 'oldFavorites',
        component: () => import('@/views/new/favorites.vue')
      }
    ]
  },
  {
    path: '/newHome',
    name: 'newHome',
    component: () => import('@/views/new/newHome.vue'),
    children: [
      {
        path: '',
        component: () => import('@/views/new/theHome.vue'),
      },
      {
        path: ':type/:lesson',
        name: 'questionList',
        component: () => import('@/views/new/questionList.vue')
      },
      {
        path: 'favorites',
        name: 'favorites',
        component: () => import('@/views/new/favorites.vue')
      },
      {
        path: 'exam/:lesson/:id',
        name: 'examView',
        component: () => import('@/views/new/examView.vue')
      },
      {
        path: 'about',
        name: 'about',
        component: () => import('@/views/new/about.vue')
      },
      {
        path: 'chat',
        name: 'gemma',
        component: () => import('@/views/new/chatView.vue')
      },
      {
        path: 'feedback',
        name: 'feedback',
        component: () => import('@/views/new/feedback.vue')
      }
    ]
  },
  {
    path: '/ncre3',
    name: 'ncre3',
    component: () => import('@/views/ncre3/ncre3Home.vue'),
    children: [
      {
        path: '',
        name: 'ncre3Index',
        component: () => import('@/views/ncre3/ncre3HomeContent.vue')
      },
      {
        path: ':category',
        name: 'ncre3Category',
        component: () => import('@/views/ncre3/ncre3Category.vue')
      },
      {
        path: 'favorites',
        name: 'ncre3Favorites',
        component: () => import('@/views/ncre3/ncre3Favorites.vue')
      },
      {
        path: 'exam/random',
        name: 'ncre3Exam',
        component: () => import('@/views/ncre3/ncre3Exam.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
