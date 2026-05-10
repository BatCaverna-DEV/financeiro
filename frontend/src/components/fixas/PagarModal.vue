<template>
  <div class="modal fade" ref="modalEl" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 440px">
      <div class="modal-content border-0 shadow">

        <div class="modal-header border-bottom-0 pb-0">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
            <div class="icon-pagar">
              <i class="bi bi-check-circle"></i>
            </div>
            Registrar pagamento
          </h5>
          <button type="button" class="btn-close" @click="close" :disabled="loading"></button>
        </div>

        <div class="modal-body pt-3">
          <p class="text-muted small mb-4">
            Mês de referência:
            <strong class="text-capitalize text-dark">{{ mesLabel }}</strong>
          </p>

          <form @submit.prevent="handleSubmit" id="pagarForm" novalidate>

            <div class="mb-3">
              <label class="form-label fw-medium small">Despesa</label>
              <p class="fw-semibold mb-0">{{ fixa?.descricao }}</p>
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium">
                Valor pago (R$) <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.valor"
                type="number"
                step="0.01"
                min="0.01"
                class="form-control"
                :class="{ 'is-invalid': submitted && !valorValido }"
                :readonly="fixa?.tipo === 1"
              />
              <div class="invalid-feedback">Informe um valor maior que zero.</div>
              <small v-if="fixa?.tipo === 1" class="text-muted">Valor fixo definido na despesa.</small>
              <small v-else class="text-muted">Informe o valor real cobrado este mês.</small>
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium">Descontar da conta</label>
              <select v-model="form.contas_id" class="form-select">
                <option v-for="c in contasStore.contas" :key="c.id" :value="c.id">
                  {{ c.descricao }}
                </option>
              </select>
            </div>

            <div v-if="apiError" class="alert alert-danger py-2 small">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ apiError }}
            </div>

          </form>
        </div>

        <div class="modal-footer border-top-0 pt-0">
          <button type="button" class="btn btn-light px-4" @click="close" :disabled="loading">Cancelar</button>
          <button type="submit" form="pagarForm" class="btn btn-success px-4" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ loading ? 'Registrando…' : 'Confirmar pagamento' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Modal } from 'bootstrap'
import { useFixasStore }            from '@/stores/fixas.js'
import { useFixasTemporariasStore } from '@/stores/fixasTemporarias.js'
import { useContasStore }           from '@/stores/contas.js'
import { useFormatters }            from '@/composables/useFormatters.js'

const emit = defineEmits(['paid'])

const fixasStore     = useFixasStore()
const tempStore      = useFixasTemporariasStore()
const contasStore    = useContasStore()
const { formatMonth } = useFormatters()

const modalEl = ref(null)
let   bsModal = null

const fixa       = ref(null)
const mes        = ref(null)
const ano        = ref(null)
const temporaria = ref(false)
const loading    = ref(false)
const submitted  = ref(false)
const apiError   = ref(null)

const form = reactive({ valor: '', contas_id: '' })

const valorValido = computed(() => form.valor && Number(form.valor) > 0)
const mesLabel    = computed(() => {
  if (!mes.value || !ano.value) return ''
  return formatMonth(new Date(ano.value, mes.value - 1, 1))
})

onMounted(() => {
  bsModal = new Modal(modalEl.value)
  if (!contasStore.contas.length) contasStore.fetchAll()
})
onUnmounted(() => bsModal?.dispose())

function open(fixaObj, mesVal, anoVal, isTemp = false) {
  fixa.value       = fixaObj
  mes.value        = mesVal
  ano.value        = anoVal
  temporaria.value = isTemp
  submitted.value  = false
  apiError.value   = null
  form.valor       = fixaObj.valor > 0 ? fixaObj.valor : ''
  form.contas_id   = fixaObj.contas_id
  bsModal.show()
}

function close() { bsModal.hide() }

async function handleSubmit() {
  submitted.value = true
  if (!valorValido.value) return

  loading.value  = true
  apiError.value = null
  try {
    const store = temporaria.value ? tempStore : fixasStore
    await store.pagar(fixa.value.id, mes.value, ano.value, {
      valor_pago: Number(form.valor),
      contas_id:  form.contas_id,
    })
    emit('paid')
    close()
  } catch (e) {
    apiError.value = e.response?.data?.error || 'Erro ao registrar pagamento'
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.icon-pagar {
  width: 36px; height: 36px;
  background: rgba(16, 185, 129, 0.12);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #10b981; font-size: 1.1rem;
}
</style>
