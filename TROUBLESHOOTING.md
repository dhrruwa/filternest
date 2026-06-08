# FilterNest Multi-App Troubleshooting Guide

> **Note:** See `CHANGELOG.md` for the MongoDB/Mongoose -> Supabase (PostgreSQL via Prisma) migration and production hardening, which explains several of the fixes below.

## Common Issues and Solutions

### 🔴 Port Conflicts

#### Issue: Port 3000, 4000, 5001, or 6001 already in use

> The admin panel runs on **6001**, not 6000: Chrome/Firefox block port 6000 as `ERR_UNSAFE_PORT`, which is why admin was moved off 6000.

**Solution 1: Kill the process using the port**
```bash
# For port 3000 (Customer App)
lsof -ti:3000 | xargs kill -9

# For port 4000 (Agent App)
lsof -ti:4000 | xargs kill -9

# For port 5001 (Backend)
lsof -ti:5001 | xargs kill -9

# For port 6001 (Admin)
lsof -ti:6001 | xargs kill -9
```

**Solution 2: Check what's using the port**
```bash
lsof -i :3000
# Shows process info, then kill with: kill -9 <PID>
```

**Solution 3: Use different ports (if multiple services need same port)**
Edit `package.json` in each app and change the dev script:
```json
{
  "scripts": {
    "dev": "vite --port 3001"
  }
}
```

---

### 🔴 CORS Errors

#### Issue: "Access to XMLHttpRequest blocked by CORS policy"

**Cause:** Frontend app and backend are on different origins

**Solution:**
1. Verify backend `.env` has correct PORT:
```env
PORT=5001
```

2. Verify frontend `.env` has correct API URL:
```env
VITE_API_URL=http://localhost:5001
```

3. Check backend `server.js` CORS configuration allows frontend port:
```javascript
cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:6001'
  ],
  credentials: true
})
```

> In production, CORS/CSRF also accept any `*.vercel.app` origin, so the deployed Vercel frontends work without listing exact URLs.

4. Restart backend after .env changes

---

### 🔴 Database (Supabase/Prisma) Connection Failed

#### Issue: "Can't reach database server", `P1001`, or Prisma client errors

The app uses **Supabase (PostgreSQL) via Prisma** — there is no local MongoDB anymore.

**Solution 1: Verify both connection URLs are set in `server/.env`**
```env
# Pooled (runtime) — port 6543, must end with ?pgbouncer=true
DATABASE_URL="postgresql://postgres.<ref>:<pw>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct (migrations / db push) — port 5432
DIRECT_URL="postgresql://postgres.<ref>:<pw>@<region>.pooler.supabase.com:5432/postgres"
```
Pooled vs direct matters: the runtime uses the **pooled** connection (6543, pgbouncer); `prisma db push` / migrations use the **direct** connection (5432). Mixing them up causes connection or prepared-statement errors.

**Solution 2: Push the schema to Supabase**
```bash
cd server
npx prisma db push      # applies prisma/schema.prisma (17 models) to Supabase
```

**Solution 3: Regenerate the Prisma client**
```bash
cd server
npx prisma generate     # also runs automatically on postinstall/build
```
Run this after pulling schema changes or if you see "@prisma/client did not initialize".

**Solution 4: Check the credentials and project**
```bash
# Copy fresh strings from Supabase Dashboard -> Connect -> ORMs -> Prisma
# Confirm the DB password is correct and the project isn't paused
```

---

### 🔴 Dependencies Installation Issues

#### Issue: npm install fails or takes too long

**Solution 1: Clear npm cache**
```bash
npm cache clean --force
```

**Solution 2: Remove node_modules and reinstall**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Solution 3: Use npm ci instead of install**
```bash
npm ci
```

**Solution 4: Check Node version**
```bash
node --version
# Must be v18 or higher (engines: ">=18")

# If old version, update Node
brew upgrade node
```

