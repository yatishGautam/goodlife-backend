import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/index';

const AUTH_BASE = '/api/v1/auth';
const BASE = '/api/v1/templates';

const testUser = {
  email: 'templates@example.com',
  password: 'password123',
  displayName: 'Template Tester',
};

async function registerAndLogin() {
  const res = await request(app).post(`${AUTH_BASE}/register`).send(testUser);
  return res.body.data.accessToken as string;
}

const sampleTemplate = {
  name: 'Push Day',
  description: 'Chest, shoulders, triceps',
  tags: ['push', 'strength'],
  suggestedWeekdays: [1],
  estimatedMinutes: 60,
  exercises: [
    {
      name: 'Bench Press',
      timerConfig: { type: 'countdown', seconds: 90 },
      targetSets: 4,
      targetReps: 8,
      targetWeight: 185,
      weightUnit: 'lbs',
      restBetweenSets: 90,
      orderIndex: 0,
    },
    {
      name: 'Overhead Press',
      timerConfig: { type: 'countdown', seconds: 75 },
      targetSets: 3,
      targetReps: 10,
      targetWeight: 115,
      weightUnit: 'lbs',
      restBetweenSets: 75,
      orderIndex: 1,
    },
  ],
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

describe('POST /templates', () => {
  it('creates a template with exercises', async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(sampleTemplate);

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.name).toBe('Push Day');
    expect(res.body.data.exercises).toHaveLength(2);
    expect(res.body.data.exercises[0].name).toBe('Bench Press');
  });

  it('rejects missing name', async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sampleTemplate, name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post(BASE).send(sampleTemplate);
    expect(res.status).toBe(401);
  });
});

describe('GET /templates', () => {
  let token: string;
  beforeEach(async () => {
    token = await registerAndLogin();
    await request(app).post(BASE).set('Authorization', `Bearer ${token}`).send(sampleTemplate);
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sampleTemplate, name: 'Pull Day', tags: ['pull'] });
  });

  it('returns all templates for the user', async () => {
    const res = await request(app).get(BASE).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('filters by search query', async () => {
    const res = await request(app)
      .get(`${BASE}?search=push`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Push Day');
  });

  it('filters by tag', async () => {
    const res = await request(app)
      .get(`${BASE}?tags=pull`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Pull Day');
  });
});

describe('GET /templates/:id', () => {
  it('returns a single template with exercises', async () => {
    const token = await registerAndLogin();
    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(sampleTemplate);

    const id = created.body.data.id;
    const res = await request(app).get(`${BASE}/${id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.exercises).toHaveLength(2);
  });

  it('returns 404 for non-existent template', async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .get(`${BASE}/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /templates/:id', () => {
  it('updates template name', async () => {
    const token = await registerAndLogin();
    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(sampleTemplate);

    const id = created.body.data.id;
    const res = await request(app)
      .put(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Push Day v2' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Push Day v2');
  });

  it('upserts exercises — adds a new one, removes unlisted ones', async () => {
    const token = await registerAndLogin();
    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(sampleTemplate);

    const id = created.body.data.id;
    const existingExId = created.body.data.exercises[0].id;

    const res = await request(app)
      .put(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exercises: [
          // Keep first exercise, update it
          { id: existingExId, name: 'Bench Press Updated', timerConfig: { type: 'countdown', seconds: 90 }, orderIndex: 0, restBetweenSets: 90, weightUnit: 'lbs' },
          // Add a new exercise (no id)
          { name: 'Cable Flye', timerConfig: { type: 'countdown', seconds: 60 }, orderIndex: 1, restBetweenSets: 60, weightUnit: 'lbs' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.exercises).toHaveLength(2);
    expect(res.body.data.exercises[0].name).toBe('Bench Press Updated');
    expect(res.body.data.exercises[1].name).toBe('Cable Flye');
  });

  it('returns 404 for template not owned by user', async () => {
    const token1 = await registerAndLogin();
    const token2 = (
      await request(app)
        .post(`${AUTH_BASE}/register`)
        .send({ email: 'other@example.com', password: 'password123', displayName: 'Other' })
    ).body.data.accessToken;

    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token1}`)
      .send(sampleTemplate);

    const res = await request(app)
      .put(`${BASE}/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ name: 'Stolen' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /templates/:id', () => {
  it('soft-deletes a template', async () => {
    const token = await registerAndLogin();
    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(sampleTemplate);

    const id = created.body.data.id;
    const delRes = await request(app)
      .delete(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);

    // Should no longer appear in list
    const listRes = await request(app).get(BASE).set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data).toHaveLength(0);

    // Direct fetch should 404
    const getRes = await request(app).get(`${BASE}/${id}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });
});

// ─── Duplicate ────────────────────────────────────────────────────────────────

describe('POST /templates/:id/duplicate', () => {
  it('creates a deep copy with "(copy)" suffix', async () => {
    const token = await registerAndLogin();
    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(sampleTemplate);

    const id = created.body.data.id;
    const res = await request(app)
      .post(`${BASE}/${id}/duplicate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Push Day (copy)');
    expect(res.body.data.id).not.toBe(id);
    expect(res.body.data.exercises).toHaveLength(2);
    // Exercise IDs should be new
    expect(res.body.data.exercises[0].id).not.toBe(created.body.data.exercises[0].id);
  });
});

// ─── Import / Export roundtrip ────────────────────────────────────────────────

describe('Import/Export roundtrip', () => {
  it('exports templates and re-imports them', async () => {
    const token = await registerAndLogin();

    // Create two templates
    await request(app).post(BASE).set('Authorization', `Bearer ${token}`).send(sampleTemplate);
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sampleTemplate, name: 'Pull Day' });

    // Export
    const exportRes = await request(app)
      .get(`${BASE}/export`)
      .set('Authorization', `Bearer ${token}`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.body.data).toHaveLength(2);

    // Register a second user and import into their account
    const token2 = (
      await request(app)
        .post(`${AUTH_BASE}/register`)
        .send({ email: 'importer@example.com', password: 'password123', displayName: 'Importer' })
    ).body.data.accessToken;

    const importPayload = exportRes.body.data.map(
      ({ name, description, tags, suggestedWeekdays, estimatedMinutes, sortOrder, exercises }: any) => ({
        name,
        description,
        tags,
        suggestedWeekdays,
        estimatedMinutes,
        sortOrder,
        exercises: exercises.map(({ id: _id, ...ex }: any) => ex),
      }),
    );

    const importRes = await request(app)
      .post(`${BASE}/import`)
      .set('Authorization', `Bearer ${token2}`)
      .send(importPayload);

    expect(importRes.status).toBe(201);
    expect(importRes.body.data).toHaveLength(2);
    expect(importRes.body.data[0].name).toBe(exportRes.body.data[0].name);
  });
});

// ─── Today's suggestion ───────────────────────────────────────────────────────

describe('GET /templates/today', () => {
  it('returns null when no templates match today', async () => {
    const token = await registerAndLogin();
    // Create template for a weekday that never matches "any" by leaving suggestedWeekdays empty
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sampleTemplate, suggestedWeekdays: [] });

    const res = await request(app)
      .get(`${BASE}/today`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it('returns a template assigned to every day of the week', async () => {
    const token = await registerAndLogin();
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sampleTemplate, suggestedWeekdays: [0, 1, 2, 3, 4, 5, 6] });

    const res = await request(app)
      .get(`${BASE}/today`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).not.toBeNull();
    expect(res.body.data.name).toBe('Push Day');
  });
});
