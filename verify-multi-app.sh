#!/bin/bash

# FilterNest Multi-App Verification Script
# Checks that all apps are properly configured

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     FilterNest Multi-App Configuration Verification          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0
WARNINGS=0

check_file() {
    if [ -f "$1" ]; then
        echo "✓ $1"
        return 0
    else
        echo "✗ $1 (MISSING)"
        ((ERRORS++))
        return 1
    fi
}

check_directory() {
    if [ -d "$1" ]; then
        echo "✓ $1"
        return 0
    else
        echo "✗ $1 (MISSING)"
        ((ERRORS++))
        return 1
    fi
}

echo "Checking Backend..."
check_directory "server"
check_file "server/package.json"
check_file "server/server.js"
check_file "server/.env"

echo ""
echo "Checking Customer App..."
check_directory "customer-app"
check_file "customer-app/package.json"
check_file "customer-app/vite.config.js"
check_file "customer-app/.env"
check_directory "customer-app/src/pages"
check_directory "customer-app/src/components"
check_directory "customer-app/src/context"
check_directory "customer-app/src/services"

echo ""
echo "Checking Agent App..."
check_directory "agent-app"
check_file "agent-app/package.json"
check_file "agent-app/vite.config.js"
check_file "agent-app/.env"
check_directory "agent-app/src/pages"
check_directory "agent-app/src/components"
check_directory "agent-app/src/context"
check_directory "agent-app/src/services"

echo ""
echo "Checking Admin Panel..."
check_directory "admin-panel"
check_file "admin-panel/package.json"
check_file "admin-panel/vite.config.js"
check_file "admin-panel/.env"
check_directory "admin-panel/src/pages"
check_directory "admin-panel/src/components"
check_directory "admin-panel/src/context"
check_directory "admin-panel/src/services"

echo ""
echo "Checking Key Files..."
check_file "MULTI_APP_README.md"
check_file "start-all.sh"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"

if [ $ERRORS -eq 0 ]; then
    echo "║            ✓ All checks passed! System ready.              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    exit 0
else
    echo "║        ✗ $ERRORS errors found. Please review.             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    exit 1
fi
