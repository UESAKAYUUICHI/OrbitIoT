import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import UserManagement from '../components/UserManagement.vue'
import PermissionManagement from '../components/PermissionManagement.vue'

const routes = [
  {
    path: '/',
    name: 'Main',
    component: App
  },
  {
    path: '/users',
    name: 'UserManagement',
    component: UserManagement
  },
  {
    path: '/permissions',
    name: 'PermissionManagement',
    component: PermissionManagement
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router