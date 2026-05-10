import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Conta extends Model {}

Conta.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    descricao: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    icone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'bi-wallet2',
    },
    saldo: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      defaultValue: 0.0,
      get() {
        const val = this.getDataValue('saldo');
        return val !== null ? parseFloat(val) : null;
      },
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    usuarios_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Conta',
    tableName: 'contas',
  }
);

export default Conta;
