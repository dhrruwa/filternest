# Testing Guide & Verification Checklist

## ✅ Pre-Launch Verification

### Backend Health Checks

1. **Database Connection**
   ```bash
   curl http://localhost:5000/api/health
   # Expected: { "status": "Server is running" }
   ```

2. **Authentication Endpoints**
   ```bash
   # Register
   curl -X POST http://localhost:5000/api/auth/register/customer \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Test",
       "lastName": "User",
       "email": "test@example.com",
       "phone": "+1234567890",
       "password": "password123"
     }'
   ```

3. **Services Endpoint**
   ```bash
   curl http://localhost:5000/api/services
   # Expected: Array of services
   ```

### Frontend Checks

1. **Load Home Page**
   - Navigate to http://localhost:3000
   - Verify hero section displays
   - Check responsive design on mobile

2. **Navigation**
   - Click navbar links: Home, Services, About, Contact
   - Verify smooth navigation

3. **Authentication Flow**
   - Click "Sign Up" - Register page loads
   - Fill form and submit (test validation)
   - Login page works correctly
   - Logout functionality works

## 🧪 Manual Test Cases

### Test Case 1: Customer Registration
**Steps:**
1. Go to http://localhost:3000/register
2. Fill form:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Phone: +1234567890
   - Password: Test@123
3. Click Register

**Expected Result:**
- ✅ Registration successful message
- ✅ Redirects to dashboard
- ✅ User data stored in database

### Test Case 2: Service Booking
**Steps:**
1. Go to /book-service
2. Select Service Type: General Service
3. Choose Date & Time: Next Friday, 10:00 AM
4. Enter Address: 123 Main St, City
5. Allow location access
6. Click Book

**Expected Result:**
- ✅ Location coordinates captured
- ✅ Booking ID generated
- ✅ Notification created
- ✅ Redirects to my bookings

### Test Case 3: Admin Dashboard
**Steps:**
1. Login as admin
2. Access /admin-dashboard
3. Check dashboard stats
4. Browse bookings table

**Expected Result:**
- ✅ Stats display correctly
- ✅ Bookings table shows data
- ✅ Pagination works
- ✅ Search functionality (if implemented)

### Test Case 4: Maintenance Reminder
**Steps:**
1. Complete a service booking
2. Mark booking as "Completed"
3. Wait or manually trigger cron job
4. Check notifications

**Expected Result:**
- ✅ Maintenance schedules created
- ✅ Email sent to customer
- ✅ In-app notification created
- ✅ Reminder marked as sent

## 🤖 Automated Testing

### Backend API Tests
```bash
# Using Jest (if configured)
npm test

# Or using curl in a script
./test-api.sh
```

### Frontend Component Tests
```bash
cd client
npm test -- --watch
```

## 📊 Performance Testing

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:5000/api/services

# Expected: Response time < 500ms
```

### Browser DevTools
1. Open DevTools (F12)
2. Go to Performance tab
3. Load http://localhost:3000
4. Check metrics:
   - Largest Contentful Paint (LCP) < 2.5s
   - First Input Delay (FID) < 100ms
   - Cumulative Layout Shift (CLS) < 0.1

## 🔒 Security Testing

### CORS Testing
```bash
curl -H "Origin: http://malicious.com" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:5000/api/auth/register/customer -v
# Should reject or handle appropriately
```

### SQL Injection Test
```bash
# Attempt injection in login
curl -X POST http://localhost:5000/api/auth/login/customer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin\" OR \"1\"=\"1",
    "password": "anything"
  }'
# Expected: Invalid credentials error
```

### JWT Token Test
```bash
# Without token
curl http://localhost:5000/api/customers/profile
# Expected: 401 Unauthorized

# With invalid token
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:5000/api/customers/profile
# Expected: 401 Invalid token
```

## 📱 Responsive Design Testing

### Screen Sizes to Test
- [ ] Mobile: 375px (iPhone SE)
- [ ] Mobile: 414px (iPhone 12)
- [ ] Tablet: 768px (iPad)
- [ ] Tablet: 1024px (iPad Pro)
- [ ] Desktop: 1440px
- [ ] Desktop: 1920px

### Responsive Features
- [ ] Navigation hamburger menu on mobile
- [ ] Touch-friendly buttons
- [ ] Images scale properly
- [ ] Forms are usable on small screens
- [ ] No horizontal scrolling

## 🌍 Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## 📋 Final Checklist

### Functionality
- [ ] User can register and login
- [ ] User can book services
- [ ] Location is captured
- [ ] Notifications are sent
- [ ] Admin can see all bookings
- [ ] Admin can assign agents
- [ ] Services are listed correctly
- [ ] Maintenance reminders work

### UI/UX
- [ ] All pages load correctly
- [ ] Animations are smooth
- [ ] Colors are consistent
- [ ] Typography is readable
- [ ] Forms have validation
- [ ] Error messages are clear
- [ ] Loading states are visible
- [ ] Responsive on all devices

### Performance
- [ ] Pages load quickly
- [ ] No console errors
- [ ] API responses are fast
- [ ] Images are optimized
- [ ] No memory leaks

### Security
- [ ] Passwords are hashed
- [ ] JWTs are validated
- [ ] CORS is configured
- [ ] Rate limiting works
- [ ] Input validation present
- [ ] No sensitive data in logs
- [ ] HTTPS ready

### Documentation
- [ ] README.md is complete
- [ ] API endpoints documented
- [ ] Setup instructions clear
- [ ] Deployment guide provided
- [ ] Architecture documented

## 🚀 Deployment Readiness

- [ ] All environment variables configured
- [ ] Database backups working
- [ ] Monitoring setup
- [ ] Error tracking (Sentry)
- [ ] Analytics enabled
- [ ] SSL certificates ready
- [ ] Logging configured
- [ ] Backup procedures documented

## 📞 Troubleshooting

If tests fail:
1. Check backend console for errors
2. Check frontend browser console
3. Verify database connection
4. Check environment variables
5. Review logs
6. Try clearing cache: Ctrl+Shift+Delete

## ✨ Sign-Off

- [ ] Developer: Testing complete
- [ ] Code review: Approved
- [ ] QA: All tests passed
- [ ] Ready for deployment

---

**Date:** ____________  
**Tester:** ____________  
**Notes:** ____________
