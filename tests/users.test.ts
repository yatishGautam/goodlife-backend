import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/index';

const AUTH_BASE = '/api/v1/auth';
const USERS_BASE = '/api/v1/users';

const testUser = {
  email: 'user@example.com',
  password: 'password123',
  displayName: 'Test User',
};

async function registerAndLogin(): Promise<{ accessToken: string; userId: string }> {
  const res = await request(app).post(`${AUTH_BASE}/register`).send(testUser);
  return { accessToken: res.body.data.accessToken, userId: res.body.data.userId };
}

// ─── GET /me ─────────────────────────────────────────────────────────────────

describe('GET /users/me', () => {
  it('returns the current user profile', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .get(`${USERS_BASE}/me`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.displayName).toBe(testUser.displayName);
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get(`${USERS_BASE}/me`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /me ────────────────────────────────────────────────────────────────

describe('PATCH /users/me', () => {
  it('updates displayName', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .patch(`${USERS_BASE}/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ displayName: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe('Updated Name');
  });

  it('updates preferredUnit to kg', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .patch(`${USERS_BASE}/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ preferredUnit: 'kg' });

    expect(res.status).toBe(200);
    expect(res.body.data.preferredUnit).toBe('kg');
  });

  it('updates timezone', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .patch(`${USERS_BASE}/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ timezone: 'America/Los_Angeles' });

    expect(res.status).toBe(200);
    expect(res.body.data.timezone).toBe('America/Los_Angeles');
  });

  it('updates haptics and sound toggles', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .patch(`${USERS_BASE}/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ hapticsEnabled: false, soundEnabled: false });

    expect(res.status).toBe(200);
    expect(res.body.data.hapticsEnabled).toBe(false);
    expect(res.body.data.soundEnabled).toBe(false);
  });

  it('rejects invalid preferredUnit', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .patch(`${USERS_BASE}/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ preferredUnit: 'stones' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── GET /me/stats ────────────────────────────────────────────────────────────

describe('GET /users/me/stats', () => {
  it('returns stats with zero values for a new user', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .get(`${USERS_BASE}/me/stats`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toMatchObject({
      streak: 0,
      totalSessions: 0,
      sessionsThisWeek: 0,
      volumeThisWeek: 0,
    });
  });
});

// ─── PUT /me/device ───────────────────────────────────────────────────────────

describe('PUT /users/me/device', () => {
  it('registers a new iOS device', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .put(`${USERS_BASE}/me/device`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ deviceType: 'ios', deviceName: 'iPhone 16', pushToken: 'abc123' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('updates push token if device type already exists', async () => {
    const { accessToken } = await registerAndLogin();

    await request(app)
      .put(`${USERS_BASE}/me/device`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ deviceType: 'ios', pushToken: 'token-v1' });

    const res = await request(app)
      .put(`${USERS_BASE}/me/device`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ deviceType: 'ios', pushToken: 'token-v2' });

    expect(res.status).toBe(200);
  });

  it('rejects invalid deviceType', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .put(`${USERS_BASE}/me/device`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ deviceType: 'android' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
