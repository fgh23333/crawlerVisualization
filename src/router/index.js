import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import subject from '@/views/subject.vue'
import examPage from '@/views/examPage.vue'
import rightWrong from '@/views/rightWrong.vue'
import singleChoice from '@/views/singleChoice.vue'
import multipleChoice from '@/views/multipleChoice.vue'
import fillingBlank from '@/views/fillingBlank.vue'
import newHome from "@/views/new/newHome.vue"
import aboutUs from "@/views/new/aboutUs.vue"
import theHome from "@/views/new/theHome.vue"
import questionList from "@/views/new/questionList"

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
    path: '/examPage/:lesson/:id',
    name: 'examPage',
    component: examPage
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
        path: 'aboutUs',
        name: 'aboutUs',
        component: aboutUs
      },
      {
        path: ':type/:lesson',
        name: 'questionList',
        component: questionList
      }
    ]
  },

]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
