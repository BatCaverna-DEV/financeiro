<template>
  <div>
    <!-- Cabeçalho + navegação de mês -->
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
      <div>
        <h4 class="mb-0 fw-bold">Dashboard</h4>
        <small class="text-muted">Visão geral das suas finanças</small>
      </div>
      <div class="d-flex align-items-center gap-2 bg-white rounded-pill px-3 py-2 shadow-sm border">
        <button class="btn btn-sm btn-link p-0 text-dark" @click="changeMonth(-1)">
          <i class="bi bi-chevron-left"></i>
        </button>
        <span class="fw-semibold text-capitalize px-1" style="min-width: 160px; text-align: center">
          {{ formatMonth(currentDate) }}
        </span>
        <button class="btn btn-sm btn-link p-0 text-dark" @click="changeMonth(1)" :disabled="isCurrentMonth">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Spinner -->
    <div v-if="store.loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <!-- Erro -->
    <div v-else-if="store.error" class="alert alert-danger">
      <i class="bi bi-exclamation-triangle me-2"></i>{{ store.error }}
    </div>

    <template v-else>
      <!-- Cards de resumo -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(99,102,241,0.12); color: #6366f1">
              <i class="bi bi-wallet2"></i>
            </div>
            <div>
              <p class="stat-label">Saldo Total</p>
              <p class="stat-value" :class="store.saldoTotal >= 0 ? 'text-dark' : 'text-danger'">
                {{ formatCurrency(store.saldoTotal) }}
              </p>
            </div>
          </div>
        </div>

        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(16,185,129,0.12); color: #10b981">
              <i class="bi bi-arrow-down-circle"></i>
            </div>
            <div>
              <p class="stat-label">Receitas do Mês</p>
              <p class="stat-value text-success">{{ formatCurrency(store.receitasMes) }}</p>
            </div>
          </div>
        </div>

        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(239,68,68,0.12); color: #ef4444">
              <i class="bi bi-arrow-up-circle"></i>
            </div>
            <div>
              <p class="stat-label">Despesas do Mês</p>
              <p class="stat-value text-danger">{{ formatCurrency(store.despesasMes) }}</p>
            </div>
          </div>
        </div>

        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245,158,11,0.12); color: #f59e0b">
              <i class="bi bi-calendar-check"></i>
            </div>
            <div>
              <p class="stat-label">Despesas Fixas</p>
              <p class="stat-value text-dark">{{ store.fixasAtivas }} ativas</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Balanço do mês -->
      <div class="row g-3 mb-4">
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-body py-3">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span class="text-muted small fw-semibold">BALANÇO DO MÊS</span>
                <div class="d-flex gap-4">
                  <span class="small">
                    <i class="bi bi-circle-fill text-success me-1" style="font-size:.5rem"></i>
                    Receitas: <strong class="text-success">{{ formatCurrency(store.receitasMes) }}</strong>
                  </span>
                  <span class="small">
                    <i class="bi bi-circle-fill text-danger me-1" style="font-size:.5rem"></i>
                    Despesas: <strong class="text-danger">{{ formatCurrency(store.despesasMes) }}</strong>
                  </span>
                  <span class="small">
                    Saldo:
                    <strong :class="balanco >= 0 ? 'text-success' : 'text-danger'">
                      {{ formatCurrency(balanco) }}
                    </strong>
                  </span>
                </div>
              </div>
              <div class="progress mt-2" style="height: 6px; border-radius: 4px">
                <div
                  class="progress-bar bg-success"
                  :style="{ width: progressReceita + '%' }"
                ></div>
                <div
                  class="progress-bar bg-danger"
                  :style="{ width: progressDespesa + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contas + Transações recentes -->
      <div class="row g-3">
        <!-- Contas -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
              <span class="fw-semibold">Contas</span>
              <RouterLink to="/contas" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-plus-lg me-1"></i>Nova
              </RouterLink>
            </div>
            <div class="card-body p-0">
              <div v-if="store.contas.length === 0" class="text-center py-4 text-muted small">
                <i class="bi bi-wallet2 d-block fs-3 mb-2"></i>Nenhuma conta cadastrada
              </div>
              <ul v-else class="list-group list-group-flush">
                <li
                  v-for="conta in store.contas"
                  :key="conta.id"
                  class="list-group-item d-flex justify-content-between align-items-center px-4 py-3"
                >
                  <div class="d-flex align-items-center gap-2">
                    <div class="conta-dot"></div>
                    <span class="small fw-medium">{{ conta.descricao }}</span>
                  </div>
                  <span
                    class="fw-bold small"
                    :class="conta.saldo >= 0 ? 'text-success' : 'text-danger'"
                  >
                    {{ formatCurrency(conta.saldo) }}
                  </span>
                </li>
              </ul>
            </div>
            <div v-if="store.contas.length > 0" class="card-footer bg-white border-top d-flex justify-content-between px-4 py-2">
              <span class="small text-muted">Total</span>
              <span class="small fw-bold" :class="store.saldoTotal >= 0 ? 'text-success' : 'text-danger'">
                {{ formatCurrency(store.saldoTotal) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Movimentações recentes -->
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
              <span class="fw-semibold">Últimas Movimentações</span>
              <RouterLink to="/movimentacoes" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-plus-lg me-1"></i>Nova
              </RouterLink>
            </div>
            <div class="card-body p-0">
              <div v-if="store.ultimasMovimentacoes.length === 0" class="text-center py-5 text-muted small">
                <i class="bi bi-arrow-left-right d-block fs-3 mb-2"></i>Nenhuma movimentação neste período
              </div>
              <div v-else class="table-responsive">
                <table class="table table-hover mb-0 align-middle">
                  <thead class="table-light">
                    <tr>
                      <th class="px-4 py-2 small text-muted fw-semibold border-0">Data</th>
                      <th class="py-2 small text-muted fw-semibold border-0">Descrição</th>
                      <th class="py-2 small text-muted fw-semibold border-0">Conta</th>
                      <th class="py-2 small text-muted fw-semibold border-0">Categoria</th>
                      <th class="py-2 pe-4 small text-muted fw-semibold border-0 text-end">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="t in store.ultimasMovimentacoes" :key="t.id">
                      <td class="px-4 small text-muted">{{ formatDate(t.data) }}</td>
                      <td class="small fw-medium">{{ t.descricao }}</td>
                      <td class="small text-muted">{{ t.conta?.descricao ?? '-' }}</td>
                      <td class="small text-muted">{{ t.categoria?.descricao ?? '-' }}</td>
                      <td class="pe-4 text-end">
                        <span
                          class="badge rounded-pill px-2 py-1"
                          :class="t.tipo === 1 ? 'text-success bg-success-subtle' : 'text-danger bg-danger-subtle'"
                        >
                          {{ t.tipo === 1 ? '+' : '-' }}{{ formatCurrency(t.valor) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-if="store.movimentacoes.length > 8" class="card-footer bg-white text-center border-top py-2">
              <RouterLink to="/movimentacoes" class="small text-primary text-decoration-none">
                Ver todas as movimentações <i class="bi bi-arrow-right ms-1"></i>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard.js'
import { useFormatters } from '@/composables/useFormatters.js'

const store = useDashboardStore()
const { formatCurrency, formatDate, formatMonth } = useFormatters()

const currentDate = ref(new Date())

const isCurrentMonth = computed(() => {
  const now = new Date()
  return currentDate.value.getMonth() === now.getMonth() &&
         currentDate.value.getFullYear() === now.getFullYear()
})

const balanco = computed(() => store.receitasMes - store.despesasMes)

const totalMovimento = computed(() => store.receitasMes + store.despesasMes)
const progressReceita = computed(() =>
  totalMovimento.value > 0 ? (store.receitasMes / totalMovimento.value) * 100 : 0
)
const progressDespesa = computed(() =>
  totalMovimento.value > 0 ? (store.despesasMes / totalMovimento.value) * 100 : 0
)

function changeMonth(delta) {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() + delta)
  currentDate.value = d
  load()
}

function load() {
  store.loadAll(currentDate.value.getMonth() + 1, currentDate.value.getFullYear())
}

onMounted(load)
</script>

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}
.stat-label {
  font-size: 0.78rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.15rem;
}
.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}
.conta-dot {
  width: 8px;
  height: 8px;
  background: #6366f1;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
