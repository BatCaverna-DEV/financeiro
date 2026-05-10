import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const { default: sequelize } = await import('../config/database.js');
const { Usuario } = await import('../models/index.js');

await sequelize.authenticate();

const username = 'bruno';
const password = 'admin';

const existing = await Usuario.findOne({ where: { username } });
if (existing) {
  console.log(`Usuário "${username}" já existe (id: ${existing.id})`);
  await sequelize.close();
  process.exit(0);
}

const hashed = await bcrypt.hash(password, 10);
const usuario = await Usuario.create({ username, password: hashed });

console.log('\nUsuário criado com sucesso!');
console.log('─────────────────────────────');
console.log(`ID:       ${usuario.id}`);
console.log(`Username: ${usuario.username}`);
console.log(`Password: ${password}`);
console.log('─────────────────────────────');

await sequelize.close();
