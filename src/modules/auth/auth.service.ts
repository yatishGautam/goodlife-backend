import crypto from 'crypto';
import prisma from '@/config/database';
import { hashPassword, comparePassword } from '@/utils/hash';
import { signAccessToken, signRefreshToken, verifyToken } from '@/utils/jwt';
import { createError } from '@/middleware/errorHandler';
import type { RegisterInput, LoginInput } from './auth.schema';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function register(input: RegisterInput): Promise<TokenPair & { userId: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw createError('Email already in use', 409, 'EMAIL_IN_USE');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    },
  });

  const tokens = await issueTokens(user.id, user.email);
  return { ...tokens, userId: user.id };
}

export async function login(input: LoginInput): Promise<TokenPair & { userId: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email, deletedAt: null },
  });

  if (!user) {
    throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const tokens = await issueTokens(user.id, user.email);
  return { ...tokens, userId: user.id };
}

export async function refresh(rawRefreshToken: string): Promise<TokenPair> {
  // Verify the JWT is structurally valid first
  let payload: { sub: string; email: string };
  try {
    payload = verifyToken(rawRefreshToken);
  } catch {
    throw createError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Hash to look up in DB
  const tokenHash = hashToken(rawRefreshToken);

  const stored = await prisma.refreshToken.findUnique({ where: { token: tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw createError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokens(payload.sub, payload.email);
}

export async function logout(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { token: tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function deleteAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });
  // Revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function issueTokens(userId: string, email: string): Promise<TokenPair> {
  const accessToken = signAccessToken({ sub: userId, email });
  const refreshToken = signRefreshToken({ sub: userId, email });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.refreshToken.create({
    data: {
      userId,
      token: hashToken(refreshToken),
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
