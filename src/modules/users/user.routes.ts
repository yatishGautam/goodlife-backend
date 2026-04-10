import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { updateProfileSchema, registerDeviceSchema } from './user.schema';
import {
  getMeHandler,
  updateMeHandler,
  getStatsHandler,
  registerDeviceHandler,
} from './user.controller';

const router = Router();

router.use(requireAuth);

router.get('/me', getMeHandler);
router.patch('/me', validate(updateProfileSchema), updateMeHandler);
router.get('/me/stats', getStatsHandler);
router.put('/me/device', validate(registerDeviceSchema), registerDeviceHandler);

export default router;