**Solution 5: Try with legacy peer deps**
```bash
npm install --legacy-peer-deps
```

---

### 🔴 Apps Won't Start

#### Issue: Vite dev server crashes or won't start

**Solution 1: Check for syntax errors**
```bash
cd customer-app
npm run dev
# Look for error messages in terminal
```

**Solution 2: Clear Vite cache**
```bash
rm -rf node_modules/.vite
npm run dev
```

**Solution 3: Check Node modules**
```bash
rm -rf node_modules
npm install
npm run dev
```

**Solution 4: Increase memory if needed**
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run dev
```

---

### 🔴 "Cannot find module" Errors

#### Issue: Import errors like "Module not found: Can't resolve '../pages/Login'"

**Solution 1: Check file exists in correct location**
```bash
# For customer app
ls customer-app/src/pages/Login.jsx

# File should exist
```

**Solution 2: Check import path is correct**
```javascript
// ✅ Correct
import Login from './pages/Login';

// ❌ Wrong
import Login from '/pages/Login';
import Login from '../../pages/Login'; // (from different directory)
```

**Solution 3: Clear node_modules in specific app**
```bash
cd customer-app
rm -rf node_modules
npm install
```

**Solution 4: Restart dev server**
```bash
# Press Ctrl+C to stop
# Then run again
npm run dev
```

---

### 🔴 Authentication Issues

#### Issue: Can't login or session persists after logout

**Solution 1: Clear browser storage**
```javascript
// Open browser console (F12) and run:
localStorage.clear()
sessionStorage.clear()
// Refresh page
```

**Solution 2: Check JWT token in localStorage**
```javascript
// In browser console:
console.log(localStorage.getItem('auth'))
```

**Solution 3: Verify backend is issuing tokens**
```bash
# Check backend logs for auth endpoint calls
# Should see POST /api/auth/login
```

**Solution 4: Check token expiration**
```javascript
// In browser console:
const token = localStorage.getItem('auth')
const payload = JSON.parse(atob(token.split('.')[1]))
console.log(payload)
```

---

### 🔴 Role-Based Access Blocked

#### Issue: "Access Denied - Customer account required" on customer app

**Cause:** Logged in with wrong role (e.g., agent account on customer app)

**Solution:**
1. Go to backend login page for correct app
2. Use appropriate credentials:
   - Customer App: customer@test.com
   - Agent App: agents have applied and been approved
   - Admin Panel: admin@filternest.com
3. Clear storage and login with correct role:
```javascript
localStorage.clear()
// Refresh and login
```

---

### 🔴 API Requests Returning 401/403

#### Issue: Unauthorized or Forbidden errors from API

**Solution 1: Check authentication token**
```bash
# Backend logs should show:
# POST /api/bookings 401 Unauthorized
```

**Solution 2: Re-login to refresh token**
```javascript
// Frontend console:
localStorage.clear()
// Logout and login again
```

**Solution 3: Check JWT secret in .env**
```bash
# server/.env
JWT_SECRET=your_secret_key

# If changed, restart backend
```

**Solution 4: Verify role in token**
```javascript
// Decode token in console:
const token = localStorage.getItem('auth')
const payload = JSON.parse(atob(token.split('.')[1]))
console.log(payload.role)  // Should match app role
```

---

### 🔴 OTP / Email Notifications Not Sending

#### Issue: OTP not received, or booking confirmation emails not received

OTP delivery uses **MSG91 SMS as the primary channel**, with SMTP email as a fallback. Render blocks outbound SMTP in production, so SMS is the production OTP path.

**Solution 1a: Check MSG91 configuration (primary OTP)**
```bash
# server/.env must have:
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_TEMPLATE_ID=your_msg91_template_id
```

**Solution 1: Check SMTP configuration (email fallback)**
```bash
# server/.env must have:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Solution 2: For Gmail, use App Password**
```
# Don't use regular password
# Instead:
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate "App Password"
4. Use in SMTP_PASS
```

