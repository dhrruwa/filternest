# Water Filter Service Management System - Deployment Guide

> **Migration note:** The backend has moved from MongoDB/Mongoose to Supabase (PostgreSQL) via Prisma 6. The deployment path is now **Render** (backend) + **Vercel** (3 frontends) + **Supabase** (database). See [`CHANGELOG.md`](./CHANGELOG.md) for the before → after rationale. Legacy Heroku/AWS/MongoDB notes below are kept only as alternatives.

## Production Architecture

| Tier | Platform | Notes |
|------|----------|-------|
| Backend API | **Render** | `render.yaml` blueprint; health check `/api/health` |
| Frontends (×3) | **Vercel** | `customer-app`, `agent-app`, `admin-panel` as separate projects |
| Database | **Supabase** (PostgreSQL) | Pooled + direct connection strings |

## Deployment Checklist

### Pre-Deployment
- [ ] Node.js >=18 available on the build environment
- [ ] Supabase project created; `DATABASE_URL` + `DIRECT_URL` ready
- [ ] Prisma schema applied (`npx prisma db push` / `migrate`)
- [ ] All environment variables configured (JWT, SMTP, MSG91)
- [ ] MSG91 (primary OTP/SMS) credentials configured; SMTP set as fallback
- [ ] All tests passing

### Backend Deployment → Render (current path)

The repo ships a `render.yaml` blueprint, so Render can provision the service directly from the repo.

1. In the Render dashboard, create a new **Blueprint** from this repo (it reads `render.yaml`).
2. Render uses:
   - **Build command:** `npm install` (which runs `prisma generate` via postinstall)
   - **Start command:** `npm start`
   - **Health check path:** `/api/health`
3. Set the following secrets in the Render dashboard (Environment tab):
   - `DATABASE_URL` — Supabase pooled URL (port `6543`, `?pgbouncer=true`) — used at runtime
   - `DIRECT_URL` — Supabase direct URL (port `5432`) — used by Prisma migrations
   - `JWT_SECRET`
   - SMTP variables (email fallback)
   - MSG91 variables (primary OTP/SMS)
4. Deploy. Apply schema changes from your machine with `npx prisma db push` (uses `DIRECT_URL`) or run `prisma migrate deploy` as part of the release.

> CORS and CSRF are configured to accept any `*.vercel.app` origin, and avatar upload URLs are built from the request host (no hardcoded localhost), so the deployed frontends work against the Render API out of the box.

### Frontend Deployment → Vercel (current path)

Deploy each of the three apps as its **own Vercel project**:

```bash
# Repeat for customer-app, agent-app, and admin-panel
cd customer-app   # then agent-app, then admin-panel
vercel --prod
```

For each Vercel project, set the env var:

```
VITE_API_URL=https://<your-render-app>.onrender.com
```

| Vercel project | Local dev port |
|----------------|----------------|
| customer-app   | 3000 |
| agent-app      | 4000 |
| admin-panel    | 6001 (6000 is blocked by browsers as ERR_UNSAFE_PORT) |

---

## Alternative / Legacy Deployment Notes

> The options below predate the Render/Vercel/Supabase setup and reference the old MongoDB stack. They are retained for reference only.

#### Legacy Backend: Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create water-filter-service

# Set environment variables (Postgres connection strings)
heroku config:set DATABASE_URL=your_pooled_url
heroku config:set DIRECT_URL=your_direct_url
heroku config:set JWT_SECRET=your_secret_key

# Deploy
git push heroku main
```
> Note: Heroku (and similar hosts) block outbound SMTP, which is exactly why MSG91 SMS is the primary OTP channel.

#### Legacy Backend: AWS EC2
```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js (>=18)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Clone repository
git clone https://github.com/yourrepo/water-filter-service.git

# Install dependencies (runs prisma generate)
cd water-filter-service/server
npm install

# Create .env file with production values (DATABASE_URL, DIRECT_URL, ...)
nano .env

# Install PM2 for process management
npm install -g pm2
pm2 start server.js
pm2 save
pm2 startup

# Setup reverse proxy with Nginx
# ... configure Nginx ...
```

#### Legacy Frontend: Netlify / S3
```bash
# Build each app individually (no single client/ folder)
cd customer-app && npm run build   # repeat for agent-app, admin-panel

# Netlify
netlify deploy --prod --dir=dist

# Or AWS S3
aws s3 cp dist s3://your-bucket-name --recursive
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Database Setup

### Supabase (PostgreSQL) — current
1. Create a project at https://supabase.com
2. From **Project Settings → Database**, copy:
   - the **Connection pooling** string (port `6543`) → set as `DATABASE_URL` and append `?pgbouncer=true`
   - the **Direct connection** string (port `5432`) → set as `DIRECT_URL`
3. Apply the schema: `npx prisma db push` (or `npx prisma migrate deploy`)
4. The Prisma schema lives in `server/prisma/schema.prisma` (17 models)

### MongoDB Atlas (legacy — no longer used)
Retained only for historical reference; the app no longer uses MongoDB or the `MONGODB_URI` variable.

## SSL/HTTPS Configuration

### Using Let's Encrypt with Nginx
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com

# Configure Nginx with SSL
sudo nano /etc/nginx/sites-available/default
# Add SSL directives
```

## Performance Optimization

1. **Enable GZIP Compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Database Indexing**
   - Index frequently queried fields
   - Create compound indexes for filters

3. **Caching**
   - Use Redis for session management
   - Cache API responses

4. **CDN**
   - Use Cloudflare or CloudFront for static assets
   - Serve images from CDN

## Monitoring & Logging

1. **Application Monitoring**
   - Set up Sentry for error tracking
   - Use New Relic or DataDog

2. **Logging**
   ```javascript
   const winston = require('winston');
   // Configure Winston for logging
   ```

3. **Uptime Monitoring**
   - Set up UptimeRobot
   - Configure health check endpoints

## Backup & Recovery

1. **Database Backups**
   ```bash
   # PostgreSQL backup (use the DIRECT_URL, port 5432)
   pg_dump "$DIRECT_URL" > backup.sql

   # Restore
   psql "$DIRECT_URL" < backup.sql
   ```

2. **Automated Backups**
   - Use Supabase's built-in automated daily backups (Project Settings → Database → Backups)

## Security Hardening

1. **Environment Variables**
   - Never commit .env to version control
   - Use .env.example as template

2. **Dependency Scanning**
   ```bash
   npm audit
   npm audit fix
   ```

3. **CORS Configuration**
   - Only allow trusted domains

4. **Rate Limiting**
   - Already implemented in server.js
   - Adjust limits based on usage

5. **HTTPS Everywhere**
   - Force HTTPS redirects
   - Use HSTS headers

## Cost Estimation

| Service | Tier | Cost/Month |
|---------|------|-----------|
| Vercel (×3 frontends) | Hobby / Pro | $0 / $20 |
| Render (backend) | Free / Starter | $0 / $7 |
| Supabase (Postgres) | Free / Pro | $0 / $25 |
| MSG91 (OTP/SMS) | Pay-as-you-go | usage-based |
| SMTP (email fallback) | Free | $0 |

## Post-Deployment

1. Set up automated tests
2. Configure CI/CD pipeline
3. Set up monitoring alerts
4. Document deployment process
5. Create runbooks for common issues
6. Set up automated backups
7. Configure DNS properly
8. Test disaster recovery
