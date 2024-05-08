import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import subject from '@/views/subject.vue'
import examPage from '@/views/examPage.vue'
import rightWrong from '@/views/rightWrong.vue'
import singleChoice from '@/views/singleChoice.vue'
import multipleChoice from '@/views/multipleChoice.vue'
import newHome from "@/views/new/newHome.vue";
import thehome from "@/views/new/thehome.vue";

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

    ]
  },
  {
    path: '/examPage/:lesson/:id',
    name: 'examPage',
    component: examPage
  },
  {
    path: '/test',
    name: 'newHome',
    component: newHome,
    children: [
      {
        path: '/test',
        name: 'thehome',
        component: thehome
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
