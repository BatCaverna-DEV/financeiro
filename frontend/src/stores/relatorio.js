import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api.js'

export const useRelatorioStore = defineStore('relatorio', () => {
  const movimentacoes  = ref([])
  const fixas          = ref([])   // despesas fixas permanentes do mês
  const fixasTemp      = ref([])   // dívidas (fixas temporárias) do mês
  const transferencias = ref([])   // transferências entre contas do mês
  const contas         = ref([])
  const historico      = ref([])   // últimos 6 meses [{mes, ano, receitas, despesas}]
  const loading        = ref(false)
  const loadingHist    = ref(false)
  const error          = ref(null)

  // ── Receitas (só movimentações tipo 1) ────────────────────────────────────
  const receitas    = computed(() => movimentacoes.value.filter(m => m.tipo === 1))
  const movDespesas = computed(() => movimentacoes.value.filter(m => m.tipo === 2))

  // ── Fixas e dívidas normalizadas como despesas ────────────────────────────
  const fixasNorm = computed(() =>
    fixas.value.map(f => ({
      ...f,
      _source: 'fixa',
      categoria: { descricao: 'Despesas Fixas' },
    }))
  )
  const fixasTempNorm = computed(() =>
    fixasTemp.value.map(f => ({
      ...f,
      _source: 'divida',
      categoria: { descricao: 'Dívidas' },
    }))
  )

  // ── Transferências normalizadas ───────────────────────────────────────────
  const transferenciasNorm = computed(() =>
    transferencias.value.map(t => ({
      ...t,
      _source: 'transferencia',
      // data vem de createdAt; garante string yyyy-mm-dd para o formatter
      data: t.createdAt ? t.createdAt.split('T')[0] : null,
      categoria: { descricao: 'Transferência' },
    }))
  )

  // ── Todas as despesas: movimentações + fixas + dívidas ────────────────────
  const despesas = computed(() => [
    ...movDespesas.value,
    ...fixasNorm.value,
    ...fixasTempNorm.value,
  ])

  // ── Todos os itens para a tabela ──────────────────────────────────────────
  const todosItens = computed(() => [
    ...movimentacoes.value,
    ...fixasNorm.value,
    ...fixasTempNorm.value,
    ...transferenciasNorm.value,
  ])

  // ── Totais ────────────────────────────────────────────────────────────────
  const totalReceitas      = computed(() => receitas.value.reduce((s, m) => s + Number(m.valor), 0))
  const totalDespesas      = computed(() => despesas.value.reduce((s, m) => s + Number(m.valor), 0))
  const totalTransferencias = computed(() => transferencias.value.reduce((s, t) => s + Number(t.valor), 0))
  const balanco            = computed(() => totalReceitas.value - totalDespesas.value)

  // ── Agrupamentos por categoria ────────────────────────────────────────────
  const despesasPorCategoria = computed(() => {
    const map = {}
    for (const m of despesas.value) {
      const label = m.categoria?.descricao ?? 'Sem categoria'
      map[label] = (map[label] ?? 0) + Number(m.valor)
    }
    for (const t of transferencias.value) {
      map['Transferências'] = (map['Transferências'] ?? 0) + Number(t.valor)
    }
    return map
  })

  const receitasPorCategoria = computed(() => {
    const map = {}
    for (const m of receitas.value) {
      const label = m.categoria?.descricao ?? 'Sem categoria'
      map[label] = (map[label] ?? 0) + Number(m.valor)
    }
    return map
  })

  // ── Ações ─────────────────────────────────────────────────────────────────
  async function loadContas() {
    const res = await api.get('/contas')
    contas.value = res.data
  }

  async function loadMes(mes, ano, contaId) {
    loading.value = true
    error.value   = null
    try {
      const movParams = { mes, ano }
      if (contaId) movParams.contas_id = contaId

      const [mRes, fRes, ftRes, tRes] = await Promise.all([
        api.get('/movimentacoes', { params: movParams }),
        api.get('/fixas', { params: { mes, ano } }),
        api.get('/fixas-temporarias', { params: { mes, ano } }),
        api.get('/transacoes', { params: { mes, ano, tipo: 'transferencia' } }),
      ])

      movimentacoes.value = mRes.data

      // Fixas e dívidas: API não filtra por conta, fazemos client-side
      fixas.value     = contaId ? fRes.data.filter(f => f.contas_id === contaId) : fRes.data
      fixasTemp.value = contaId ? ftRes.data.filter(f => f.contas_id === contaId) : ftRes.data

      // Transferências: filtra se origem OU destino for a conta selecionada
      transferencias.value = contaId
        ? tRes.data.filter(t => t.contas_id === contaId || t.conta_destino_id === contaId)
        : tRes.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Erro ao carregar dados'
    } finally {
      loading.value = false
    }
  }

  async function loadHistorico(mesAtual, anoAtual, contaId) {
    loadingHist.value = true
    const meses = []
    let m = mesAtual
    let a = anoAtual
    for (let i = 0; i < 6; i++) {
      meses.unshift({ mes: m, ano: a })
      m--
      if (m === 0) { m = 12; a-- }
    }

    try {
      const resultados = await Promise.all(
        meses.map(({ mes, ano }) => {
          const movParams = { mes, ano }
          if (contaId) movParams.contas_id = contaId

          return Promise.all([
            api.get('/movimentacoes', { params: movParams }),
            api.get('/fixas', { params: { mes, ano } }),
            api.get('/fixas-temporarias', { params: { mes, ano } }),
          ]).then(([mRes, fRes, ftRes]) => {
            const movs = mRes.data
            const fs   = contaId ? fRes.data.filter(f => f.contas_id === contaId) : fRes.data
            const fts  = contaId ? ftRes.data.filter(f => f.contas_id === contaId) : ftRes.data

            const rec  = movs.filter(x => x.tipo === 1).reduce((s, x) => s + Number(x.valor), 0)
            const desp = movs.filter(x => x.tipo === 2).reduce((s, x) => s + Number(x.valor), 0)
                       + fs.reduce((s, x) => s + Number(x.valor), 0)
                       + fts.reduce((s, x) => s + Number(x.valor), 0)

            return { mes, ano, receitas: rec, despesas: desp }
          })
        })
      )
      historico.value = resultados
    } catch {
      // histórico é opcional, não bloqueia
    } finally {
      loadingHist.value = false
    }
  }

  return {
    movimentacoes, fixas, fixasTemp, transferencias, contas, historico,
    loading, loadingHist, error,
    receitas, despesas, todosItens,
    totalReceitas, totalDespesas, totalTransferencias, balanco,
    despesasPorCategoria, receitasPorCategoria,
    loadContas, loadMes, loadHistorico,
  }
})
