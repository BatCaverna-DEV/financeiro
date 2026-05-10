import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const dbName = process.env.DB_NAME || 'financeiro';

// 1. Cria o banco de dados (mysql2 sem selecionar DB)
const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
});

try {
  console.log(`Criando banco de dados "${dbName}"...`);
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log('Banco de dados pronto.');
} finally {
  await conn.end();
}

// 2. Importa o Sequelize e os models (dotenv já está carregado)
const { default: sequelize } = await import('../config/database.js');
await import('../models/index.js');

console.log('Sincronizando tabelas com Sequelize...');
await sequelize.sync({ force: false });

console.log('\nTabelas criadas/verificadas com sucesso!');
console.log('Tabelas: usuarios, contas, categoria, fixas, transacoes');

await sequelize.close();
