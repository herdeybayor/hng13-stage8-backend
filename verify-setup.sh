#!/bin/bash

echo "========================================="
echo "Wallet Service - Setup Verification"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
echo "Checking Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed"
    docker --version
else
    echo -e "${RED}✗${NC} Docker is not installed"
    echo "  Install from: https://docs.docker.com/get-docker/"
    exit 1
fi
echo ""

# Check Docker Compose
echo "Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose is installed"
    docker-compose --version
else
    echo -e "${RED}✗${NC} Docker Compose is not installed"
    echo "  Install from: https://docs.docker.com/compose/install/"
    exit 1
fi
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js is installed"
    node --version
else
    echo -e "${RED}✗${NC} Node.js is not installed"
    echo "  Install from: https://nodejs.org/"
    exit 1
fi
echo ""

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} npm is installed"
    npm --version
else
    echo -e "${RED}✗${NC} npm is not installed"
    exit 1
fi
echo ""

# Check .env file
echo "Checking environment file..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"

    # Check if important variables are set
    if grep -q "GOOGLE_CLIENT_ID=your-google-client-id" .env; then
        echo -e "${YELLOW}⚠${NC}  Warning: GOOGLE_CLIENT_ID not configured"
    fi

    if grep -q "PAYSTACK_SECRET_KEY=sk_test_your" .env; then
        echo -e "${YELLOW}⚠${NC}  Warning: PAYSTACK_SECRET_KEY not configured"
    fi
else
    echo -e "${YELLOW}⚠${NC}  .env file not found"
    echo "  Run: cp .env.example .env"
fi
echo ""

# Check if node_modules exists
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC}  Dependencies not installed"
    echo "  Run: npm install"
fi
echo ""

# Check if port 5432 is available
echo "Checking if port 5432 (PostgreSQL) is available..."
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}  Port 5432 is already in use"
    echo "  Stop the service using this port or use a different port"
else
    echo -e "${GREEN}✓${NC} Port 5432 is available"
fi
echo ""

# Check if port 3000 is available
echo "Checking if port 3000 (API) is available..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}  Port 3000 is already in use"
    echo "  Stop the service using this port or configure a different port"
else
    echo -e "${GREEN}✓${NC} Port 3000 is available"
fi
echo ""

# Summary
echo "========================================="
echo "Setup Verification Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Configure .env with your Google OAuth and Paystack credentials"
echo "2. Start database: npm run docker:db"
echo "3. Install dependencies: npm install (if not done)"
echo "4. Start application: npm run start:dev"
echo ""
echo "For detailed instructions, see README.md"
