<template>
  <div>
    <!-- Cabeçalho -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-0 fw-bold">Contas</h4>
        <small class="text-muted">Gerencie suas contas bancárias e carteiras</small>
      </div>
      <div class="d-flex gap-2">
<button class="btn btn-outline-primary d-flex align-items-center gap-2" @click="openTransferencia()" :disabled="store.contas.length < 2">
          <i class="bi bi-arrow-left-right"></i>
          <span class="d-none d-sm-inline">Transferir</span>
        </button>
        <button class="btn btn-primary d-flex align-items-center gap-2" @click="openCreate">
          <i class="bi bi-plus-lg"></i>
          <span class="d-none d-sm-inline">Nova Conta</span>
        </button>
      </div>
    </div>

    <!-- Card de resumo -->
    <div class="summary-card mb-4">
      <div class="row g-0 align-items-center flex-wrap gap-3">
        <div class="col-auto pe-4 border-end">
          <p class="summary-label">
            {{ store.contasPrincipais.length > 0 ? 'Saldo principal' : 'Saldo total' }}
          </p>
          <p class="summary-value" :class="store.saldoTotal >= 0 ? 'text-success' : 'text-danger'">
            {{ formatCurrency(store.saldoTotal) }}
          </p>
        </div>
        <div class="col-auto pe-4 border-end">
          <p class="summary-label">Contas ativas</p>
          <p class="summary-value text-dark">{{ store.contas.length }}</p>
        </div>
        <div v-if="store.contasPrincipais.length === 0" class="col ps-2">
          <span class="badge bg-warning-subtle text-warning border border-warning-subtle small">
            <i class="bi bi-exclamation-triangle me-1"></i>Nenhuma conta principal definida
          </span>
        </div>
        <div v-else class="col ps-2">
          <p class="summary-label">Principal</p>
          <p class="summary-value text-dark fs-6">{{ store.contasPrincipais[0].descricao }}</p>
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

    <!-- Estado vazio -->
    <div v-else-if="store.contas.length === 0" class="empty-state">
      <i class="bi bi-wallet2 mb-3"></i>
      <h6 class="fw-semibold mb-1">Nenhuma conta cadastrada</h6>
      <p class="text-muted small mb-3">Crie sua primeira conta para começar a controlar suas finanças.</p>
      <button class="btn btn-primary" @click="openCreate">
        <i class="bi bi-plus-lg me-1"></i>Criar primeira conta
      </button>
    </div>

    <!-- Grid de contas -->
    <div v-else class="row g-3">
      <div
        v-for="conta in store.contas"
        :key="conta.id"
        class="col-sm-6 col-xl-4"
      >
        <div class="conta-card" :class="{ 'conta-card--principal': conta.principal }">
          <!-- Topo: ícone + menu -->
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="d-flex align-items-center gap-2">
              <div class="conta-icon-wrap" :style="iconBg(conta.icone)">
                <i class="bi" :class="conta.icone || 'bi-wallet2'"></i>
              </div>
              <span v-if="conta.principal" class="badge bg-warning-subtle text-warning border border-warning-subtle" style="font-size:.65rem">
                <i class="bi bi-star-fill me-1"></i>Principal
              </span>
            </div>

            <div class="dropdown">
              <button
                class="btn btn-sm btn-link text-muted p-1"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="bi bi-three-dots-vertical"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow border-0 py-1" style="min-width: 180px">
                <li>
                  <button class="dropdown-item small py-2" @click="openDepositar(conta)">
                    <i class="bi bi-arrow-down-circle text-success me-2"></i>Depositar
                  </button>
                </li>
                <li>
                  <button class="dropdown-item small py-2" @click="openTransferencia(conta)" :disabled="store.contas.length < 2">
                    <i class="bi bi-arrow-left-right text-primary me-2"></i>Transferir
                  </button>
                </li>
                <li v-if="!conta.principal">
                  <button class="dropdown-item small py-2" @click="setPrincipal(conta)">
                    <i class="bi bi-star text-warning me-2"></i>Definir como principal
                  </button>
                </li>
                <li>
                  <button class="dropdown-item small py-2" @click="openEdit(conta)">
                    <i class="bi bi-pencil text-secondary me-2"></i>Editar
                  </button>
                </li>
                <li><hr class="dropdown-divider my-1"></li>
                <li>
                  <button class="dropdown-item small py-2 text-danger" @click="openDelete(conta)">
                    <i class="bi bi-trash me-2"></i>Excluir
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <!-- Nome -->
          <h6 class="fw-semibold mb-1 text-truncate">{{ conta.descricao }}</h6>

          <!-- Saldo -->
          <p class="text-muted small mb-1">Saldo atual</p>
          <p
            class="saldo-value mb-0"
            :class="conta.saldo >= 0 ? 'text-success' : 'text-danger'"
          >
            {{ formatCurrency(conta.saldo) }}
          </p>

          <!-- Rodapé: botão depositar -->
          <div class="conta-footer mt-3 pt-3">
            <button
              class="btn btn-sm btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2"
              @click="openDepositar(conta)"
            >
              <i class="bi bi-arrow-down-circle"></i>
              Depositar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modais -->
    <ContaModal         ref="contaModalRef"         @saved="store.fetchAll()" />
    <DepositarModal     ref="depositarModalRef"      @deposited="store.fetchAll()" />
    <TransferenciaModal ref="transferenciaModalRef"  @transferred="store.fetchAll()" />
    <ConfirmModal
      ref="confirmModalRef"
      title="Excluir conta"
      :message="`Deseja excluir a conta &quot;${contaParaExcluir?.descricao}&quot;? Esta ação não pode ser desfeita.`"
      confirm-label="Excluir"
      variant="danger"
      icon="bi-trash"
      @confirmed="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useContasStore } from '@/stores/contas.js'
