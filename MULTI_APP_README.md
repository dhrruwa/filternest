# FilterNest Multi-Frontend SaaS Architecture

A professional multi-frontend SaaS application with separate frontend applications for customers, agents, and administrators, all connected to a centralized backend.

> **Migration note:** The backend has moved from MongoDB/Mongoose to Supabase (PostgreSQL) via Prisma 6. See [`CHANGELOG.md`](./CHANGELOG.md) for the full before → after rationale.

## 📋 Architecture Overview

```
filter-nest/
├── customer-app/      # Consumer-facing customer application
├── agent-app/         # Field workforce / technician application  
├── admin-panel/       # Enterprise administration panel
└── server/           # Centralized Express.js backend
```

## 🚀 Tech Stack

### Frontend (All Apps)
- **React 18** - UI framework
- **Vite** - Ultra-fast build tool
- **React Router v6** - Client-side routing
- **Zustand** - Global state management
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client
- **React Icons** - Icon library
- **React Hot Toast** - Toast notifications

### Backend
- **Node.js + Express.js** - Server framework
- **Supabase (PostgreSQL)** - Relational database
- **Prisma 6** - ORM (schema, migrations, type-safe client)
- **JWT** - Authentication
- **MSG91** - Primary OTP/SMS channel
- **Nodemailer** - Email service (best-effort fallback)
- **Express-validator** - Input validation

## 📦 Applications

### 1. Customer App (Port 3000)
Consumer-facing application for booking water filter maintenance services.

**Key Features:**
- Service booking system
- Booking history and tracking
- Payment management
- Invoice viewing
- Profile management
- Support center
- Notifications

**Pages:**
- `/` - Home
- `/services` - Browse services
- `/book-service` - Book a service
- `/my-bookings` - Service bookings dashboard
- `/profile` - Customer profile
- `/contact` - Contact support

### 2. Agent App (Port 4000)
Field workforce dashboard for service technicians.

**Key Features:**
- Job assignment and acceptance
- Real-time GPS tracking
- Attendance management
- Earnings dashboard
- Performance analytics
- Mobile-first UI
- Job scheduling

**Pages:**
- `/dashboard` - Main dashboard
- `/jobs` - Assigned jobs
- `/attendance` - Attendance records
- `/earnings` - Earnings overview
- `/profile` - Agent profile

### 3. Admin Panel (Port 6001)
Enterprise administration control center.

> Dev port is **6001**, not 6000 — browsers block port 6000 as `ERR_UNSAFE_PORT`.

**Key Features:**
- Customer management
- Agent/technician management
- Booking management and allocation
- Payment and invoice management
- Analytics and reporting
- Performance tracking
- System monitoring

**Pages:**
- `/dashboard` - Main dashboard
- `/customers` - Customer management
- `/agents` - Agent management
- `/bookings` - Booking management
- `/payments` - Payment tracking
- `/reports` - Analytics and reports

### 4. Backend Server (Port 5001)
Centralized API server handling all business logic.

**API Routes:**
```
/api/auth/*           - Authentication endpoints
/api/customers/*      - Customer-specific APIs
/api/agents/*         - Agent-specific APIs
/api/bookings/*       - Booking management
/api/admin/*          - Admin-specific APIs
/api/notifications/*  - Notification service
/api/services/*       - Service catalog
```

## 🔧 Installation

### Prerequisites
- Node.js >=18
- A Supabase (PostgreSQL) project (or any Postgres instance)
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd filter-nest
```

2. **Backend Setup**
```bash
cd server
npm install   # also runs `prisma generate` on postinstall
cp .env.example .env

# Edit .env with your configuration
# DATABASE_URL=postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true  # pooled, runtime
# DIRECT_URL=postgresql://...@...supabase.com:5432/postgres                          # direct, migrations
# JWT_SECRET=your_secret_key
# MSG91 credentials for OTP/SMS (primary)
# SMTP configuration for email (fallback)
# NODE_ENV=development
# PORT=5001

# Apply the Prisma schema to your database
npx prisma db push   # or: npx prisma migrate dev

