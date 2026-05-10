<template>
  <div class="modal fade" ref="modalEl" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog">
      <div class="modal-content border-0 shadow">

        <div class="modal-header">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
            <div class="icon-badge text-success">
              <i class="bi bi-arrow-down-circle"></i>
            </div>
            Depositar na conta
          </h5>
          <button type="button" class="btn-close" @click="close" :disabled="loading"></button>
        </div>

        <div class="modal-body">
          <!-- Info da conta -->
          <div class="conta-info mb-4 p-3 rounded-3">
            <div class="d-flex align-items-center gap-3">
              <div class="conta-icon">
                <i class="bi" :class="conta?.icone || 'bi-wallet2'"></i>
              </div>
              <div>
                <p class="mb-0 fw-semibold">{{ conta?.descricao }}</p>
                <p class="mb-0 text-muted small">
                  Saldo atual:
                  <strong :class="(conta?.saldo ?? 0) >= 0 ? 'text-success' : 'text-danger'">
                    {{ formatCurrency(conta?.saldo) }}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" id="depositarForm" novalidate>
            <!-- Valor -->
            <div class="mb-3">
              <label class="form-label fw-medium">
                Valor <span class="text-danger">*</span>
              </label>
              <div class="input-group input-group-lg">
                <span class="input-group-text fw-semibold">R$</span>
                <input
                  v-model="form.valor"
                  type="number"
                  class="form-control"
                  :class="{ 'is-invalid': submitted && (!form.valor || form.valor <= 0) }"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  autofocus
                />
                <div class="invalid-feedback">Informe um valor maior que zero.</div>
              </div>
            </div>

            <!-- Descrição -->
            <div class="mb-3">
              <label class="form-label fw-medium">Descrição</label>
              <input
                v-model="form.descricao"
                type="text"
                class="form-control"
                maxlength="100"
                placeholder="Depósito de salário"
              />
            </div>

            <!-- Preview do novo saldo -->
            <div v-if="form.valor > 0" class="alert alert-success py-2 small">
              <i class="bi bi-info-circle me-1"></i>
              Novo saldo: <strong>{{ formatCurrency((conta?.saldo ?? 0) + Number(form.valor)) }}</strong>
            </div>

            <!-- Erro de API -->
            <div v-if="apiError" class="alert alert-danger py-2 small">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ apiError }}
            </div>
          </form>
        </div>

        <div class="modal-footer border-top-0">
          <button type="button" class="btn btn-light px-4" @click="close" :disabled="loading">
            Cancelar
          </button>
          <button
            type="submit"
            form="depositarForm"
            class="btn btn-success px-4"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ loading ? 'Depositando…' : 'Confirmar depósito' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Modal } from 'bootstrap'
import { useContasStore } from '@/stores/contas.js'
import { useFormatters } from '@/composables/useFormatters.js'

const emit = defineEmits(['deposited'])

const store   = useContasStore()
const { formatCurrency } = useFormatters()
const modalEl = ref(null)
let   bsModal = null

const conta     = ref(null)
const loading   = ref(false)
const submitted = ref(false)
const apiError  = ref(null)

const form = reactive({ valor: '', descricao: 'Depósito de salário' })

onMounted(() => { bsModal = new Modal(modalEl.value) })
onUnmounted(() => bsModal?.dispose())

function open(c) {
  conta.value     = c
  submitted.value = false
  apiError.value  = null
  form.valor      = ''
  form.descricao  = 'Depósito de salário'
  bsModal.show()
}

function close() {
  bsModal.hide()
}

async function handleSubmit() {
  submitted.value = true
  if (!form.valor || form.valor <= 0) return

  loading.value  = true
  apiError.value = null
  try {
    await store.depositar(conta.value.id, {
      valor: parseFloat(form.valor),
      descricao: form.descricao || 'Depósito de salário',
    })
    emit('deposited')
    close()
  } catch (e) {
    apiError.value = e.response?.data?.error || 'Erro ao realizar depósito'
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.conta-info {
  background: rgba(16, 185, 129, 0.06);
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.conta-icon {
  width: 44px;
  height: 44px;
  background: rgba(16, 185, 129, 0.12);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #10b981;
  flex-shrink: 0;
}
.icon-badge {
  width: 36px;
  height: 36px;
  background: rgba(16, 185, 129, 0.12);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
</style>
