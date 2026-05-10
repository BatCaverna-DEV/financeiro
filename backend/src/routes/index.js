import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import authRoutes             from './auth.js';
import contasRoutes           from './contas.js';
import fixasRoutes            from './fixas.js';
import fixasTemporariasRoutes from './fixasTemporarias.js';
import movimentacoesRoutes    from './movimentacoes.js';
import categoriasRoutes       from './categorias.js';
import transacoesRoutes       from './transacoes.js';
import relatoriosRoutes       from './relatorios.js';

const router = Router();

router.use('/auth',              authRoutes);
router.use('/contas',            authMiddleware, contasRoutes);
router.use('/fixas',             authMiddleware, fixasRoutes);
router.use('/fixas-temporarias', authMiddleware, fixasTemporariasRoutes);
router.use('/movimentacoes',     authMiddleware, movimentacoesRoutes);
router.use('/categorias',        authMiddleware, categoriasRoutes);
router.use('/transacoes',        authMiddleware, transacoesRoutes);
router.use('/relatorios',        authMiddleware, relatoriosRoutes);

export default router;
