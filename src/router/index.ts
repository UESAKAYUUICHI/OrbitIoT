import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import UserManagement from '../components/user/UserManagement.vue'
import PermissionManagement from '../components/user/PermissionManagement.vue'
import AlertCenter from '../components/device/AlertCenter.vue'
import RealTimeDeviceData from '../components/device/RealTimeDeviceData.vue'

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
  },
  {
    path: '/alerts',
    name: 'AlertCenter',
    component: AlertCenter
  },
  {
    path: '/realtime-data',
    name: 'RealTimeDeviceData',
    component: RealTimeDeviceData
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router