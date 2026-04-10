import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ ok: true, data });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
): void {
  res.status(statusCode).json({ ok: false, error: { code, message } });
}
