# Architecture & System Design

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
     ┌───▼────┐      ┌─────▼──────┐    ┌────▼────┐
     │MongoDB │      │ Redis Cache│    │ Queue   │
     │Database│      │ (Sessions) │    │ System  │
     └────────┘      └────────────┘    └────┬────┘
                                             │
                                       ┌─────▼─────┐
                                       │ Cron Jobs │
                                       │Scheduler  │
                                       └───────────┘
```

## Data Flow & Authentication Pipelines

### 1. Customer Self-Registration & Vetting
```
Customer Input → Express Validator → Save to DB (verified: false) → Generate Verification OTP → Nodemailer Dispatch → OTP Match → Save (verified: true)
```

### 2. Admin-Controlled Agent Onboarding (Strict Uber/Urban Company Model)
```
Technician Candidate → Public Application Form (/technician-application) 
  ↓
Upload Name, Contact, Permanent Address, Aadhaar, PAN, DL, and Profile Avatar
  ↓
Stored in MongoDB (isApproved: false, registrationStatus: 'pending')
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

## Database Schemas (Extended Collections)

### 1. Customer Collection (`Customer.js`)
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: String (unique),
  password: String (hashed),
  address: { street: String, city: String, state: String, pincode: String },
  location: { type: "Point", coordinates: [longitude, latitude] },
  verified: Boolean,
  biometrics: { publicKey: String, credentialId: String, deviceId: String },
  createdAt: Date
}
```

### 2. Agent Collection (`Agent.js`)
```javascript
{
  _id: ObjectId,
  agentId: String (unique, read-only: AGXXXXXX),
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: String (unique),
  password: String (hashed, passcode configured by admin),
  documents: { aadhar: String, panCard: String, drivingLicense: String },
  profileImage: String,
  address: { street: String, city: String, state: String, pincode: String },
  role: { type: String, default: 'agent' },
  isApproved: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  registrationStatus: { type: String, enum: ['pending', 'active', 'rejected', 'suspended'] },
  rejectedReason: String,
  approvalDate: Date,
  approvedBy: ObjectId (ref: Admin)
}
```

### 3. Session Collection (`Session.js`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  userModel: String (enum: ['Customer', 'Agent', 'Admin']),
  refreshTokenId: ObjectId (ref: RefreshToken),
  os: String,
  browser: String,
  deviceType: String,
  deviceName: String,
  ipAddress: String,
  location: String,
  isActive: { type: Boolean, default: true },
  expiresAt: Date
}
```

### 4. Refresh Token Collection (`RefreshToken.js`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  userModel: String,
  token: String (secure dynamic payload),
  isRevoked: { type: Boolean, default: false },
  expiresAt: Date
}
```

### 5. Login History Collection (`LoginHistory.js`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  userModel: String,
  email: String,
  os: String,
  browser: String,
  deviceType: String,
  ipAddress: String,
  location: String,
  status: String (enum: ['success', 'failed', 'suspicious']),
  reason: String
}
```

---

## Interactive Security & Remote Session Revocation
The frontend communicates with `/api/auth/sessions` (protected routes) to render all active sessions dynamically:
- **Revoke Session (`DELETE /api/auth/sessions/:sessionId`)**: Marks target session `isActive: false` and revokes the associated `RefreshToken.isRevoked = true`, instantly invalidating remote device cookies.
- **Revoke All Sessions (`POST /api/auth/logout-all`)**: Revokes every session mapped to the `userId` in parallel, performing a complete session sweep.
