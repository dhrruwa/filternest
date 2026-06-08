# 📚 FilterNest Multi-App Architecture - Complete Documentation Index

> **Note:** See `CHANGELOG.md` for the migration from MongoDB/Mongoose to Supabase (PostgreSQL via Prisma) and production hardening (before → after rationale).

## 🎯 Start Here

### Fastest Way to Get Running
```bash
npm run install-all   # root + all 4 apps
npm run dev           # backend + all 3 frontends concurrently
```

Then open:
- 🛒 Customer: http://localhost:3000
- 🔧 Agent: http://localhost:4000  
- ⚙️ Admin: http://localhost:6001  (not 6000 — browsers block 6000 as ERR_UNSAFE_PORT)

---

## 📖 Documentation Guide

### For First-Time Users
1. Start with **README.md** - Project overview
2. Read **SETUP_GUIDE.md** - Step-by-step setup
3. Run **start-all.sh** - Start everything
4. Test with credentials below

### For Architecture Understanding
1. Read **MULTI_APP_README.md** - Comprehensive guide
2. Check **TRANSFORMATION_SUMMARY.md** - What changed
3. Review **DELIVERABLES.md** - What was created

### For Troubleshooting
1. Check **TROUBLESHOOTING.md** - Common issues
2. Run **verify-multi-app.sh** - Verify setup
3. Review terminal logs

### For Deployment
1. Read **MULTI_APP_README.md** (Deployment section)
2. Check **SETUP_GUIDE.md** (Deployment section)
3. Build commands listed below

---

## 📋 Documentation Files

| File | Purpose | Pages |
|------|---------|-------|
| `MULTI_APP_README.md` | Complete architecture documentation | 50+ |
| `SETUP_GUIDE.md` | Detailed setup and configuration | 30+ |
| `TROUBLESHOOTING.md` | Problem solving guide | 40+ |
| `TRANSFORMATION_SUMMARY.md` | Architecture changes | 20+ |
| `DELIVERABLES.md` | Complete deliverables list | 30+ |
| `README.md` | Project overview | 10+ |
| `QUICKSTART.md` | 5-minute setup (Supabase/Prisma) | 10+ |
| `CHANGELOG.md` | MongoDB → Supabase migration + production hardening, with before → after rationale | — |

---

## 🚀 Quick Commands

```bash
# ONE COMMAND STARTUP (from repo root)
npm run dev   # runs backend + all 3 frontends concurrently

# Push the database schema to Supabase (first run)
cd server && npx prisma db push

# Manual startup (use 4 terminals)
Terminal 1: cd server && npm install && npm run dev        # 5001
Terminal 2: cd customer-app && npm install && npm run dev  # 3000
Terminal 3: cd agent-app && npm install && npm run dev     # 4000
Terminal 4: cd admin-panel && npm install && npm run dev   # 6001
```

---

## 🔐 Test Credentials

```
CUSTOMER APP (http://localhost:3000)
├── Email: customer@test.com
├── Password: password123
└── Features: Book services, track bookings, manage payments

ADMIN PANEL (http://localhost:6001)
├── Email: admin@filternest.com
├── Password: admin123
└── Features: Manage customers, agents, bookings, analytics

AGENT APP (http://localhost:4000)
├── Status: Apply from customer app
├── Approval: Admin approves in admin panel
└── Features: View jobs, track location, manage attendance
```

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                   Multi-Frontend SaaS                    │
└──────────────────────────────────────────────────────────┘

            Supabase (PostgreSQL) via Prisma
                        │
         ┌──────────────┴──────────────┐
         │                             │
    Backend API               Role-Based Auth
    (Port 5001)               JWT Tokens
    Express.js                

         │
    ┌────┼────────────────┐
    │    │                │
    ▼    ▼                ▼
