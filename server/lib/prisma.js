// Shared Prisma client for the whole server.
//
// Connection goes through the `pg` Node driver via Prisma's driver adapter so
// TLS is handled by Node.js (not the Rust query engine). This fixes the
// P1011 "Error opening a TLS connection: OpenSSL error" that the engine throws
// when connecting to the Supabase pooler from some hosts (e.g. Render).
//
// The frontends (and a lot of existing controller code) expect Mongo-style
// `_id` on every returned document. Prisma's primary key is `id`, so we use a
// result extension to expose a computed `_id` (equal to `id`) on EVERY model —
// including nested/included relations.

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

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

const rawConnectionString = process.env.DATABASE_URL || '';
const isLocal = /localhost|127\.0\.0\.1/.test(rawConnectionString);

// Strip any `sslmode` from the URL so it can't override the explicit `ssl`
// config below. (sslmode=require forces strict cert verification, which fails
// against Supabase's pooler cert with "self-signed certificate in chain".)
const stripSslmode = (url) => {
  try {
    const u = new URL(url);
    u.searchParams.delete('sslmode');
    return u.toString();
  } catch (e) {
    return url;
  }
};
const connectionString = stripSslmode(rawConnectionString);

// Supabase requires TLS; its pooler cert isn't in the default Node CA bundle,
// so accept it without strict CA verification (still encrypted).
const adapter = new PrismaPg({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const base = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

const prisma = base.$extends({ result });

module.exports = prisma;
