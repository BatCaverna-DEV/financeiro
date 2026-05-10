<template>
  <div class="login-page">
    <div class="login-card card border-0 shadow-lg">
      <div class="card-body p-5">
        <!-- Logo -->
        <div class="text-center mb-4">
          <div class="login-icon mb-3">
            <i class="bi bi-cash-coin text-warning fs-1"></i>
          </div>
          <h4 class="fw-bold mb-1">Financeiro Pessoal</h4>
          <p class="text-muted small">Faça login para continuar</p>
        </div>

        <!-- Erro -->
        <div v-if="error" class="alert alert-danger py-2 small" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ error }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label class="form-label fw-medium">Usuário</label>
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-person text-muted"></i>
              </span>
              <input
                v-model="form.username"
                type="text"
                class="form-control border-start-0 ps-0"
                placeholder="Seu usuário"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label fw-medium">Senha</label>
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-lock text-muted"></i>
              </span>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-control border-start-0 border-end-0 ps-0"
                placeholder="Sua senha"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                class="input-group-text bg-light border-start-0"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" class="text-muted"></i>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ loading ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const router    = useRouter()

const form         = reactive({ username: '', password: '' })
const loading      = ref(false)
const error        = ref(null)
const showPassword = ref(false)

async function handleLogin() {
  loading.value = true
  error.value   = null
  try {
    await authStore.login(form.username, form.password)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.error || 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1d2e 0%, #2d3250 100%);
  padding: 1rem;
}
.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
}
.login-icon {
  width: 72px;
  height: 72px;
  background: rgba(255, 193, 7, 0.12);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}
</style>
