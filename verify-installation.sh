#!/bin/bash
# Project Installation Verification Script
# Run this to verify all project files are in place

echo "🔍 Verifying Water Filter Service Management System Installation..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

errors=0
successes=0

# Check function
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((successes++))
    else
        echo -e "${RED}✗${NC} $1"
        ((errors++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((successes++))
    else
        echo -e "${RED}✗${NC} $1/"
        ((errors++))
    fi
}

echo "📁 Checking Directory Structure..."
check_dir "server"
check_dir "client"
check_dir ".github"

echo ""
echo "📄 Checking Root Configuration Files..."
check_file "package.json"
check_file "README.md"
check_file "QUICKSTART.md"
check_file "DEPLOYMENT.md"
check_file "ARCHITECTURE.md"
check_file "TESTING.md"
check_file "PROJECT_SUMMARY.md"
check_file ".gitignore"

echo ""
echo "🔌 Checking Backend Files..."
check_file "server/package.json"
check_file "server/server.js"
check_file "server/.env.example"

echo ""
echo "📁 Checking Backend Directories..."
check_dir "server/models"
check_dir "server/controllers"
check_dir "server/routes"
check_dir "server/middleware"
check_dir "server/services"
check_dir "server/utils"
check_dir "server/config"

echo ""
echo "📋 Checking Backend Models..."
check_file "server/models/Customer.js"
check_file "server/models/Agent.js"
check_file "server/models/Booking.js"
check_file "server/models/MaintenanceSchedule.js"
check_file "server/models/Notification.js"
check_file "server/models/Invoice.js"
check_file "server/models/Service.js"
check_file "server/models/Admin.js"

echo ""
echo "🎛️ Checking Backend Controllers..."
check_file "server/controllers/authController.js"
check_file "server/controllers/customerController.js"
check_file "server/controllers/bookingController.js"
check_file "server/controllers/agentController.js"
check_file "server/controllers/adminController.js"

echo ""
echo "🛣️ Checking Backend Routes..."
check_file "server/routes/authRoutes.js"
check_file "server/routes/customerRoutes.js"
check_file "server/routes/bookingRoutes.js"
check_file "server/routes/agentRoutes.js"
check_file "server/routes/adminRoutes.js"
check_file "server/routes/notificationRoutes.js"
check_file "server/routes/serviceRoutes.js"

echo ""
echo "⚙️ Checking Backend Middleware..."
check_file "server/middleware/auth.js"
check_file "server/middleware/authorize.js"
check_file "server/middleware/validation.js"

echo ""
echo "🔧 Checking Backend Services..."
check_file "server/services/emailService.js"
check_file "server/services/notificationService.js"
check_file "server/services/schedulerService.js"

echo ""
echo "🎨 Checking Frontend Files..."
check_file "client/package.json"
check_file "client/index.html"
check_file "client/.env.example"
check_file "client/tailwind.config.js"
check_file "client/postcss.config.js"
check_file "client/vite.config.js"

echo ""
echo "📁 Checking Frontend Directories..."
check_dir "client/src"
check_dir "client/src/pages"
check_dir "client/src/components"
check_dir "client/src/services"
check_dir "client/src/context"
check_dir "client/src/styles"
check_dir "client/src/utils"

echo ""
echo "📖 Checking Frontend Pages..."
check_file "client/src/pages/Home.jsx"
check_file "client/src/pages/Login.jsx"
check_file "client/src/pages/Register.jsx"
check_file "client/src/pages/Services.jsx"
check_file "client/src/pages/About.jsx"
check_file "client/src/pages/Contact.jsx"
check_file "client/src/pages/BookService.jsx"
check_file "client/src/pages/Dashboard.jsx"
check_file "client/src/pages/AdminDashboard.jsx"

echo ""
echo "🧩 Checking Frontend Components..."
check_file "client/src/components/Navbar.jsx"
check_file "client/src/components/Footer.jsx"
check_file "client/src/components/ServiceCard.jsx"
check_file "client/src/components/BookingCard.jsx"

echo ""
echo "🌐 Checking Frontend Services..."
check_file "client/src/services/api.js"
check_file "client/src/services/services.js"

echo ""
echo "🧠 Checking Frontend State Management..."
check_file "client/src/context/authStore.js"

echo ""
echo "🎪 Checking Frontend App Files..."
check_file "client/src/App.jsx"
check_file "client/src/main.jsx"
check_file "client/src/styles/globals.css"

echo ""
echo "=====================================  "
echo "📊 Verification Summary"
echo "====================================="
echo -e "✓ Files Found: ${GREEN}${successes}${NC}"
echo -e "✗ Files Missing: ${RED}${errors}${NC}"
echo ""

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All files verified successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. npm run install-all"
    echo "2. Configure .env files"
    echo "3. npm run dev"
    exit 0
else
    echo -e "${RED}⚠️  Some files are missing!${NC}"
    echo "Please check the installation."
    exit 1
fi
