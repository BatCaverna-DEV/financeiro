import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Fixa extends Model {}

Fixa.init(
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
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    inicio: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    fim: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    valor: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('valor');
        return val !== null ? parseFloat(val) : null;
      },
    },
    tipo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '1=valor fixo, 2=valor variavel',
    },
    contas_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Fixa',
    tableName: 'fixas',
  }
);

export default Fixa;
