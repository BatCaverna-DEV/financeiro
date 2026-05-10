import Usuario from './Usuario.js';
import Conta from './Conta.js';
import Categoria from './Categoria.js';
import Fixa from './Fixa.js';
import FixaPagamento from './FixaPagamento.js';
import FixaTemporaria from './FixaTemporaria.js';
import FixaTemporariaPagamento from './FixaTemporariaPagamento.js';
import Movimentacao from './Movimentacao.js';
import Transacao from './Transacao.js';

// Usuario <-> Conta
Usuario.hasMany(Conta,   { foreignKey: 'usuarios_id', as: 'contas' });
Conta.belongsTo(Usuario, { foreignKey: 'usuarios_id', as: 'usuario' });

// Conta <-> Fixa (permanente)
Conta.hasMany(Fixa,  { foreignKey: 'contas_id', as: 'fixas' });
Fixa.belongsTo(Conta, { foreignKey: 'contas_id', as: 'conta' });

// Fixa <-> FixaPagamento
Fixa.hasMany(FixaPagamento,    { foreignKey: 'fixas_id', as: 'pagamentos' });
FixaPagamento.belongsTo(Fixa,  { foreignKey: 'fixas_id', as: 'fixa' });

// Conta <-> FixaTemporaria
Conta.hasMany(FixaTemporaria,   { foreignKey: 'contas_id', as: 'fixasTemporarias' });
FixaTemporaria.belongsTo(Conta, { foreignKey: 'contas_id', as: 'conta' });

// FixaTemporaria <-> FixaTemporariaPagamento
FixaTemporaria.hasMany(FixaTemporariaPagamento,        { foreignKey: 'fixas_temporarias_id', as: 'pagamentos' });
FixaTemporariaPagamento.belongsTo(FixaTemporaria,       { foreignKey: 'fixas_temporarias_id', as: 'fixaTemporaria' });

// Conta <-> Movimentacao
Conta.hasMany(Movimentacao,    { foreignKey: 'contas_id', as: 'movimentacoes' });
Movimentacao.belongsTo(Conta,  { foreignKey: 'contas_id', as: 'conta' });

// Categoria <-> Movimentacao
Categoria.hasMany(Movimentacao,    { foreignKey: 'categoria_id', as: 'movimentacoes' });
Movimentacao.belongsTo(Categoria,  { foreignKey: 'categoria_id', as: 'categoria' });

// Conta <-> Transacao (log)
Conta.hasMany(Transacao,        { foreignKey: 'contas_id',        as: 'transacoes' });
Transacao.belongsTo(Conta,      { foreignKey: 'contas_id',        as: 'conta' });
Conta.hasMany(Transacao,        { foreignKey: 'conta_destino_id', as: 'transacoesDestino' });
Transacao.belongsTo(Conta,      { foreignKey: 'conta_destino_id', as: 'contaDestino' });

export { Usuario, Conta, Categoria, Fixa, FixaPagamento, FixaTemporaria, FixaTemporariaPagamento, Movimentacao, Transacao };