npm run dev
```

3. **Customer App Setup**
```bash
cd ../customer-app
npm install
npm run dev
# Runs on http://localhost:3000
```

4. **Agent App Setup**
```bash
cd ../agent-app
npm install
npm run dev
# Runs on http://localhost:4000
```

5. **Admin Panel Setup**
```bash
cd ../admin-panel
npm install
npm run dev
# Runs on http://localhost:6001
```

## 🎯 Quick Start (All Apps)

### Option 1: Run apps in separate terminals

**Terminal 1 - Backend**
```bash
cd server && npm run dev
```

**Terminal 2 - Customer App**
```bash
cd customer-app && npm run dev
```

**Terminal 3 - Agent App**
```bash
cd agent-app && npm run dev
```

**Terminal 4 - Admin Panel**
```bash
cd admin-panel && npm run dev
```

### Option 2: Run all apps with a single command

Create a `start-all.sh` script in the root:
```bash
#!/bin/bash

# Start all applications in the background
echo "Starting FilterNest Multi-App Architecture..."

# Backend
cd server && npm run dev &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Customer App
cd ../customer-app && npm run dev &
CUSTOMER_PID=$!
echo "Customer App started (PID: $CUSTOMER_PID)"

# Agent App
cd ../agent-app && npm run dev &
AGENT_PID=$!
echo "Agent App started (PID: $AGENT_PID)"

# Admin Panel
cd ../admin-panel && npm run dev &
ADMIN_PID=$!
echo "Admin Panel started (PID: $ADMIN_PID)"

echo ""
echo "All applications started!"
echo "================================"
echo "Customer App:  http://localhost:3000"
echo "Agent App:     http://localhost:4000"
echo "Admin Panel:   http://localhost:6001"
echo "Backend API:   http://localhost:5001"
echo "================================"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
wait
```

Make it executable:
```bash
chmod +x start-all.sh
./start-all.sh
```

## 📱 Accessing Applications

| App | URL | Role |
|-----|-----|------|
| Customer | http://localhost:3000 | Customer/User |
| Agent | http://localhost:4000 | Technician/Agent |
| Admin | http://localhost:6001 | Administrator |
| Backend API | http://localhost:5001 | N/A |

## 🔐 Authentication

### Role-Based Access Control

Each application enforces role-based authentication:

**Customer App**
- Allows: `role = 'customer'`
- Blocks: Agent and Admin accounts

**Agent App**
- Allows: `role = 'agent'`
- Blocks: Customer and Admin accounts

**Admin Panel**
- Allows: `role = 'admin'`
- Blocks: Customer and Agent accounts

### Login Credentials

Test accounts are automatically seeded in the database:

**Customer Account**
- Email: customer@test.com
- Password: password123

**Admin Account**
- Email: <ADMIN_EMAIL from server/.env>
- Password: <ADMIN_PASSWORD from server/.env>

**Create New Accounts**
- Customers: Use registration form on customer app
- Agents: Apply via "Technician Application" on customer app
- Admins: Create manually in admin panel

## 🔄 API Communication

### CORS Configuration

The backend is configured to accept requests from all three frontend applications:

```javascript
cors({
  origin: [
    'http://localhost:3000',  // customer-app
    'http://localhost:4000',  // agent-app
    'http://localhost:6001'   // admin-panel
  ],
  credentials: true
})
```

> In production, CORS (and CSRF) also accept any `*.vercel.app` origin so the deployed frontends can reach the Render API.

### Environment Variables

Each app has an `.env` file pointing to the backend:

**customer-app/.env**
```
VITE_API_URL=http://localhost:5001
```

**agent-app/.env**
```
VITE_API_URL=http://localhost:5001
```

**admin-panel/.env**
```
VITE_API_URL=http://localhost:5001
```

## 🏗️ Project Structure

### Each App Has

```
app/
├── src/
│   ├── pages/          # Page components (role-specific)
│   ├── components/     # Reusable components
│   ├── context/        # Zustand store (authStore)
│   ├── services/       # API and business logic
│   ├── utils/          # Auth utilities
│   ├── styles/         # CSS files
│   ├── App.jsx         # Main router
│   └── main.jsx        # Entry point
├── public/             # Static assets
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
├── postcss.config.js   # PostCSS configuration
└── package.json        # Dependencies
```

## 🛠️ Building for Production

### Build All Apps

```bash
# Customer App
cd customer-app && npm run build

