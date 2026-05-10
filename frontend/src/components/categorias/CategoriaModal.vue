<template>
  <div class="modal fade" ref="modalEl" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
      <div class="modal-content border-0 shadow">

        <div class="modal-header">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
            <div class="icon-badge">
              <i class="bi" :class="form.icone || 'bi-tag'"></i>
            </div>
            {{ isEdit ? 'Editar Categoria' : 'Nova Categoria' }}
          </h5>
          <button type="button" class="btn-close" @click="close" :disabled="loading"></button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit" id="categoriaForm" novalidate>

            <!-- Ícone -->
            <div class="mb-4">
              <label class="form-label fw-medium">Ícone</label>
              <IconPicker v-model="form.icone" />
            </div>

            <hr class="my-3">

            <!-- Nome -->
            <div class="mb-3">
              <label class="form-label fw-medium">
                Nome <span class="text-danger">*</span>
              </label>
              <input
                v-model.trim="form.descricao"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': submitted && !form.descricao }"
                placeholder="Ex.: Alimentação, Transporte, Lazer..."
                maxlength="100"
                autofocus
              />
              <div class="invalid-feedback">O nome é obrigatório.</div>
            </div>

            <!-- Status (apenas edição) -->
            <div v-if="isEdit" class="mb-3">
              <label class="form-label fw-medium">Status</label>
              <div class="d-flex gap-3">
                <div class="form-check">
                  <input class="form-check-input" type="radio" id="statusAtivo"   :value="1" v-model="form.status" />
                  <label class="form-check-label" for="statusAtivo">Ativa</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" id="statusInativo" :value="0" v-model="form.status" />
                  <label class="form-check-label" for="statusInativo">Inativa</label>
                </div>
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
          <button type="submit" form="categoriaForm" class="btn btn-primary px-4" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ loading ? 'Salvando…' : (isEdit ? 'Salvar alterações' : 'Criar categoria') }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Modal } from 'bootstrap'
import { useCategoriasStore } from '@/stores/categorias.js'
import IconPicker from '@/components/contas/IconPicker.vue'

const emit  = defineEmits(['saved'])
const store = useCategoriasStore()

const modalEl  = ref(null)
let   bsModal  = null

const isEdit    = ref(false)
const editId    = ref(null)
const loading   = ref(false)
const submitted = ref(false)
const apiError  = ref(null)

const form = reactive({ descricao: '', icone: 'bi-tag', status: 1 })

onMounted(() => { bsModal = new Modal(modalEl.value) })
onUnmounted(() => bsModal?.dispose())

function open(categoria = null) {
  submitted.value = false
  apiError.value  = null

  if (categoria) {
    isEdit.value   = true
    editId.value   = categoria.id
    form.descricao = categoria.descricao
    form.icone     = categoria.icone || 'bi-tag'
    form.status    = categoria.status
  } else {
    isEdit.value   = false
    editId.value   = null
    form.descricao = ''
    form.icone     = 'bi-tag'
    form.status    = 1
  }

  bsModal.show()
}

function close() { bsModal.hide() }

async function handleSubmit() {
  submitted.value = true
  if (!form.descricao) return

  loading.value  = true
  apiError.value = null
  try {
    if (isEdit.value) {
      await store.update(editId.value, { descricao: form.descricao, icone: form.icone, status: form.status })
    } else {
      await store.create({ descricao: form.descricao, icone: form.icone })
    }
    emit('saved')
    close()
  } catch (e) {
    apiError.value = e.response?.data?.error || 'Erro ao salvar categoria'
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
  background: rgba(245, 158, 11, 0.12);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
  font-size: 1.1rem;
}
</style>
