# FilterNest: Enterprise Water Purifier Service & Workforce Management

A comprehensive, production-ready full-stack enterprise platform for managing reverse osmosis servicing, smart maintenance schedules, multi-device sessions, and admin-controlled agent onboarding.

## 🌟 Core Architecture Modules

### 1. **Customer Identity & Care Portal**
- **Vibrant Onboarding**: Seamless registration and dynamic login powered by JWT token rotation.
- **Service Bookings**: Book certified servicing and membrane calibrations with full date/time selectors.
- **Location Alignment**: Capture and track real-time customer coordinates for white-glove route dispatching.
- **Booking & Service Ledger**: Interactive customer dashboard showing service history, current status, and billing logs.

### 2. **Admin-Controlled Specialist Onboarding**
- **No Agent Self-Registration**: Public self-registration and OTP-creation systems are disabled.
- **Dedicated Application Portal**: Vetted specialists apply through `/technician-application`, providing PAN, Aadhaar (spaced: `XXXX XXXX XXXX`), driving license, and permanent address along with a square-compressed progressive profile avatar uploader.
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
- **Multi-Channel Notification Gateway**: Sends in-app messages and nodemailer-powered HTML emails.

---

## 🏗️ Project Structure

```
filter-service/
├── server/                          # Node.js + Express backend
│   ├── models/                      # MongoDB schemas (Customer, Agent, Session, RefreshToken, LoginHistory)
│   ├── controllers/                 # Business logic (authController, adminController, bookingController)
│   ├── routes/                      # API endpoints (authRoutes, adminRoutes, customerRoutes)
│   ├── middleware/                  # Auth, validation, rate limits, XSS scrubs, CSRF checkers
│   ├── services/                    # Email, MSG91 SMS, and Cron scheduler engines
│   ├── utils/                       # Token helpers and User-Agent parser utilities
│   └── server.js                    # Core app entry point
│
├── client/                          # React + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── pages/                   # Home, Login, Register, AgentApply, AdminDashboard, Dashboards
│   │   ├── components/              # Navbar, Footer, SecurityDashboard active session panel
│   │   ├── services/                # Axios client with silent dual-token token rotation
│   │   ├── context/                 # Zustand state storage (authStore)
│   │   └── App.jsx                  # Main router definitions (/technician-application, /login)
│   ├── vite.config.js
│   ├── package.json
│   └── index.html
```

---

## 🚀 Getting Started

### Backend Setup

1. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment Variables (`server/.env`)**
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/water-filter-service
   JWT_SECRET=your_super_secret_jwt_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FRONTEND_URL=http://localhost:3000
   ```

3. **Boot Backend Server**
   ```bash
   npm run start
   ```

### Frontend Setup

1. **Install Client Dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Configure Environment Variables (`client/.env`)**
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

3. **Launch Vite Development Server**
   ```bash
   npm run dev
   ```

---

## 🔐 Advanced Security Features

- **XSS & SQL Injection Mitigation**: Recursive scrubbers cleaning request attributes.
- **CSRF Token Guards**: Header matchers guarding state-changing endpoint execution.
- **Auth Rate-Limiting**: Strictly restricts authentication attempts to 10 requests per 15 minutes.
- **Bcrypt Security**: Auto-hashes all onboarding passcodes and customer passwords before saving.
- **HTTP-Only Cookies**: Refresh tokens cannot be accessed by client-side browser scripts, stopping cookie theft.

---

## 📞 Support & Inquiries

For technical support or certified technician alignment:
- Email: support@waterfilter.com
- Helpline: 1-800-FILTER-1
- Portal: [FilterNest Security Hub](http://localhost:3000)
