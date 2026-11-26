#!/bin/bash
# ================================================================
# Workforce Intelligence — Localhost MySQL Setup Script
# Run: bash setup-localhost.sh
# ================================================================

set -e
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo ""
echo "⚡ Workforce Intelligence — Localhost Setup"
echo "==========================================="
echo ""

# 1. Check Node.js
echo -n "Checking Node.js... "
if command -v node &>/dev/null; then
    VER=$(node -v)
    echo -e "${GREEN}✅ $VER${NC}"
else
    echo -e "${RED}❌ Node.js not found. Install Node.js 22+ from https://nodejs.org${NC}"
    exit 1
fi

# 2. Check MySQL
echo -n "Checking MySQL... "
if command -v mysql &>/dev/null; then
    echo -e "${GREEN}✅ $(mysql --version | awk '{print $1,$2,$3}')${NC}"
else
    echo -e "${YELLOW}⚠️  MySQL CLI not found. Install MySQL 8.0+ first.${NC}"
fi

# 3. Setup .env
echo ""
echo "Setting up .env..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ .env created from .env.example${NC}"
else
    echo -e "${YELLOW}⚠️  .env already exists — keeping it${NC}"
fi

# 4. Install npm dependencies
echo ""
echo "Installing Node.js dependencies..."
PUPPETEER_SKIP_DOWNLOAD=true npm install --silent
echo -e "${GREEN}✅ Dependencies installed${NC}"

# 5. Setup MySQL database
echo ""
echo "Setting up MySQL database..."
echo -e "${YELLOW}Enter your MySQL ROOT password when prompted:${NC}"

# Create DB, user, grant permissions
mysql -u root -p << 'SQLEOF'
CREATE DATABASE IF NOT EXISTS workforce_intelligence
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'wfi_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'P123/';
CREATE USER IF NOT EXISTS 'wfi_user'@'%' IDENTIFIED WITH mysql_native_password BY 'P123/';

GRANT ALL PRIVILEGES ON workforce_intelligence.* TO 'wfi_user'@'localhost';
GRANT ALL PRIVILEGES ON workforce_intelligence.* TO 'wfi_user'@'%';

FLUSH PRIVILEGES;

SELECT 'Database setup complete!' AS Status;
SQLEOF

echo ""
echo "Importing schema and seed data..."

# Import schema (01_init.sql)
echo -e "${GREEN}✅ Database + user created (root)${NC}"

# Import master schema + seed data (02_master.sql)
mysql -u wfi_user -p'P123/' workforce_intelligence < database/init/02_master.sql
echo -e "${GREEN}✅ Master data (02_master.sql) imported${NC}"

# 6. Verify tables
echo ""
echo "Verifying database..."
TABLE_COUNT=$(mysql -u wfi_user -p'P123/' workforce_intelligence -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='workforce_intelligence';" 2>/dev/null)
USER_COUNT=$(mysql -u wfi_user -p'P123/' workforce_intelligence -se "SELECT COUNT(*) FROM users;" 2>/dev/null)
echo -e "${GREEN}✅ Tables created: $TABLE_COUNT${NC}"
echo -e "${GREEN}✅ Demo users: $USER_COUNT${NC}"

# 7. Start the server
echo ""
echo "==========================================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Start the server:"
echo "  npm start       # production"
echo "  npm run dev     # development (auto-reload)"
echo ""
echo "Open in browser:"
echo "  http://localhost:5000/login.html"
echo ""
echo "Demo credentials:"
echo "  Admin   : admin@wip.com           / P123/"
echo "  HR      : hr@wfintelligence.com   / P123/"
echo "  Manager : manager@wfintelligence.com / P123/"
echo "  Employee: employee@wfintelligence.com / P123/"
echo "==========================================="
