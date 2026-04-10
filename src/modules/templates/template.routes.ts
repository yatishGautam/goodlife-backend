import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { createTemplateSchema, updateTemplateSchema } from './template.schema';
import {
  listHandler,
  getOneHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  duplicateHandler,
  importHandler,
  exportHandler,
  todayHandler,
} from './template.controller';

const router = Router();

router.use(requireAuth);

// Specific routes before /:id to avoid param conflicts
router.get('/today', todayHandler);
router.get('/export', exportHandler);
router.post('/import', importHandler);

router.get('/', listHandler);
router.post('/', validate(createTemplateSchema), createHandler);
router.get('/:id', getOneHandler);
router.put('/:id', validate(updateTemplateSchema), updateHandler);
router.delete('/:id', deleteHandler);
router.post('/:id/duplicate', duplicateHandler);

export default router;
