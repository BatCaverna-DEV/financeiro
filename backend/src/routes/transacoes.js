import { Router } from 'express';
import { index } from '../controllers/transacoesController.js';

const router = Router();

router.get('/', index);

export default router;
