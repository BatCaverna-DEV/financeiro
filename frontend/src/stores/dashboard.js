import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api.js'

export const useDashboardStore = defineStore('dashboard', () => {
  const contas        = ref([])
  const movimentacoes = ref([])
  const fixas         = ref([])
  const loading       = ref(false)
  const error         = ref(null)

  const saldoTotal = computed(() => {
    const principais = contas.value.filter(c => c.principal)
    const base = principais.length > 0 ? principais : contas.value
    return base.reduce((s, c) => s + Number(c.saldo), 0)
  })
  const receitasMes         = computed(() => movimentacoes.value.filter(t => t.tipo === 1).reduce((s, t) => s + Number(t.valor), 0))
  const despesasMes         = computed(() => movimentacoes.value.filter(t => t.tipo === 2).reduce((s, t) => s + Number(t.valor), 0))
  const fixasAtivas         = computed(() => fixas.value.filter(f => f.status === 1).length)
  const ultimasMovimentacoes = computed(() => movimentacoes.value.slice(0, 8))

  async function loadAll(mes, ano) {
    loading.value = true
    error.value   = null
    try {
      const [cRes, mRes, fRes] = await Promise.all([
        api.get('/contas'),
        api.get('/movimentacoes', { params: { mes, ano } }),
        api.get('/fixas'),
      ])
      contas.value        = cRes.data
      movimentacoes.value = mRes.data
      fixas.value         = fRes.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Erro ao carregar dados'
    } finally {
      loading.value = false
    }
  }

  return { contas, movimentacoes, fixas, loading, error, saldoTotal, receitasMes, despesasMes, fixasAtivas, ultimasMovimentacoes, loadAll }
})
