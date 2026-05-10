import { Op } from 'sequelize';
import { Transacao, Conta } from '../models/index.js';

const CONTA_ATTRS = ['id', 'descricao'];

export async function index(req, res) {
  try {
    const { mes, ano, tipo, contas_id } = req.query;

    const where = { usuarios_id: req.userId };
    if (tipo)      where.tipo      = tipo;
    if (contas_id) where.contas_id = contas_id;

    if (mes && ano) {
      const y = parseInt(ano);
      const m = parseInt(mes);
      const start = new Date(y, m - 1, 1);
      const end   = new Date(y, m, 0, 23, 59, 59, 999);
      where.createdAt = { [Op.between]: [start, end] };
    } else if (ano) {
      where.createdAt = {
        [Op.between]: [new Date(parseInt(ano), 0, 1), new Date(parseInt(ano), 11, 31, 23, 59, 59)],
      };
    }

    const transacoes = await Transacao.findAll({
      where,
      include: [
        { model: Conta, as: 'conta',        attributes: CONTA_ATTRS, required: false },
        { model: Conta, as: 'contaDestino', attributes: CONTA_ATTRS, required: false },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json(transacoes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
