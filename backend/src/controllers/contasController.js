import sequelize from '../config/database.js';
import { Conta, Movimentacao, Transacao } from '../models/index.js';

export async function index(req, res) {
  try {
    const contas = await Conta.findAll({
      where: { usuarios_id: req.userId, status: 1 },
      order: [['descricao', 'ASC']],
    });
    return res.json(contas);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function show(req, res) {
  try {
    const conta = await Conta.findOne({
      where: { id: req.params.id, usuarios_id: req.userId },
    });
    if (!conta) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }
    return res.json(conta);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function demotePrincipal(userId, excludeId = null) {
  const where = { usuarios_id: userId, principal: true };
  if (excludeId) where.id = { [require('sequelize').Op.ne]: excludeId };
  await Conta.update({ principal: false }, { where });
}

export async function store(req, res) {
  try {
    const { descricao, icone = 'bi-wallet2', saldo = 0, principal = false } = req.body;

    if (!descricao) {
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }

    if (principal) await demotePrincipal(req.userId);

    const conta = await Conta.create({ descricao, icone, saldo, principal: !!principal, usuarios_id: req.userId });
    return res.status(201).json(conta);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function update(req, res) {
  try {
    const conta = await Conta.findOne({
      where: { id: req.params.id, usuarios_id: req.userId },
    });
    if (!conta) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    const { descricao, icone, status, principal } = req.body;
    const fields = {};

    if (descricao  !== undefined) fields.descricao  = descricao;
    if (icone      !== undefined) fields.icone      = icone;
    if (status     !== undefined) fields.status     = status;
    if (principal  !== undefined) fields.principal  = !!principal;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    if (fields.principal) await demotePrincipal(req.userId, conta.id);

    await conta.update(fields);
    return res.json(conta);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function destroy(req, res) {
  try {
    const conta = await Conta.findOne({
      where: { id: req.params.id, usuarios_id: req.userId },
    });
    if (!conta) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    await conta.update({ status: 0 });
    return res.json({ message: 'Conta removida com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function transferir(req, res) {
  try {
    const { conta_origem_id, conta_destino_id, valor, descricao = 'Transferência' } = req.body;

    if (!conta_origem_id || !conta_destino_id || !valor) {
      return res.status(400).json({ error: 'Campos obrigatórios: conta_origem_id, conta_destino_id, valor' });
    }
    if (conta_origem_id === conta_destino_id) {
      return res.status(400).json({ error: 'As contas de origem e destino devem ser diferentes' });
    }
    if (parseFloat(valor) <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    const [origem, destino] = await Promise.all([
      Conta.findOne({ where: { id: conta_origem_id, usuarios_id: req.userId, status: 1 } }),
      Conta.findOne({ where: { id: conta_destino_id, usuarios_id: req.userId, status: 1 } }),
    ]);

    if (!origem)  return res.status(404).json({ error: 'Conta de origem não encontrada' });
    if (!destino) return res.status(404).json({ error: 'Conta de destino não encontrada' });

    const valorNum = parseFloat(valor);
    const hoje = new Date().toISOString().split('T')[0];

    const t = await sequelize.transaction();
    try {
      await Conta.increment({ saldo: -valorNum }, { where: { id: origem.id },  transaction: t });
      await Conta.increment({ saldo:  valorNum }, { where: { id: destino.id }, transaction: t });

      await Transacao.create({
        tipo:             'transferencia',
        descricao,
        valor:            valorNum,
        contas_id:        origem.id,
        conta_destino_id: destino.id,
        referencia_tipo:  'transferencia',
        usuarios_id:      req.userId,
      }, { transaction: t });

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }

    await Promise.all([origem.reload(), destino.reload()]);
    return res.json({ origem, destino });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function depositar(req, res) {
  try {
    const { valor, descricao = 'Depósito de salário' } = req.body;

    if (!valor || parseFloat(valor) <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    const conta = await Conta.findOne({
      where: { id: req.params.id, usuarios_id: req.userId, status: 1 },
    });
    if (!conta) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    const t = await sequelize.transaction();
    try {
      await Conta.increment({ saldo: parseFloat(valor) }, {
        where: { id: conta.id },
        transaction: t,
      });

      const movimentacao = await Movimentacao.create({
        tipo: 1,
        descricao,
        data: new Date().toISOString().split('T')[0],
        valor: parseFloat(valor),
        contas_id: conta.id,
      }, { transaction: t });

      await Transacao.create({
        tipo:            'receita',
        descricao,
        valor:           parseFloat(valor),
        contas_id:       conta.id,
        referencia_id:   movimentacao.id,
        referencia_tipo: 'movimentacao',
        usuarios_id:     req.userId,
      }, { transaction: t });

      await t.commit();
      await conta.reload();
      return res.json(conta);
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
