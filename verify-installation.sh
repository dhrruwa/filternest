#!/bin/bash
# Project Installation Verification Script
# Run this to verify all multi-app project files are correctly in place

echo "🔍 Verifying FilterNest Multi-App Environment Installation..."
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
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((errors++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((successes++))
    else
        echo -e "${RED}✗${NC} $1/ (MISSING)"
        ((errors++))
    fi
}

echo "📁 Checking Directory Structure..."
check_dir "server"
check_dir "customer-app"
check_dir "agent-app"
check_dir "admin-panel"
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
check_file "start-all.sh"
check_file "verify-installation.sh"

echo ""
echo "🔌 Checking Backend Core Files..."
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
echo "🛒 Checking Customer App Frontend..."
check_file "customer-app/package.json"
check_file "customer-app/index.html"
check_file "customer-app/vite.config.js"
check_dir "customer-app/src/pages"
check_dir "customer-app/src/components"
check_dir "customer-app/src/context"
check_dir "customer-app/src/services"

echo ""
echo "🔧 Checking Agent App Frontend..."
check_file "agent-app/package.json"
check_file "agent-app/index.html"
check_file "agent-app/vite.config.js"
check_dir "agent-app/src/pages"
check_dir "agent-app/src/components"
check_dir "agent-app/src/context"
check_dir "agent-app/src/services"

echo ""
echo "⚙️ Checking Admin Panel Frontend..."
check_file "admin-panel/package.json"
check_file "admin-panel/index.html"
check_file "admin-panel/vite.config.js"
check_dir "admin-panel/src/pages"
check_dir "admin-panel/src/components"
check_dir "admin-panel/src/context"
check_dir "admin-panel/src/services"

echo ""
echo "====================================="
echo "📊 Verification Summary"
echo "====================================="
echo -e "✓ Files & Directories Found: ${GREEN}${successes}${NC}"
echo -e "✗ Files & Directories Missing: ${RED}${errors}${NC}"
echo ""

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All multi-app components verified successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. npm run install-all"
    echo "2. Configure .env files"
    echo "3. npm run dev"
    exit 0
else
    echo -e "${RED}⚠️  Some files are missing from the configuration!${NC}"
    echo "Please check the installation checklist."
    exit 1
fi
