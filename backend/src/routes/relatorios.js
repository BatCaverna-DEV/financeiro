import { Router } from 'express';
import { visaoGeral } from '../controllers/relatoriosController.js';

const router = Router();

router.get('/visao-geral', visaoGeral);

export default router;
