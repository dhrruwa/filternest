# FilterNest Multi-App Setup Guide

> **Note:** See `CHANGELOG.md` for the recent migration from MongoDB/Mongoose to Supabase (PostgreSQL via Prisma) and production hardening (before → after rationale).

## Quick Start (5 Minutes)

### 1. One-Command Start (Recommended)
From the repo root:
```bash
npm run install-all   # install root + all 4 apps
npm run dev           # runs backend + all 3 frontends concurrently
```

This will:
- Start the backend API on port 5001
- Start the customer app on port 3000
- Start the agent app on port 4000
- Start the admin panel on port **6001** (not 6000 — browsers block 6000 as ERR_UNSAFE_PORT)

Then open:
- 🛒 Customer: http://localhost:3000
- 🔧 Agent: http://localhost:4000
- ⚙️ Admin: http://localhost:6001

### 2. Manual Start (If Preferred)

Open 4 terminals and run (the backend needs the Prisma schema pushed first — see Database Setup below):

**Terminal 1 - Backend**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 - Customer App**
```bash
cd customer-app
npm install
npm run dev
```

**Terminal 3 - Agent App**
```bash
cd agent-app
npm install
npm run dev
```

**Terminal 4 - Admin Panel**
```bash
cd admin-panel
npm install
npm run dev
```

## Configuration Files

### Backend Environment (.env)
Create or update `server/.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=5001

# Database - Supabase (PostgreSQL via Prisma)
# Get these from: Supabase Dashboard -> Connect -> ORMs -> Prisma
# DATABASE_URL = pooled connection (port 6543, ends with ?pgbouncer=true) used at runtime
# DIRECT_URL   = direct connection (port 5432) used by Prisma Migrate / db push
DATABASE_URL="postgresql://postgres.<project-ref>:<db-password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<db-password>@<region>.pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email Service (Nodemailer) - SMTP fallback for OTP/notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# MSG91 OTP Configuration (primary OTP channel - SMS)
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_TEMPLATE_ID=your_msg91_template_id

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Session Secret
SESSION_SECRET=your_session_secret_change_this
```

### Database Setup (Supabase + Prisma)

The schema lives in `server/prisma/schema.prisma` (17 models). After setting `DATABASE_URL` / `DIRECT_URL`, push it to Supabase:

```bash
cd server
npx prisma db push      # creates/updates tables in Supabase
npx prisma generate     # regenerate the Prisma client (also runs on postinstall/build)
```

OTP delivery uses **MSG91 SMS as the primary channel**, with SMTP email as a fallback (Render blocks outbound SMTP in production, so SMS is preferred there).

### Frontend Environment Files

Each frontend app has a `.env` file pointing to the backend:

**customer-app/.env**
```env
VITE_API_URL=http://localhost:5001
VITE_APP_NAME=FilterNest Customer
```

**agent-app/.env**
```env
VITE_API_URL=http://localhost:5001
VITE_APP_NAME=FilterNest Agent
```

**admin-panel/.env**
```env
VITE_API_URL=http://localhost:5001
VITE_APP_NAME=FilterNest Admin
```

## Test Credentials

After starting the server, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@test.com | password123 |
| Admin | admin@filternest.com | admin123 |

## Verify Setup

Run the verification script:
```bash
./verify-multi-app.sh
```

Should output:
```
✓ All checks passed! System ready.
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   API Gateway (5001)                     │
│                  backend/server.js                       │
│   ┌──────────────────────────────────────────────────┐  │
│   │ Supabase/Prisma │ JWT Auth │ CORS │ Rate Limit  │  │
│   └──────────────────────────────────────────────────┘  │
│   /api/customers  /api/agents  /api/admin /api/bookings │
└─────────────────────────────────────────────────────────┘
                           ▲
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────┐       ┌─────────┐       ┌─────────┐
    │ Customer│       │  Agent  │       │ Admin   │
    │  App    │       │   App   │       │ Panel   │
    │ (3000)  │       │ (4000)  │       │ (6001)  │
    │ React   │       │ React   │       │ React   │
    │ Vite    │       │ Vite    │       │ Vite    │
    └─────────┘       └─────────┘       └─────────┘
```

## Common Issues & Solutions

### Port Already in Use
```bash
# Kill process on specific port
lsof -ti:3000 | xargs kill -9

# For all ports at once
for port in 3000 4000 5001 6001; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
```

> Admin runs on **6001**, not 6000: Chrome/Firefox block port 6000 as ERR_UNSAFE_PORT.

