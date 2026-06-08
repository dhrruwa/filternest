# Changelog

This document records what was implemented and changed in the FilterNest platform, with **before → after** and the **reason** for each change. Newest first.

---

## Maintainability: structured logging + frontend de-duplication (2026-06-08)

| Area | Before | After | Why |
|------|--------|-------|-----|
| **Logging** | 116 raw `console.log/warn/error` calls | **`pino`** structured logger (`server/lib/logger.js`): levels, sensitive-field redaction, pretty in dev / JSON in prod, silent in tests | Queryable production logs, no secrets in output, log levels. |
| **Frontend duplication** | `api.js`, `ConfirmationModal`, `SecurityDashboard` were **byte-identical copies** in all 3 apps | Extracted to a shared **npm-workspace package `@filternest/shared`**; each app keeps a one-line re-export shim so existing imports are untouched | One source of truth — a fix happens once, not three times. |

Notes:
- The workspace **excludes `server`** so the Render backend remains a standalone install (verified: `cd server && npm install` and boot still work independently).
- Verified the Vercel build path: `cd <app> && npm install && npm run build` succeeds for all 3 with the workspace.
- Stale app-level `package-lock.json` removed; the workspace uses a single root lockfile.

---

## Code Quality: error handling, tests, CI, dead-code removal (2026-06-08)

| Area | Before | After | Why |
|------|--------|-------|-----|
| **Error responses** | `res.status(500).json({ error: error.message })` leaked stack traces / Prisma queries / file paths to the client (74 sites) | One central middleware **sanitizes all 5xx bodies** to a generic message in production and logs full detail server-side (`server.js`) | Information disclosure — clients should never see internals. |
| **Tests** | `jest` listed but **0 tests** | **16 Jest tests** (Prisma/email/SMS mocked): origin allow-list, JWT round-trip, CSRF enforcement, health, 404, auth 400/401 (`server/__tests__/`) | An auth app with no tests is the biggest review red flag. |
| **CI** | None | **GitHub Actions** runs backend tests + builds all 3 frontends on every push/PR (`.github/workflows/ci.yml`) | Catch regressions automatically. |
| **Dead code/deps** | `mongoose` + 17 unused `models/*.js`, unused `redis`/`stripe`/`qrcode`, root scratch scripts, legacy `client/` | All removed | Post-migration cleanup; smaller install, no confusion. |
| **Simulated data** | Hardcoded `location: 'Mumbai, India'` in login history | `'Unknown'` until a geo provider is wired | Don't present fake data as real. |
| **Testability** | `server.js` always listened/connected on import | Exports `app`; skips listen/DB/scheduler under `NODE_ENV=test` | Enables supertest integration tests. |

---

## Security Hardening & Production Fixes (2026-06-08)

Hardened auth/security, fixed the Render↔Supabase database connection, and got the
deployed apps working on every device. Several items here **supersede** the earlier
"Production & Deploy Readiness" entry below (CORS wildcard and SMS-primary OTP).

### Database connection on Render (the big production blocker)

| Issue | Fix | Why |
|------|-----|-----|
| Prisma's Rust engine threw `P1011 — Error opening a TLS connection: OpenSSL error` against the Supabase pooler from Render; every query failed | Connect through the **`pg` Node driver via Prisma's driver adapter** (`@prisma/adapter-pg`) so **Node.js handles TLS** (`server/lib/prisma.js`) | The engine's TLS to the Supabase pooler fails on Render's OpenSSL; routing TLS through Node connects reliably. `sslmode`/`binaryTargets` did not resolve it. |
| After the adapter: `self-signed certificate in certificate chain` | **Strip `sslmode` from the URL** and set `ssl: { rejectUnauthorized: false }` | Supabase's pooler cert isn't in Node's default CA bundle; `sslmode=require` in the URL was overriding the explicit ssl config. |
| "Only one device could log in"; others got auth failures | **`app.set('trust proxy', 1)`** + raised `authRateLimiter` 10→50/15min | Without trusting Render's proxy, every request shared one `req.ip`, so the IP-keyed rate limiter used a single bucket for all users. |

