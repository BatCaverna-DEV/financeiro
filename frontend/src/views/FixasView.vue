<template>
  <div>
    <!-- Cabeçalho + navegação de mês -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <div>
        <h4 class="mb-0 fw-bold">Despesas Fixas</h4>
        <small class="text-muted">Gerencie e quite suas despesas recorrentes</small>
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

      <!-- Botão que respeita a aba ativa -->
      <button class="btn d-flex align-items-center gap-2"
        :class="activeTab === 'permanentes' ? 'btn-primary' : 'btn-warning'"
        @click="activeTab === 'permanentes' ? fixaModalRef.open() : fixaTempModalRef.open()"
      >
        <i class="bi bi-plus-lg"></i>
        <span class="d-none d-sm-inline">
          {{ activeTab === 'permanentes' ? 'Nova Despesa Fixa' : 'Nova Dívida' }}
        </span>
      </button>
    </div>

    <!-- Cards de resumo (combinado) -->
    <div class="row g-3 mb-4">
      <div class="col-sm-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="summary-icon bg-secondary-subtle text-secondary">
              <i class="bi bi-calendar-check"></i>
            </div>
            <div>
              <div class="text-muted small">Total do mês</div>
              <div class="fw-bold fs-5">{{ formatCurrency(totalMesGeral) }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="summary-icon bg-success-subtle text-success">
              <i class="bi bi-check-circle"></i>
            </div>
            <div>
              <div class="text-muted small">Já quitadas</div>
              <div class="fw-bold fs-5 text-success">{{ formatCurrency(totalPagoGeral) }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="summary-icon bg-warning-subtle text-warning">
              <i class="bi bi-hourglass-split"></i>
            </div>
            <div>
              <div class="text-muted small">Pendentes</div>
              <div class="fw-bold fs-5 text-warning">{{ formatCurrency(totalPendenteGeral) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de progresso geral -->
    <div v-if="totalItens > 0" class="card border-0 shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="d-flex justify-content-between small mb-2">
          <span class="text-muted">Progresso geral de quitação</span>
          <span class="fw-semibold">{{ progressoPct }}%</span>
        </div>
        <div class="progress" style="height: 8px">
          <div class="progress-bar bg-success" :style="{ width: progressoPct + '%' }" role="progressbar"></div>
        </div>
        <div class="d-flex justify-content-between mt-2 small text-muted">
          <span>{{ countPagoGeral }} de {{ totalItens }} quitadas</span>
          <span>Faltam {{ totalItens - countPagoGeral }}</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-0" style="border-bottom: none">
      <li class="nav-item">
        <button
          class="nav-link d-flex align-items-center gap-2"
          :class="{ active: activeTab === 'permanentes' }"
          @click="activeTab = 'permanentes'"
        >
          <i class="bi bi-arrow-repeat"></i>
          Permanentes
          <span class="badge rounded-pill" :class="activeTab === 'permanentes' ? 'bg-primary' : 'bg-secondary'">
            {{ fixasStore.fixas.length }}
          </span>
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link d-flex align-items-center gap-2"
          :class="{ active: activeTab === 'temporarias' }"
          @click="activeTab = 'temporarias'"
        >
          <i class="bi bi-calendar-range"></i>
          Dívidas
          <span class="badge rounded-pill" :class="activeTab === 'temporarias' ? 'bg-warning text-dark' : 'bg-secondary'">
            {{ tempStore.fixas.length }}
          </span>
        </button>
      </li>
    </ul>

    <!-- Painel da aba -->
    <div class="card border-0 shadow-sm" style="border-top-left-radius: 0">

      <!-- Loading -->
      <div v-if="activeLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <!-- Erro -->
      <div v-else-if="activeError" class="alert alert-danger m-3">
        <i class="bi bi-exclamation-triangle me-2"></i>{{ activeError }}
      </div>

      <template v-else>
        <!-- Filtros -->
        <div class="card-header bg-white border-bottom py-3 d-flex align-items-center gap-3" style="border-radius: 0">
          <div class="input-group input-group-sm" style="max-width: 240px">
            <span class="input-group-text bg-light border-end-0">
              <i class="bi bi-search text-muted"></i>
            </span>
            <input v-model="search" type="text" class="form-control border-start-0 ps-0" placeholder="Pesquisar..." />
            <button v-if="search" class="input-group-text bg-light" @click="search = ''">
              <i class="bi bi-x text-muted"></i>
            </button>
          </div>
          <select v-model="filterSituacao" class="form-select form-select-sm" style="max-width: 150px">
            <option value="">Todas</option>
            <option value="pendente">Pendentes</option>
            <option value="pago">Quitadas</option>
          </select>
          <span class="text-muted small ms-auto">
            {{ filtered.length }} despesa{{ filtered.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Estado vazio -->
        <div v-if="activeFixas.length === 0" class="text-center py-5">
          <i class="bi d-block mb-3 text-muted"
            :class="activeTab === 'permanentes' ? 'bi-arrow-repeat' : 'bi-calendar-range'"
            style="font-size: 3rem; opacity: .3"
          ></i>
          <p class="fw-semibold mb-1">
            {{ activeTab === 'permanentes'
              ? 'Nenhuma despesa fixa permanente'
              : 'Nenhuma dívida neste mês' }}
          </p>
          <p class="text-muted small mb-3">
            {{ activeTab === 'permanentes'
              ? 'Cadastre despesas recorrentes sem prazo definido.'
              : 'Dívidas aparecem apenas nos meses dentro do período definido.' }}
          </p>
          <button class="btn btn-sm" :class="activeTab === 'permanentes' ? 'btn-primary' : 'btn-warning'"
            @click="activeTab === 'permanentes' ? fixaModalRef.open() : fixaTempModalRef.open()"
          >
            <i class="bi bi-plus-lg me-1"></i>{{ activeTab === 'permanentes' ? 'Criar' : 'Nova dívida' }}
          </button>
        </div>

        <!-- Sem resultados no filtro -->
        <div v-else-if="filtered.length === 0" class="text-center py-5 text-muted small">
          <i class="bi bi-funnel d-block mb-2 fs-4"></i>
          Nenhuma despesa corresponde aos filtros.
        </div>

        <!-- Tabela -->
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="ps-4 py-3 small text-muted fw-semibold border-0">Descrição</th>
                <th v-if="activeTab === 'temporarias'" class="py-3 small text-muted fw-semibold border-0 d-none d-md-table-cell">Período</th>
                <th class="py-3 small text-muted fw-semibold border-0 d-none d-md-table-cell">Conta</th>
                <th class="py-3 small text-muted fw-semibold border-0 text-center d-none d-sm-table-cell">Tipo</th>
                <th class="py-3 small text-muted fw-semibold border-0 text-end">Valor</th>
                <th class="py-3 small text-muted fw-semibold border-0 text-center">Situação</th>
                <th class="py-3 pe-4 small text-muted fw-semibold border-0 text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fixa in filtered" :key="fixa.id">
                <td class="ps-4">
                  <div class="d-flex align-items-center gap-2">
                    <div class="fixa-dot" :class="fixa.pagamento ? 'dot-pago' : 'dot-pendente'">
                      <i class="bi" :class="fixa.pagamento ? 'bi-check' : 'bi-clock'"></i>
                    </div>
                    <span class="fw-medium">{{ fixa.descricao }}</span>
                  </div>
                </td>
                <td v-if="activeTab === 'temporarias'" class="text-muted small d-none d-md-table-cell text-nowrap">
                  {{ formatDate(fixa.inicio) }} → {{ formatDate(fixa.fim) }}
                </td>
                <td class="text-muted small d-none d-md-table-cell">{{ fixa.conta?.descricao || '—' }}</td>
                <td class="text-center d-none d-sm-table-cell">
                  <span class="badge rounded-pill px-2"
                    :class="fixa.tipo === 1 ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning'">
                    {{ fixa.tipo === 1 ? 'Fixo' : 'Variável' }}
                  </span>
                </td>
                <td class="text-end fw-semibold text-nowrap">
                  <span v-if="fixa.pagamento && fixa.pagamento.valor_pago !== fixa.valor"
                    class="text-muted text-decoration-line-through me-1 small">
                    {{ formatCurrency(fixa.valor) }}
                  </span>
                  {{ formatCurrency(fixa.pagamento ? fixa.pagamento.valor_pago : fixa.valor) }}
                </td>
                <td class="text-center">
                  <button
                    v-if="!fixa.pagamento"
                    class="btn btn-sm btn-outline-success py-1 px-2"
                    :disabled="togglingId === fixa.id"
                    @click="marcarPago(fixa)"
                  >
                    <span v-if="togglingId === fixa.id" class="spinner-border spinner-border-sm"></span>
                    <template v-else><i class="bi bi-check-circle me-1"></i>Pagar</template>
                  </button>
                  <button
                    v-else
                    class="btn btn-sm btn-success py-1 px-2"
                    title="Clique para reverter"
                    :disabled="togglingId === fixa.id"
                    @click="reverterPago(fixa)"
                  >
                    <span v-if="togglingId === fixa.id" class="spinner-border spinner-border-sm"></span>
                    <template v-else><i class="bi bi-check-circle-fill me-1"></i>Pago</template>
                  </button>
                </td>
                <td class="pe-4 text-end text-nowrap">
                  <button class="btn btn-sm btn-link text-primary p-1 me-1" title="Editar" @click="openEdit(fixa)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-link text-danger p-1" title="Excluir" @click="openDelete(fixa)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Modais -->
    <FixaModal           ref="fixaModalRef"    @saved="reloadAll" />
    <FixaTemporariaModal ref="fixaTempModalRef" @saved="reloadAll" />
    <PagarModal          ref="pagarModalRef"    @paid="reloadAll" />
    <ConfirmModal
      ref="confirmModalRef"
      :title="isExcluirTemp ? 'Encerrar dívida' : 'Encerrar despesa fixa'"
      :message="`Deseja encerrar &quot;${fixaParaExcluir?.descricao}&quot;?`"
      confirm-label="Encerrar"
      variant="danger"
      icon="bi-trash"
      @confirmed="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFixasStore }            from '@/stores/fixas.js'
import { useFixasTemporariasStore } from '@/stores/fixasTemporarias.js'
import { useFormatters }            from '@/composables/useFormatters.js'
import FixaModal            from '@/components/fixas/FixaModal.vue'
import FixaTemporariaModal  from '@/components/fixas/FixaTemporariaModal.vue'
import PagarModal           from '@/components/fixas/PagarModal.vue'
import ConfirmModal         from '@/components/shared/ConfirmModal.vue'

const fixasStore = useFixasStore()
const tempStore  = useFixasTemporariasStore()
const { formatCurrency, formatDate, formatMonth } = useFormatters()

const fixaModalRef    = ref(null)
const fixaTempModalRef = ref(null)
const pagarModalRef   = ref(null)
const confirmModalRef = ref(null)
const fixaParaExcluir = ref(null)
const isExcluirTemp   = ref(false)
const togglingId      = ref(null)

const activeTab      = ref('permanentes')
const search         = ref('')
const filterSituacao = ref('')
const currentDate    = ref(new Date())

// ── computed helpers ─────────────────────────────────────────────────────────

const isCurrentMonth = computed(() => {
  const now = new Date()
  return currentDate.value.getFullYear() === now.getFullYear() &&
         currentDate.value.getMonth()    === now.getMonth()
})

const activeFixas   = computed(() => activeTab.value === 'permanentes' ? fixasStore.fixas  : tempStore.fixas)
const activeLoading = computed(() => activeTab.value === 'permanentes' ? fixasStore.loading : tempStore.loading)
const activeError   = computed(() => activeTab.value === 'permanentes' ? fixasStore.error   : tempStore.error)

const totalMesGeral      = computed(() => fixasStore.totalMes     + tempStore.totalMes)
const totalPagoGeral     = computed(() => fixasStore.totalPago    + tempStore.totalPago)
const totalPendenteGeral = computed(() => fixasStore.totalPendente + tempStore.totalPendente)
const countPagoGeral     = computed(() => fixasStore.fixas.filter(f => f.pagamento).length + tempStore.fixas.filter(f => f.pagamento).length)
const totalItens         = computed(() => fixasStore.fixas.length + tempStore.fixas.length)
const progressoPct       = computed(() => totalItens.value === 0 ? 0 : Math.round((countPagoGeral.value / totalItens.value) * 100))

const filtered = computed(() => {
  let list = activeFixas.value
  if (filterSituacao.value === 'pendente') list = list.filter(f => !f.pagamento)
  if (filterSituacao.value === 'pago')     list = list.filter(f =>  f.pagamento)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(f =>
      f.descricao.toLowerCase().includes(q) ||
      f.conta?.descricao?.toLowerCase().includes(q)
    )
  }
  return list
})

// ── navigation ───────────────────────────────────────────────────────────────

function changeMonth(delta) {
  const d = new Date(currentDate.value)
  d.setDate(1)
  d.setMonth(d.getMonth() + delta)
  currentDate.value = d
  reloadAll()
}

function reloadAll() {
  const mes = currentDate.value.getMonth() + 1
  const ano = currentDate.value.getFullYear()
  fixasStore.fetchAll(mes, ano)
  tempStore.fetchAll(mes, ano)
}

onMounted(reloadAll)

// ── actions ──────────────────────────────────────────────────────────────────

function openEdit(fixa) {
  if (activeTab.value === 'permanentes') fixaModalRef.value.open(fixa)
  else                                   fixaTempModalRef.value.open(fixa)
}

function openDelete(fixa) {
  fixaParaExcluir.value = fixa
  isExcluirTemp.value   = activeTab.value === 'temporarias'
  confirmModalRef.value.open()
}

async function handleDelete({ done }) {
  try {
    if (isExcluirTemp.value) await tempStore.remove(fixaParaExcluir.value.id)
    else                     await fixasStore.remove(fixaParaExcluir.value.id)
  } finally {
    done()
  }
}

function marcarPago(fixa) {
  const isTemp = activeTab.value === 'temporarias'
  if (fixa.tipo === 2) {
    pagarModalRef.value.open(
      fixa,
      currentDate.value.getMonth() + 1,
      currentDate.value.getFullYear(),
      isTemp,
    )
  } else {
    togglePagar(fixa, isTemp)
  }
}

async function togglePagar(fixa, isTemp) {
  togglingId.value = fixa.id
  try {
    const store = isTemp ? tempStore : fixasStore
    await store.pagar(
      fixa.id,
      currentDate.value.getMonth() + 1,
      currentDate.value.getFullYear(),
      { valor_pago: fixa.valor, contas_id: fixa.contas_id },
    )
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao registrar pagamento')
  } finally {
    togglingId.value = null
  }
}

async function reverterPago(fixa) {
  const isTemp = activeTab.value === 'temporarias'
  togglingId.value = fixa.id
  try {
    const store = isTemp ? tempStore : fixasStore
    await store.despagar(
      fixa.id,
      currentDate.value.getMonth() + 1,
      currentDate.value.getFullYear(),
    )
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao reverter pagamento')
  } finally {
    togglingId.value = null
  }
}
</script>

<style scoped>
.summary-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; flex-shrink: 0;
}
.fixa-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; flex-shrink: 0;
}
.dot-pendente { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.dot-pago     { background: rgba(16, 185, 129, 0.12);  color: #10b981; }

.nav-tabs .nav-link { color: #6c757d; border-bottom: 2px solid transparent; }
.nav-tabs .nav-link.active { color: #0d6efd; border-bottom-color: #0d6efd; background: white; }
</style>
