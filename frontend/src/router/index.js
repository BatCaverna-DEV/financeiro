import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

import AppLayout       from '@/components/layout/AppLayout.vue'
import LoginView       from '@/views/LoginView.vue'
import DashboardView   from '@/views/DashboardView.vue'
import ContasView      from '@/views/ContasView.vue'
import FixasView       from '@/views/FixasView.vue'
import MovimentacoesView from '@/views/MovimentacoesView.vue'
import CategoriasView  from '@/views/CategoriasView.vue'
import RelatorioView   from '@/views/RelatorioView.vue'

const routes = [
  {
    path: '/login',
    component: LoginView,
    meta: { guest: true },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '',          redirect: '/dashboard' },
      { path: 'dashboard', component: DashboardView,  meta: { title: 'Dashboard' } },
      { path: 'contas',    component: ContasView,     meta: { title: 'Contas' } },
      { path: 'fixas',     component: FixasView,      meta: { title: 'Despesas Fixas' } },
      { path: 'movimentacoes', component: MovimentacoesView, meta: { title: 'Movimentações' } },
      { path: 'relatorio', component: RelatorioView,  meta: { title: 'Relatório' } },
      { path: 'categorias',component: CategoriasView, meta: { title: 'Categorias' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return '/dashboard'
  }
})

export default router