### Security hardening

| Area | Before | After | Why |
|------|--------|-------|-----|
| **Default admin** | Hardcoded emails/phones/plaintext passwords in `seedDefaultAdmin.js` | Single admin from **`ADMIN_EMAIL`/`ADMIN_PASSWORD`** (+ optional name/phone), bcrypt-hashed, **never logged**, skips if unset | No credentials in source; rotatable via env. |
| **JWT secrets** | Hardcoded fallback strings | **Throw at startup** if `JWT_SECRET`/`JWT_REFRESH_SECRET` unset; no fallback | A default secret lets anyone forge tokens. |
| **CORS** | Any `*.vercel.app` (wildcard) | **Explicit allow-list** from `ALLOWED_ORIGINS` + `FRONTEND_URL`; no wildcard with `credentials:true` (`lib/allowedOrigins.js`) | Wildcard + credentials is unsafe; only our exact domains are allowed. **Supersedes the wildcard entry below.** |
| **CSRF** | Computed a custom-header flag but never enforced it | Reject state-changing requests lacking the **`X-Requested-With`/CSRF header** or a present/allow-listed **Origin** | Makes the double-submit CSRF defense actually effective. |
| **Token source** | Also accepted `?token=` in the query string | **Authorization header or HTTP-only cookie only** | Query tokens leak into logs, history, Referer. |
| **Middleware order** | `xssClean`/`csrfCheck` ran before `express.json()` | Body parsers run **first** | `req.body` was undefined, so body sanitization never ran. |
| **Logging** | Logged full `req.body` (passwords/OTPs) on every non-GET | **No body logging in prod**; redacted in dev | Stop leaking secrets to logs. |
| **Leaked creds** | Default `admin123` in 6 docs + `start-all.sh` | Scrubbed | That account existed in the DB. |

### Email OTP via Brevo

| Before | After | Why |
|--------|-------|-----|
| OTP via Gmail **SMTP** (and MSG91 SMS primary) | **Email OTP via Brevo HTTP API** (`BREVO_API_KEY`), SMTP fallback locally; SMS now best-effort fire-and-forget (`emailService.js`, `authController.js`) | Render blocks outbound SMTP; MSG91 trial only delivered to the account owner's number. Brevo's HTTPS API (free, 300/day, no domain) delivers to all users. **Supersedes the SMS-primary entry below.** |

### Frontend / UX

- All 3 apps send `X-Requested-With` (incl. the token-refresh call) so CSRF passes.
- **Admin panel port 6000 → 6001** (browsers block port 6000 as unsafe / `ERR_UNSAFE_PORT`).
- Agent application: **profile avatar photo made optional** (was mandatory).
- Customer registration: removed the "Customer registration only / Technician Application Portal" notice.
- `VITE_API_URL` must be set on each Vercel project (build-time) to point at the Render API.

### New environment variables

`JWT_REFRESH_SECRET`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (+ optional `ADMIN_*`), `ALLOWED_ORIGINS`,
`BREVO_API_KEY` — all documented in `server/.env.example` (placeholders only).

---

## Production & Deploy Readiness (Render + Vercel)

Made the backend and frontends deployable to managed hosting.

