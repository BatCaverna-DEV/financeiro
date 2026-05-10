import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api.js'

export const useContasStore = defineStore('contas', () => {
  const contas  = ref([])
  const loading = ref(false)
  const error   = ref(null)

  const saldoTotal = computed(() => contas.value.reduce((s, c) => s + Number(c.saldo), 0))

  async function fetchAll() {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/contas')
      contas.value = data
    } catch (e) {
      error.value = e.response?.data?.error || 'Erro ao carregar contas'
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const { data } = await api.post('/contas', payload)
    contas.value.push(data)
    return data
  }

  async function update(id, payload) {
    const { data } = await api.put(`/contas/${id}`, payload)
    const idx = contas.value.findIndex(c => c.id === id)
    if (idx !== -1) contas.value[idx] = data
    return data
  }

  async function remove(id) {
    await api.delete(`/contas/${id}`)
    contas.value = contas.value.filter(c => c.id !== id)
  }

  async function depositar(id, payload) {
    const { data } = await api.post(`/contas/${id}/depositar`, payload)
    const idx = contas.value.findIndex(c => c.id === id)
    if (idx !== -1) contas.value[idx] = data
    return data
  }

  return { contas, loading, error, saldoTotal, fetchAll, create, update, remove, depositar }
})
