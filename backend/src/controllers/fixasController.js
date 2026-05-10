import { Fixa, Conta } from '../models/index.js';

export async function index(req, res) {
  try {
    const { contas_id, tipo, status } = req.query;

    const fixaWhere = {};
    if (contas_id)         fixaWhere.contas_id = contas_id;
    if (tipo)              fixaWhere.tipo      = tipo;
    if (status !== undefined) fixaWhere.status = status;

    const fixas = await Fixa.findAll({
      where: fixaWhere,
      include: [{
        model: Conta,
        as: 'conta',
        where: { usuarios_id: req.userId },
        attributes: ['descricao'],
      }],
      order: [['descricao', 'ASC']],
    });
    return res.json(fixas);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function show(req, res) {
  try {
    const fixa = await Fixa.findOne({
      where: { id: req.params.id },
      include: [{
        model: Conta,
        as: 'conta',
        where: { usuarios_id: req.userId },
        attributes: ['descricao'],
      }],
    });
    if (!fixa) {
      return res.status(404).json({ error: 'Despesa fixa não encontrada' });
    }
    return res.json(fixa);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function store(req, res) {
  try {
    const { descricao, inicio, fim, valor, tipo, contas_id } = req.body;

    if (!descricao || valor === undefined || !tipo || !contas_id) {
      return res.status(400).json({
        error: 'Campos obrigatórios: descricao, valor, tipo, contas_id',
      });
    }

    const conta = await Conta.findOne({
      where: { id: contas_id, usuarios_id: req.userId, status: 1 },
    });
    if (!conta) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    const fixa = await Fixa.create({
      descricao,
      inicio: inicio || null,
      fim: fim || null,
      valor,
      tipo,
      contas_id,
    });

    await fixa.reload({ include: [{ model: Conta, as: 'conta', attributes: ['descricao'] }] });
    return res.status(201).json(fixa);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function update(req, res) {
  try {
    const fixa = await Fixa.findOne({
      where: { id: req.params.id },
      include: [{ model: Conta, as: 'conta', where: { usuarios_id: req.userId } }],
    });
    if (!fixa) {
      return res.status(404).json({ error: 'Despesa fixa não encontrada' });
    }

    const { descricao, inicio, fim, valor, tipo, contas_id, status } = req.body;
    const fields = {};

    if (descricao  !== undefined) fields.descricao  = descricao;
    if (inicio     !== undefined) fields.inicio     = inicio || null;
    if (fim        !== undefined) fields.fim        = fim || null;
    if (valor      !== undefined) fields.valor      = valor;
    if (tipo       !== undefined) fields.tipo       = tipo;
    if (contas_id  !== undefined) fields.contas_id  = contas_id;
    if (status     !== undefined) fields.status     = status;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    await fixa.update(fields);
    await fixa.reload({ include: [{ model: Conta, as: 'conta', attributes: ['descricao'] }] });
    return res.json(fixa);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function destroy(req, res) {
  try {
    const fixa = await Fixa.findOne({
      where: { id: req.params.id },
      include: [{ model: Conta, as: 'conta', where: { usuarios_id: req.userId } }],
    });
    if (!fixa) {
      return res.status(404).json({ error: 'Despesa fixa não encontrada' });
    }

    await fixa.update({ status: 0 });
    return res.json({ message: 'Despesa fixa removida com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
