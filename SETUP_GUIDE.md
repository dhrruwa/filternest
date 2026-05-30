# FilterNest Multi-App Setup Guide

## Quick Start (5 Minutes)

### 1. One-Command Start (Recommended)
```bash
./start-all.sh
```

This will automatically:
- Start the backend API on port 5001
- Start the customer app on port 3000
- Start the agent app on port 4000
- Start the admin panel on port 6000
- Install dependencies automatically

Then open:
- 🛒 Customer: http://localhost:3000
- 🔧 Agent: http://localhost:4000
- ⚙️ Admin: http://localhost:6000

### 2. Manual Start (If Preferred)

Open 4 terminals and run:

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

# Database
MONGODB_URI=mongodb://localhost:27017/water-filter-service

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email Service (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Session Secret
SESSION_SECRET=your_session_secret_change_this
```

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
│   │  MongoDB  │  JWT Auth  │  CORS  │  Rate Limit   │  │
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
    │ (3000)  │       │ (4000)  │       │ (6000)  │
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
for port in 3000 4000 5001 6000; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
```

### CORS Errors
- Check backend is running
- Verify API_URL in frontend .env matches backend port
- Check browser console for exact error

### MongoDB Connection Failed
```bash
# Start MongoDB locally
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with connection string
```

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

### Deploy Backend to Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new Heroku app
cd server
heroku create filternest-api

# Deploy
git push heroku main

# Set environment variables
heroku config:set JWT_SECRET=your_secret_key
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
```

## Project Structure

```
filter-nest/
├── server/                 # Backend API
│   ├── models/            # MongoDB schemas
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
- ✅ CORS configuration for 3 frontends
- ✅ Database models
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
