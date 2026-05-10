<template>
  <div class="modal fade" ref="modalEl" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content border-0 shadow">

        <div class="modal-header">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
            <div class="icon-badge">
              <i class="bi" :class="form.icone || 'bi-wallet2'"></i>
            </div>
            {{ isEdit ? 'Editar Conta' : 'Nova Conta' }}
          </h5>
          <button type="button" class="btn-close" @click="close" :disabled="loading"></button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit" id="contaForm" novalidate>

            <!-- Ícone -->
            <div class="mb-4">
              <label class="form-label fw-medium">Ícone da conta</label>
              <IconPicker v-model="form.icone" />
            </div>

            <hr class="my-3">

            <!-- Descrição -->
            <div class="mb-3">
              <label class="form-label fw-medium">
                Descrição <span class="text-danger">*</span>
              </label>
              <input
                v-model.trim="form.descricao"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': submitted && !form.descricao }"
                placeholder="Ex.: Conta Corrente, Poupança, Carteira..."
                maxlength="100"
                autofocus
              />
              <div class="invalid-feedback">Descrição é obrigatória.</div>
            </div>

            <!-- Saldo inicial (apenas criação) -->
            <div v-if="!isEdit" class="mb-3">
              <label class="form-label fw-medium">Saldo inicial</label>
              <div class="input-group">
                <span class="input-group-text">R$</span>
                <input
                  v-model="form.saldo"
                  type="number"
                  class="form-control"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                />
              </div>
              <div class="form-text">Pode ser alterado a qualquer momento via depósitos.</div>
            </div>

            <!-- Conta principal -->
            <div class="form-check form-switch mt-3">
              <input
                class="form-check-input"
                type="checkbox"
                id="switchPrincipal"
                v-model="form.principal"
              />
              <label class="form-check-label fw-medium" for="switchPrincipal">
                Conta principal
              </label>
              <div class="form-text">
                O saldo desta conta é usado nos totais do sistema. Só uma conta pode ser principal.
              </div>
            </div>

            <!-- Erro de API -->
            <div v-if="apiError" class="alert alert-danger py-2 small mt-3">
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
            form="contaForm"
            class="btn btn-primary px-4"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ loading ? 'Salvando…' : (isEdit ? 'Salvar alterações' : 'Criar conta') }}
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
import IconPicker from './IconPicker.vue'

const emit = defineEmits(['saved'])

const store    = useContasStore()
const modalEl  = ref(null)
let   bsModal  = null

const isEdit    = ref(false)
const editId    = ref(null)
const loading   = ref(false)
const submitted = ref(false)
const apiError  = ref(null)

const form = reactive({
  descricao: '',
  icone: 'bi-wallet2',
  saldo: 0,
  principal: false,
})

onMounted(() => {
  bsModal = new Modal(modalEl.value)
})
onUnmounted(() => bsModal?.dispose())

function open(conta = null) {
  submitted.value = false
  apiError.value  = null

  if (conta) {
    isEdit.value      = true
    editId.value      = conta.id
    form.descricao    = conta.descricao
    form.icone        = conta.icone || 'bi-wallet2'
    form.saldo        = conta.saldo
    form.principal    = !!conta.principal
  } else {
    isEdit.value   = false
    editId.value   = null
    form.descricao = ''
    form.icone     = 'bi-wallet2'
    form.saldo     = 0
    form.principal = false
  }

  bsModal.show()
}

function close() {
  bsModal.hide()
}

async function handleSubmit() {
  submitted.value = true
  if (!form.descricao) return

  loading.value  = true
  apiError.value = null
  try {
    if (isEdit.value) {
      await store.update(editId.value, { descricao: form.descricao, icone: form.icone, principal: form.principal })
    } else {
      await store.create({ descricao: form.descricao, icone: form.icone, saldo: form.saldo, principal: form.principal })
    }
    emit('saved')
    close()
  } catch (e) {
    apiError.value = e.response?.data?.error || 'Erro ao salvar conta'
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.icon-badge {
  width: 36px;
  height: 36px;
  background: rgba(99, 102, 241, 0.12);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  font-size: 1.1rem;
}
</style>