| Area | Before | After | Why |
|------|--------|-------|-----|
| **CORS** | Hardcoded list of `localhost` origins only | Allow-list **plus any `*.vercel.app` origin** | The 3 frontends (customer, agent, admin) each deploy to their own Vercel domain, and preview deploys get random `*.vercel.app` subdomains. A static list couldn't cover them. |
| **CSRF check** | `allowedOrigins.includes(origin)` only | Same list **plus** `hostname.endsWith('.vercel.app')` | Same reason as CORS — state-changing requests from production/preview frontends were being blocked with `403 CSRF Protection Violation`. (`server/middleware/securityMiddleware.js`) |
| **Avatar upload URLs** | Hardcoded `http://localhost:5001/...` | Built from the **request host** | Once the API runs on Render, a localhost URL points nowhere. Building from the request host makes uploaded avatars resolve correctly in every environment. (`authController`, `adminController`) |
| **OTP delivery** | Email (SMTP) only | **MSG91 SMS as primary**, email as best-effort fallback | Hosts like Render block outbound SMTP, so email-only OTP silently failed in production. SMS is reliable there. |
| **Prisma client on deploy** | Generated only locally | `prisma generate` wired into `postinstall` **and** `build`; Node `>=18` engine hint | Render runs `npm install` on a clean box — without this the Prisma client is missing at runtime and the server crashes on boot. |
| **Deploy config** | None | Added **`render.yaml`** blueprint for the backend web service | One-click, reproducible backend deploys with health check at `/api/health` and secrets declared (but not committed). |

---

## Database Migration: MongoDB/Mongoose → Supabase (PostgreSQL + Prisma 6)

The single largest change — the entire backend moved off MongoDB onto a relational database.

### Before → After

| Before (MongoDB / Mongoose) | After (Supabase / Prisma 6) |
|------------------------------|------------------------------|
| `mongoose` ODM + `MONGODB_URI` | `@prisma/client` / `prisma` + `DATABASE_URL` (pooled) and `DIRECT_URL` (migrations) |
| Schemas defined in `server/models/*.js` | All **17 models** in `server/prisma/schema.prisma` |
| Embedded sub-documents | `Json` columns |
| Scalar arrays (`[String]`) | Postgres `String[]` |
| Polymorphic refs + `.populate()` | Real foreign-key relations / explicit columns |
| `Model.toJSON()` to strip secrets | `lib/sanitize.js` helper |
| Mongo `_id` consumed by frontend | `lib/prisma.js` client extension **aliases `id` → `_id`** so the frontends needed no changes |

### Why
- **Relational integrity & queryability**: Bookings, invoices, agents, and sessions are highly relational. Foreign keys and joins enforce consistency that polymorphic Mongo refs left to application code.
- **Managed Postgres (Supabase)**: free, hosted, with pooled connections suited to serverless/SPA traffic — no self-managed Mongo instance.
- **Prisma type-safety**: a single source-of-truth schema and generated client replace hand-written Mongoose models.

### What was rewritten
- All **5 controllers** (auth, admin, booking, customer, agent), the **auth middleware**, the **notification** and **scheduler** services, `serviceRoutes`, and the **seed utilities** — all converted from Mongoose calls to Prisma.
- Passwords are now hashed **explicitly** in code (previously a Mongoose pre-save hook).
- `DATABASE_URL` / `DIRECT_URL` wired into `server.js`; `.env.example` sanitized to the Supabase shape.

See **[server/MIGRATION_CONVENTIONS.md](server/MIGRATION_CONVENTIONS.md)** for the full mapping rules.

### Fixes that rode along with the migration
- **Latent bug fixed**: `authController` called an undefined `buildAgentId()` → corrected to `generateUniqueAgentId()`.
- **Rate limit raised**: global limit of 100 req/15 min was too low for normal SPA traffic; now environment-aware (relaxed in dev).
- **Admin panel dev port `6000` → `6001`**: Chrome and Firefox block port 6000 as an "unsafe port" (ERR_UNSAFE_PORT), so the admin panel wouldn't load.
- **Agent application avatar made optional**: the profile photo was blocking applications; it's now optional.

---

## Earlier Foundation (pre-migration)

- Multi-frontend split into **customer-app**, **agent-app**, and **admin-panel** with strict role-based access control.
- Enterprise agent system: live GPS, shift attendance, wallet earnings, autograph proofs.
- Dual-token JWT auth (15-min access + 7-day refresh in HTTP-only cookies) with silent rotation and multi-device session management.
- Admin-controlled technician onboarding (no agent self-registration); credentials issued by admin and emailed.
- Smart maintenance scheduler (3-month pre-filter, 6-month RO membrane reminders) with email + in-app notifications.
