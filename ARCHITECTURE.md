# Architecture & System Design

> **Migration note:** Persistence has moved from MongoDB/Mongoose to Supabase (PostgreSQL) via Prisma 6. The schemas below are now Prisma models in `server/prisma/schema.prisma`. See [`CHANGELOG.md`](./CHANGELOG.md) for the before → after rationale.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet / Users                        │
└─────────────────────────┬───────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
     ┌───▼────┐      ┌─────▼─────┐     ┌────▼──────┐
     │ Browser│      │  Mobile   │     │ Third-    │
     │ Client │      │    App    │     │ party API │
     └───┬────┘      └─────┬─────┘     └────┬──────┘
         │                 │                │
         └─────────────────┼────────────────┘
                           │
                     ┌─────▼─────────┐
                     │  CDN / Cache  │
                     │  (CloudFlare) │
                     └─────┬─────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
     ┌───▼─────────┐  ┌────▼──────┐  ┌─────▼──────┐
     │Next.js /Vite│  │ API Routes│  │Static Files│
     │ (Frontend)  │  │(Optimized)│  │  (Images)  │
     └───┬─────────┘  └────┬──────┘  └─────┬──────┘
         │                 │               │
         │        ┌────────▼────────┐     │
         └────────► Express Server  ◄─────┘
                  │  (Backend API)  │
                  └────────┬────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
     ┌───▼────────┐  ┌─────▼──────┐    ┌────▼────┐
     │ Supabase   │  │ Redis Cache│    │ Queue   │
     │(PostgreSQL │  │ (Sessions) │    │ System  │
     │ via Prisma)│  └────────────┘    └────┬────┘
     └────────────┘                          │
                                       ┌─────▼─────┐
                                       │ Cron Jobs │
                                       │Scheduler  │
                                       └───────────┘
```

## Data Flow & Authentication Pipelines

### 1. Customer Self-Registration & Vetting
```
Customer Input → Express Validator → Save to Postgres via Prisma (verified: false) → Generate Verification OTP → MSG91 SMS Dispatch (primary; Nodemailer/SMTP as best-effort fallback) → OTP Match → Update (verified: true)
```

### 2. Admin-Controlled Agent Onboarding (Strict Uber/Urban Company Model)
```
Technician Candidate → Public Application Form (/technician-application) 
  ↓
Upload Name, Contact, Permanent Address, Aadhaar, PAN, DL, and Profile Avatar
  ↓
Stored in Postgres via Prisma (isApproved: false, registrationStatus: 'pending')
  ↓
Admin logs into Dashboard → Pending tab → Inspects Profile Vetting details
  ↓
Admin enters a passcode (bcrypt-hashed) → approvalDate + approvedBy logged
  ↓
Transporter dispatches Welcome Onboarding HTML Email containing plain-text passcode and read-only Specialist ID (AGXXXXXX)
```

### 3. Dual-Token JWT Access + Refresh Cookie Rotation
```
Client Request Credentials
  ↓
Server Validates
  ↓
Generate Stateless Access Token (15m, payload: userId, role, sessionId) 
  AND Stateful Refresh Token (7d, logged in DB, served in HTTP-Only, Lax Cookie)
  ↓
Access Token expires (Client receives 401)
  ↓
Client Axios Interceptor catches 401 → requests /api/auth/refresh behind the scenes
  ↓
Server checks DB (Refresh token valid, not revoked, session active)
  ↓
Server rotates and issues fresh Access Token → Client retries original query
```

### 4. Device Session Tracking & Security Alerts
```
Login Attempt
  ↓
Parse User-Agent headers (Browser, OS, Device Type)
  ↓
Generate unique Device Fingerprint
  ↓
Check recognized Device Tracking DB logs
  ↓
If Unrecognized: Flag "suspicious" in LoginHistory → Dispatch New Device Login Warning Email containing IP, Browser, OS, and timestamp
  ↓
Create Session document mapped to the user
```

---

## Database Schemas (Prisma / PostgreSQL)

All persistence is defined in `server/prisma/schema.prisma` as **17 Prisma models**:
`Customer`, `Agent`, `Admin`, `Service`, `Booking`, `Invoice`, `Payment`, `MaintenanceSchedule`, `SupportTicket`, `Notification`, `Session`, `RefreshToken`, `LoginHistory`, `DeviceTracking`, `AadhaarVerification`, `EmailVerification`, `PasswordResetToken`.

- Primary keys are Postgres `id` columns. `server/lib/prisma.js` (the shared client) aliases `id` → `_id` on the way out so existing frontend code keeps working.
- `server/lib/sanitize.js` strips secrets (e.g. password hashes, tokens) from responses, replacing the old Mongoose `toJSON` transform.
- Apply schema changes with `npx prisma db push` (or `npx prisma migrate dev`); `prisma generate` runs on `postinstall` and `build`.

The model shapes below are illustrative (field names mirror the Prisma schema).

### 1. Customer (`model Customer`)
```prisma
id           String   @id @default(cuid())   // exposed to clients as _id
firstName    String
lastName     String
email        String   @unique
phone        String   @unique
password     String   // hashed
address      Json     // { street, city, state, pincode }
location     Json?    // { coordinates: [longitude, latitude] }
verified     Boolean  @default(false)
biometrics   Json?    // { publicKey, credentialId, deviceId }
createdAt    DateTime @default(now())
```

### 2. Agent (`model Agent`)
```prisma
id                 String   @id @default(cuid())
agentId            String   @unique   // read-only: AGXXXXXX
firstName          String
lastName           String
email              String   @unique
phone              String   @unique
password           String   // hashed; passcode configured by admin
documents          Json     // { aadhar, panCard, drivingLicense }
profileImage       String?
address            Json     // { street, city, state, pincode }
role               String   @default("agent")
isApproved         Boolean  @default(false)
isVerified         Boolean  @default(false)
isActive           Boolean  @default(false)
registrationStatus String   @default("pending") // pending | active | rejected | suspended
rejectedReason     String?
approvalDate       DateTime?
approvedBy         String?  // -> Admin.id
```

### 3. Session (`model Session`)
```prisma
id             String   @id @default(cuid())
userId         String
userModel      String   // Customer | Agent | Admin
refreshTokenId String?  // -> RefreshToken.id
os             String?
browser        String?
deviceType     String?
deviceName     String?
ipAddress      String?
location       String?
isActive       Boolean  @default(true)
expiresAt      DateTime
```

### 4. Refresh Token (`model RefreshToken`)
```prisma
id        String   @id @default(cuid())
userId    String
userModel String
token     String   // secure dynamic payload
isRevoked Boolean  @default(false)
expiresAt DateTime
```

### 5. Login History (`model LoginHistory`)
```prisma
id         String   @id @default(cuid())
userId     String?
userModel  String?
email      String
os         String?
browser    String?
deviceType String?
ipAddress  String?
location   String?
status     String   // success | failed | suspicious
reason     String?
```

---

## Interactive Security & Remote Session Revocation
The frontend communicates with `/api/auth/sessions` (protected routes) to render all active sessions dynamically:
- **Revoke Session (`DELETE /api/auth/sessions/:sessionId`)**: Marks target session `isActive: false` and revokes the associated `RefreshToken.isRevoked = true`, instantly invalidating remote device cookies.
- **Revoke All Sessions (`POST /api/auth/logout-all`)**: Revokes every session mapped to the `userId` in parallel, performing a complete session sweep.
