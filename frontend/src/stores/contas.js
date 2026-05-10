import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api.js'

export const useContasStore = defineStore('contas', () => {
  const contas  = ref([])
  const loading = ref(false)
  const error   = ref(null)

  const contasPrincipais = computed(() => contas.value.filter(c => c.principal))
  const saldoTotal = computed(() => {
    const base = contasPrincipais.value.length > 0 ? contasPrincipais.value : contas.value
    return base.reduce((s, c) => s + Number(c.saldo), 0)
  })

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
    // Se a conta foi definida como principal, desmarca as demais no estado local
    if (payload.principal) {
      contas.value.forEach(c => { if (c.id !== id) c.principal = false })
    }
    const idx = contas.value.findIndex(c => c.id === id)
    if (idx !== -1) contas.value[idx] = data
    return data
  }

  async function setAsPrincipal(id) {
    return update(id, { principal: true })
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

  async function transferir(payload) {
    const { data } = await api.post('/contas/transferir', payload)
    const idxOrigem  = contas.value.findIndex(c => c.id === data.origem.id)
    const idxDestino = contas.value.findIndex(c => c.id === data.destino.id)
    if (idxOrigem  !== -1) contas.value[idxOrigem]  = data.origem
    if (idxDestino !== -1) contas.value[idxDestino] = data.destino
    return data
  }

  return { contas, contasPrincipais, loading, error, saldoTotal, fetchAll, create, update, remove, depositar, transferir, setAsPrincipal }
})
