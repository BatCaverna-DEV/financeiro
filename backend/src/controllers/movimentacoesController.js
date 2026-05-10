import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { Movimentacao, Conta, Categoria, Transacao } from '../models/index.js';

const INCLUDE_DETAILS = [
  { model: Conta,     as: 'conta',     attributes: ['descricao'] },
  { model: Categoria, as: 'categoria', attributes: ['descricao', 'icone'], required: false },
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

    const movimentacoes = await Movimentacao.findAll({
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
          attributes: ['descricao', 'icone'],
          required: false,
        },
      ],
      order: [['data', 'DESC'], ['createdAt', 'DESC']],
    });
    return res.json(movimentacoes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function show(req, res) {
  try {
    const movimentacao = await Movimentacao.findOne({
      where: { id: req.params.id },
      include: [
        { model: Conta,     as: 'conta',     where: { usuarios_id: req.userId }, attributes: ['descricao'] },
        { model: Categoria, as: 'categoria', attributes: ['descricao', 'icone'], required: false },
      ],
    });
    if (!movimentacao) {
      return res.status(404).json({ error: 'Movimentação não encontrada' });
    }
    return res.json(movimentacao);
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
      const movimentacao = await Movimentacao.create(
        { tipo, descricao, data, valor, contas_id, categoria_id: categoria_id || null },
        { transaction: t }
      );

      const delta = parseInt(tipo) === 1 ? parseFloat(valor) : -parseFloat(valor);
      await Conta.increment({ saldo: delta }, { where: { id: contas_id }, transaction: t });

      await Transacao.create({
        tipo:            parseInt(tipo) === 1 ? 'receita' : 'despesa',
        descricao,
        valor:           parseFloat(valor),
        contas_id,
        referencia_id:   movimentacao.id,
        referencia_tipo: 'movimentacao',
        usuarios_id:     req.userId,
      }, { transaction: t });

      await t.commit();

      await movimentacao.reload({ include: INCLUDE_DETAILS });
      return res.status(201).json(movimentacao);
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
    const movimentacao = await Movimentacao.findOne({
      where: { id: req.params.id },
      include: [{ model: Conta, as: 'conta', where: { usuarios_id: req.userId } }],
    });
    if (!movimentacao) {
      return res.status(404).json({ error: 'Movimentação não encontrada' });
    }

    const { tipo, descricao, data, valor, contas_id, categoria_id } = req.body;

    const oldTipo     = parseInt(movimentacao.tipo);
    const oldValor    = parseFloat(movimentacao.valor);
    const oldContasId = movimentacao.contas_id;

    const newTipo     = tipo      !== undefined ? parseInt(tipo)    : oldTipo;
    const newValor    = valor     !== undefined ? parseFloat(valor) : oldValor;
    const newContasId = contas_id !== undefined ? contas_id         : oldContasId;

    const fields = {};
    if (tipo         !== undefined) fields.tipo         = tipo;
    if (descricao    !== undefined) fields.descricao    = descricao;
    if (data         !== undefined) fields.data         = data;
    if (valor        !== undefined) fields.valor        = valor;
    if (contas_id    !== undefined) fields.contas_id    = contas_id;
    if (categoria_id !== undefined) fields.categoria_id = categoria_id || null;

    const t = await sequelize.transaction();
    try {
      const oldDelta = oldTipo === 1 ? -oldValor : oldValor;
      await Conta.increment({ saldo: oldDelta }, { where: { id: oldContasId }, transaction: t });

      if (Object.keys(fields).length > 0) {
        await movimentacao.update(fields, { transaction: t });
      }

      const newDelta = newTipo === 1 ? newValor : -newValor;
      await Conta.increment({ saldo: newDelta }, { where: { id: newContasId }, transaction: t });

      await Transacao.update(
        {
          tipo:      newTipo === 1 ? 'receita' : 'despesa',
          descricao: movimentacao.descricao,
          valor:     newValor,
          contas_id: newContasId,
        },
        { where: { referencia_id: req.params.id, referencia_tipo: 'movimentacao' }, transaction: t }
      );

      await t.commit();

      await movimentacao.reload({ include: INCLUDE_DETAILS });
      return res.json(movimentacao);
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
    const movimentacao = await Movimentacao.findOne({
      where: { id: req.params.id },
      include: [{ model: Conta, as: 'conta', where: { usuarios_id: req.userId } }],
    });
    if (!movimentacao) {
      return res.status(404).json({ error: 'Movimentação não encontrada' });
    }

    const delta = parseInt(movimentacao.tipo) === 1 ? -parseFloat(movimentacao.valor) : parseFloat(movimentacao.valor);

    const t = await sequelize.transaction();
    try {
      await movimentacao.destroy({ transaction: t });
      await Conta.increment({ saldo: delta }, { where: { id: movimentacao.contas_id }, transaction: t });
      await Transacao.destroy({
        where: { referencia_id: movimentacao.id, referencia_tipo: 'movimentacao' },
        transaction: t,
      });
      await t.commit();
      return res.json({ message: 'Movimentação removida com sucesso' });
    } catch (e) {
      await t.rollback();
      throw e;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
