import { Op } from 'sequelize';
import { Fixa, FixaPagamento, FixaTemporaria, FixaTemporariaPagamento, Conta, Usuario } from '../models/index.js';

const CONTA_ATTRS = ['id', 'descricao'];

export async function visaoGeral(req, res) {
  try {
    const mes = parseInt(req.query.mes) || new Date().getMonth() + 1;
    const ano = parseInt(req.query.ano) || new Date().getFullYear();

    const firstDay = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const lastDay  = `${ano}-${String(mes).padStart(2, '0')}-${new Date(ano, mes, 0).getDate()}`;

    // ── Despesas Fixas ───────────────────────────────────────────────────────
    const fixasRaw = await Fixa.findAll({
      where: { status: 1 },
      include: [
        { model: Conta,        as: 'conta',      where: { usuarios_id: req.userId }, attributes: CONTA_ATTRS },
        { model: FixaPagamento, as: 'pagamentos', where: { mes, ano }, required: false },
      ],
      order: [['descricao', 'ASC']],
    });

    const fixas = fixasRaw.map(f => {
      const json = f.toJSON();
      json.pagamento = json.pagamentos?.[0] ?? null;
      delete json.pagamentos;
      return json;
    });

    const fixasTotal    = fixas.reduce((s, f) => s + parseFloat(f.valor), 0);
    const fixasPago     = fixas.filter(f =>  f.pagamento).reduce((s, f) => s + parseFloat(f.pagamento.valor_pago), 0);
    const fixasPendente = fixas.filter(f => !f.pagamento).reduce((s, f) => s + parseFloat(f.valor), 0);

    // ── Dívidas ──────────────────────────────────────────────────────────────
    const dividasRaw = await FixaTemporaria.findAll({
      where: {
        status: 1,
        inicio: { [Op.lte]: lastDay },
        fim:    { [Op.gte]: firstDay },
      },
      include: [
        { model: Conta,                   as: 'conta',      where: { usuarios_id: req.userId }, attributes: CONTA_ATTRS },
        { model: FixaTemporariaPagamento, as: 'pagamentos', where: { mes, ano }, required: false },
      ],
      order: [['descricao', 'ASC']],
    });

    const dividas = dividasRaw.map(d => {
      const json = d.toJSON();
      json.pagamento = json.pagamentos?.[0] ?? null;
      delete json.pagamentos;
      return json;
    });

    const dividasTotal    = dividas.reduce((s, d) => s + parseFloat(d.valor), 0);
    const dividasPago     = dividas.filter(d =>  d.pagamento).reduce((s, d) => s + parseFloat(d.pagamento.valor_pago), 0);
    const dividasPendente = dividas.filter(d => !d.pagamento).reduce((s, d) => s + parseFloat(d.valor), 0);

    // ── Saldo atual das contas ───────────────────────────────────────────────
    const contas = await Conta.findAll({
      where: { usuarios_id: req.userId, status: 1 },
      attributes: ['id', 'descricao', 'saldo', 'principal'],
    });

    const contasPrincipais = contas.filter(c => c.principal);
    const saldoAtual = (contasPrincipais.length > 0 ? contasPrincipais : contas)
      .reduce((s, c) => s + parseFloat(c.saldo), 0);
    const totalPendente = fixasPendente + dividasPendente;

    return res.json({
      mes,
      ano,
      fixas:   { items: fixas,   total: fixasTotal,   pago: fixasPago,   pendente: fixasPendente },
      dividas: { items: dividas, total: dividasTotal, pago: dividasPago, pendente: dividasPendente },
      resumo: {
        total:    fixasTotal    + dividasTotal,
        pago:     fixasPago     + dividasPago,
        pendente: totalPendente,
      },
      previsao: {
        saldoAtual,
        saldoAposPagamentos: saldoAtual - totalPendente,
        contas: (contasPrincipais.length > 0 ? contasPrincipais : contas).map(c => ({
          descricao: c.descricao,
          saldo:     parseFloat(c.saldo),
        })),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
