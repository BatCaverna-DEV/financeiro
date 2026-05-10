import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Transacao extends Model {}

Transacao.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tipo: {
    type: DataTypes.ENUM(
      'receita', 'despesa',
      'transferencia',
      'pagamento_fixa', 'pagamento_divida'
    ),
    allowNull: false,
  },
  descricao:        { type: DataTypes.STRING(255), allowNull: false },
  valor:            { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  contas_id:        { type: DataTypes.UUID, allowNull: false },
  conta_destino_id: { type: DataTypes.UUID, allowNull: true },
  referencia_id:    { type: DataTypes.UUID, allowNull: true },
  referencia_tipo:  { type: DataTypes.STRING(50), allowNull: true },
  usuarios_id:      { type: DataTypes.UUID, allowNull: false },
}, {
  sequelize,
  modelName: 'Transacao',
  tableName: 'transacoes',
  timestamps: true,
  updatedAt: false,
});

export default Transacao;
