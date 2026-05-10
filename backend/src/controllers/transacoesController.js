import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { Transacao, Conta, Categoria } from '../models/index.js';

const INCLUDE_DETAILS = [
  { model: Conta,     as: 'conta',     attributes: ['descricao'] },
  { model: Categoria, as: 'categoria', attributes: ['descricao'], required: false },
];

export async function index(req, res) {
  try {
    const { mes, ano, contas_id, tipo } = req.query;

    const where = {};
    if (contas_id) where.contas_id = contas_id;
    if (tipo)      where.tipo      = tipo;

    if (mes && ano) {
      const y = parseInt(ano);
      const m = parseInt(mes);
      const start = `${y}-${String(m).padStart(2, '0')}-01`;
      const end   = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
      where.data  = { [Op.between]: [start, end] };
    } else if (ano) {
      where.data = { [Op.between]: [`${ano}-01-01`, `${ano}-12-31`] };
    }

    const transacoes = await Transacao.findAll({
      where,
      include: [
        {
          model: Conta,
          as: 'conta',
          where: { usuarios_id: req.userId },
          attributes: ['descricao'],
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['descricao'],
          required: false,
        },
      ],
      order: [['data', 'DESC'], ['createdAt', 'DESC']],
    });
    return res.json(transacoes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function show(req, res) {
  try {
    const transacao = await Transacao.findOne({
      where: { id: req.params.id },
      include: [
        { model: Conta,     as: 'conta',     where: { usuarios_id: req.userId }, attributes: ['descricao'] },
        { model: Categoria, as: 'categoria', attributes: ['descricao'], required: false },
      ],
    });
    if (!transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    return res.json(transacao);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function store(req, res) {
  try {
    const { tipo, descricao, data, valor, contas_id, categoria_id } = req.body;

    if (!tipo || !descricao || !data || valor === undefined || !contas_id) {
      return res.status(400).json({
        error: 'Campos obrigatórios: tipo, descricao, data, valor, contas_id',
      });
    }

    const conta = await Conta.findOne({
      where: { id: contas_id, usuarios_id: req.userId, status: 1 },
    });
    if (!conta) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    const t = await sequelize.transaction();
    try {
      const transacao = await Transacao.create(
        { tipo, descricao, data, valor, contas_id, categoria_id: categoria_id || null },
        { transaction: t }
      );

      const delta = parseInt(tipo) === 1 ? parseFloat(valor) : -parseFloat(valor);
      await Conta.increment({ saldo: delta }, { where: { id: contas_id }, transaction: t });

      await t.commit();

      await transacao.reload({ include: INCLUDE_DETAILS });
      return res.status(201).json(transacao);
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function update(req, res) {
  try {
    const transacao = await Transacao.findOne({
      where: { id: req.params.id },
      include: [{ model: Conta, as: 'conta', where: { usuarios_id: req.userId } }],
    });
    if (!transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const { tipo, descricao, data, valor, contas_id, categoria_id } = req.body;

    const oldTipo     = parseInt(transacao.tipo);
    const oldValor    = parseFloat(transacao.valor);
    const oldContasId = transacao.contas_id;

    const newTipo     = tipo      !== undefined ? parseInt(tipo)     : oldTipo;
    const newValor    = valor     !== undefined ? parseFloat(valor)  : oldValor;
    const newContasId = contas_id !== undefined ? contas_id          : oldContasId;

    const fields = {};
    if (tipo         !== undefined) fields.tipo         = tipo;
    if (descricao    !== undefined) fields.descricao    = descricao;
    if (data         !== undefined) fields.data         = data;
    if (valor        !== undefined) fields.valor        = valor;
    if (contas_id    !== undefined) fields.contas_id    = contas_id;
    if (categoria_id !== undefined) fields.categoria_id = categoria_id || null;

    const t = await sequelize.transaction();
    try {
      // Reverte o efeito anterior
      const oldDelta = oldTipo === 1 ? -oldValor : oldValor;
      await Conta.increment({ saldo: oldDelta }, { where: { id: oldContasId }, transaction: t });

      if (Object.keys(fields).length > 0) {
        await transacao.update(fields, { transaction: t });
      }

      // Aplica o novo efeito
      const newDelta = newTipo === 1 ? newValor : -newValor;
      await Conta.increment({ saldo: newDelta }, { where: { id: newContasId }, transaction: t });

      await t.commit();

      await transacao.reload({ include: INCLUDE_DETAILS });
      return res.json(transacao);
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function destroy(req, res) {
  try {
    const transacao = await Transacao.findOne({
      where: { id: req.params.id },
      include: [{ model: Conta, as: 'conta', where: { usuarios_id: req.userId } }],
    });
    if (!transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const delta = parseInt(transacao.tipo) === 1 ? -parseFloat(transacao.valor) : parseFloat(transacao.valor);

    const t = await sequelize.transaction();
    try {
      await transacao.destroy({ transaction: t });
      await Conta.increment({ saldo: delta }, { where: { id: transacao.contas_id }, transaction: t });
      await t.commit();
      return res.json({ message: 'Transação removida com sucesso' });
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
