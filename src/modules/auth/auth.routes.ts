import { Router } from 'express';
import { validate } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';
import { authRateLimiter } from '@/middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from './auth.schema';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  deleteAccountHandler,
} from './auth.controller';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), registerHandler);
router.post('/login', authRateLimiter, validate(loginSchema), loginHandler);
router.post('/refresh', validate(refreshSchema), refreshHandler);
router.post('/logout', requireAuth, validate(logoutSchema), logoutHandler);
router.delete('/account', requireAuth, deleteAccountHandler);

export default router;
