import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Categoria extends Model {}

Categoria.init(
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
      defaultValue: 'bi-tag',
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: 'Categoria',
    tableName: 'categoria',
  }
);

export default Categoria;
