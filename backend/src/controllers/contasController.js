import sequelize from '../config/database.js';
import { Conta, Transacao } from '../models/index.js';

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

export async function store(req, res) {
  try {
    const { descricao, icone = 'bi-wallet2', saldo = 0 } = req.body;

    if (!descricao) {
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }

    const conta = await Conta.create({ descricao, icone, saldo, usuarios_id: req.userId });
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

    const { descricao, icone, status } = req.body;
    const fields = {};

    if (descricao !== undefined) fields.descricao = descricao;
    if (icone     !== undefined) fields.icone     = icone;
    if (status    !== undefined) fields.status    = status;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

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

      await Transacao.create({
        tipo: 1,
        descricao,
        data: new Date().toISOString().split('T')[0],
        valor: parseFloat(valor),
        contas_id: conta.id,
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
