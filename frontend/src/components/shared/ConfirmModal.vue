<template>
  <div class="modal fade" ref="modalEl" tabindex="-1">
    <div class="modal-dialog modal-sm modal-dialog-centered">
      <div class="modal-content border-0 shadow">

        <div class="modal-body text-center p-4">
          <div class="confirm-icon mb-3" :class="`bg-${variant}-subtle`">
            <i class="bi" :class="[icon, `text-${variant}`]"></i>
          </div>
          <h6 class="fw-bold mb-2">{{ title }}</h6>
          <p class="text-muted small mb-0">{{ message }}</p>
        </div>

        <div class="modal-footer border-0 pt-0 justify-content-center gap-2">
          <button type="button" class="btn btn-light px-4" @click="close">
            Cancelar
          </button>
          <button
            type="button"
            class="btn px-4"
            :class="`btn-${variant}`"
            :disabled="loading"
            @click="confirm"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
            {{ confirmLabel }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Modal } from 'bootstrap'

const emit = defineEmits(['confirmed'])

defineProps({
  title:        { type: String, default: 'Confirmar ação' },
  message:      { type: String, default: 'Tem certeza que deseja continuar?' },
  confirmLabel: { type: String, default: 'Confirmar' },
  variant:      { type: String, default: 'danger' },
  icon:         { type: String, default: 'bi-exclamation-triangle' },
})

const modalEl = ref(null)
const loading = ref(false)
let   bsModal = null

onMounted(() => { bsModal = new Modal(modalEl.value) })
onUnmounted(() => bsModal?.dispose())

function open() {
  loading.value = false
  bsModal.show()
}
function close() {
  bsModal.hide()
}
function confirm() {
  loading.value = true
  emit('confirmed', { done: () => { loading.value = false; close() } })
}

defineExpose({ open, close })
</script>

<style scoped>
.confirm-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 1.6rem;
}
</style>
