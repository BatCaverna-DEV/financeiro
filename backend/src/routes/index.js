import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import authRoutes from './auth.js';
import contasRoutes from './contas.js';
import fixasRoutes from './fixas.js';
import transacoesRoutes from './transacoes.js';
import categoriasRoutes from './categorias.js';

const router = Router();

router.use('/auth',       authRoutes);
router.use('/contas',     authMiddleware, contasRoutes);
router.use('/fixas',      authMiddleware, fixasRoutes);
router.use('/transacoes', authMiddleware, transacoesRoutes);
router.use('/categorias', authMiddleware, categoriasRoutes);

export default router;
