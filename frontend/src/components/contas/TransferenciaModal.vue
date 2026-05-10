<template>
  <div class="modal fade" ref="modalEl" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 460px">
      <div class="modal-content border-0 shadow">

        <div class="modal-header">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
            <div class="icon-badge">
              <i class="bi bi-arrow-left-right"></i>
            </div>
            Transferência entre contas
          </h5>
          <button type="button" class="btn-close" @click="close" :disabled="loading"></button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit" id="transferenciaForm" novalidate>

            <!-- Origem -->
            <div class="mb-3">
              <label class="form-label fw-medium">
                Conta de origem <span class="text-danger">*</span>
              </label>
              <select
                v-model="form.conta_origem_id"
                class="form-select"
                :class="{ 'is-invalid': submitted && !form.conta_origem_id }"
              >
                <option value="">Selecione a conta de origem</option>
                <option
                  v-for="c in store.contas"
                  :key="c.id"
                  :value="c.id"
                  :disabled="c.id === form.conta_destino_id"
                >
                  {{ c.descricao }} — {{ formatCurrency(c.saldo) }}
                </option>
              </select>
              <div class="invalid-feedback">Selecione a conta de origem.</div>
            </div>

            <!-- Seta visual -->
            <div class="text-center my-2">
              <div class="transfer-arrow">
                <i class="bi bi-arrow-down fs-4 text-primary"></i>
              </div>
            </div>

            <!-- Destino -->
            <div class="mb-3">
              <label class="form-label fw-medium">
                Conta de destino <span class="text-danger">*</span>
              </label>
              <select
                v-model="form.conta_destino_id"
                class="form-select"
                :class="{ 'is-invalid': submitted && !form.conta_destino_id }"
              >
                <option value="">Selecione a conta de destino</option>
                <option
                  v-for="c in store.contas"
                  :key="c.id"
                  :value="c.id"
                  :disabled="c.id === form.conta_origem_id"
                >
                  {{ c.descricao }} — {{ formatCurrency(c.saldo) }}
                </option>
              </select>
              <div class="invalid-feedback">Selecione a conta de destino.</div>
            </div>

            <hr class="my-3">

            <!-- Valor -->
            <div class="mb-3">
              <label class="form-label fw-medium">
                Valor (R$) <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.valor"
                type="number"
                step="0.01"
                min="0.01"
                class="form-control"
                :class="{ 'is-invalid': submitted && !valorValido }"
                placeholder="0,00"
              />
              <div class="invalid-feedback">Informe um valor maior que zero.</div>
            </div>

            <!-- Descrição -->
            <div class="mb-3">
              <label class="form-label fw-medium">Descrição</label>
              <input
                v-model.trim="form.descricao"
                type="text"
                class="form-control"
                placeholder="Transferência"
                maxlength="100"
              />
            </div>

            <!-- Preview -->
            <div v-if="origemObj && destinoObj && valorValido" class="preview-box p-3 rounded-3 mt-3">
              <div class="d-flex justify-content-between align-items-center small">
                <div class="text-center flex-fill">
                  <div class="text-muted mb-1">De</div>
                  <div class="fw-semibold text-truncate">{{ origemObj.descricao }}</div>
                  <div class="text-danger mt-1">− {{ formatCurrency(form.valor) }}</div>
                </div>
                <i class="bi bi-arrow-right fs-5 text-primary mx-3 flex-shrink-0"></i>
                <div class="text-center flex-fill">
                  <div class="text-muted mb-1">Para</div>
                  <div class="fw-semibold text-truncate">{{ destinoObj.descricao }}</div>
                  <div class="text-success mt-1">+ {{ formatCurrency(form.valor) }}</div>
                </div>
              </div>
            </div>

            <div v-if="apiError" class="alert alert-danger py-2 small mt-3">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ apiError }}
            </div>

          </form>
        </div>

        <div class="modal-footer border-top-0">
          <button type="button" class="btn btn-light px-4" @click="close" :disabled="loading">
            Cancelar
          </button>
          <button type="submit" form="transferenciaForm" class="btn btn-primary px-4" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ loading ? 'Transferindo…' : 'Confirmar transferência' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Modal } from 'bootstrap'
import { useContasStore } from '@/stores/contas.js'
import { useFormatters }  from '@/composables/useFormatters.js'

const emit = defineEmits(['transferred'])

const store = useContasStore()
const { formatCurrency } = useFormatters()

const modalEl  = ref(null)
let   bsModal  = null

const loading   = ref(false)
const submitted = ref(false)
const apiError  = ref(null)

const form = reactive({
  conta_origem_id:  '',
  conta_destino_id: '',
  valor:            '',
  descricao:        '',
})

const valorValido = computed(() => form.valor && Number(form.valor) > 0)
const origemObj   = computed(() => store.contas.find(c => c.id === form.conta_origem_id))
const destinoObj  = computed(() => store.contas.find(c => c.id === form.conta_destino_id))

onMounted(() => { bsModal = new Modal(modalEl.value) })
onUnmounted(() => bsModal?.dispose())

function open(contaOrigem = null) {
  submitted.value          = false
  apiError.value           = null
  form.conta_origem_id     = contaOrigem?.id || ''
  form.conta_destino_id    = ''
  form.valor               = ''
  form.descricao           = ''
  bsModal.show()
}

function close() { bsModal.hide() }

async function handleSubmit() {
  submitted.value = true
  if (!form.conta_origem_id || !form.conta_destino_id || !valorValido.value) return

  loading.value  = true
  apiError.value = null
  try {
    await store.transferir({
      conta_origem_id:  form.conta_origem_id,
      conta_destino_id: form.conta_destino_id,
      valor:            Number(form.valor),
      descricao:        form.descricao || 'Transferência',
    })
    emit('transferred')
    close()
  } catch (e) {
    apiError.value = e.response?.data?.error || 'Erro ao realizar transferência'
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.icon-badge {
  width: 36px; height: 36px;
  background: rgba(59, 130, 246, 0.12);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #3b82f6; font-size: 1.1rem;
}

.transfer-arrow {
  width: 40px; height: 40px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
}

.preview-box {
  background: #f8faff;
  border: 1px solid rgba(59, 130, 246, 0.15);
}
</style>
