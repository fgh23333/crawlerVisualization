import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import(/* webpackChunkName: "home" */ '../views/HomeView.vue'),
    children: [
      {
        path: 'subject/:lesson',
        name: 'subject',
        component: () => import(/* webpackChunkName: "old-views" */ '@/views/subject.vue')
      },
      {
        path: 'rightWrong/:lesson',
        name: 'rightWrong',
        component: () => import(/* webpackChunkName: "old-views" */ '@/views/rightWrong.vue')
      },
      {
        path: 'singleChoice/:lesson',
        name: 'singleChoice',
        component: () => import(/* webpackChunkName: "old-views" */ '@/views/singleChoice.vue')
      },
      {
        path: 'multipleChoice/:lesson',
        name: 'multipleChoice',
        component: () => import(/* webpackChunkName: "old-views" */ '@/views/multipleChoice.vue')
      },
      {
        path: 'fillingBlank/:lesson',
        name: 'fillingBlank',
        component: () => import(/* webpackChunkName: "old-views" */ '@/views/fillingBlank.vue')
      }
    ]
  },
  {
    path: '/newHome',
    name: 'newHome',
    component: () => import(/* webpackChunkName: "new-home" */ "@/views/new/newHome.vue"),
    children: [
      {
        path: '/',
        component: () => import(/* webpackChunkName: "new-home" */ "@/views/new/theHome.vue"),
      },
      {
        path: ':type/:lesson',
        name: 'questionList',
        component: () => import(/* webpackChunkName: "new-question-list" */ "@/views/new/questionList.vue")
      },
      {
        path: 'favorites',
        name: 'favorites',
        component: () => import(/* webpackChunkName: "new-favorites" */ "@/views/new/favorites.vue")
      },
      {
        path: 'exam/:lesson/:id',
        name: 'examView',
        component: () => import(/* webpackChunkName: "new-exam" */ '@/views/new/examView.vue')
      },
      {
        path: 'about',
        name: 'about',
        component: () => import(/* webpackChunkName: "new-about" */ '@/views/new/about.vue')
      },
      {
        path: 'chat',
        name: 'gemma',
        component: () => import(/* webpackChunkName: "chat" */ '@/views/new/chatView.vue')
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
