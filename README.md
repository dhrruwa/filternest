# FilterNest: Enterprise Water Purifier Service & Workforce Management

A comprehensive, production-ready full-stack enterprise platform for managing reverse osmosis servicing, smart maintenance schedules, multi-device sessions, and admin-controlled agent onboarding.

> **Stack at a glance:** React 18 + Vite frontends (3 separate apps) · Node.js + Express backend · **Supabase (PostgreSQL) via Prisma 6** · JWT dual-token auth · Deployed on **Render (API)** + **Vercel (frontends)**.
>
> Looking for what recently changed and *why*? See **[CHANGELOG.md](CHANGELOG.md)** (MongoDB → Supabase migration and production hardening, with before → after rationale).

## 🌟 Core Architecture Modules

### 1. **Customer Identity & Care Portal**
- **Vibrant Onboarding**: Seamless registration and dynamic login powered by JWT token rotation.
- **Service Bookings**: Book certified servicing and membrane calibrations with full date/time selectors.
- **Location Alignment**: Capture and track real-time customer coordinates for white-glove route dispatching.
- **Booking & Service Ledger**: Interactive customer dashboard showing service history, current status, and billing logs.

### 2. **Admin-Controlled Specialist Onboarding**
- **No Agent Self-Registration**: Public self-registration and OTP-creation systems are disabled.
- **Dedicated Application Portal**: Vetted specialists apply through `/technician-application`, providing PAN, Aadhaar (spaced: `XXXX XXXX XXXX`), driving license, and permanent address along with an **optional** square-compressed progressive profile avatar uploader.
- **Vault-Secured Passcode**: Credentials (secure passcodes) are created solely by the Admin during vetting, cryptographically hashed using `bcryptjs` (10 rounds), and dispatched automatically to the technician via a beautifully styled welcome HTML email.

### 3. **Workforce & Fleet Command Center**
- **Split Fleet Dashboard**: Redesigned workforce command panel managing **Active Fleet** (available technicians) vs. **Pending Applications** vs. **Rejected / Suspended** rosters.
- **Vetting Viewer**: Clicking any candidate opens an overlay showing permanent address, document verification proofs, and detailed timelines.
- **Fleet Control Actions**: Real-time interactive modals to **Approve (passcode input)**, **Reject (reason input)**, and **Suspend (session revocation)**.

### 4. **Enterprise Session & Security Vault**
- **Dual-Token Auth**: Signed stateless short-lived Access Tokens (15 min) + stateful Refresh Tokens (7 days) served inside **HTTP-only, Lax, Secure** cookies.
- **Silent Token Rotation**: Automatic Axios interceptors that capture expired access tokens, rotate them silently via `/api/auth/refresh`, and seamlessly retry original user queries.
- **Recognized Devices Tracking**: Stores user device fingerprints. Unrecognized device logins trigger branded **New Login Warning Emails** listing IP, platform, and browser data.
- **Interactive Security Dashboard**: Real-time security panel for Customers, Agents, and Admins to inspect current and active remote sessions, remotely revoke other logins, or sign out globally.

### 5. **Smart Maintenance System**
- **Schedule Auto-Generation**: Triggers daily reminder evaluations.
- **Pre-filter Calibration**: Creates service check-in schedules 3 months post-completion.
- **RO Membrane Replacements**: Creates renewal schedules 6 months post-completion.
- **Multi-Channel Notification Gateway**: Sends in-app messages and nodemailer-powered HTML emails, plus **MSG91 SMS OTP** for login/verification.

---

## 🏗️ Project Structure

This is a **multi-frontend monorepo**: three independent React apps share one Express + Prisma backend.

```
filter-service/
├── server/                          # Node.js + Express backend
│   ├── prisma/
│   │   └── schema.prisma            # 17 PostgreSQL models (Customer, Agent, Admin,
│   │                                #   Booking, Invoice, Session, RefreshToken, ...)
│   ├── lib/
│   │   ├── prisma.js                # Shared Prisma client (+ `_id` alias for frontend compat)
│   │   └── sanitize.js              # Strips secrets from responses (replaces Mongoose toJSON)
│   ├── controllers/                 # Business logic (auth, admin, booking, customer, agent)
│   ├── routes/                      # API endpoints (authRoutes, adminRoutes, serviceRoutes, ...)
│   ├── middleware/                  # Auth, validation, rate limits, XSS scrubs, CSRF checkers
│   ├── services/                    # Email, MSG91 SMS, and Cron scheduler engines
│   ├── utils/                       # Token helpers, UA parser, and DB seeders
│   └── server.js                    # Core app entry point
│
├── customer-app/                    # Consumer-facing React + Vite app   (dev port 3000)
├── agent-app/                       # Field technician React + Vite app   (dev port 4000)
├── admin-panel/                     # Admin control center React + Vite   (dev port 6001)
│
├── render.yaml                      # Render blueprint for the backend web service
└── package.json                     # Root scripts to run/build all apps together
```