# Agent App
cd agent-app && npm run build

# Admin Panel
cd admin-panel && npm run build

# Backend (if needed)
cd server && npm run build
```

### Build Output

- `customer-app/dist/` - Ready to deploy to customer.filternest.com
- `agent-app/dist/` - Ready to deploy to agent.filternest.com
- `admin-panel/dist/` - Ready to deploy to admin.filternest.com

## 🚀 Deployment

### Production Environment

Update `.env` files for production:

**All Frontend Apps:**
```
VITE_API_URL=https://api.filternest.com
```

**Backend:**
```
NODE_ENV=production
DATABASE_URL=<supabase-pooled-url:6543?pgbouncer=true>
DIRECT_URL=<supabase-direct-url:5432>
JWT_SECRET=<strong-secret-key>
FRONTEND_URL=https://filternest.com
```

### Deployment Options (current production path)

1. **Backend → Render** (via `render.yaml` blueprint)
   - Build: `npm install` (runs `prisma generate`); Start: `npm start`
   - Health check: `/api/health`
   - Secrets set in the Render dashboard: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, SMTP, MSG91

2. **Frontends → Vercel** (3 separate projects)
   - Deploy `customer-app`, `agent-app`, `admin-panel` independently
   - Each sets `VITE_API_URL` to the Render API URL

3. **Database → Supabase** (PostgreSQL)

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full step-by-step guide.

## 📊 Database Schema

Defined in `server/prisma/schema.prisma` (PostgreSQL via Prisma 6, **17 models**):
`Customer`, `Agent`, `Admin`, `Service`, `Booking`, `Invoice`, `Payment`, `MaintenanceSchedule`, `SupportTicket`, `Notification`, `Session`, `RefreshToken`, `LoginHistory`, `DeviceTracking`, `AadhaarVerification`, `EmailVerification`, `PasswordResetToken`.

- `server/lib/prisma.js` is the shared Prisma client; it aliases `id` → `_id` for frontend compatibility.
- `server/lib/sanitize.js` strips secrets from responses (replacing the old Mongoose `toJSON`).
- There are no `server/models/*.js` Mongoose files anymore.

## 🐛 Troubleshooting

### CORS Errors
- Ensure backend is running on port 5001
- Check that `VITE_API_URL` matches backend URL in frontend `.env`
- Verify CORS configuration in `server.js`

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Kill process on port 6001
lsof -ti:6001 | xargs kill -9

# Kill process on port 5001
lsof -ti:5001 | xargs kill -9
```

### Database Connection Issues
- Verify `DATABASE_URL` (pooled, port 6543, `?pgbouncer=true`) and `DIRECT_URL` (direct, port 5432) in `.env`
- Re-sync the schema: `npx prisma db push`
- Regenerate the client: `npx prisma generate`
- Confirm your Supabase project is active and the IP is allowed

### Authentication Issues
- Clear browser cookies/localStorage
- Check JWT token expiration (default: 7 days)
- Verify role in token matches app requirement

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Express.js Guide](https://expressjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

## 🤝 Support

For issues or questions:
1. Check existing documentation
2. Review error logs in browser console
3. Check backend logs in terminal
4. Contact support: support@filternest.com

## 📝 License

This project is proprietary and confidential.

## 🎉 Next Steps

After setting up:

1. **Test all three apps** independently
2. **Verify authentication** with test accounts
3. **Test role-based access control** (ensure users can't access wrong apps)
4. **Test API communication** between apps and backend
5. **Review and customize** UI/UX for each app
6. **Set up development CI/CD** pipeline
7. **Prepare for deployment** to production

---

**Happy Coding! 🚀**

For the ultimate SaaS experience, FilterNest brings professional water management to the next level.
