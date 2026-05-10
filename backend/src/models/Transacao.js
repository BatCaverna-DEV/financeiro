import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Transacao extends Model {}

Transacao.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tipo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '1=receita, 2=despesa',
    },
    descricao: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    valor: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('valor');
        return val !== null ? parseFloat(val) : null;
      },
    },
    contas_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    categoria_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Transacao',
    tableName: 'transacoes',
  }
);

export default Transacao;
