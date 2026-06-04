# Mongoose → Prisma migration conventions (FilterNest server)

The backend moved from MongoDB/Mongoose to PostgreSQL (Supabase) via **Prisma 6**.
Rewrite each controller's data-access layer to Prisma. **Do NOT change API routes,
request/response shapes, status codes, business logic, validation, or function
names/exports.** Only swap the persistence calls.

## Setup in every file
- Remove all `require('../models/X')` and any `mongoose` import.
- Add: `const prisma = require('../lib/prisma');`
- If the file returns Customer/Agent/Admin records (directly or nested in bookings,
  invoices, etc.), add: `const { stripSensitive } = require('../lib/sanitize');`
- Keep all other imports (jwt, bcrypt, tokenUtils, otpService, emailService, etc.) unchanged.
- `bcrypt` is `require('bcryptjs')` (already used in repo).

## Model name → Prisma delegate (camelCase)
Customer→`prisma.customer`, Agent→`prisma.agent`, Admin→`prisma.admin`,
Service→`prisma.service`, Booking→`prisma.booking`, Invoice→`prisma.invoice`,
Payment→`prisma.payment`, MaintenanceSchedule→`prisma.maintenanceSchedule`,
SupportTicket→`prisma.supportTicket`, Notification→`prisma.notification`,
Session→`prisma.session`, RefreshToken→`prisma.refreshToken`,
LoginHistory→`prisma.loginHistory`, DeviceTracking→`prisma.deviceTracking`,
AadhaarVerification→`prisma.aadhaarVerification`,
EmailVerification→`prisma.emailVerification`,
PasswordResetToken→`prisma.passwordResetToken`.

## IDs
- Primary key column is `id` (string cuid). Every returned row ALSO has `_id` (=== id)
  via a client extension, so frontends keep working. Use `record.id` in server code.
- `req.params.id` etc. are plain strings — use directly in `where: { id }`.
- There is NO ObjectId. Never wrap ids in any ObjectId constructor.

## Method translation
| Mongoose | Prisma |
|---|---|
| `Model.findById(id)` | `prisma.model.findUnique({ where: { id } })` |
| `Model.findOne({ email })` (unique field) | `prisma.model.findUnique({ where: { email } })` |
| `Model.findOne(query)` (non-unique) | `prisma.model.findFirst({ where: query })` |
| `Model.find(query)` | `prisma.model.findMany({ where: query })` |
| `Model.find()` | `prisma.model.findMany()` |
| `Model.create(data)` | `prisma.model.create({ data })` |
| `new Model(data); await doc.save()` | `prisma.model.create({ data })` |
| `Model.findByIdAndUpdate(id, data, {new:true})` | `prisma.model.update({ where:{id}, data })` |
| `Model.findByIdAndDelete(id)` / `findByIdAndRemove` | `prisma.model.delete({ where:{id} })` |
| `Model.findOneAndUpdate(filter, data)` | if filter is a unique field → `update`; else `findFirst` then `update({where:{id}})` |
| `Model.updateOne(filter, {$set:{...}})` | `prisma.model.updateMany({ where: filter, data: {...} })` (or `update` if filter unique) |
| `Model.updateMany(filter, {$set:{...}})` | `prisma.model.updateMany({ where: filter, data: {...} })` |
| `Model.deleteOne(filter)` | `prisma.model.deleteMany({ where: filter })` |
| `Model.deleteMany(filter)` | `prisma.model.deleteMany({ where: filter })` |
| `Model.countDocuments(filter)` | `prisma.model.count({ where: filter })` |
| `doc.field = x; await doc.save()` | `prisma.model.update({ where:{id:doc.id}, data:{ field:x } })` |

`update`/`delete` throw if the row doesn't exist (code `P2025`). If existing code
relied on a null result for "not found", first fetch with `findUnique`, branch on
null, then update/delete.

## Query operator translation (inside `where`)
- `{ f: { $ne: v } }` → `{ f: { not: v } }`
- `{ f: { $in: [...] } }` → `{ f: { in: [...] } }`
- `{ f: { $nin: [...] } }` → `{ f: { notIn: [...] } }`
- `{ f: { $gt/$gte/$lt/$lte: v } }` → `{ f: { gt/gte/lt/lte: v } }`
- `{ f: { $exists: true } }` → `{ f: { not: null } }`;  `$exists:false` → `{ f: null }`
- `{ f: { $regex: s, $options: 'i' } }` → `{ f: { contains: s, mode: 'insensitive' } }`
- `{ $or: [a,b] }` → `{ OR: [a,b] }`;  `$and` → `AND`
- `$set` wrapper in updates: drop it, put fields directly in `data`.
- `$inc: { n: 1 }` → `data: { n: { increment: 1 } }`
- For a `String[]` column: append with `data: { col: { push: value } }`.
- For a `Json` array column (e.g. SupportTicket.messages, Admin.loginHistory):
  fetch row, append in JS, write the whole array back via `update`.

