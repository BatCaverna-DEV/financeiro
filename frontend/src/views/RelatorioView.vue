<template>
  <div>
    <!-- Cabeçalho + filtros -->
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
      <div>
        <h4 class="mb-0 fw-bold">Relatório</h4>
        <small class="text-muted">Análise detalhada das suas movimentações</small>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2">
        <!-- Dropdown de conta -->
        <select class="form-select form-select-sm rounded-pill border shadow-sm" style="min-width: 170px" v-model="contaSelecionada" @change="load">
          <option :value="null">Todas as contas</option>
          <option v-for="c in store.contas" :key="c.id" :value="c.id">{{ c.descricao }}</option>
        </select>

        <!-- Navegação de mês -->
        <div class="d-flex align-items-center gap-2 bg-white rounded-pill px-3 py-2 shadow-sm border">
          <button class="btn btn-sm btn-link p-0 text-dark" @click="changeMonth(-1)">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="fw-semibold text-capitalize px-1" style="min-width: 150px; text-align: center">
            {{ formatMonth(currentDate) }}
          </span>
          <button class="btn btn-sm btn-link p-0 text-dark" @click="changeMonth(1)" :disabled="isCurrentMonth">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
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
            <div class="stat-icon" style="background: rgba(16,185,129,0.12); color: #10b981">
              <i class="bi bi-arrow-down-circle"></i>
            </div>
            <div>
              <p class="stat-label">Receitas</p>
              <p class="stat-value text-success">{{ formatCurrency(store.totalReceitas) }}</p>
            </div>
          </div>
        </div>

        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(239,68,68,0.12); color: #ef4444">
              <i class="bi bi-arrow-up-circle"></i>
            </div>
            <div>
              <p class="stat-label">Despesas</p>
              <p class="stat-value text-danger">{{ formatCurrency(store.totalDespesas) }}</p>
            </div>
          </div>
        </div>

        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon"
              :style="store.balanco >= 0
                ? 'background: rgba(99,102,241,0.12); color: #6366f1'
                : 'background: rgba(239,68,68,0.12); color: #ef4444'">
              <i class="bi bi-wallet2"></i>
            </div>
            <div>
              <p class="stat-label">Balanço</p>
              <p class="stat-value" :class="store.balanco >= 0 ? 'text-primary' : 'text-danger'">
                {{ formatCurrency(store.balanco) }}
              </p>
            </div>
          </div>
        </div>

        <div class="col-sm-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(59,130,246,0.12); color: #3b82f6">
              <i class="bi bi-arrow-left-right"></i>
            </div>
            <div>
              <p class="stat-label">Transferências</p>
              <p class="stat-value text-primary">{{ formatCurrency(store.totalTransferencias) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos linha 1: Evolução + Doughnut despesas -->
      <div class="row g-3 mb-3">
        <!-- Evolução 6 meses -->
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <span class="fw-semibold">Evolução dos Últimos 6 Meses</span>
              <span v-if="store.loadingHist" class="spinner-border spinner-border-sm text-primary"></span>
            </div>
            <div class="card-body d-flex align-items-center justify-content-center" style="min-height: 260px">
              <Bar v-if="historicoData.labels.length" :data="historicoData" :options="barOptions" style="width:100%; max-height:230px" />
              <span v-else class="text-muted small">Sem dados para exibir</span>
            </div>
          </div>
        </div>

        <!-- Doughnut despesas por categoria -->
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3">
              <span class="fw-semibold">Despesas por Categoria</span>
            </div>
            <div class="card-body d-flex align-items-center gap-3 px-3" style="min-height: 260px">
              <template v-if="Object.keys(store.despesasPorCategoria).length">
                <!-- Gráfico -->
                <div style="flex: 1; min-width: 0">
                  <Doughnut :data="doughnutDespesasData" :options="doughnutDespesasOptions" />
                </div>
                <!-- Legenda customizada -->
                <ul class="list-unstyled mb-0" style="font-size: 0.8rem; width: 200px; flex-shrink: 0">
                  <li
                    v-for="(item, i) in despesasLegenda"
                    :key="item.label"
                    class="d-flex align-items-center gap-2 mb-2"
                  >
                    <span class="legend-dot flex-shrink-0" :style="{ background: PALETTE[i % PALETTE.length] }"></span>
                    <span class="text-truncate flex-grow-1 text-muted" :title="item.label">{{ item.label }}</span>
                    <span class="fw-semibold ms-1 flex-shrink-0">{{ item.pct }}%</span>
                  </li>
                </ul>
              </template>
              <span v-else class="text-muted small m-auto">Sem despesas no período</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos linha 2: Receitas por cat + Barras comparativo categorias -->
      <div class="row g-3 mb-4">
        <!-- Doughnut receitas por categoria -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3">
              <span class="fw-semibold">Receitas por Categoria</span>
            </div>
            <div class="card-body d-flex flex-column align-items-center justify-content-center" style="min-height: 260px">
              <Doughnut
                v-if="Object.keys(store.receitasPorCategoria).length"
                :data="doughnutReceitasData"
                :options="doughnutOptions"
                style="max-height: 200px"
              />
              <span v-else class="text-muted small">Sem receitas no período</span>
            </div>
          </div>
        </div>

        <!-- Comparativo receitas x despesas por categoria -->
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3">
              <span class="fw-semibold">Receitas vs Despesas por Categoria</span>
            </div>
            <div class="card-body d-flex align-items-center justify-content-center" style="min-height: 260px">
              <Bar
                v-if="comparativoData.labels.length"
                :data="comparativoData"
                :options="barGroupedOptions"
                style="width:100%; max-height:230px"
              />
              <span v-else class="text-muted small">Sem movimentações no período</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela de movimentações do mês -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <span class="fw-semibold">Movimentações do Período</span>
          <span class="badge bg-secondary rounded-pill">{{ store.todosItens.length }}</span>
        </div>
        <div class="card-body p-0">
          <div v-if="store.todosItens.length === 0" class="text-center py-5 text-muted small">
            <i class="bi bi-inbox d-block fs-3 mb-2"></i>Nenhuma movimentação no período
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th class="px-4 py-2 small text-muted fw-semibold border-0">Data</th>
                  <th class="py-2 small text-muted fw-semibold border-0">Descrição</th>
                  <th class="py-2 small text-muted fw-semibold border-0">Conta</th>
                  <th class="py-2 small text-muted fw-semibold border-0">Categoria</th>
                  <th class="py-2 small text-muted fw-semibold border-0">Tipo</th>
                  <th class="py-2 pe-4 small text-muted fw-semibold border-0 text-end">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in store.todosItens" :key="`${m._source ?? 'mov'}-${m.id}`">
                  <td class="px-4 small text-muted">
                    {{ m.data ? formatDate(m.data) : '—' }}
                  </td>
                  <td class="small fw-medium">{{ m.descricao }}</td>
                  <td class="small text-muted">
                    <template v-if="m._source === 'transferencia'">
                      {{ m.conta?.descricao ?? '?' }}
                      <i class="bi bi-arrow-right mx-1" style="font-size:.7rem"></i>
                      {{ m.contaDestino?.descricao ?? '?' }}
                    </template>
                    <template v-else>{{ m.conta?.descricao ?? '-' }}</template>
                  </td>
                  <td class="small text-muted">{{ m.categoria?.descricao ?? '-' }}</td>
                  <td class="small">
                    <span v-if="m._source === 'transferencia'" class="badge rounded-pill px-2 bg-info-subtle text-info">
                      Transferência
                    </span>
                    <span v-else-if="m._source === 'fixa'" class="badge rounded-pill px-2 bg-warning-subtle text-warning">
                      Fixa
                    </span>
                    <span v-else-if="m._source === 'divida'" class="badge rounded-pill px-2 bg-purple-subtle text-purple">
                      Dívida
                    </span>
                    <span v-else class="badge rounded-pill px-2" :class="m.tipo === 1 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                      {{ m.tipo === 1 ? 'Receita' : 'Despesa' }}
                    </span>
                  </td>
                  <td class="pe-4 text-end">
                    <span v-if="m._source === 'transferencia'" class="fw-semibold small text-info">
                      {{ formatCurrency(m.valor) }}
                    </span>
                    <span v-else class="fw-semibold small" :class="m.tipo === 1 ? 'text-success' : 'text-danger'">
                      {{ m.tipo === 1 ? '+' : '-' }}{{ formatCurrency(m.valor) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

import { useRelatorioStore } from '@/stores/relatorio.js'
import { useFormatters } from '@/composables/useFormatters.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const store = useRelatorioStore()
const { formatCurrency, formatDate, formatMonth } = useFormatters()

const currentDate     = ref(new Date())
const contaSelecionada = ref(null)

const isCurrentMonth = computed(() => {
  const now = new Date()
  return currentDate.value.getMonth() === now.getMonth() &&
         currentDate.value.getFullYear() === now.getFullYear()
})

function changeMonth(delta) {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() + delta)
  currentDate.value = d
  load()
}

function load() {
  const mes = currentDate.value.getMonth() + 1
  const ano = currentDate.value.getFullYear()
  store.loadMes(mes, ano, contaSelecionada.value)
  store.loadHistorico(mes, ano, contaSelecionada.value)
}

onMounted(async () => {
  await store.loadContas()
  load()
})

// ─── Paleta de cores ────────────────────────────────────────────────────────
const PALETTE = [
  '#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16',
]

// ─── Histórico 6 meses (Bar agrupado) ───────────────────────────────────────
const historicoData = computed(() => ({
  labels: store.historico.map(h => {
    const d = new Date(h.ano, h.mes - 1)
    return d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
  }),
  datasets: [
    {
      label: 'Receitas',
      data: store.historico.map(h => h.receitas),
      backgroundColor: 'rgba(16,185,129,0.75)',
      borderRadius: 5,
    },
    {
      label: 'Despesas',
      data: store.historico.map(h => h.despesas),
      backgroundColor: 'rgba(239,68,68,0.75)',
      borderRadius: 5,
    },
  ],
}))

// ─── Doughnut despesas ───────────────────────────────────────────────────────
const doughnutDespesasData = computed(() => {
  const labels = Object.keys(store.despesasPorCategoria)
  return {
    labels,
    datasets: [{
      data: labels.map(l => store.despesasPorCategoria[l]),
      backgroundColor: PALETTE.slice(0, labels.length),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }
})

const despesasLegenda = computed(() => {
  const entries = Object.entries(store.despesasPorCategoria)
  const total   = entries.reduce((s, [, v]) => s + v, 0)
  return entries.map(([label, valor]) => ({
    label,
    pct: total > 0 ? ((valor / total) * 100).toFixed(1) : '0.0',
  }))
})

// ─── Doughnut receitas ───────────────────────────────────────────────────────
const doughnutReceitasData = computed(() => {
  const labels = Object.keys(store.receitasPorCategoria)
  return {
    labels,
    datasets: [{
      data: labels.map(l => store.receitasPorCategoria[l]),
      backgroundColor: PALETTE.slice(0, labels.length),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }
})

// ─── Comparativo receitas x despesas por categoria ───────────────────────────
const comparativoData = computed(() => {
  const cats = new Set([
    ...Object.keys(store.receitasPorCategoria),
    ...Object.keys(store.despesasPorCategoria),
  ])
  const labels = [...cats]
  return {
    labels,
    datasets: [
      {
        label: 'Receitas',
        data: labels.map(l => store.receitasPorCategoria[l] ?? 0),
        backgroundColor: 'rgba(16,185,129,0.75)',
        borderRadius: 5,
      },
      {
        label: 'Despesas',
        data: labels.map(l => store.despesasPorCategoria[l] ?? 0),
        backgroundColor: 'rgba(239,68,68,0.75)',
        borderRadius: 5,
      },
    ],
  }
})

// ─── Opções dos gráficos ─────────────────────────────────────────────────────
const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
    tooltip: {
      callbacks: {
        label: ctx => ' ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctx.raw),
      },
    },
  },
  scales: {
    y: { ticks: { font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
    x: { ticks: { font: { size: 11 } }, grid: { display: false } },
  },
}

const barGroupedOptions = {
  ...barOptions,
  scales: {
    ...barOptions.scales,
    x: { ...barOptions.scales.x, ticks: { font: { size: 10 }, maxRotation: 30 } },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
    tooltip: {
      callbacks: {
        label: ctx => ' ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctx.raw),
      },
    },
  },
}

// Igual ao doughnutOptions mas sem legenda nativa (usamos legenda HTML customizada)
const doughnutDespesasOptions = {
  ...doughnutOptions,
  plugins: {
    ...doughnutOptions.plugins,
    legend: { display: false },
  },
}
</script>

<style scoped>
.bg-purple-subtle { background-color: rgba(139, 92, 246, 0.12); }
.text-purple      { color: #7c3aed; }

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

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
</style>