**Solution 3: Check backend logs**
```bash
# Look for email sending logs in terminal
# Should show: "Email sent to customer@example.com"
```

**Solution 4: Use test email service**
```env
# For development, use Mailtrap or similar
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=mailtrap_username
SMTP_PASS=mailtrap_password
```

---

### 🔴 Database Data Not Persisting

#### Issue: Bookings/data disappears or isn't saved

**Cause:** Wrong/empty `DATABASE_URL`, or the schema was never pushed to Supabase.

**Solution 1: Ensure the schema is pushed**
```bash
cd server
npx prisma db push   # creates the tables in Supabase
```

**Solution 2: Check DATABASE_URL / DIRECT_URL in server/.env**
```env
# ✅ Pooled runtime connection (note the :6543 and ?pgbouncer=true)
DATABASE_URL="postgresql://postgres.<ref>:<pw>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"

# ✅ Direct connection for migrations / db push (:5432)
DIRECT_URL="postgresql://postgres.<ref>:<pw>@<region>.pooler.supabase.com:5432/postgres"

# ❌ Wrong — missing ?pgbouncer=true on the pooled URL, or pointing at the wrong port
```

**Solution 3: Verify data is being saved**
```bash
# Inspect data via Prisma Studio
cd server
npx prisma studio

# Or use the Supabase Dashboard -> Table Editor
```

---

### 🔴 Performance Issues (Slow Loading)

#### Issue: Apps load slowly or freeze

**Solution 1: Check browser DevTools Network tab**
```
1. Open Developer Tools (F12)
2. Go to Network tab
3. Reload page
4. Look for slow requests
5. Check waterfall timing
```

**Solution 2: Check backend performance**
```bash
# Backend logs should show request times
# Look for [DEBUG] entries
```

**Solution 3: Increase Node.js memory**
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run dev
```

**Solution 4: Clear browser cache**
```bash
# Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
# Clear browsing data
```

---

### 🔴 Hot Module Replacement (HMR) Not Working

#### Issue: Changes don't hot-reload in dev

**Solution 1: Restart dev server**
```bash
# Press Ctrl+C
npm run dev
```

**Solution 2: Check Vite config**
```javascript
// vite.config.js should have:
export default {
  server: {
    hmr: true,
    port: 3000
  }
}
```

**Solution 3: Clear browser cache**
```bash
# Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

---

## Debugging Tips

### Enable Verbose Logging

**Frontend (React)**
```javascript
// In main.jsx
console.log('Environment:', import.meta.env)
console.log('API URL:', import.meta.env.VITE_API_URL)
```

**Backend (Express)**
```bash
# Set debug environment
DEBUG=* npm run dev

# Or just for Express
DEBUG=express:* npm run dev
```

### Use Browser Developer Tools

```javascript
// Check API calls
// In Network tab, look for API requests
// Check Headers, Request, Response

// Check local storage
// Application > Local Storage > http://localhost:3000
// Should contain 'auth' key with JWT token

// Check console errors
// Console tab should show any JavaScript errors
```

### Check Server Logs

```bash
# Backend logs in terminal should show:
[DEBUG] POST /api/auth/login - 200 (45ms)
[DEBUG] Body: {"email":"customer@test.com","password":"..."}
```

---

## Getting Help

1. **Check logs first:**
   - Browser console (F12)
   - Backend terminal output
   - Network requests in DevTools

2. **Verify configuration:**
   - .env files exist and have correct values
   - All required dependencies installed
   - All services running on correct ports

3. **Try common fixes:**
   - Restart dev servers
   - Clear cache/storage
   - Kill and restart processes
   - Check Node/npm versions

4. **Contact support:**
   - Email: support@filternest.com
   - Include error messages and logs

---

**🆘 Still having issues? Check SETUP_GUIDE.md or MULTI_APP_README.md for more information.**
