<template>
  <aside class="sidebar" :class="{ 'sidebar--open': open }">
    <div class="sidebar-header">
      <i class="bi bi-cash-coin me-2 text-warning fs-4"></i>
      <span class="fw-bold fs-5">Financeiro</span>
    </div>

    <nav class="sidebar-nav">
      <p class="sidebar-section-label">MENU</p>

      <RouterLink to="/dashboard"  class="sidebar-link" @click="$emit('close')">
        <i class="bi bi-speedometer2"></i>
        <span>Dashboard</span>
      </RouterLink>

      <RouterLink to="/contas"     class="sidebar-link" @click="$emit('close')">
        <i class="bi bi-wallet2"></i>
        <span>Contas</span>
      </RouterLink>

      <RouterLink to="/fixas"      class="sidebar-link" @click="$emit('close')">
        <i class="bi bi-calendar-check"></i>
        <span>Despesas Fixas</span>
      </RouterLink>

      <RouterLink to="/movimentacoes" class="sidebar-link" @click="$emit('close')">
        <i class="bi bi-arrow-left-right"></i>
        <span>Movimentações</span>
      </RouterLink>

      <RouterLink to="/relatorio" class="sidebar-link" @click="$emit('close')">
        <i class="bi bi-bar-chart-line"></i>
        <span>Relatório</span>
      </RouterLink>

      <p class="sidebar-section-label mt-3">CONFIGURAÇÕES</p>

      <RouterLink to="/categorias" class="sidebar-link" @click="$emit('close')">
        <i class="bi bi-tags"></i>
        <span>Categorias</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="d-flex align-items-center gap-2">
        <div class="avatar">
          <i class="bi bi-person-fill"></i>
        </div>
        <div class="flex-grow-1 overflow-hidden">
          <p class="mb-0 fw-semibold text-truncate small">{{ authStore.user?.nome || authStore.user?.username }}</p>
          <p class="mb-0 text-muted" style="font-size: 0.7rem;">Administrador</p>
        </div>
        <button class="btn btn-sm btn-link text-danger p-0" title="Sair" @click="handleLogout">
          <i class="bi bi-box-arrow-right fs-5"></i>
        </button>
      </div>
    </div>
  </aside>

  <!-- Overlay mobile -->
  <div v-if="open" class="sidebar-overlay d-lg-none" @click="$emit('close')" />
</template>

<script setup>
import { useAuthStore } from '@/stores/auth.js'
import { useRouter } from 'vue-router'

defineProps({ open: Boolean })
defineEmits(['close'])

const authStore = useAuthStore()
const router    = useRouter()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  min-height: 100vh;
  background: #1a1d2e;
  color: #cdd3e0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-header {
  padding: 1.25rem 1.5rem;
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  display: flex;
  align-items: center;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  overflow-y: auto;
}

.sidebar-section-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #5a6480;
  padding: 0.25rem 0.75rem;
  margin-bottom: 0.25rem;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  color: #9aa3b8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  margin-bottom: 2px;
}
.sidebar-link i {
  font-size: 1.1rem;
  width: 1.25rem;
  text-align: center;
  flex-shrink: 0;
}
.sidebar-link:hover {
  background: rgba(255,255,255,0.06);
  color: #fff;
}
.sidebar-link.router-link-active {
  background: rgba(99,102,241,0.18);
  color: #818cf8;
}

.sidebar-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.07);
}

.avatar {
  width: 34px;
  height: 34px;
  background: rgba(99,102,241,0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #818cf8;
  flex-shrink: 0;
}

/* Mobile */
@media (max-width: 991.98px) {
  .sidebar {
    position: fixed;
    left: -260px;
    top: 0;
    z-index: 1045;
    transition: left 0.25s ease;
    height: 100vh;
  }
  .sidebar--open {
    left: 0;
  }
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1044;
}
</style>
