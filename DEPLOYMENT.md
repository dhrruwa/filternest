# Water Filter Service Management System - Deployment Guide

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database (MongoDB or MySQL) set up
- [ ] Email service (SMTP) configured
- [ ] Google Maps API key obtained
- [ ] SSL certificates prepared
- [ ] All tests passing

### Backend Deployment (Node.js + Express)

#### Option 1: Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create water-filter-service

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set JWT_SECRET=your_secret_key
heroku config:set SMTP_USER=your_email
heroku config:set SMTP_PASS=your_password

# Deploy
git push heroku main
```

#### Option 2: AWS EC2
```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# Clone repository
git clone https://github.com/yourrepo/water-filter-service.git

# Install dependencies
cd water-filter-service/server
npm install

# Create .env file with production values
nano .env

# Install PM2 for process management
npm install -g pm2
pm2 start server.js
pm2 save
pm2 startup

# Setup reverse proxy with Nginx
# ... configure Nginx ...
```

#### Option 3: DigitalOcean
```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Clone and setup application
git clone https://github.com/yourrepo/water-filter-service.git
cd water-filter-service/server
npm install

# Setup PM2
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

### Frontend Deployment

#### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from client directory
cd client
vercel --prod
```

#### Option 2: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd client
npm run build
netlify deploy --prod --dir=dist
```

#### Option 3: AWS S3 + CloudFront
```bash
# Build the frontend
cd client
npm run build

# Deploy to S3
aws s3 cp dist s3://your-bucket-name --recursive

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Option 4: GitHub Pages
```bash
# Update vite.config.js
# Add: base: '/water-filter-service/'

cd client
npm run build
# Push dist folder to gh-pages branch
```

## Database Setup

### MongoDB Atlas
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Add to MONGODB_URI in .env

### MySQL / MariaDB
```bash
# Create database
CREATE DATABASE water_filter_service;

# Create user
CREATE USER 'wfs_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON water_filter_service.* TO 'wfs_user'@'localhost';
FLUSH PRIVILEGES;
```

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
   # MongoDB backup
   mongodump --uri "mongodb+srv://..." --out ./backup

   # MySQL backup
   mysqldump -u user -p database_name > backup.sql
   ```

2. **Automated Backups**
   - Set up AWS Backup
   - Use MongoDB Atlas automated backups

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
| Vercel | Pro | $20 |
| Netlify | Pro | $19 |
| MongoDB Atlas | M0 (Free) | $0 |
| | M10 | $57 |
| Heroku | Standard | $50 |
| DigitalOcean | Basic | $5-6 |
| AWS EC2 | t2.micro | $9.50 |
| SendGrid | Free | $0 |

## Post-Deployment

1. Set up automated tests
2. Configure CI/CD pipeline
3. Set up monitoring alerts
4. Document deployment process
5. Create runbooks for common issues
6. Set up automated backups
7. Configure DNS properly
8. Test disaster recovery
