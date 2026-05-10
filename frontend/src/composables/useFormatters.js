export function useFormatters() {
  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  function formatMonth(date) {
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  }

  return { formatCurrency, formatDate, formatMonth }
}
