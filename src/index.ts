import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '@/config/env';
import prisma from '@/config/database';
import { requestLogger } from '@/middleware/requestLogger';
import { errorHandler } from '@/middleware/errorHandler';
import { apiRateLimiter } from '@/middleware/rateLimiter';
import authRoutes from '@/modules/auth/auth.routes';
import userRoutes from '@/modules/users/user.routes';
import templateRoutes from '@/modules/templates/template.routes';

const app = express();

// ─── Core middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  }),
);
app.use(express.json());

if (env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ ok: false, status: 'unhealthy', timestamp: new Date().toISOString() });
  }
});

app.use('/api/v1', apiRateLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/templates', templateRoutes);

// ─── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`GoodLife API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

export default app;
