# Changelog

This document records what was implemented and changed in the FilterNest platform, with **before → after** and the **reason** for each change. Newest first.

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
