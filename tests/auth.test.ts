import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '@/index';
import prisma from '@/config/database';

const BASE = '/api/v1/auth';

const testUser = {
  email: 'test@example.com',
  password: 'password123',
  displayName: 'Test User',
};

// ─── Register ─────────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('creates a new user and returns tokens', async () => {
    const res = await request(app).post(`${BASE}/register`).send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.userId).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    await request(app).post(`${BASE}/register`).send(testUser);
    const res = await request(app).post(`${BASE}/register`).send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('rejects invalid email', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...testUser, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects password shorter than 8 chars', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...testUser, password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(testUser);
  });

  it('returns tokens on valid credentials', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects unknown email', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'nobody@example.com', password: testUser.password });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

// ─── Refresh ──────────────────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
  it('returns new token pair on valid refresh token', async () => {
    const registerRes = await request(app).post(`${BASE}/register`).send(testUser);
    const { refreshToken } = registerRes.body.data;

    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // New refresh token should differ from old (rotation)
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('rejects an already-rotated refresh token', async () => {
    const registerRes = await request(app).post(`${BASE}/register`).send(testUser);
    const { refreshToken } = registerRes.body.data;

    // Use it once
    await request(app).post(`${BASE}/refresh`).send({ refreshToken });

    // Try to reuse the original
    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('rejects an invalid token', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken: 'totally.invalid.token' });

    expect(res.status).toBe(401);
  });
});

// ─── Protected routes ─────────────────────────────────────────────────────────

describe('Protected route access', () => {
  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).delete(`${BASE}/account`);
    expect(res.status).toBe(401);
  });

  it('rejects requests with an invalid token', async () => {
    const res = await request(app)
      .delete(`${BASE}/account`)
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });

  it('allows requests with a valid access token', async () => {
    const registerRes = await request(app).post(`${BASE}/register`).send(testUser);
    const { accessToken, refreshToken } = registerRes.body.data;

    const res = await request(app)
      .post(`${BASE}/logout`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  it('revokes refresh token on logout', async () => {
    const registerRes = await request(app).post(`${BASE}/register`).send(testUser);
    const { accessToken, refreshToken } = registerRes.body.data;

    const logoutRes = await request(app)
      .post(`${BASE}/logout`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);

    // After logout, refresh token should no longer work
    const refreshRes = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });
});

// ─── Delete account ───────────────────────────────────────────────────────────

describe('DELETE /auth/account', () => {
  it('soft-deletes the account', async () => {
    const registerRes = await request(app).post(`${BASE}/register`).send(testUser);
    const { accessToken, userId } = registerRes.body.data;

    const res = await request(app)
      .delete(`${BASE}/account`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.deletedAt).not.toBeNull();
  });
});
