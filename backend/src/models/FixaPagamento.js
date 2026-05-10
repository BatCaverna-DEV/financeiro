import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class FixaPagamento extends Model {}

FixaPagamento.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fixas_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    mes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ano: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valor_pago: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('valor_pago');
        return val !== null ? parseFloat(val) : null;
      },
    },
    contas_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'FixaPagamento',
    tableName: 'fixas_pagamentos',
    indexes: [
      { unique: true, fields: ['fixas_id', 'mes', 'ano'] },
    ],
  }
);

export default FixaPagamento;
