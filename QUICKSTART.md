# Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Clone and Navigate
```bash
cd /Users/dhruva/Downloads/filter_service
```

### Step 2: Install All Dependencies
```bash
npm run install-all
```

### Step 3: Configure Environment

**Backend (.env)**
```bash
cd server
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/water-filter-service
JWT_SECRET=your_super_secret_key_12345
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_or_16char_code
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env)**
```bash
cd ../client
cp .env.example .env
```

### Step 4: MongoDB Setup

**Option A: Local MongoDB**
```bash
# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify connection
mongosh
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Get connection string
4. Update MONGODB_URI in server/.env

### Step 5: Seed Initial Data
```bash
cd server
npm run seed
```

### Step 6: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Output: Server is running on port 5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Output: Local: http://localhost:3000
```

### Step 7: Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

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
filter_service/
├── server/                 # Node.js backend
│   ├── models/            # MongoDB schemas
│   ├── controllers/       # Business logic
│   ├── routes/            # API endpoints
│   ├── services/          # Services (email, notifications, scheduler)
│   ├── middleware/        # Auth, validation
│   ├── utils/             # Utilities
│   ├── server.js          # Entry point
│   └── package.json
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # React components
│   │   ├── services/      # API calls
│   │   ├── context/       # State management
│   │   ├── styles/        # CSS/Tailwind
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
│
├── README.md              # Full documentation
├── DEPLOYMENT.md          # Deployment guide
├── ARCHITECTURE.md        # System design
└── package.json           # Root scripts
```

## 🔐 Environment Variables Checklist

### Backend (.env)
- [ ] MONGODB_URI (MongoDB connection)
- [ ] JWT_SECRET (Change from default!)
- [ ] SMTP_USER (Email for notifications)
- [ ] SMTP_PASS (Email app password)
- [ ] FRONTEND_URL (Frontend address)

### Frontend (.env)
- [ ] VITE_API_URL (Backend API URL)
- [ ] VITE_GOOGLE_MAPS_API_KEY (Optional, for maps)

## 🧪 Testing the API

### Using cURL

**Register Customer:**
```bash
curl -X POST http://localhost:5000/api/auth/register/customer \
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
curl -X POST http://localhost:5000/api/auth/login/customer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get Services:**
```bash
curl http://localhost:5000/api/services
```

### Using Postman
1. Download Postman: https://www.postman.com/downloads/
2. Import the API endpoints (create collection)
3. Set base URL to `http://localhost:5000/api`
4. Test endpoints with request body

## 🚨 Common Issues & Solutions

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
# macOS:
brew services list

# Start MongoDB:
brew services start mongodb-community

# Windows:
net start MongoDB
```

### Port Already in Use
```bash
# Kill process on port 5000:
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000:
lsof -ti:3000 | xargs kill -9
```

### CORS Error
- Ensure FRONTEND_URL is set correctly in backend .env
- Check browser console for error details

### Email Not Sending
- Verify SMTP credentials
- Use Gmail app password (not regular password)
- Enable "Less secure app access" if using Gmail

## 🎯 Next Steps

1. **Configure Email Service**
   - Get Gmail app password or use SendGrid
   - Update SMTP settings in .env

2. **Add Google Maps API**
   - Get API key from Google Cloud Console
   - Add to frontend .env

3. **Set Up Database Backups**
   - For MongoDB Atlas: enable automatic backups
   - For local: create cron backup job

4. **Deploy to Production**
   - See DEPLOYMENT.md for detailed guide
   - Heroku, AWS, DigitalOcean options available

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
- MongoDB: https://docs.mongodb.com
- Framer Motion: https://www.framer.com/motion

---

**You're all set! Start building and enjoy! 🎉**
