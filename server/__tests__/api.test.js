// Integration tests against the Express app via supertest.
// Prisma, email and SMS are mocked so no real DB/network is touched.

const makeModel = () => ({
  findUnique: jest.fn().mockResolvedValue(null),
  findFirst: jest.fn().mockResolvedValue(null),
  findMany: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({ id: 'test-id', email: 'x@test.com' }),
  update: jest.fn().mockResolvedValue({ id: 'test-id' }),
  updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  count: jest.fn().mockResolvedValue(0),
});

jest.mock('../lib/prisma', () => {
  const models = [
    'customer', 'agent', 'admin', 'service', 'booking', 'invoice', 'payment',
    'notification', 'session', 'refreshToken', 'loginHistory', 'deviceTracking',
    'maintenanceSchedule', 'supportTicket', 'aadhaarVerification',
    'emailVerification', 'passwordResetToken',
  ];
  const client = { $connect: jest.fn().mockResolvedValue(), $disconnect: jest.fn().mockResolvedValue() };
  for (const m of models) client[m] = makeModel();
  return client;
});

// Avoid real SMTP/HTTP from email + SMS services.
jest.mock('../services/emailService');
jest.mock('../services/smsService');

const request = require('supertest');
const app = require('../server');

const ALLOWED = 'http://localhost:3000';
const csrfHeaders = { Origin: ALLOWED, 'X-Requested-With': 'XMLHttpRequest' };

describe('health & routing', () => {
  test('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'Server is running' });
  });

  test('unknown route returns 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('CSRF protection on state-changing requests', () => {
  const body = { email: 'a@test.com', password: 'secret123', userType: 'customer' };

  test('rejects POST with no custom header', async () => {
    const res = await request(app).post('/api/auth/login/customer').set('Origin', ALLOWED).send(body);
    expect(res.status).toBe(403);
  });

  test('rejects POST with no Origin/Referer', async () => {
    const res = await request(app).post('/api/auth/login/customer').set('X-Requested-With', 'XMLHttpRequest').send(body);
    expect(res.status).toBe(403);
  });

  test('rejects POST from a disallowed origin', async () => {
    const res = await request(app)
      .post('/api/auth/login/customer')
      .set({ Origin: 'https://evil.example.com', 'X-Requested-With': 'XMLHttpRequest' })
      .send(body);
    expect(res.status).toBe(403);
  });

  test('allows POST with valid origin + header (reaches the handler)', async () => {
    const res = await request(app).post('/api/auth/login/customer').set(csrfHeaders).send(body);
    expect(res.status).not.toBe(403); // passed CSRF; unknown user -> 401
  });
});

describe('auth behavior', () => {
  test('registration with missing fields returns 400', async () => {
    const res = await request(app).post('/api/auth/register/customer').set(csrfHeaders).send({ email: 'a@test.com' });
    expect(res.status).toBe(400);
  });

  test('login with unknown user returns 401 (prisma mocked to null)', async () => {
    const res = await request(app)
      .post('/api/auth/login/customer')
      .set(csrfHeaders)
      .send({ email: 'nobody@test.com', password: 'whatever1' });
    expect(res.status).toBe(401);
  });
});
