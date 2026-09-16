const request = require('supertest');
const app = require('../../src/index');

describe('GET /users', () => {
  it('returns the seeded users', async () => {
    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /users/:id', () => {
  it('returns a single user', async () => {
    const res = await request(app).get('/users/1');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Ada Lovelace');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/users/999');

    expect(res.status).toBe(404);
  });
});

describe('POST /users', () => {
  it('rejects requests without auth', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Grace Hopper', email: 'grace@example.com' });

    expect(res.status).toBe(401);
  });

  it('creates a user when authenticated', async () => {
    const res = await request(app)
      .post('/users')
      .set('Authorization', 'Bearer dev-token')
      .send({ name: 'Grace Hopper', email: 'grace@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Grace Hopper');
  });
});
