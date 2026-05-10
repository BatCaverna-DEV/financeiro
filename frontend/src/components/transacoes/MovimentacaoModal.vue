<template>
  <div class="modal fade" ref="modalEl" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
      <div class="modal-content border-0 shadow">

        <div class="modal-header">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
            <div class="icon-badge" :class="form.tipo === 1 ? 'icon-receita' : 'icon-despesa'">
              <i class="bi" :class="form.tipo === 1 ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle'"></i>
            </div>
            {{ isEdit ? 'Editar Movimentação' : 'Nova Movimentação' }}
          </h5>
          <button type="button" class="btn-close" @click="close" :disabled="loading"></button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit" id="transacaoForm" novalidate>

            <!-- Tipo -->
            <div class="mb-4">
              <label class="form-label fw-medium">Tipo</label>
              <div class="d-flex gap-2">
                <button
                  type="button"
                  class="btn flex-fill tipo-btn"
                  :class="form.tipo === 1 ? 'btn-receita active' : 'btn-outline-secondary'"
                  @click="form.tipo = 1"
                >
                  <i class="bi bi-arrow-down-circle me-2"></i>Receita
                </button>
                <button
                  type="button"
                  class="btn flex-fill tipo-btn"
                  :class="form.tipo === 2 ? 'btn-despesa active' : 'btn-outline-secondary'"
                  @click="form.tipo = 2"
                >
                  <i class="bi bi-arrow-up-circle me-2"></i>Despesa
                </button>
              </div>
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
                placeholder="Ex.: Salário, Mercado, Aluguel..."
                maxlength="100"
              />
              <div class="invalid-feedback">A descrição é obrigatória.</div>
            </div>

            <div class="row g-3 mb-3">
              <!-- Data -->
              <div class="col-sm-6">
                <label class="form-label fw-medium">
                  Data <span class="text-danger">*</span>
                </label>
                <input
                  v-model="form.data"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': submitted && !form.data }"
                />
                <div class="invalid-feedback">A data é obrigatória.</div>
              </div>

              <!-- Valor -->
              <div class="col-sm-6">
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
            </div>

            <div class="row g-3 mb-3">
              <!-- Conta -->
              <div class="col-sm-6">
                <label class="form-label fw-medium">
                  Conta <span class="text-danger">*</span>
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

              <!-- Categoria -->
              <div class="col-sm-6">
                <label class="form-label fw-medium">Categoria</label>
                <select v-model="form.categoria_id" class="form-select">
                  <option value="">Sem categoria</option>
                  <option v-for="c in categoriasStore.categorias" :key="c.id" :value="c.id">
                    {{ c.descricao }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="apiError" class="alert alert-danger py-2 small mt-2">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ apiError }}
            </div>

          </form>
        </div>

        <div class="modal-footer border-top-0">
          <button type="button" class="btn btn-light px-4" @click="close" :disabled="loading">
            Cancelar
          </button>
          <button type="submit" form="transacaoForm" class="btn px-4" :class="form.tipo === 1 ? 'btn-receita' : 'btn-despesa'" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ loading ? 'Salvando…' : (isEdit ? 'Salvar alterações' : (form.tipo === 1 ? 'Lançar receita' : 'Lançar despesa')) }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Modal } from 'bootstrap'
import { useMovimentacoesStore } from '@/stores/movimentacoes.js'
import { useContasStore }     from '@/stores/contas.js'
import { useCategoriasStore } from '@/stores/categorias.js'

const emit = defineEmits(['saved'])

const store           = useMovimentacoesStore()
const contasStore     = useContasStore()
const categoriasStore = useCategoriasStore()

const modalEl  = ref(null)
let   bsModal  = null

const isEdit    = ref(false)
const editId    = ref(null)
const loading   = ref(false)
const submitted = ref(false)
const apiError  = ref(null)

const form = reactive({
  tipo:        2,
  descricao:   '',
  data:        '',
  valor:       '',
  contas_id:   '',
  categoria_id: '',
})

const valorValido = computed(() => form.valor && Number(form.valor) > 0)

onMounted(() => {
  bsModal = new Modal(modalEl.value)
  if (!contasStore.contas.length)     contasStore.fetchAll()
  if (!categoriasStore.categorias.length) categoriasStore.fetchAll()
})
onUnmounted(() => bsModal?.dispose())

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function open(transacao = null) {
  submitted.value = false
  apiError.value  = null

  if (transacao) {
    isEdit.value        = true
    editId.value        = transacao.id
    form.tipo           = transacao.tipo
    form.descricao      = transacao.descricao
    form.data           = transacao.data
    form.valor          = transacao.valor
    form.contas_id      = transacao.contas_id
    form.categoria_id   = transacao.categoria_id || ''
  } else {
    isEdit.value        = false
    editId.value        = null
    form.tipo           = 2
    form.descricao      = ''
    form.data           = todayISO()
    form.valor          = ''
    form.contas_id      = contasStore.contas[0]?.id || ''
    form.categoria_id   = ''
  }

  bsModal.show()
}

function close() { bsModal.hide() }

async function handleSubmit() {
  submitted.value = true
  if (!form.descricao || !form.data || !valorValido.value || !form.contas_id) return

  const payload = {
    tipo:         form.tipo,
    descricao:    form.descricao,
    data:         form.data,
    valor:        Number(form.valor),
    contas_id:    form.contas_id,
    categoria_id: form.categoria_id || null,
  }

  loading.value  = true
  apiError.value = null
  try {
    if (isEdit.value) {
      await store.update(editId.value, payload)
    } else {
      await store.create(payload)
    }
    emit('saved')
    close()
  } catch (e) {
    apiError.value = e.response?.data?.error || 'Erro ao salvar movimentação'
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
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.icon-receita { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.icon-despesa { background: rgba(239, 68, 68, 0.12);  color: #ef4444; }

.tipo-btn { font-weight: 500; }
.btn-receita        { background: #10b981; border-color: #10b981; color: #fff; }
.btn-receita:hover  { background: #059669; border-color: #059669; color: #fff; }
.btn-despesa        { background: #ef4444; border-color: #ef4444; color: #fff; }
.btn-despesa:hover  { background: #dc2626; border-color: #dc2626; color: #fff; }
</style>
