import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sequelize from './src/config/database.js';
import './src/models/index.js';
import routes from './src/routes/index.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;

try {
  await sequelize.authenticate();
  console.log('Conexão com banco de dados estabelecida.');
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
} catch (err) {
  console.error('Erro ao conectar ao banco de dados:', err.message);
  process.exit(1);
}
