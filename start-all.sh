#!/bin/bash

# FilterNest Multi-App Startup Script
# Starts all three frontend apps and the backend API in one go

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        FilterNest Multi-Frontend SaaS Architecture           ║"
echo "║                    Starting All Services                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Store PIDs for cleanup
PIDS=()
APPS=()

# Function to handle script termination
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    for pid in "${PIDS[@]}"; do
        if ps -p "$pid" > /dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    wait
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup SIGINT SIGTERM

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${RED}Error: Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

echo "Checking ports..."
for port in 5001 3000 4000 6000; do
    if ! check_port $port; then
        echo -e "${YELLOW}Attempting to free port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
done

echo ""

# Start Backend Server
echo -e "${BLUE}[1/4]${NC} Starting Backend API on port ${BLUE}5001${NC}..."
cd server
npm install > /dev/null 2>&1 || true
npm run dev &
SERVER_PID=$!
PIDS+=($SERVER_PID)
APPS+=("Backend API (PID: $SERVER_PID)")
echo -e "${GREEN}✓${NC} Backend API started"
sleep 3

# Start Customer App
echo ""
echo -e "${BLUE}[2/4]${NC} Starting Customer App on port ${BLUE}3000${NC}..."
cd ../customer-app
npm install > /dev/null 2>&1 || true
npm run dev &
CUSTOMER_PID=$!
PIDS+=($CUSTOMER_PID)
APPS+=("Customer App (PID: $CUSTOMER_PID)")
echo -e "${GREEN}✓${NC} Customer App started"
sleep 3

# Start Agent App
echo ""
echo -e "${BLUE}[3/4]${NC} Starting Agent App on port ${BLUE}4000${NC}..."
cd ../agent-app
npm install > /dev/null 2>&1 || true
npm run dev &
AGENT_PID=$!
PIDS+=($AGENT_PID)
APPS+=("Agent App (PID: $AGENT_PID)")
echo -e "${GREEN}✓${NC} Agent App started"
sleep 3

# Start Admin Panel
echo ""
echo -e "${BLUE}[4/4]${NC} Starting Admin Panel on port ${BLUE}6000${NC}..."
cd ../admin-panel
npm install > /dev/null 2>&1 || true
npm run dev &
ADMIN_PID=$!
PIDS+=($ADMIN_PID)
APPS+=("Admin Panel (PID: $ADMIN_PID)")
echo -e "${GREEN}✓${NC} Admin Panel started"
sleep 2

# Display summary
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  All Services Started!                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Applications:${NC}"
echo "  🛒 Customer App:  ${BLUE}http://localhost:3000${NC}"
echo "  🔧 Agent App:     ${BLUE}http://localhost:4000${NC}"
echo "  ⚙️  Admin Panel:   ${BLUE}http://localhost:6000${NC}"
echo "  📡 Backend API:   ${BLUE}http://localhost:5001${NC}"
echo ""
echo -e "${YELLOW}Test Credentials:${NC}"
echo "  Customer: customer@test.com / password123"
echo "  Admin:    admin@filternest.com / admin123"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all processes
for pid in "${PIDS[@]}"; do
    wait "$pid" 2>/dev/null || true
done
