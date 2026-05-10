import { Categoria } from '../models/index.js';

export async function index(_req, res) {
  try {
    const categorias = await Categoria.findAll({
      where: { status: 1 },
      order: [['descricao', 'ASC']],
    });
    return res.json(categorias);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function show(req, res) {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    return res.json(categoria);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function store(req, res) {
  try {
    const { descricao, icone = 'bi-tag' } = req.body;
    if (!descricao) {
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }

    const categoria = await Categoria.create({ descricao, icone });
    return res.status(201).json(categoria);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function update(req, res) {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    const { descricao, icone, status } = req.body;
    const fields = {};

    if (descricao !== undefined) fields.descricao = descricao;
    if (icone     !== undefined) fields.icone     = icone;
    if (status    !== undefined) fields.status    = status;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    await categoria.update(fields);
    return res.json(categoria);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function destroy(req, res) {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    await categoria.update({ status: 0 });
    return res.json({ message: 'Categoria removida com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
