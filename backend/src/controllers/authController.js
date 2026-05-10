import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/index.js';

export async function register(req, res) {
  try {
    const { nome, username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }

    const existing = await Usuario.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'Username já está em uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nome: nome || null, username, password: hashedPassword });

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    return res.status(201).json({ token, user: { id: usuario.id, nome: usuario.nome, username: usuario.username } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }

    const usuario = await Usuario.findOne({ where: { username, status: 1 } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isValid = await bcrypt.compare(password, usuario.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    return res.json({ token, user: { id: usuario.id, nome: usuario.nome, username: usuario.username } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function me(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.userId, {
      attributes: ['id', 'nome', 'username', 'status', 'categoria', 'createdAt'],
    });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    return res.json(usuario);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
