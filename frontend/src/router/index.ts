import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import RegisterView from '@/views/RegisterView.vue'
import UserListView from '@/views/Admin/UserLIstView.vue'
import DashboardView from '@/views/User/DashboardView.vue'
import ProfileView from '@/views/ProfileView.vue'
import VerifyEmailView from '@/views/VerifyEmailView.vue'
import ResetPasswordView from '@/views/ResetPasswordView.vue'
import EmployeeListView from '@/views/Admin/EmployeeListView.vue'
import DepartmentsView from '@/views/Admin/DepartmentsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: UserListView,
    },
    {
      path: '/user/dashboard',
      name: 'user-dashboard',
      component: DashboardView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView
    },
    {
      path: '/account/verify-email',
      name: 'verify-email',
      component: VerifyEmailView
    },
    {
      path: '/account/reset-password',
      name: 'reset-password',
      component: ResetPasswordView
    },
    {
      path: '/admin/employees',
      name: 'admin-employees',
      component: EmployeeListView
    },
    {
      path: '/admin/departments',
      name: 'admin-departments',
      component: DepartmentsView
    },
  ],
})

export default router
