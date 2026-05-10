import sequelize from '../config/database.js';
import { Conta, Transacao } from '../models/index.js';

export async function registrarPagamento({
  PagamentoModel, fkField, fkValue,
  mes, ano, valorPago, contaId, userId,
  tipo, descricao,
}) {
  const conta = await Conta.findOne({
    where: { id: contaId, usuarios_id: userId, status: 1 },
  });
  if (!conta) {
    const err = new Error('Conta não encontrada');
    err.status = 404;
    throw err;
  }

  const existing = await PagamentoModel.findOne({
    where: { [fkField]: fkValue, mes, ano },
  });
  if (existing) {
    const err = new Error('Já existe pagamento registrado para este mês');
    err.status = 409;
    throw err;
  }

  const t = await sequelize.transaction();
  try {
    await Conta.increment({ saldo: -valorPago }, { where: { id: contaId }, transaction: t });

    const pagamento = await PagamentoModel.create(
      { [fkField]: fkValue, mes, ano, valor_pago: valorPago, contas_id: contaId },
      { transaction: t }
    );

    await Transacao.create({
      tipo,
      descricao,
      valor:           valorPago,
      contas_id:       contaId,
      referencia_id:   pagamento.id,
      referencia_tipo: tipo === 'pagamento_fixa' ? 'fixa_pagamento' : 'divida_pagamento',
      usuarios_id:     userId,
    }, { transaction: t });

    await t.commit();
    return pagamento;
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

export async function reverterPagamento({ PagamentoModel, fkField, fkValue, mes, ano }) {
  const pagamento = await PagamentoModel.findOne({
    where: { [fkField]: fkValue, mes, ano },
  });
  if (!pagamento) {
    const err = new Error('Pagamento não encontrado para este mês');
    err.status = 404;
    throw err;
  }

  const t = await sequelize.transaction();
  try {
    await Conta.increment(
      { saldo: pagamento.valor_pago },
      { where: { id: pagamento.contas_id }, transaction: t }
    );

    await Transacao.destroy({
      where: { referencia_id: pagamento.id },
      transaction: t,
    });

    await pagamento.destroy({ transaction: t });
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
}
