import rateLimit from 'express-rate-limit';
import { sendError } from '@/utils/apiResponse';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    sendError(res, 'RATE_LIMITED', 'Too many requests, please try again later', 429);
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    sendError(res, 'RATE_LIMITED', 'Too many requests, please try again later', 429);
  },
});