Customer Agent            Admin
App      App              Panel
3000     4000             6001
React    React            React
Vite     Vite             Vite
```

---

## ✅ Pre-Flight Checklist

Before starting, verify:
- [ ] Node.js v18+ installed (engines: ">=18")
- [ ] npm or yarn installed
- [ ] Supabase project created; DATABASE_URL + DIRECT_URL set, schema pushed (`npx prisma db push`)
- [ ] Ports 3000, 4000, 5001, 6001 are free
- [ ] All .env files configured

**Verify setup:**
```bash
./verify-multi-app.sh
```

---

## 📱 Applications Overview

### 1. Customer App (Port 3000)
**Purpose:** Consumer booking service management

**Key Pages:**
- Home - Landing page
- Services - Browse available services
- Book Service - Schedule a service
- My Bookings - View bookings & track status
- Dashboard - Customer overview
- Payments - Payment history
- Profile - Customer profile management

**Tech:** React + Vite + Tailwind (Blue theme)

### 2. Agent App (Port 4000)
**Purpose:** Field workforce management

**Key Pages:**
- Dashboard - Job overview
- Jobs - Assigned jobs list
- Attendance - Mark attendance
- Earnings - View earnings
- Profile - Agent profile

**Tech:** React + Vite + Tailwind (Teal theme)

### 3. Admin Panel (Port 6001)
**Purpose:** Enterprise administration

**Key Pages:**
- Dashboard - Analytics & metrics
- Customers - Customer management
- Agents - Agent management & approval
- Bookings - Booking allocation
- Payments - Payment tracking
- Reports - Advanced analytics

**Tech:** React + Vite + Tailwind (Dark theme)

### 4. Backend API (Port 5001)
**Purpose:** Centralized business logic

**Routes:**
- `/api/auth/*` - Authentication
- `/api/customers/*` - Customer endpoints
- `/api/agents/*` - Agent endpoints
- `/api/bookings/*` - Booking management
- `/api/admin/*` - Admin endpoints
- `/api/notifications/*` - Notifications
- `/api/services/*` - Service catalog

**Tech:** Express.js + Supabase (PostgreSQL via Prisma) + JWT

---

## 🔧 Configuration

### Environment Variables

**Backend (server/.env)**
```env
NODE_ENV=development
PORT=5001

# Supabase (PostgreSQL via Prisma)
DATABASE_URL="postgresql://postgres.<ref>:<pw>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<pw>@<region>.pooler.supabase.com:5432/postgres"

JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRE=7d

# OTP: MSG91 SMS primary, SMTP email fallback
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_TEMPLATE_ID=your_msg91_template_id
```

**Frontend (.env in each app)**
```env
VITE_API_URL=http://localhost:5001
```

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Frontend Apps | 3 ✅ |
| Backend APIs | 1 (Shared) ✅ |
| Total Ports | 4 (3000, 4000, 5001, 6001) |
| Database | Supabase (PostgreSQL) via Prisma 6 — 17 models |
| Framework | React 18 + Express.js |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| State Mgmt | Zustand |
| Authentication | JWT |

---

## 🎯 Key Features

### ✅ Implemented Features

**Customer App:**
- [x] User registration & email verification
- [x] Login with OTP option
- [x] Service browsing
- [x] Booking with location picker
- [x] Real-time tracking
- [x] Payment management
- [x] Invoice download
- [x] Notifications
- [x] Support tickets

**Agent App:**
- [x] Agent authentication
- [x] Job dashboard
- [x] GPS tracking
- [x] Attendance management
- [x] Earnings tracking
- [x] Performance metrics
- [x] Mobile-first UI

**Admin Panel:**
- [x] Admin authentication
- [x] Customer management
- [x] Agent management
- [x] Booking allocation
- [x] Payment tracking
- [x] Analytics & reports
- [x] System monitoring

**Backend:**
- [x] Supabase (PostgreSQL) integration via Prisma
- [x] JWT authentication
- [x] Role-based authorization
- [x] CORS for 3 apps
- [x] Email notifications
- [x] Automated scheduling
- [x] Rate limiting
- [x] Security middleware

---

## 🚀 Getting Started Workflow

```
1. Run ./start-all.sh
        ↓
2. Wait for all apps to start
        ↓
3. Open http://localhost:3000 (Customer)
        ↓
4. Login with customer@test.com / password123
        ↓
5. Book a service
        ↓
6. Open http://localhost:6001 (Admin)
        ↓
7. Login with admin@filternest.com / admin123
        ↓
8. See the booking in admin dashboard
        ↓
9. Allocate to agent
        ↓
10. Done! ✅
```

---

## 🐛 If Something Goes Wrong

1. **Check logs in terminal** - Look for error messages
2. **Run verification script:**
   ```bash
   ./verify-multi-app.sh
   ```
3. **Clear cache and reinstall:**
   ```bash
   rm -rf */node_modules
   npm cache clean --force
   npm install
   ```
4. **Check ports:**
   ```bash
   lsof -i :3000 :4000 :5001 :6001
   ```
5. **See TROUBLESHOOTING.md** for detailed solutions

---

## 📚 Documentation Recommendations

### First-Time Setup
1. Read: SETUP_GUIDE.md
2. Read: MULTI_APP_README.md (Architecture section)
3. Run: ./start-all.sh
4. Test with provided credentials

### Understanding Architecture
1. Read: TRANSFORMATION_SUMMARY.md
2. Read: MULTI_APP_README.md (Architecture Overview)
3. Review: DELIVERABLES.md

### Troubleshooting
1. Check: TROUBLESHOOTING.md
2. Run: ./verify-multi-app.sh
3. Review: Terminal logs

### Deployment
1. Read: SETUP_GUIDE.md (Deployment section)
2. Read: MULTI_APP_README.md (Deployment section)
3. Build: npm run build in each app

---

## 📞 Support Resources

**Quick Help:**
- 🚀 Quick Start: SETUP_GUIDE.md
- 🔍 Verify Setup: Run `./verify-multi-app.sh`
- 🐛 Debugging: TROUBLESHOOTING.md
- 📖 Full Docs: MULTI_APP_README.md

**Commands:**
```bash
# Start all apps
./start-all.sh

# Verify configuration
./verify-multi-app.sh

# Clear cache and reinstall
rm -rf */node_modules && npm cache clean --force && npm install

# Kill all npm processes
pkill -f "npm run dev"
```

---

## ✨ Summary

Your FilterNest system now has:

✅ **3 Independent Frontend Applications**
- Customer (Port 3000)
- Agent (Port 4000)
- Admin (Port 6001)

✅ **1 Centralized Backend API**
- Port 5001
- Supabase (PostgreSQL) via Prisma
- JWT authentication

✅ **Professional Documentation**
- Setup guides
- Architecture docs
- Troubleshooting guides
- Deployment instructions

✅ **Automation Scripts**
- start-all.sh - One command startup
- verify-multi-app.sh - Configuration verification

✅ **Production Ready**
- All tests passing
- Security features implemented
- Error handling in place
- Ready to deploy

---

## 🎉 You're Ready to Go!

1. Run: `./start-all.sh`
2. Login with test credentials
3. Explore the applications
4. Read documentation for details
5. Deploy to production when ready

**Happy Coding! 🚀**

---

**For complete information, see the full documentation files listed above.**
