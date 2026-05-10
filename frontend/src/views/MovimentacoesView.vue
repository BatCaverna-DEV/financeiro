<template>
  <div>
    <!-- Cabeçalho + Navegação de mês -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <div>
        <h4 class="mb-0 fw-bold">Movimentações</h4>
        <small class="text-muted">Histórico de receitas e despesas</small>
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

      <button class="btn btn-primary d-flex align-items-center gap-2" @click="openCreate">
        <i class="bi bi-plus-lg"></i>
        <span class="d-none d-sm-inline">Nova Movimentação</span>
      </button>
    </div>

    <!-- Cards de resumo -->
    <div class="row g-3 mb-4">
      <div class="col-sm-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="summary-icon bg-success-subtle text-success">
              <i class="bi bi-arrow-down-circle"></i>
            </div>
            <div>
              <div class="text-muted small">Receitas</div>
              <div class="fw-bold fs-5 text-success">{{ formatCurrency(store.totalReceitas) }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="summary-icon bg-danger-subtle text-danger">
              <i class="bi bi-arrow-up-circle"></i>
            </div>
            <div>
              <div class="text-muted small">Despesas</div>
              <div class="fw-bold fs-5 text-danger">{{ formatCurrency(store.totalDespesas) }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="summary-icon" :class="store.saldoPeriodo >= 0 ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning'">
              <i class="bi bi-wallet2"></i>
            </div>
            <div>
              <div class="text-muted small">Saldo do período</div>
              <div class="fw-bold fs-5" :class="store.saldoPeriodo >= 0 ? 'text-primary' : 'text-warning'">
                {{ formatCurrency(store.saldoPeriodo) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <!-- Erro -->
    <div v-else-if="store.error" class="alert alert-danger">
      <i class="bi bi-exclamation-triangle me-2"></i>{{ store.error }}
    </div>

    <template v-else>
      <div class="card border-0 shadow-sm">
        <!-- Filtros -->
        <div class="card-header bg-white border-bottom py-3">
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <!-- Busca -->
            <div class="input-group input-group-sm" style="max-width: 220px">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input
                v-model="search"
                type="text"
                class="form-control border-start-0 ps-0"
                placeholder="Pesquisar..."
              />
              <button v-if="search" class="input-group-text bg-light" @click="search = ''">
                <i class="bi bi-x text-muted"></i>
              </button>
            </div>

            <!-- Filtro tipo -->
            <select v-model="filterTipo" class="form-select form-select-sm" style="max-width: 150px">
              <option value="">Todos os tipos</option>
              <option value="1">Receitas</option>
              <option value="2">Despesas</option>
            </select>

            <!-- Filtro conta -->
            <select v-model="filterConta" class="form-select form-select-sm" style="max-width: 180px">
              <option value="">Todas as contas</option>
              <option v-for="c in contasStore.contas" :key="c.id" :value="c.id">
                {{ c.descricao }}
              </option>
            </select>

            <span class="text-muted small ms-auto">
              {{ filtered.length }} movimentaç{{ filtered.length !== 1 ? 'ões' : 'ão' }}
            </span>
          </div>
        </div>

        <!-- Estado vazio -->
        <div v-if="store.movimentacoes.length === 0" class="text-center py-5">
          <i class="bi bi-arrow-left-right text-muted d-block mb-3" style="font-size: 3rem; opacity: .3"></i>
          <p class="fw-semibold mb-1">Nenhuma movimentação neste período</p>
          <p class="text-muted small mb-3">Lance uma receita ou despesa para começar.</p>
          <button class="btn btn-primary btn-sm" @click="openCreate">
            <i class="bi bi-plus-lg me-1"></i>Nova movimentação
          </button>
        </div>

        <!-- Sem resultados nos filtros -->
        <div v-else-if="filtered.length === 0" class="text-center py-5 text-muted small">
          <i class="bi bi-funnel d-block mb-2 fs-4"></i>
          Nenhuma movimentação corresponde aos filtros aplicados.
        </div>

        <!-- Tabela -->
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="ps-4 py-3 small text-muted fw-semibold border-0">Data</th>
                <th class="py-3 small text-muted fw-semibold border-0">Descrição</th>
                <th class="py-3 small text-muted fw-semibold border-0 d-none d-md-table-cell">Conta</th>
                <th class="py-3 small text-muted fw-semibold border-0 d-none d-lg-table-cell">Categoria</th>
                <th class="py-3 small text-muted fw-semibold border-0 text-end">Valor</th>
                <th class="py-3 pe-4 small text-muted fw-semibold border-0 text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filtered" :key="t.id">
                <td class="ps-4 text-muted small text-nowrap">{{ formatDate(t.data) }}</td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="tipo-dot" :class="t.tipo === 1 ? 'dot-receita' : 'dot-despesa'">
                      <i class="bi" :class="t.tipo === 1 ? 'bi-arrow-down' : 'bi-arrow-up'"></i>
                    </div>
                    <span class="fw-medium">{{ t.descricao }}</span>
                  </div>
                </td>
                <td class="text-muted small d-none d-md-table-cell">
                  {{ t.conta?.descricao || '-' }}
                </td>
                <td class="d-none d-lg-table-cell">
                  <span v-if="t.categoria" class="badge bg-light text-secondary border">
                    <i class="bi me-1" :class="t.categoria.icone || 'bi-tag'"></i>
                    {{ t.categoria.descricao }}
                  </span>
                  <span v-else class="text-muted small">—</span>
                </td>
                <td class="text-end fw-semibold text-nowrap"
                    :class="t.tipo === 1 ? 'text-success' : 'text-danger'">
                  {{ t.tipo === 1 ? '+' : '-' }}{{ formatCurrency(t.valor) }}
                </td>
                <td class="pe-4 text-end">
                  <button
                    class="btn btn-sm btn-link text-primary p-1 me-1"
                    title="Editar"
                    @click="openEdit(t)"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-link text-danger p-1"
                    title="Excluir"
                    @click="openDelete(t)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modais -->
    <MovimentacaoModal ref="movimentacaoModalRef" @saved="reload" />
    <ConfirmModal
      ref="confirmModalRef"
      title="Excluir movimentação"
      :message="`Deseja excluir a movimentação &quot;${movimentacaoParaExcluir?.descricao}&quot;? O saldo da conta será revertido.`"
      confirm-label="Excluir"
      variant="danger"
      icon="bi-trash"
      @confirmed="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMovimentacoesStore } from '@/stores/movimentacoes.js'
import { useContasStore }        from '@/stores/contas.js'
import { useFormatters }         from '@/composables/useFormatters.js'
import MovimentacaoModal         from '@/components/transacoes/MovimentacaoModal.vue'
import ConfirmModal              from '@/components/shared/ConfirmModal.vue'

const store       = useMovimentacoesStore()
const contasStore = useContasStore()
const { formatCurrency, formatDate, formatMonth } = useFormatters()

const movimentacaoModalRef    = ref(null)
const confirmModalRef         = ref(null)
const movimentacaoParaExcluir = ref(null)

const search      = ref('')
const filterTipo  = ref('')
const filterConta = ref('')

const currentDate = ref(new Date())

const isCurrentMonth = computed(() => {
  const now = new Date()
  return (
    currentDate.value.getFullYear() === now.getFullYear() &&
    currentDate.value.getMonth()    === now.getMonth()
  )
})

function changeMonth(delta) {
  const d = new Date(currentDate.value)
  d.setDate(1)
  d.setMonth(d.getMonth() + delta)
  currentDate.value = d
  reload()
}

function reload() {
  store.fetchAll({
    mes: currentDate.value.getMonth() + 1,
    ano: currentDate.value.getFullYear(),
  })
}

onMounted(() => {
  reload()
  if (!contasStore.contas.length) contasStore.fetchAll()
})

const filtered = computed(() => {
  let list = store.movimentacoes
  if (filterTipo.value)  list = list.filter(t => t.tipo === Number(filterTipo.value))
  if (filterConta.value) list = list.filter(t => t.contas_id === filterConta.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(t =>
      t.descricao.toLowerCase().includes(q) ||
      t.conta?.descricao.toLowerCase().includes(q) ||
      t.categoria?.descricao.toLowerCase().includes(q)
    )
  }
  return list
})

function openCreate()  { movimentacaoModalRef.value.open() }
function openEdit(t)   { movimentacaoModalRef.value.open(t) }

function openDelete(t) {
  movimentacaoParaExcluir.value = t
  confirmModalRef.value.open()
}

async function handleDelete({ done }) {
  try {
    await store.remove(movimentacaoParaExcluir.value.id)
    reload()
  } finally {
    done()
  }
}
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

.tipo-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .8rem;
  flex-shrink: 0;
}
.dot-receita { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.dot-despesa { background: rgba(239, 68, 68, 0.12);  color: #ef4444; }
</style>
