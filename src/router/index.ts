import { createRouter, createWebHistory } from 'vue-router';
import LibraryView from '../views/LibraryView.vue';
import SettingView from '../views/SettingView.vue';

const routes = [
  {
    path: '/',
    redirect: '/library'
  },
  {
    path: '/library',
    name: 'Library',
    component: LibraryView,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
