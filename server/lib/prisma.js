// Shared Prisma client for the whole server.
//
// The frontends (and a lot of existing controller code) expect Mongo-style
// `_id` on every returned document. Prisma's primary key is `id`, so we use a
// result extension to expose a computed `_id` (equal to `id`) on EVERY model —
// including nested/included relations. This keeps API responses drop-in
// compatible with the old Mongoose output without touching the frontends.

const { PrismaClient } = require('@prisma/client');

// Every model name (camelCase, as used on the Prisma client) gets an `_id`.
const MODELS = [
  'customer',
  'agent',
  'admin',
  'service',
  'booking',
  'invoice',
  'payment',
  'maintenanceSchedule',
  'supportTicket',
  'notification',
  'session',
  'refreshToken',
  'loginHistory',
  'deviceTracking',
  'aadhaarVerification',
  'emailVerification',
  'passwordResetToken',
];

const idAlias = {
  _id: {
    needs: { id: true },
    compute(record) {
      return record.id;
    },
  },
};

const result = {};
for (const model of MODELS) {
  result[model] = idAlias;
}

const base = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

const prisma = base.$extends({ result });

module.exports = prisma;
