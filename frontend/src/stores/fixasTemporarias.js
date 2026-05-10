import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api.js'

export const useFixasTemporariasStore = defineStore('fixasTemporarias', () => {
  const fixas   = ref([])
  const loading = ref(false)
  const error   = ref(null)

  const totalMes      = computed(() => fixas.value.reduce((s, f) => s + Number(f.valor), 0))
  const totalPago     = computed(() => fixas.value.filter(f => f.pagamento).reduce((s, f) => s + Number(f.pagamento.valor_pago), 0))
  const totalPendente = computed(() => fixas.value.filter(f => !f.pagamento).reduce((s, f) => s + Number(f.valor), 0))

  async function fetchAll(mes, ano) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/fixas-temporarias', { params: { mes, ano } })
      fixas.value = data
    } catch (e) {
      error.value = e.response?.data?.error || 'Erro ao carregar despesas temporárias'
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const { data } = await api.post('/fixas-temporarias', payload)
    fixas.value.push(data)
    fixas.value.sort((a, b) => a.descricao.localeCompare(b.descricao))
    return data
  }

  async function update(id, payload) {
    const { data } = await api.put(`/fixas-temporarias/${id}`, payload)
    const idx = fixas.value.findIndex(f => f.id === id)
    if (idx !== -1) fixas.value[idx] = { ...fixas.value[idx], ...data }
    return data
  }

  async function remove(id) {
    await api.delete(`/fixas-temporarias/${id}`)
    fixas.value = fixas.value.filter(f => f.id !== id)
  }

  async function pagar(id, mes, ano, payload) {
    const { data } = await api.post(`/fixas-temporarias/${id}/pagar`, { mes, ano, ...payload })
    const idx = fixas.value.findIndex(f => f.id === id)
    if (idx !== -1) fixas.value[idx] = { ...fixas.value[idx], pagamento: data }
    return data
  }

  async function despagar(id, mes, ano) {
    await api.delete(`/fixas-temporarias/${id}/pagar`, { params: { mes, ano } })
    const idx = fixas.value.findIndex(f => f.id === id)
    if (idx !== -1) fixas.value[idx] = { ...fixas.value[idx], pagamento: null }
  }

  return {
    fixas, loading, error,
    totalMes, totalPago, totalPendente,
    fetchAll, create, update, remove, pagar, despagar,
  }
})
