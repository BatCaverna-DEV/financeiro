<template>
  <div class="modal fade" ref="modalEl" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content border-0 shadow">

        <div class="modal-header">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
            <div class="icon-badge">
              <i class="bi bi-calendar-range"></i>
            </div>
            {{ isEdit ? 'Editar Dívida' : 'Nova Dívida' }}
          </h5>
          <button type="button" class="btn-close" @click="close" :disabled="loading"></button>
        </div>

        <div class="modal-body">
          <p class="text-muted small mb-4">
            Dívidas com período definido — aparecem apenas nos meses dentro do intervalo.
          </p>
          <form @submit.prevent="handleSubmit" id="fixaTempForm" novalidate>

            <div class="mb-3">
              <label class="form-label fw-medium">
                Descrição <span class="text-danger">*</span>
              </label>
              <input
                v-model.trim="form.descricao"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': submitted && !form.descricao }"
                placeholder="Ex.: Parcela do carro, Empréstimo, Financiamento..."
                maxlength="100"
              />
              <div class="invalid-feedback">A descrição é obrigatória.</div>
            </div>

            <div class="row g-3 mb-3">
              <!-- Início -->
              <div class="col-sm-6">
                <label class="form-label fw-medium">
                  Data início <span class="text-danger">*</span>
                </label>
                <input
                  v-model="form.inicio"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': submitted && !form.inicio }"
                />
                <div class="invalid-feedback">A data de início é obrigatória.</div>
              </div>
              <!-- Fim -->
              <div class="col-sm-6">
                <label class="form-label fw-medium">
                  Data fim <span class="text-danger">*</span>
                </label>
                <input
                  v-model="form.fim"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': submitted && (!form.fim || fimInvalido) }"
                />
                <div class="invalid-feedback">
                  {{ !form.fim ? 'A data de fim é obrigatória.' : 'O fim deve ser posterior ao início.' }}
                </div>
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-sm-7">
                <label class="form-label fw-medium">
                  Conta padrão <span class="text-danger">*</span>
                </label>
                <select
                  v-model="form.contas_id"
                  class="form-select"
                  :class="{ 'is-invalid': submitted && !form.contas_id }"
                >
                  <option value="">Selecione uma conta</option>
                  <option v-for="c in contasStore.contas" :key="c.id" :value="c.id">
                    {{ c.descricao }}
                  </option>
                </select>
                <div class="invalid-feedback">Selecione uma conta.</div>
              </div>

              <div class="col-sm-5">
                <label class="form-label fw-medium">Tipo de valor</label>
                <div class="d-flex gap-3 mt-1">
                  <div class="form-check">
                    <input class="form-check-input" type="radio" id="tFixo2" :value="1" v-model="form.tipo" />
                    <label class="form-check-label" for="tFixo2">Fixo</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" id="tVar2"  :value="2" v-model="form.tipo" />
                    <label class="form-check-label" for="tVar2">Variável</label>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium">
                Valor (R$)
                <span v-if="form.tipo === 1" class="text-danger">*</span>
                <span v-else class="text-muted small fw-normal">(referência)</span>
              </label>
              <input
                v-model="form.valor"
                type="number"
                step="0.01"
                min="0"
                class="form-control"
                :class="{ 'is-invalid': submitted && form.tipo === 1 && !valorValido }"
                placeholder="0,00"
              />
              <div class="invalid-feedback">Informe um valor maior que zero.</div>
            </div>

            <!-- Status (edição) -->
            <div v-if="isEdit" class="mb-3">
              <label class="form-label fw-medium">Status</label>
              <div class="d-flex gap-3">
                <div class="form-check">
                  <input class="form-check-input" type="radio" id="sAtivo2"     :value="1" v-model="form.status" />
                  <label class="form-check-label" for="sAtivo2">Ativa</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" id="sEncerrado2" :value="0" v-model="form.status" />
                  <label class="form-check-label text-danger" for="sEncerrado2">Encerrada</label>
                </div>
              </div>
            </div>

            <div v-if="apiError" class="alert alert-danger py-2 small mt-2">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ apiError }}
            </div>
          </form>
        </div>

        <div class="modal-footer border-top-0">
          <button type="button" class="btn btn-light px-4" @click="close" :disabled="loading">Cancelar</button>
          <button type="submit" form="fixaTempForm" class="btn btn-warning px-4" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ loading ? 'Salvando…' : (isEdit ? 'Salvar alterações' : 'Criar') }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Modal } from 'bootstrap'
import { useFixasTemporariasStore } from '@/stores/fixasTemporarias.js'
import { useContasStore }           from '@/stores/contas.js'

const emit = defineEmits(['saved'])
const store       = useFixasTemporariasStore()
const contasStore = useContasStore()

const modalEl  = ref(null)
let   bsModal  = null

const isEdit    = ref(false)
const editId    = ref(null)
const loading   = ref(false)
const submitted = ref(false)
const apiError  = ref(null)

const form = reactive({
  descricao: '', contas_id: '', tipo: 1, valor: '',
  inicio: '', fim: '', status: 1,
})

const valorValido = computed(() => form.valor && Number(form.valor) > 0)
const fimInvalido = computed(() => form.inicio && form.fim && form.fim < form.inicio)

onMounted(() => {
  bsModal = new Modal(modalEl.value)
  if (!contasStore.contas.length) contasStore.fetchAll()
})
onUnmounted(() => bsModal?.dispose())

function open(fixa = null) {
  submitted.value = false
  apiError.value  = null
  if (fixa) {
    isEdit.value    = true
    editId.value    = fixa.id
    form.descricao  = fixa.descricao
    form.contas_id  = fixa.contas_id
    form.tipo       = fixa.tipo
    form.valor      = fixa.valor
    form.inicio     = fixa.inicio
    form.fim        = fixa.fim
    form.status     = fixa.status
  } else {
    isEdit.value    = false
    editId.value    = null
    form.descricao  = ''
    form.contas_id  = contasStore.contas[0]?.id || ''
    form.tipo       = 1
    form.valor      = ''
    form.inicio     = ''
    form.fim        = ''
    form.status     = 1
  }
  bsModal.show()
}

function close() { bsModal.hide() }

async function handleSubmit() {
  submitted.value = true
  if (!form.descricao || !form.contas_id || !form.inicio || !form.fim) return
  if (fimInvalido.value) return
  if (form.tipo === 1 && !valorValido.value) return

  const payload = {
    descricao: form.descricao,
    contas_id: form.contas_id,
    tipo:      form.tipo,
    valor:     Number(form.valor) || 0,
    inicio:    form.inicio,
    fim:       form.fim,
  }
  if (isEdit.value) payload.status = form.status

  loading.value  = true
  apiError.value = null
  try {
    if (isEdit.value) await store.update(editId.value, payload)
    else              await store.create(payload)
    emit('saved')
    close()
  } catch (e) {
    apiError.value = e.response?.data?.error || 'Erro ao salvar'
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.icon-badge {
  width: 36px; height: 36px;
  background: rgba(245, 158, 11, 0.12);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #f59e0b; font-size: 1.1rem;
}
</style>
