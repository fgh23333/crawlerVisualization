import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import subject from '@/views/subject.vue'
import rightWrong from '@/views/rightWrong.vue'
import singleChoice from '@/views/singleChoice.vue'
import multipleChoice from '@/views/multipleChoice.vue'
import fillingBlank from '@/views/fillingBlank.vue'
import newHome from "@/views/new/newHome.vue"
import theHome from "@/views/new/theHome.vue"
import questionList from "@/views/new/questionList.vue"
import favorites from "@/views/new/favorites.vue"
import examView from '@/views/new/examView.vue'
import about from '@/views/new/about.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    children: [
      {
        path: 'subject/:lesson',
        name: 'subject',
        component: subject
      },
      {
        path: 'rightWrong/:lesson',
        name: 'rightWrong',
        component: rightWrong
      },
      {
        path: 'singleChoice/:lesson',
        name: 'singleChoice',
        component: singleChoice
      },
      {
        path: 'multipleChoice/:lesson',
        name: 'multipleChoice',
        component: multipleChoice
      },
      {
        path: 'fillingBlank/:lesson',
        name: 'fillingBlank',
        component: fillingBlank
      }
    ]
  },
  {
    path: '/newHome',
    name: 'newHome',
    component: newHome,
    children: [
      {
        path: '/',
        component: theHome,
      },
      {
        path: ':type/:lesson',
        name: 'questionList',
        component: questionList
      },
      {
        path: 'favorites',
        name: 'favorites',
        component: favorites
      },
      {
        path: 'exam/:lesson/:id',
        name: 'examView',
        component: examView
      },
      {
        path: 'about',
        name: 'about',
        component: about
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