## Chained query helpers → options object
`.sort({ createdAt: -1 })` → `orderBy: { createdAt: 'desc' }` (1 → 'asc').
`.limit(n)` → `take: n`. `.skip(n)` → `skip: n`. `.lean()` → remove (Prisma already returns plain objects).
`.select('a b')` → `select: { a:true, b:true }`. `.select('-password')` → `omit: { password: true }`.

## Relations & `.populate()`
Real foreign-key columns (use these scalar names when writing):
- **Booking**: `customerId`, `assignedAgentId` (NULLABLE). **No `invoiceId` column** — see note below.
- **Invoice**: `bookingId` (UNIQUE), `customerId`, `agentId` (nullable).
- **Payment**: `customerId`, `bookingId` (nullable), `invoiceId` (nullable).
- **MaintenanceSchedule**: `customerId`, `relatedBookingId` (nullable).
- **SupportTicket**: `customerId`.
- **Notification**: `relatedBookingId`, `relatedMaintenanceId` (nullable). `recipient` + `recipientModel` are PLAIN STRING columns (polymorphic — NOT relations).
- **Session / RefreshToken / LoginHistory / DeviceTracking / PasswordResetToken**: `userId` + `userModel` are PLAIN STRING columns (polymorphic — NOT relations).

**On writes**, translate embedded ref assignment to the scalar FK:
`customer: someId` → `customerId: someId`; `assignedAgent: id` → `assignedAgentId: id`;
`booking: id` → `bookingId: id`; `agent: id` → `agentId: id`;
`invoice: id` (on Payment) → `invoiceId: id`;
`relatedBooking: id` → `relatedBookingId: id`; `relatedMaintenance: id` → `relatedMaintenanceId: id`.
Pass `null`/omit when the value is absent (don't pass `undefined` for required fields).

**On reads**, translate `.populate()` to `include`:
- `.populate('customer')` → `include: { customer: true }`
- `.populate('assignedAgent', 'firstName lastName phone')` → `include: { assignedAgent: { select: { id:true, firstName:true, lastName:true, phone:true } } }` (always include `id` in the select so `_id` is present).
- Multiple populates → one `include: { customer: true, assignedAgent: true }`.
- Relation names available per model: Booking→`customer`,`assignedAgent`,`invoice`,`payments`; Invoice→`booking`,`customer`,`agent`; Payment→`customer`,`booking`,`invoice`; MaintenanceSchedule→`customer`,`relatedBooking`; SupportTicket→`customer`.

**Booking ↔ Invoice note (IMPORTANT):** the link is owned by `Invoice.bookingId`.
- To read a booking's invoice: `include: { invoice: true }` (works).
- To "attach" an invoice to a booking: set `bookingId` when creating the Invoice. Do NOT try to write `invoiceId`/`invoice` on Booking — that column does not exist. If old code did `Booking.findByIdAndUpdate(bookingId, { invoice: invId })`, replace it by ensuring the Invoice was created with `bookingId: bookingId` (drop the Booking update).

## Password hashing (CRITICAL — Mongoose pre-save hooks are gone)
Customer/Agent/Admin no longer auto-hash. Anywhere a password is set on create OR
update, hash it first: `const password = await bcrypt.hash(plain, 10);`
- Registration/create → hash before `create`.
- Password reset / change-password → hash before `update`.
- Agent temporary passcode set as password → hash before `update`.
- `user.comparePassword(plain)` → `await bcrypt.compare(plain, user.password)`.

## Stripping secrets (Mongoose toJSON is gone)
When responding with any Customer/Agent/Admin (directly, in an array, or nested in
a booking/invoice/etc.), wrap the data with `stripSensitive(...)`:
`res.json(stripSensitive(user))` / `res.json({ bookings: stripSensitive(bookings) })`.
`stripSensitive` is deep and safe to over-apply; prefer wrapping any payload that
could carry user records. Do NOT strip before a `bcrypt.compare` (you need the hash first).

## Misc
- Results are plain objects: no `.toObject()`, no `.save()`, no Mongoose doc methods.
- Dates: pass JS `Date` objects (e.g. `new Date()`); existing code already does.
- Embedded objects (address, cost, feedback, preferences, serviceLocation, items,
  messages, channels, etc.) are `Json` columns — pass/return plain objects as-is.
- Keep all `console.log`/error handling and response messages identical.
- After rewriting, run `node --check <file>` and fix any syntax error.
