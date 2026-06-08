# GitHub Copilot Instructions

## Project Overview
Water Filter Service Management System - A production-ready full-stack application for managing water purifier servicing, maintenance schedules, and customer bookings.

## Technology Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion (three separate apps)
- **Backend**: Node.js (>=18) + Express.js
- **Database**: Supabase (PostgreSQL) accessed via Prisma 6 — NOT MongoDB/Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: Zustand
- **API Client**: Axios
- **Validation**: Express-validator + Client-side validation
- **OTP / Messaging**: MSG91 SMS (primary), SMTP email as fallback
- **Email**: Nodemailer
- **Scheduling**: Node-cron
- **Notifications**: Multi-channel (Email, SMS)

## Project Structure
This is a multi-frontend SaaS layout. There is NO single `/client` folder.
- `/server` - Express backend (controllers, routes, middleware, services, utils)
  - `/server/prisma/schema.prisma` - Prisma schema (17 models). There are no `server/models/*.js` files.
  - `/server/lib/prisma.js` - shared Prisma client; aliases Postgres `id` to `_id` for API responses.
  - `/server/lib/sanitize.js` - strips secrets/sensitive fields before returning records.
- `/customer-app` - Customer React+Vite app (port 3000)
- `/agent-app` - Agent React+Vite app (port 4000)
- `/admin-panel` - Admin React+Vite app (port 6001 — NOT 6000; browsers block 6000 as ERR_UNSAFE_PORT)
- Each app has its own `.env`; backend has its own `.env`

## Key Features Implemented
1. ✅ Customer registration, login, and profile management
2. ✅ Service booking system with geolocation capture
3. ✅ Service agent dashboard with status updates
4. ✅ Admin dashboard with analytics
5. ✅ Automatic maintenance scheduling (3-month pre-filter, 6-month membrane)
6. ✅ Email notifications and reminders
7. ✅ Role-based access control
8. ✅ JWT authentication and authorization
9. ✅ Mobile-responsive UI with Tailwind CSS
10. ✅ Smooth animations with Framer Motion

## Development Guidelines
- Use `.env` files for sensitive configuration. The DB env vars are `DATABASE_URL` (pooled connection, port 6543, append `?pgbouncer=true`) and `DIRECT_URL` (port 5432, used for migrations). `MONGODB_URI` no longer exists.
- Always access the database through `server/lib/prisma.js`; never instantiate a new PrismaClient. Remember it exposes `_id` (aliased from Postgres `id`).
- Run records through `server/lib/sanitize.js` before returning them in API responses so secrets/sensitive fields are stripped.
- Follow REST API conventions for endpoints
- Implement proper error handling and validation
- Keep components modular and reusable; each frontend app (`customer-app`, `agent-app`, `admin-panel`) is independent
- Use Zustand for global state management in React
- Document all API endpoints and their requirements
- `prisma generate` runs automatically on postinstall/build, so the client is generated on Render too

## Database Schema (Prisma models, 17 total)
Defined in `server/prisma/schema.prisma`:
- Customer, Agent, Admin, Service, Booking, Invoice, Payment, MaintenanceSchedule,
  SupportTicket, Notification, Session, RefreshToken, LoginHistory, DeviceTracking,
  AadhaarVerification, EmailVerification, PasswordResetToken

## Running the Application
1. Backend: `cd server && npm run dev` (runs on port 5001)
2. Customer app: `cd customer-app && npm run dev` (port 3000)
3. Agent app: `cd agent-app && npm run dev` (port 4000)
4. Admin panel: `cd admin-panel && npm run dev` (port 6001)

## Important Notes
- Scheduler starts automatically on server initialization
- JWT tokens expire after 7 days by default
- All passwords are hashed explicitly in controller code (bcrypt) — this is NOT a Mongoose pre-save hook
- Geolocation uses browser's Geolocation API
- OTP delivery uses MSG91 SMS as primary, with SMTP email as fallback (Render blocks outbound SMTP)
- CORS/CSRF accept any `*.vercel.app` origin; avatar URLs are built from the request host
- Rate limiting enabled (global limit is environment-aware) to prevent abuse

## Deployment
- Backend → Render (see root `render.yaml`); `prisma generate` is wired into the build
- Frontends → Vercel (one project per app)
- Database → Supabase (PostgreSQL)

## Next Steps for Deployment
1. Provision a Supabase project and set `DATABASE_URL` + `DIRECT_URL`
2. Configure MSG91 (SMS) and SMTP (email fallback) credentials
3. Add Google Maps API key for maps integration
4. Set up environment variables for production on Render/Vercel
5. Build frontends: `npm run build` in each app
6. Deploy backend to Render and frontends to Vercel

See the root `CHANGELOG.md` for the full MongoDB→Supabase migration and production-hardening notes.
