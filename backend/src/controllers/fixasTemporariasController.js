import { Op } from 'sequelize';
import { FixaTemporaria, FixaTemporariaPagamento, Conta } from '../models/index.js';
import { registrarPagamento, reverterPagamento } from '../helpers/pagamento.js';

const CONTA_ATTRS = ['id', 'descricao'];

function contaInclude(userId) {
  return {
    model: Conta,
    as: 'conta',
    where: { usuarios_id: userId },
    attributes: CONTA_ATTRS,
  };
}

function pagamentoInclude(mes, ano) {
  return {
    model: FixaTemporariaPagamento,
    as: 'pagamentos',
    where: { mes, ano },
    required: false,
  };
}

function flatten(list) {
  return list.map(f => {
    const p = f.toJSON();
    p.pagamento = p.pagamentos?.[0] ?? null;
    delete p.pagamentos;
    return p;
  });
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function index(req, res) {
  try {
    const { mes, ano } = req.query;

    const where = { status: 1 };

    // Filter to only fixas that overlap the requested month
    if (mes && ano) {
      const m   = parseInt(mes);
      const y   = parseInt(ano);
      const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay  = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
      where.inicio = { [Op.lte]: lastDay };
      where.fim    = { [Op.gte]: firstDay };
    }

    const include = [contaInclude(req.userId)];
    if (mes && ano) include.push(pagamentoInclude(parseInt(mes), parseInt(ano)));

    const fixas = await FixaTemporaria.findAll({
      where,
      include,
      order: [['descricao', 'ASC']],
    });

    return res.json(flatten(fixas));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function show(req, res) {
  try {
    const fixa = await FixaTemporaria.findOne({
      where: { id: req.params.id },
      include: [contaInclude(req.userId)],
    });
    if (!fixa) return res.status(404).json({ error: 'Despesa fixa temporária não encontrada' });
    return res.json(fixa);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function store(req, res) {
  try {
    const { descricao, inicio, fim, valor, tipo, contas_id } = req.body;

    if (!descricao || !inicio || !fim || valor === undefined || !tipo || !contas_id) {
      return res.status(400).json({
        error: 'Campos obrigatórios: descricao, inicio, fim, valor, tipo, contas_id',
      });
    }

    if (inicio > fim) {
      return res.status(400).json({ error: 'A data de início deve ser anterior ao fim' });
    }

    const conta = await Conta.findOne({ where: { id: contas_id, usuarios_id: req.userId, status: 1 } });
    if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });

    const fixa = await FixaTemporaria.create({ descricao, inicio, fim, valor, tipo, contas_id });
    await fixa.reload({ include: [{ model: Conta, as: 'conta', attributes: CONTA_ATTRS }] });

    const plain = fixa.toJSON();
    plain.pagamento = null;
    return res.status(201).json(plain);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function update(req, res) {
  try {
    const fixa = await FixaTemporaria.findOne({
      where: { id: req.params.id },
      include: [contaInclude(req.userId)],
    });
    if (!fixa) return res.status(404).json({ error: 'Despesa fixa temporária não encontrada' });

    const { descricao, inicio, fim, valor, tipo, contas_id, status } = req.body;
    const fields = {};
    if (descricao !== undefined) fields.descricao = descricao;
    if (inicio    !== undefined) fields.inicio    = inicio;
    if (fim       !== undefined) fields.fim       = fim;
    if (valor     !== undefined) fields.valor     = valor;
    if (tipo      !== undefined) fields.tipo      = tipo;
    if (contas_id !== undefined) fields.contas_id = contas_id;
    if (status    !== undefined) fields.status    = status;

    if (!Object.keys(fields).length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    const novoInicio = fields.inicio || fixa.inicio;
    const novoFim    = fields.fim    || fixa.fim;
    if (novoInicio > novoFim) {
      return res.status(400).json({ error: 'A data de início deve ser anterior ao fim' });
    }

    await fixa.update(fields);
    await fixa.reload({ include: [{ model: Conta, as: 'conta', attributes: CONTA_ATTRS }] });

    const plain = fixa.toJSON();
    plain.pagamento = null;
    return res.json(plain);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function destroy(req, res) {
  try {
    const fixa = await FixaTemporaria.findOne({
      where: { id: req.params.id },
      include: [contaInclude(req.userId)],
    });
    if (!fixa) return res.status(404).json({ error: 'Despesa fixa temporária não encontrada' });

    await fixa.update({ status: 0 });
    return res.json({ message: 'Despesa fixa temporária encerrada com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// ── Pagamento mensal ──────────────────────────────────────────────────────────

export async function pagar(req, res) {
  try {
    const { mes, ano, valor_pago, contas_id } = req.body;
    if (!mes || !ano) return res.status(400).json({ error: 'Campos obrigatórios: mes, ano' });

    const fixa = await FixaTemporaria.findOne({
      where: { id: req.params.id, status: 1 },
      include: [contaInclude(req.userId)],
    });
    if (!fixa) return res.status(404).json({ error: 'Despesa fixa temporária não encontrada' });

    const valorFinal = valor_pago !== undefined ? parseFloat(valor_pago) : parseFloat(fixa.valor);
    if (isNaN(valorFinal) || valorFinal <= 0) return res.status(400).json({ error: 'Valor inválido' });

    const pagamento = await registrarPagamento({
      PagamentoModel: FixaTemporariaPagamento,
      fkField:        'fixas_temporarias_id',
      fkValue:        fixa.id,
      mes:            parseInt(mes),
      ano:            parseInt(ano),
      valorPago:      valorFinal,
      contaId:        contas_id || fixa.contas_id,
      userId:         req.userId,
      tipo:           'pagamento_divida',
      descricao:      fixa.descricao,
    });

    return res.status(201).json(pagamento);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function despagar(req, res) {
  try {
    const { mes, ano } = req.query;
    if (!mes || !ano) return res.status(400).json({ error: 'Parâmetros obrigatórios: mes, ano' });

    const fixa = await FixaTemporaria.findOne({
      where: { id: req.params.id },
      include: [contaInclude(req.userId)],
    });
    if (!fixa) return res.status(404).json({ error: 'Despesa fixa temporária não encontrada' });

    await reverterPagamento({
      PagamentoModel: FixaTemporariaPagamento,
      fkField: 'fixas_temporarias_id',
      fkValue: fixa.id,
      mes:     parseInt(mes),
      ano:     parseInt(ano),
    });

    return res.json({ message: 'Pagamento revertido com sucesso' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