import { useFormatters } from '@/composables/useFormatters.js'
import ContaModal         from '@/components/contas/ContaModal.vue'
import DepositarModal     from '@/components/contas/DepositarModal.vue'
import TransferenciaModal from '@/components/contas/TransferenciaModal.vue'
import ConfirmModal       from '@/components/shared/ConfirmModal.vue'

const store = useContasStore()
const { formatCurrency } = useFormatters()

const contaModalRef         = ref(null)
const depositarModalRef     = ref(null)
const transferenciaModalRef = ref(null)
const confirmModalRef       = ref(null)
const contaParaExcluir      = ref(null)

onMounted(() => store.fetchAll())

function openCreate()              { contaModalRef.value.open() }
function openEdit(conta)           { contaModalRef.value.open(conta) }
function openDepositar(conta)      { depositarModalRef.value.open(conta) }
function openTransferencia(conta)  { transferenciaModalRef.value.open(conta) }

function openDelete(conta) {
  contaParaExcluir.value = conta
  confirmModalRef.value.open()
}

async function setPrincipal(conta) {
  await store.setAsPrincipal(conta.id)
}

async function handleDelete({ done }) {
  try {
    await store.remove(contaParaExcluir.value.id)
  } finally {
    done()
  }
}

// Gera cor de fundo do ícone baseada no nome do ícone (hash simples)
function iconBg(icone = '') {
  const palettes = [
    { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
    { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
    { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
    { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
    { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
    { bg: 'rgba(168,85,247,0.12)',  color: '#a855f7' },
    { bg: 'rgba(236,72,153,0.12)',  color: '#ec4899' },
    { bg: 'rgba(20,184,166,0.12)',  color: '#14b8a6' },
  ]
  const idx = icone.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length
  const p = palettes[idx]
  return { background: p.bg, color: p.color }
}
</script>

<style scoped>
.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.summary-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.2rem;
}
.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.empty-state i {
  font-size: 3.5rem;
  color: #d1d5db;
  display: block;
}

.conta-card {
  background: #fff;
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s, transform 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.conta-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
.conta-card--principal {
  border: 1.5px solid rgba(245, 158, 11, 0.4);
  box-shadow: 0 2px 12px rgba(245, 158, 11, 0.12);
}

.conta-icon-wrap {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.saldo-value {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
}

.conta-footer {
  border-top: 1px solid #f3f4f6;
  margin-top: auto;
}
</style>
