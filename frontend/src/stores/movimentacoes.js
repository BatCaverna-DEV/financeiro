import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api.js'

export const useMovimentacoesStore = defineStore('movimentacoes', () => {
  const movimentacoes = ref([])
  const loading       = ref(false)
  const error         = ref(null)

  const totalReceitas = computed(() =>
    movimentacoes.value.filter(t => t.tipo === 1).reduce((s, t) => s + Number(t.valor), 0)
  )
  const totalDespesas = computed(() =>
    movimentacoes.value.filter(t => t.tipo === 2).reduce((s, t) => s + Number(t.valor), 0)
  )
  const saldoPeriodo = computed(() => totalReceitas.value - totalDespesas.value)

  async function fetchAll(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/movimentacoes', { params })
      movimentacoes.value = data
    } catch (e) {
      error.value = e.response?.data?.error || 'Erro ao carregar movimentações'
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const { data } = await api.post('/movimentacoes', payload)
    return data
  }

  async function update(id, payload) {
    const { data } = await api.put(`/movimentacoes/${id}`, payload)
    return data
  }

  async function remove(id) {
    await api.delete(`/movimentacoes/${id}`)
    movimentacoes.value = movimentacoes.value.filter(t => t.id !== id)
  }

  return {
    movimentacoes, loading, error,
    totalReceitas, totalDespesas, saldoPeriodo,
    fetchAll, create, update, remove,
  }
})
