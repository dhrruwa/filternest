# Quick Start Guide

> **Note:** See `CHANGELOG.md` for the migration from MongoDB/Mongoose to Supabase (PostgreSQL via Prisma) and production hardening.

## 🚀 5-Minute Setup

### Step 1: Navigate to the Repo
```bash
cd /Users/dhruva/Documents/filter_service_v0
```

### Step 2: Install All Dependencies
```bash
npm run install-all   # root + server + customer-app + agent-app + admin-panel
```

### Step 3: Configure Environment

**Backend (.env)**
```bash
cd server
cp .env.example .env
```

Edit `.env`:
```env
PORT=5001
NODE_ENV=development

# Supabase (PostgreSQL via Prisma) — from Supabase Dashboard -> Connect -> ORMs -> Prisma
# DATABASE_URL = pooled (port 6543, ?pgbouncer=true) used at runtime
# DIRECT_URL   = direct (port 5432) used by Prisma Migrate / db push
DATABASE_URL="postgresql://postgres.<project-ref>:<db-password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<db-password>@<region>.pooler.supabase.com:5432/postgres"

JWT_SECRET=your_super_secret_key_12345
JWT_EXPIRE=7d

# OTP: MSG91 SMS is the primary channel; SMTP email is a fallback
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_TEMPLATE_ID=your_msg91_template_id
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_or_16char_code
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env)** — each of the three apps (`customer-app`, `agent-app`, `admin-panel`) has its own `.env`:
```bash
# In each app dir:
cp .env.example .env   # if present; otherwise set VITE_API_URL=http://localhost:5001
```

### Step 4: Database Setup (Supabase + Prisma)

The schema lives in `server/prisma/schema.prisma` (17 models). After setting `DATABASE_URL` / `DIRECT_URL`:

```bash
cd server
npx prisma db push      # create/update tables in Supabase
npx prisma generate     # regenerate Prisma client (also runs on postinstall/build)
```

> Don't have a Supabase project yet? Create one free at https://supabase.com, then copy the Prisma connection strings from Dashboard -> Connect -> ORMs -> Prisma.

### Step 5: Seed Initial Data
```bash
npm run seed   # from repo root (seeds service catalog)
```

### Step 6: Start Development Servers

**Option A — one command (from repo root):**
```bash
npm run dev   # runs backend + all 3 frontends concurrently
```

**Option B — separate terminals:**
```bash
# Terminal 1 - Backend
cd server && npm run dev          # http://localhost:5001

# Terminal 2 - Customer App
cd customer-app && npm run dev    # http://localhost:3000

# Terminal 3 - Agent App
cd agent-app && npm run dev       # http://localhost:4000

