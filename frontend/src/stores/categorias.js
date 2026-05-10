import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api.js'

export const useCategoriasStore = defineStore('categorias', () => {
  const categorias = ref([])
  const loading    = ref(false)
  const error      = ref(null)

  async function fetchAll() {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/categorias')
      categorias.value = data
    } catch (e) {
      error.value = e.response?.data?.error || 'Erro ao carregar categorias'
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const { data } = await api.post('/categorias', payload)
    categorias.value.push(data)
    categorias.value.sort((a, b) => a.descricao.localeCompare(b.descricao))
    return data
  }

  async function update(id, payload) {
    const { data } = await api.put(`/categorias/${id}`, payload)
    const idx = categorias.value.findIndex(c => c.id === id)
    if (idx !== -1) categorias.value[idx] = data
    return data
  }

  async function remove(id) {
    await api.delete(`/categorias/${id}`)
    categorias.value = categorias.value.filter(c => c.id !== id)
  }

  return { categorias, loading, error, fetchAll, create, update, remove }
})
