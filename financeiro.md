# Financeiro — Sistema de Gestão Financeira Pessoal

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js + Express 4, ES modules |
| ORM | Sequelize 6 + MySQL (mysql2) |
| Auth | JWT (7d) + bcryptjs |
| Frontend | Vue 3 + Vite 5 |
| Estado | Pinia |
| Roteamento | Vue Router 4 |
| UI | Bootstrap 5 + Bootstrap Icons |
| Gráficos | Chart.js + vue-chartjs |
| HTTP | Axios (interceptor JWT automático) |

## Estrutura de Diretórios

```
financeiro/
├── backend/
│   ├── index.js                  # entry point (porta 3000)
│   └── src/
│       ├── config/               # conexão Sequelize/MySQL
│       ├── controllers/          # lógica de rotas
│       ├── middleware/           # auth JWT → req.userId
│       ├── models/               # 9 modelos Sequelize
│       ├── routes/               # montados em /api
│       ├── helpers/              # registrarPagamento / reverterPagamento
│       └── scripts/              # createDatabase.js, seed.js
├── frontend/
│   └── src/
│       ├── views/                # páginas (Login, Dashboard, Contas, Movimentacoes, Fixas, Categorias, Relatorio)
│       ├── stores/               # Pinia: auth, contas, movimentacoes, fixas, fixasTemporarias, categorias, dashboard, relatorio
│       ├── components/           # modais (Conta, Movimentacao, Fixa, FixaTemporaria, Categoria, Depositar, Transferencia, Pagar, Confirm, IconPicker) + layout (AppLayout, Navbar, Sidebar)
│       ├── services/api.js       # Axios + interceptor 401
│       ├── composables/useFormatters.js
│       └── router/               # rotas protegidas, layout aninhado
├── der.png                       # diagrama ER
└── financeiro.md                 # este arquivo
```

## Modelos e Banco de Dados

| Modelo | Tabela | Descrição |
|--------|--------|-----------|
| Usuario | usuarios | id UUID, username único, password hash, status, categoria |
| Conta | contas | id UUID, descricao, icone, saldo Decimal(20,2), usuarios_id |
| Categoria | categorias | id UUID, descricao, icone |
| Movimentacao | movimentacoes | tipo 1=receita/2=despesa, data, valor, contas_id, categoria_id |
| Fixa | fixas | despesa fixa permanente, tipo 1=valor fixo/2=variável |
| FixaPagamento | fixas_pagamentos | pagamento mensal de Fixa; unique(fixas_id, mes, ano) |
| FixaTemporaria | dividas | despesa temporária com inicio/fim |
| FixaTemporariaPagamento | dividas_pagamentos | pagamento mensal de FixaTemporaria; unique(fixas_temporarias_id, mes, ano) |
| Transacao | transacoes | log de auditoria; tipo ENUM: receita, despesa, transferencia, pagamento_fixa, pagamento_divida |

Todos os IDs são UUID. Todos os modelos têm createdAt/updatedAt. Queries sempre filtradas por `usuarios_id` (isolamento multi-tenant).

## Rotas da API (`/api`)

```
POST   /auth/register
POST   /auth/login
GET    /auth/me

# (todas abaixo requerem Bearer JWT)
GET|POST             /contas
GET|PUT|DELETE       /contas/:id
POST                 /contas/transferir
POST                 /contas/:id/depositar

GET|POST             /movimentacoes
GET|PUT|DELETE       /movimentacoes/:id

GET|POST             /fixas
GET|PUT|DELETE       /fixas/:id
POST                 /fixas/:id/pagar
DELETE               /fixas/:id/pagar       # reverte (query: mes, ano)

GET|POST             /fixas-temporarias
GET|PUT|DELETE       /fixas-temporarias/:id
POST                 /fixas-temporarias/:id/pagar
DELETE               /fixas-temporarias/:id/pagar

GET|POST             /categorias
GET|PUT|DELETE       /categorias/:id

GET                  /transacoes
```

## Padrões de Implementação

- **Sequelize transactions** em todas as operações multi-etapa (transferências, depósitos, pagamentos) — rollback automático em erro.
- **`helpers/pagamento.js`** centraliza `registrarPagamento()` e `reverterPagamento()`: atualiza saldo da conta, cria registro de pagamento e loga em Transacao. Retorna 409 se já existe pagamento para o mesmo mês/ano.
- **Middleware auth** verifica JWT, injeta `req.userId`; todas as queries usam esse ID para escopo de dados.
- **Frontend** persiste token JWT no localStorage; Axios intercepta 401 e redireciona para login.

## Variáveis de Ambiente

**Backend (`.env`):**
```
PORT=3000
DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME=financeiro
JWT_SECRET=...
JWT_EXPIRES_IN=7d
```

**Frontend (`.env`):**
```
VITE_API_URL=/api
```
Vite proxia `/api` → `http://localhost:3000` em dev.

## Como Rodar

```bash
# Backend
cd backend && npm install && node src/scripts/createDatabase.js && npm run dev

# Frontend
cd frontend && npm install && npm run dev
# Acesso: http://localhost:5173
```