Each frontend app contains `src/pages`, `src/components`, `src/services` (Axios client with silent
dual-token rotation), `src/context` (Zustand `authStore`), and its own `vite.config.js`.

> **Why three apps instead of one `client/`?** Strict role isolation — each app only accepts its own
> role (`customer` / `agent` / `admin`) and deploys to its own domain, so a customer build never ships
> admin code. See [MULTI_APP_README.md](MULTI_APP_README.md).

---

## 🚀 Getting Started

### Prerequisites
- Node.js **v18+**
- A **Supabase** project (free tier is fine) for the PostgreSQL database

### Backend Setup

1. **Install Server Dependencies** (this also runs `prisma generate` via `postinstall`)
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment Variables (`server/.env`)** — copy from `server/.env.example`
   ```env
   PORT=5001
   NODE_ENV=development

   # Supabase (PostgreSQL via Prisma) — get from Supabase → Connect → ORMs → Prisma
   DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"  # pooled (runtime)
   DIRECT_URL="postgresql://...pooler.supabase.com:5432/postgres"                    # direct (migrations)

   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=7d

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password

   MSG91_AUTH_KEY=your_msg91_auth_key       # primary OTP channel
   MSG91_TEMPLATE_ID=your_msg91_template_id

   FRONTEND_URL=http://localhost:3000
   ```

3. **Apply the Prisma schema to your database**
   ```bash
   npx prisma db push      # or: npx prisma migrate dev
   ```

4. **Boot Backend Server**
   ```bash
   npm run dev             # nodemon (or `npm start` for production)
   ```

### Frontend Setup

Each app is set up the same way. Example for the customer app:

1. **Install dependencies**
   ```bash
   cd customer-app          # or agent-app / admin-panel
   npm install
   ```

2. **Configure Environment Variables (`customer-app/.env`)**
   ```env
   VITE_API_URL=http://localhost:5001
   ```

3. **Launch Vite Development Server**
   ```bash
   npm run dev
   ```

### Run Everything At Once

From the repo root:
```bash
npm run install-all      # installs root + server + all three frontends
npm run dev              # concurrently starts server + customer + agent + admin
```

| App | Dev URL | Role |
|-----|---------|------|
| Customer | http://localhost:3000 | Customer/User |
| Agent | http://localhost:4000 | Technician/Agent |
| Admin | http://localhost:6001 | Administrator |
| Backend API | http://localhost:5001 | N/A |

---

## 🔐 Advanced Security Features

- **XSS & Injection Mitigation**: Recursive scrubbers cleaning request attributes; Prisma's parameterized queries eliminate SQL injection surface.
- **CSRF Token Guards**: Header/origin matchers guarding state-changing endpoints — allow-list plus any `*.vercel.app` origin so production frontends and preview deploys pass.
- **Auth Rate-Limiting**: Strictly restricts authentication attempts; global limiter is environment-aware (relaxed in dev for SPA traffic).
- **Bcrypt Security**: All onboarding passcodes and customer passwords are hashed (10 rounds) before saving.
- **HTTP-Only Cookies**: Refresh tokens cannot be accessed by client-side browser scripts, stopping cookie theft.

---

## ☁️ Deployment

The platform ships production-ready:

- **Backend → Render** via the included [`render.yaml`](render.yaml) blueprint. `npm install` runs
  `prisma generate` (postinstall); secrets (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, SMTP, MSG91)
  are set in the Render dashboard. Health check: `/api/health`.
- **Frontends → Vercel** — deploy `customer-app`, `agent-app`, and `admin-panel` as three separate
  Vercel projects, each with `VITE_API_URL` pointing at the Render API URL.
- **Database → Supabase** managed PostgreSQL.

CORS and CSRF automatically accept any `*.vercel.app` origin, and avatar upload URLs are built from
the request host (not a hardcoded localhost), so uploads resolve correctly behind Render's domain.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full walkthrough.

---

## 📚 Documentation

- **[CHANGELOG.md](CHANGELOG.md)** — what changed recently and why (MongoDB → Supabase, production hardening).
- [MULTI_APP_README.md](MULTI_APP_README.md) — multi-frontend architecture.
- [ARCHITECTURE.md](ARCHITECTURE.md) — system design.
- [SETUP_GUIDE.md](SETUP_GUIDE.md) / [QUICKSTART.md](QUICKSTART.md) — getting running.
- [DEPLOYMENT.md](DEPLOYMENT.md) — Render + Vercel deploy.
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — common issues.
- [server/MIGRATION_CONVENTIONS.md](server/MIGRATION_CONVENTIONS.md) — Mongoose → Prisma data-modeling rules.

---

## 📞 Support & Inquiries

For technical support or certified technician alignment:
- Email: support@filternest.com
- Portal: FilterNest Security Hub
