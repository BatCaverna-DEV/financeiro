import Usuario from './Usuario.js';
import Conta from './Conta.js';
import Categoria from './Categoria.js';
import Fixa from './Fixa.js';
import Transacao from './Transacao.js';

// Usuario <-> Conta
Usuario.hasMany(Conta,  { foreignKey: 'usuarios_id', as: 'contas' });
Conta.belongsTo(Usuario, { foreignKey: 'usuarios_id', as: 'usuario' });

// Conta <-> Fixa
Conta.hasMany(Fixa,  { foreignKey: 'contas_id', as: 'fixas' });
Fixa.belongsTo(Conta, { foreignKey: 'contas_id', as: 'conta' });

// Conta <-> Transacao
Conta.hasMany(Transacao,  { foreignKey: 'contas_id', as: 'transacoes' });
Transacao.belongsTo(Conta, { foreignKey: 'contas_id', as: 'conta' });

// Categoria <-> Transacao
Categoria.hasMany(Transacao,  { foreignKey: 'categoria_id', as: 'transacoes' });
Transacao.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });

export { Usuario, Conta, Categoria, Fixa, Transacao };