### CORS Errors
- Check backend is running
- Verify API_URL in frontend .env matches backend port
- Check browser console for exact error

### Database (Supabase/Prisma) Connection Failed
```bash
# Verify DATABASE_URL (pooled, :6543, ?pgbouncer=true) and
# DIRECT_URL (direct, :5432) are set in server/.env

# Push the schema to Supabase
cd server && npx prisma db push

# Regenerate the Prisma client if you see client errors
npx prisma generate
```
See TROUBLESHOOTING.md for pooled-vs-direct connection details.

### Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## Deployment

### Build All Apps
```bash
# Customer
cd customer-app && npm run build

# Agent
cd agent-app && npm run build

# Admin
cd admin-panel && npm run build

# Backend (if needed)
cd server && npm run build
```

### Deploy to Vercel (Recommended for Frontend)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy each app
cd customer-app && vercel
cd ../agent-app && vercel
cd ../admin-panel && vercel
```

### Deploy Backend to Render
The backend deploys to **Render** using the committed `render.yaml`.

```bash
# 1. Push the repo to GitHub
# 2. In Render, create a service from render.yaml (Blueprint)
# 3. Set environment variables in the Render dashboard:
#      DATABASE_URL   (Supabase pooled, :6543, ?pgbouncer=true)
#      DIRECT_URL     (Supabase direct, :5432)
#      JWT_SECRET
#      MSG91_AUTH_KEY, MSG91_TEMPLATE_ID
#      SMTP_* (fallback)
```

Notes:
- `prisma generate` runs automatically on `postinstall`/`build`.
- CORS/CSRF accept any `*.vercel.app` origin, so the Vercel frontends work without listing exact URLs.
- Avatar URLs are built from the request host.
- Render blocks outbound SMTP, so OTP uses MSG91 SMS in production.

## Project Structure

```
filter-nest/
├── server/                 # Backend API
│   ├── prisma/            # schema.prisma (17 models) — Supabase/PostgreSQL
│   ├── lib/               # prisma.js (client, aliases id->_id), sanitize.js
│   ├── controllers/       # Business logic
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth, validation, security
│   ├── services/          # Utilities (email, scheduler)
│   ├── package.json
│   ├── server.js
│   └── .env
│
├── customer-app/          # Customer Frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── context/      # Zustand stores
│   │   ├── services/     # API calls
│   │   ├── utils/        # Helper functions
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── agent-app/            # Agent Frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── admin-panel/          # Admin Frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── render.yaml           # Render backend deploy config
├── CHANGELOG.md          # MongoDB->Supabase migration + hardening log
├── start-all.sh          # Startup script
├── verify-multi-app.sh   # Verification script
└── MULTI_APP_README.md   # Full documentation
```

## What's Included

### Customer App Features
- ✅ User registration & authentication
- ✅ Service booking system
- ✅ Real-time booking tracking
- ✅ Payment management
- ✅ Invoice viewing
- ✅ Profile management
- ✅ Support ticketing
- ✅ Responsive design

### Agent App Features
- ✅ Agent authentication
- ✅ Job assignment dashboard
- ✅ GPS location tracking
- ✅ Attendance management
- ✅ Earnings tracking
- ✅ Performance analytics
- ✅ Mobile-first UI
- ✅ Job status updates

### Admin Panel Features
- ✅ Admin authentication
- ✅ Customer management
- ✅ Agent management
- ✅ Booking management & allocation
- ✅ Payment & invoice tracking
- ✅ Analytics & reporting
- ✅ System configuration
- ✅ Dark theme UI

### Backend Features
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ CORS configuration for 3 frontends (+ any *.vercel.app origin)
- ✅ Supabase/PostgreSQL via Prisma (17 models)
- ✅ REST API endpoints
- ✅ Email notifications
- ✅ Automated scheduling
- ✅ Error handling & logging
- ✅ Rate limiting
- ✅ Security middleware

## Next Steps

1. ✅ Start all apps: `./start-all.sh`
2. ✅ Test customer login: customer@test.com / password123
3. ✅ Test admin login: admin@filternest.com / admin123
4. ✅ Create a booking in customer app
5. ✅ View booking in admin panel
6. ✅ Customize branding and colors
7. ✅ Deploy to production

## Support

For issues or questions:
1. Check the MULTI_APP_README.md for detailed docs
2. Review backend logs in the terminal
3. Check browser console for frontend errors
4. Contact: support@filternest.com

---

**🎉 Welcome to FilterNest! Happy coding!**
