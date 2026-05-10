<template>
  <div>
    <!-- Cabeçalho -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <div>
        <h4 class="mb-0 fw-bold">Visão Geral</h4>
        <small class="text-muted">Resumo de despesas fixas e dívidas</small>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-light btn-sm" @click="changeMonth(-1)">
          <i class="bi bi-chevron-left"></i>
        </button>
        <span class="fw-semibold text-capitalize px-1" style="min-width: 140px; text-align: center">
          {{ formatMonth(currentDate) }}
        </span>
        <button class="btn btn-light btn-sm" @click="changeMonth(1)" :disabled="isCurrentMonth">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <!-- Erro -->
    <div v-else-if="error" class="alert alert-danger">
      <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
    </div>

    <template v-else-if="data">

      <!-- Cards de resumo -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-xl">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="summary-icon bg-secondary-subtle text-secondary">
                <i class="bi bi-list-check"></i>
              </div>
              <div>
                <div class="text-muted small">Total Previsto</div>
                <div class="fw-bold fs-5">{{ formatCurrency(data.resumo.total) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="summary-icon bg-success-subtle text-success">
                <i class="bi bi-check-circle"></i>
              </div>
              <div>
                <div class="text-muted small">Pago</div>
                <div class="fw-bold fs-5 text-success">{{ formatCurrency(data.resumo.pago) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="summary-icon bg-danger-subtle text-danger">
                <i class="bi bi-hourglass-split"></i>
              </div>
              <div>
                <div class="text-muted small">Pendente</div>
                <div class="fw-bold fs-5 text-danger">{{ formatCurrency(data.resumo.pendente) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="summary-icon bg-indigo-subtle text-indigo">
                <i class="bi bi-cash-coin"></i>
              </div>
              <div>
                <div class="text-muted small">Saldo Atual</div>
                <div class="fw-bold fs-5" :class="data.previsao.saldoAtual >= 0 ? 'text-dark' : 'text-danger'">
                  {{ formatCurrency(data.previsao.saldoAtual) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <div
                class="summary-icon"
                :class="data.previsao.saldoAposPagamentos >= 0 ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning'"
              >
                <i class="bi bi-wallet2"></i>
              </div>
              <div>
                <div class="text-muted small">Saldo Após Pagar Tudo</div>
                <div
                  class="fw-bold fs-5"
                  :class="data.previsao.saldoAposPagamentos >= 0 ? 'text-primary' : 'text-warning'"
                >
                  {{ formatCurrency(data.previsao.saldoAposPagamentos) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="row g-4 mb-4">

        <!-- Donut: Pago vs Pendente -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3">
              <span class="fw-semibold small">Pago vs Pendente</span>
            </div>
            <div class="card-body d-flex flex-column align-items-center justify-content-center py-3">
              <div style="max-width: 220px; width: 100%">
                <canvas ref="donutRef"></canvas>
              </div>
              <div class="d-flex gap-3 mt-3">
                <span class="d-flex align-items-center gap-1 small">
                  <span class="legend-dot" style="background:#10b981"></span>
                  Pago {{ progressoPct }}%
                </span>
                <span class="d-flex align-items-center gap-1 small">
                  <span class="legend-dot" style="background:#ef4444"></span>
                  Pendente {{ 100 - progressoPct }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Barra: Fixas vs Dívidas -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3">
              <span class="fw-semibold small">Fixas vs Dívidas</span>
            </div>
            <div class="card-body d-flex align-items-center justify-content-center py-3">
              <canvas ref="barRef" style="max-height: 220px"></canvas>
            </div>
          </div>
        </div>

        <!-- Barra horizontal: Previsão de saldo por conta -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3">
              <span class="fw-semibold small">Saldo Atual por Conta</span>
            </div>
            <div class="card-body d-flex align-items-center justify-content-center py-3">
              <canvas ref="contasRef" style="max-height: 220px; width: 100%"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Previsão de saldo -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-3">
          <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <span class="small fw-semibold text-muted">PREVISÃO DE SALDO APÓS PAGAR PENDENTES</span>
            <div class="d-flex gap-4">
              <span class="small">
                Saldo atual: <strong>{{ formatCurrency(data.previsao.saldoAtual) }}</strong>
              </span>
              <span class="small">
                Pendente: <strong class="text-danger">− {{ formatCurrency(data.resumo.pendente) }}</strong>
              </span>
              <span class="small">
                Restará:
                <strong :class="data.previsao.saldoAposPagamentos >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(data.previsao.saldoAposPagamentos) }}
                </strong>
              </span>
            </div>
          </div>
          <div class="progress" style="height: 10px; border-radius: 6px; background:#f1f5f9">
            <!-- Barra pago -->
            <div
              class="progress-bar bg-success"
              :style="{ width: progressoPct + '%' }"
              style="border-radius: 6px 0 0 6px; transition: width .4s"
              :title="`Pago: ${formatCurrency(data.resumo.pago)}`"
            ></div>
            <!-- Barra pendente -->
            <div
              class="progress-bar bg-danger"
              :style="{ width: pendentePct + '%' }"
              style="transition: width .4s"
              :title="`Pendente: ${formatCurrency(data.resumo.pendente)}`"
            ></div>
          </div>
          <div class="d-flex justify-content-between mt-1">
            <small class="text-success">{{ formatCurrency(data.resumo.pago) }} pago</small>
            <small class="text-danger">{{ formatCurrency(data.resumo.pendente) }} restante</small>
          </div>
        </div>
      </div>

      <!-- Tabelas -->
      <div class="row g-4">

        <!-- Despesas Fixas -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-2">
                <div class="section-icon bg-primary-subtle text-primary">
                  <i class="bi bi-calendar-check"></i>
                </div>
                <span class="fw-semibold">Despesas Fixas</span>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle ms-1">
                  {{ fixasPagasCount }}/{{ data.fixas.items.length }}
                </span>
              </div>
              <div class="d-flex gap-3">
                <div class="text-end">
                  <div class="text-muted" style="font-size:.68rem">TOTAL</div>
                  <div class="fw-bold small">{{ formatCurrency(data.fixas.total) }}</div>
                </div>
                <div class="text-end">
                  <div class="text-muted" style="font-size:.68rem">PENDENTE</div>
                  <div class="fw-bold small text-danger">{{ formatCurrency(data.fixas.pendente) }}</div>
                </div>
              </div>
            </div>

            <div v-if="data.fixas.items.length === 0" class="text-center py-5 text-muted small">
              <i class="bi bi-calendar-check d-block fs-3 mb-2 opacity-25"></i>
              Nenhuma despesa fixa ativa
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="ps-4 py-2 small text-muted fw-semibold border-0">Descrição</th>
                    <th class="py-2 small text-muted fw-semibold border-0">Conta</th>
                    <th class="py-2 small text-muted fw-semibold border-0 text-end">Valor</th>
                    <th class="py-2 pe-4 small text-muted fw-semibold border-0 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="f in data.fixas.items" :key="f.id">
                    <td class="ps-4 small fw-medium">{{ f.descricao }}</td>
                    <td class="text-muted small">{{ f.conta?.descricao || '-' }}</td>
                    <td class="text-end small fw-semibold text-nowrap">
                      <template v-if="f.pagamento && Number(f.pagamento.valor_pago) !== Number(f.valor)">
                        <span class="text-success">{{ formatCurrency(f.pagamento.valor_pago) }}</span>
                        <span class="text-muted ms-1" style="font-size:.75rem; text-decoration:line-through">
                          {{ formatCurrency(f.valor) }}
                        </span>
                      </template>
                      <template v-else>{{ formatCurrency(f.valor) }}</template>
                    </td>
                    <td class="pe-4 text-center">
                      <span v-if="f.pagamento" class="badge bg-success-subtle text-success border border-success-subtle">
                        <i class="bi bi-check-lg me-1"></i>Pago
                      </span>
                      <span v-else class="badge bg-danger-subtle text-danger border border-danger-subtle">
                        <i class="bi bi-clock me-1"></i>Pendente
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <td colspan="2" class="ps-4 py-2 small fw-semibold">Total</td>
                    <td class="py-2 text-end small fw-bold">{{ formatCurrency(data.fixas.total) }}</td>
                    <td class="pe-4 py-2 text-center small text-muted">
                      {{ fixasPagasCount }}/{{ data.fixas.items.length }} pagas
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Dívidas -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-2">
                <div class="section-icon bg-warning-subtle text-warning">
                  <i class="bi bi-credit-card"></i>
                </div>
                <span class="fw-semibold">Dívidas</span>
                <span class="badge bg-warning-subtle text-warning border border-warning-subtle ms-1">
                  {{ dividasPagasCount }}/{{ data.dividas.items.length }}
                </span>
              </div>
              <div class="d-flex gap-3">
                <div class="text-end">
                  <div class="text-muted" style="font-size:.68rem">TOTAL</div>
                  <div class="fw-bold small">{{ formatCurrency(data.dividas.total) }}</div>
                </div>
                <div class="text-end">
                  <div class="text-muted" style="font-size:.68rem">PENDENTE</div>
                  <div class="fw-bold small text-danger">{{ formatCurrency(data.dividas.pendente) }}</div>
                </div>
              </div>
            </div>

            <div v-if="data.dividas.items.length === 0" class="text-center py-5 text-muted small">
              <i class="bi bi-credit-card d-block fs-3 mb-2 opacity-25"></i>
              Nenhuma dívida ativa neste mês
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="ps-4 py-2 small text-muted fw-semibold border-0">Descrição</th>
                    <th class="py-2 small text-muted fw-semibold border-0 d-none d-xl-table-cell">Período</th>
                    <th class="py-2 small text-muted fw-semibold border-0 text-end">Valor</th>
                    <th class="py-2 pe-4 small text-muted fw-semibold border-0 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in data.dividas.items" :key="d.id">
                    <td class="ps-4 small fw-medium">{{ d.descricao }}</td>
                    <td class="text-muted small d-none d-xl-table-cell text-nowrap">
                      {{ formatDate(d.inicio) }} – {{ formatDate(d.fim) }}
                    </td>
                    <td class="text-end small fw-semibold text-nowrap">
                      <template v-if="d.pagamento && Number(d.pagamento.valor_pago) !== Number(d.valor)">
                        <span class="text-success">{{ formatCurrency(d.pagamento.valor_pago) }}</span>
                        <span class="text-muted ms-1" style="font-size:.75rem; text-decoration:line-through">
                          {{ formatCurrency(d.valor) }}
                        </span>
                      </template>
                      <template v-else>{{ formatCurrency(d.valor) }}</template>
                    </td>
                    <td class="pe-4 text-center">
                      <span v-if="d.pagamento" class="badge bg-success-subtle text-success border border-success-subtle">
                        <i class="bi bi-check-lg me-1"></i>Pago
                      </span>
                      <span v-else class="badge bg-danger-subtle text-danger border border-danger-subtle">
                        <i class="bi bi-clock me-1"></i>Pendente
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <td colspan="2" class="ps-4 py-2 small fw-semibold">Total</td>
                    <td class="py-2 text-end small fw-bold">{{ formatCurrency(data.dividas.total) }}</td>
                    <td class="pe-4 py-2 text-center small text-muted">
                      {{ dividasPagasCount }}/{{ data.dividas.items.length }} pagas
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Chart,
  ArcElement, DoughnutController,
  BarElement, BarController,
  CategoryScale, LinearScale,
  Tooltip, Legend,
} from 'chart.js'
import api from '@/services/api.js'
import { useFormatters } from '@/composables/useFormatters.js'

Chart.register(ArcElement, DoughnutController, BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend)

const { formatCurrency, formatDate, formatMonth } = useFormatters()

const currentDate = ref(new Date())
const loading     = ref(false)
const error       = ref(null)
const data        = ref(null)

const donutRef  = ref(null)
const barRef    = ref(null)
const contasRef = ref(null)

let donutChart  = null
let barChart    = null
let contasChart = null

const isCurrentMonth = computed(() => {
  const now = new Date()
  return (
    currentDate.value.getFullYear() === now.getFullYear() &&
    currentDate.value.getMonth()    === now.getMonth()
  )
})

const progressoPct = computed(() => {
  if (!data.value || data.value.resumo.total === 0) return 0
  return Math.round((data.value.resumo.pago / data.value.resumo.total) * 100)
})

const pendentePct = computed(() => {
  if (!data.value || data.value.resumo.total === 0) return 0
  return Math.round((data.value.resumo.pendente / data.value.resumo.total) * 100)
})

const fixasPagasCount   = computed(() => data.value?.fixas.items.filter(f => f.pagamento).length ?? 0)
const dividasPagasCount = computed(() => data.value?.dividas.items.filter(d => d.pagamento).length ?? 0)

function destroyCharts() {
  donutChart?.destroy();  donutChart  = null
  barChart?.destroy();    barChart    = null
  contasChart?.destroy(); contasChart = null
}

function buildCharts() {
  if (!data.value) return

  const fmt = (v) => formatCurrency(v)

  // ── Donut: Pago vs Pendente ──────────────────────────────────────────────
  if (donutRef.value) {
    donutChart = new Chart(donutRef.value, {
      type: 'doughnut',
      data: {
        labels: ['Pago', 'Pendente'],
        datasets: [{
          data: [data.value.resumo.pago, data.value.resumo.pendente],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => ` ${fmt(ctx.raw)}` },
          },
        },
      },
    })
  }

  // ── Barra: Fixas vs Dívidas ──────────────────────────────────────────────
  if (barRef.value) {
    barChart = new Chart(barRef.value, {
      type: 'bar',
      data: {
        labels: ['Despesas Fixas', 'Dívidas'],
        datasets: [
          {
            label: 'Pago',
            data: [data.value.fixas.pago, data.value.dividas.pago],
            backgroundColor: '#10b981',
            borderRadius: 4,
          },
          {
            label: 'Pendente',
            data: [data.value.fixas.pendente, data.value.dividas.pendente],
            backgroundColor: '#ef4444',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}` },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            ticks: { callback: v => 'R$ ' + v.toLocaleString('pt-BR') },
            grid: { color: '#f1f5f9' },
          },
        },
      },
    })
  }

  // ── Barra horizontal: Saldo por conta ────────────────────────────────────
  if (contasRef.value && data.value.previsao.contas.length > 0) {
    const contas = data.value.previsao.contas
    contasChart = new Chart(contasRef.value, {
      type: 'bar',
      data: {
        labels: contas.map(c => c.descricao),
        datasets: [{
          label: 'Saldo',
          data: contas.map(c => c.saldo),
          backgroundColor: contas.map(c => c.saldo >= 0 ? '#6366f1' : '#ef4444'),
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => ` ${fmt(ctx.raw)}` },
          },
        },
        scales: {
          x: {
            ticks: { callback: v => 'R$ ' + v.toLocaleString('pt-BR'), font: { size: 10 } },
            grid: { color: '#f1f5f9' },
          },
          y: { grid: { display: false } },
        },
      },
    })
  }
}

watch(data, async () => {
  destroyCharts()
  await nextTick()
  buildCharts()
})

function changeMonth(delta) {
  const d = new Date(currentDate.value)
  d.setDate(1)
  d.setMonth(d.getMonth() + delta)
  currentDate.value = d
  load()
}

async function load() {
  loading.value = true
  error.value   = null
  try {
    const { data: res } = await api.get('/relatorios/visao-geral', {
      params: {
        mes: currentDate.value.getMonth() + 1,
        ano: currentDate.value.getFullYear(),
      },
    })
    data.value = res
  } catch (e) {
    error.value = e.response?.data?.error || 'Erro ao carregar relatório'
  } finally {
    loading.value = false
  }
}

onMounted(load)
onUnmounted(destroyCharts)
</script>

<style scoped>
.summary-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.section-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.bg-indigo-subtle { background: rgba(99, 102, 241, 0.12); }
.text-indigo       { color: #6366f1; }
</style>