# Terminal 4 - Admin Panel
cd admin-panel && npm run dev     # http://localhost:6001
```

### Step 7: Access the Application
- Customer App: http://localhost:3000
- Agent App: http://localhost:4000
- Admin Panel: http://localhost:6001  *(not 6000 — browsers block 6000 as ERR_UNSAFE_PORT)*
- Backend API: http://localhost:5001/api
- Health Check: http://localhost:5001/api/health

## 📝 Default Test Credentials

After seeding, use these to test:

**Customer:**
- Email: customer@example.com
- Password: password123

**Agent:**
- Email: agent@example.com
- Password: password123

**Admin:**
- Email: admin@example.com
- Password: password123

*(These will be available after you create users through registration)*

## 📂 Project Structure

```
filter_service_v0/
├── server/                 # Node.js backend (Express)
│   ├── prisma/            # schema.prisma (17 models) — Supabase/PostgreSQL
│   ├── lib/               # prisma.js (client, aliases id->_id), sanitize.js
│   ├── controllers/       # Business logic
│   ├── routes/            # API endpoints
│   ├── services/          # Services (email, notifications, scheduler)
│   ├── middleware/        # Auth, validation, security
│   ├── utils/             # Utilities
│   ├── server.js          # Entry point
│   └── package.json
│
├── customer-app/           # Customer React + Vite app (port 3000)
├── agent-app/              # Agent React + Vite app (port 4000)
├── admin-panel/            # Admin React + Vite app (port 6001)
│   └── (each: src/pages, src/components, src/services, src/context, vite.config.js, .env)
│
├── render.yaml            # Render backend deploy config
├── CHANGELOG.md           # MongoDB->Supabase migration + hardening log
├── README.md              # Full documentation
└── package.json           # Root scripts (npm run dev runs all)
```

## 🔐 Environment Variables Checklist

### Backend (.env)
- [ ] DATABASE_URL (Supabase pooled, :6543, ?pgbouncer=true)
- [ ] DIRECT_URL (Supabase direct, :5432 — for prisma db push)
- [ ] JWT_SECRET (Change from default!)
- [ ] MSG91_AUTH_KEY / MSG91_TEMPLATE_ID (primary OTP — SMS)
- [ ] SMTP_USER / SMTP_PASS (email fallback)
- [ ] FRONTEND_URL (Frontend address)

### Frontend (.env)
- [ ] VITE_API_URL (Backend API URL)
- [ ] VITE_GOOGLE_MAPS_API_KEY (Optional, for maps)

## 🧪 Testing the API

### Using cURL

**Register Customer:**
```bash
curl -X POST http://localhost:5001/api/auth/register/customer \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5001/api/auth/login/customer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get Services:**
```bash
curl http://localhost:5001/api/services
```

### Using Postman
1. Download Postman: https://www.postman.com/downloads/
2. Import the API endpoints (create collection)
3. Set base URL to `http://localhost:5001/api`
4. Test endpoints with request body

## 🚨 Common Issues & Solutions

### Database (Supabase/Prisma) Connection Failed
```bash
# Verify DATABASE_URL (pooled, :6543, ?pgbouncer=true) and
# DIRECT_URL (direct, :5432) are set in server/.env

# Push schema to Supabase
cd server && npx prisma db push

# Regenerate the Prisma client if you see client errors
npx prisma generate
```
See TROUBLESHOOTING.md for pooled-vs-direct connection details.

### Port Already in Use
```bash
# Kill process on backend port 5001:
lsof -ti:5001 | xargs kill -9

# Kill process on port 3000 (customer app):
lsof -ti:3000 | xargs kill -9
```

### CORS Error
- Ensure FRONTEND_URL is set correctly in backend .env
- Check browser console for error details
- Deployed frontends: CORS/CSRF accept any *.vercel.app origin automatically

### OTP / Email Not Sending
- OTP is delivered via MSG91 SMS first — verify MSG91_AUTH_KEY / MSG91_TEMPLATE_ID
- SMTP email is the fallback — verify SMTP credentials (Gmail app password, not regular password)
- Note: Render blocks outbound SMTP in production, so SMS is the production OTP channel

## 🎯 Next Steps

1. **Configure Email Service**
   - Get Gmail app password or use SendGrid
   - Update SMTP settings in .env

2. **Add Google Maps API**
   - Get API key from Google Cloud Console
   - Add to frontend .env

3. **Set Up Database Backups**
   - Supabase provides automatic daily backups (Dashboard -> Database -> Backups)

4. **Deploy to Production**
   - Backend -> Render (via render.yaml); Frontends -> Vercel; DB -> Supabase
   - See SETUP_GUIDE.md (Deployment section) and CHANGELOG.md

5. **Set Up Monitoring**
   - Add error tracking (Sentry)
   - Set up uptime monitoring
   - Configure logging

## 📞 Support

- **Documentation:** See README.md and ARCHITECTURE.md
- **Issues:** Check DEPLOYMENT.md troubleshooting section
- **API Docs:** Endpoints documented in routes/ folder

## 🎓 Learning Resources

- React: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Express.js: https://expressjs.com
- Prisma: https://www.prisma.io/docs
- Supabase: https://supabase.com/docs
- Framer Motion: https://www.framer.com/motion

---

**You're all set! Start building and enjoy! 🎉**
