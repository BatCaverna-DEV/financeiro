<template>
  <div>
    <!-- Cabeçalho -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-0 fw-bold">Categorias</h4>
        <small class="text-muted">Classifique suas receitas e despesas</small>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2" @click="openCreate">
        <i class="bi bi-plus-lg"></i>
        <span class="d-none d-sm-inline">Nova Categoria</span>
      </button>
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
      <!-- Busca + contador -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-bottom py-3 d-flex align-items-center gap-3">
          <div class="input-group input-group-sm" style="max-width: 280px">
            <span class="input-group-text bg-light border-end-0">
              <i class="bi bi-search text-muted"></i>
            </span>
            <input
              v-model="search"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Pesquisar categoria..."
            />
            <button v-if="search" class="input-group-text bg-light" @click="search = ''">
              <i class="bi bi-x text-muted"></i>
            </button>
          </div>
          <span class="text-muted small ms-auto">
            {{ filtered.length }} categoria{{ filtered.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Estado vazio -->
        <div v-if="store.categorias.length === 0" class="text-center py-5">
          <i class="bi bi-tags text-muted d-block mb-3" style="font-size: 3rem; opacity: .3"></i>
          <p class="fw-semibold mb-1">Nenhuma categoria cadastrada</p>
          <p class="text-muted small mb-3">Crie categorias para organizar melhor suas transações.</p>
          <button class="btn btn-primary btn-sm" @click="openCreate">
            <i class="bi bi-plus-lg me-1"></i>Criar primeira categoria
          </button>
        </div>

        <!-- Sem resultados na busca -->
        <div v-else-if="filtered.length === 0" class="text-center py-5 text-muted small">
          <i class="bi bi-search d-block mb-2 fs-4"></i>
          Nenhuma categoria encontrada para "<strong>{{ search }}</strong>"
        </div>

        <!-- Tabela -->
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="ps-4 py-3 small text-muted fw-semibold border-0">#</th>
                <th class="py-3 small text-muted fw-semibold border-0">Nome</th>
                <th class="py-3 small text-muted fw-semibold border-0 text-center">Status</th>
                <th class="py-3 pe-4 small text-muted fw-semibold border-0 text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(cat, idx) in filtered" :key="cat.id">
                <td class="ps-4 text-muted small">{{ idx + 1 }}</td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="cat-icon" :style="iconStyle(cat.descricao)">
                      <i class="bi" :class="cat.icone || 'bi-tag'"></i>
                    </div>
                    <span class="fw-medium">{{ cat.descricao }}</span>
                  </div>
                </td>
                <td class="text-center">
                  <span
                    class="badge rounded-pill px-3"
                    :class="cat.status === 1 ? 'text-success bg-success-subtle' : 'text-secondary bg-secondary-subtle'"
                  >
                    {{ cat.status === 1 ? 'Ativa' : 'Inativa' }}
                  </span>
                </td>
                <td class="pe-4 text-end">
                  <button
                    class="btn btn-sm btn-link text-primary p-1 me-1"
                    title="Editar"
                    @click="openEdit(cat)"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-link text-danger p-1"
                    title="Excluir"
                    @click="openDelete(cat)"
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
    <CategoriaModal ref="categoriaModalRef" @saved="store.fetchAll()" />
    <ConfirmModal
      ref="confirmModalRef"
      title="Excluir categoria"
      :message="`Deseja excluir a categoria &quot;${catParaExcluir?.descricao}&quot;?`"
      confirm-label="Excluir"
      variant="danger"
      icon="bi-trash"
      @confirmed="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCategoriasStore } from '@/stores/categorias.js'
import CategoriaModal from '@/components/categorias/CategoriaModal.vue'
import ConfirmModal   from '@/components/shared/ConfirmModal.vue'

const store = useCategoriasStore()

const categoriaModalRef = ref(null)
const confirmModalRef   = ref(null)
const catParaExcluir    = ref(null)
const search            = ref('')

onMounted(() => store.fetchAll())

const filtered = computed(() => {
  if (!search.value) return store.categorias
  const q = search.value.toLowerCase()
  return store.categorias.filter(c => c.descricao.toLowerCase().includes(q))
})

function openCreate()    { categoriaModalRef.value.open() }
function openEdit(cat)   { categoriaModalRef.value.open(cat) }

function openDelete(cat) {
  catParaExcluir.value = cat
  confirmModalRef.value.open()
}

async function handleDelete({ done }) {
  try {
    await store.remove(catParaExcluir.value.id)
  } finally {
    done()
  }
}

const PALETTES = [
  { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
  { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  { bg: 'rgba(168,85,247,0.12)',  color: '#a855f7' },
  { bg: 'rgba(236,72,153,0.12)',  color: '#ec4899' },
  { bg: 'rgba(20,184,166,0.12)',  color: '#14b8a6' },
  { bg: 'rgba(249,115,22,0.12)',  color: '#f97316' },
  { bg: 'rgba(132,204,22,0.12)',  color: '#84cc16' },
]
function iconStyle(name = '') {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length
  const p = PALETTES[idx]
  return { background: p.bg, color: p.color }
}
</script>

<style scoped>
.cat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}
</style>
