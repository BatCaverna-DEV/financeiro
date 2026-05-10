<template>
  <header class="app-navbar">
    <button class="btn btn-sm d-lg-none me-2 text-muted" @click="$emit('toggle-sidebar')">
      <i class="bi bi-list fs-4"></i>
    </button>

    <div class="d-flex flex-column">
      <h5 class="mb-0 fw-semibold text-dark">{{ pageTitle }}</h5>
      <small class="text-muted">{{ formattedDate }}</small>
    </div>

    <div class="ms-auto d-flex align-items-center gap-2">
      <span class="text-muted small d-none d-sm-inline">
        Olá, <strong>{{ authStore.user?.nome || authStore.user?.username }}</strong>
      </span>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

defineEmits(['toggle-sidebar'])

const route     = useRoute()
const authStore = useAuthStore()

const pageTitle = computed(() => route.meta.title || 'Financeiro')

const formattedDate = computed(() =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)
</script>

<style scoped>
.app-navbar {
  display: flex;
  align-items: center;
  padding: 0.85rem 1.75rem;
  background: #fff;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 100;
}
</style>
