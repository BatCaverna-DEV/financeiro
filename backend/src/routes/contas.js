import { Router } from 'express';
import { index, show, store, update, destroy, depositar } from '../controllers/contasController.js';

const router = Router();

router.get('/',              index);
router.post('/',             store);
router.get('/:id',           show);
router.put('/:id',           update);
router.delete('/:id',        destroy);
router.post('/:id/depositar', depositar);

export default router;
