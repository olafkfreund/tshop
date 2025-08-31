# TShop Development Commands
# Run `just --list` to see all available commands

# Default recipe - shows help and detects OS
default:
    @just --list
    @echo ""
    @just detect-os

# Detect operating system and show recommended setup
detect-os:
    #!/usr/bin/env bash
    if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v nixos-version >/dev/null 2>&1; then
        echo "NixOS detected - Docker is recommended for development"
        echo "   Quick start: just docker-start"
        echo "   Or use: ./docker-start.sh"
    else
        echo "Non-NixOS system detected - native development available"
        echo "   Quick start: just quick-start-local"
    fi

# === Docker Development (Recommended for NixOS) ===

#  Start TShop with Docker (recommended for NixOS)
docker-start:
    @echo " Starting TShop with Docker..."
    ./docker-start.sh

#  Build Docker images
docker-build:
    @echo " Building Docker images..."
    docker build -t tshop:dev --target development .

#  Start Docker services in background
docker-up:
    @echo " Starting Docker services in background..."
    docker-compose up -d

#  Stop Docker services
docker-down:
    @echo " Stopping Docker services..."
    docker-compose down

#  View Docker logs
docker-logs:
    @echo " Viewing Docker logs..."
    docker-compose logs -f

#  Restart Docker services
docker-restart: docker-down docker-up

#  Docker health check
docker-health:
    @echo " Checking Docker services health..."
    @echo "Mock API: $(curl -s http://localhost:8080/health | jq -r .status 2>/dev/null || echo 'Not running')"
    @echo "Web App: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo 'Not running')"
    @echo "Prisma Studio: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:5555 2>/dev/null || echo 'Not running')"

# === Native Development (For Non-NixOS Systems) ===

# ️ Set up native development environment
setup:
    @echo "️ Setting up native development environment..."
    @echo "️  Note: On NixOS, use 'just docker-start' instead"
    env-setup

#  Complete local native setup
setup-local:
    @echo " Setting up complete local development environment..."
    @echo "️  Note: On NixOS, use 'just docker-start' instead"
    setup-local-dev

# === Database Operations ===

# ️ Set up PostgreSQL database (requires PostgreSQL running)
db-setup:
    @echo "️ Setting up PostgreSQL database..."
    db-setup

# ️ Set up SQLite database (local development)
db-sqlite:
    @echo "️ Setting up SQLite for local development..."
    setup-sqlite

#  Run database migrations
db-migrate:
    @echo " Running database migrations..."
    db-migrate

#  Open Prisma Studio
db-studio:
    @echo " Opening Prisma Studio..."
    npx prisma studio

#  Seed database with sample data
db-seed:
    @echo " Seeding database..."
    npx prisma db seed

#  Reset database (dangerous!)
db-reset:
    @echo "️ Resetting database..."
    npx prisma migrate reset

# === Native Development Server (Non-NixOS) ===

#  Start native development server (full mode with external APIs)
dev:
    @echo " Starting TShop development server..."
    @echo "️  Note: On NixOS, use 'just docker-start' instead"
    npm run dev

#  Start native local development (no external APIs required)
dev-local:
    @echo " Starting local development environment..."
    @echo "️  Note: On NixOS, use 'just docker-start' instead"
    overmind start -f Procfile.local

#  Stop native development services
dev-stop:
    @echo " Stopping development services..."
    overmind stop

#  Restart native development services
dev-restart: dev-stop dev

# === Testing ===

#  Run all tests
test:
    @echo " Running tests..."
    npm test

#  Run tests in CI mode (no watch)
test-ci:
    @echo " Running tests in CI mode..."
    npm run test:ci

#  Run end-to-end tests
test-e2e:
    @echo " Running end-to-end tests..."
    npm run test:e2e

#  Run end-to-end tests with UI
test-e2e-ui:
    @echo " Running end-to-end tests with UI..."
    npm run test:e2e:ui

# === Code Quality ===

#  Format code
format:
    @echo " Formatting code..."
    npm run format

#  Lint code
lint:
    @echo " Linting code..."
    npm run lint

#  Check linting without fixing
lint-check:
    @echo " Checking code style..."
    npm run lint:check

#  Type check TypeScript
type-check:
    @echo " Running TypeScript type check..."
    npm run type-check

#  Fix all code issues (format + lint)
fix:
    @echo " Fixing all code issues..."
    npm run format
    npm run lint

# === Build & Deployment ===

#  Build for production
build:
    @echo " Building for production..."
    npm run build

#  Build and analyze bundle
build-analyze:
    @echo " Building and analyzing bundle..."
    ANALYZE=true npm run build

#  Start production server
start:
    @echo " Starting production server..."
    npm start

# === Mock Services (Native Development) ===

#  Start native mock API server (port 8080)
mock-server:
    @echo " Starting native mock API server on port 8080..."
    @echo "️  Note: On NixOS, use 'just docker-start' instead"
    python scripts/mock-services.py

#  Test mock API health
mock-health:
    @echo " Checking mock API health..."
    curl -s http://localhost:8080/health | jq || curl -s http://localhost:8080/health

# === Package Management ===

#  Install dependencies
install:
    @echo " Installing dependencies..."
    npm install

#  Install and clean cache
install-clean:
    @echo " Installing dependencies with clean cache..."
    npm ci

# ️ Update dependencies
update:
    @echo "️ Updating dependencies..."
    npm update

#  Audit dependencies for security issues
audit:
    @echo " Auditing dependencies..."
    npm audit

#  Fix security vulnerabilities
audit-fix:
    @echo " Fixing security vulnerabilities..."
    npm audit fix

# === Utilities ===

#  Check development environment health
health:
    @echo " Running health check..."
    health-check

#  Clean development environment
clean:
    @echo " Cleaning development environment..."
    dev-clean

#  Show project information
info:
    @echo " TShop Project Information"
    @echo "============================"
    @just detect-os
    @echo ""
    @echo "System Information:"
    @echo "  Node.js version: $(node --version 2>/dev/null || echo 'Not available')"
    @echo "  npm version: $(npm --version 2>/dev/null || echo 'Not available')"
    @echo "  Docker version: $(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',' || echo 'Not available')"
    @echo "  Project version: $(jq -r .version package.json 2>/dev/null || echo 'N/A')"
    @echo "  Environment: $(echo $NODE_ENV)"
    @echo "  Current directory: $(pwd)"
    @echo ""
    @echo "Available services:"
    @echo "  -  Web app: http://localhost:3000"
    @echo "  -  Mock APIs: http://localhost:8080"
    @echo "  -  Prisma Studio: http://localhost:5555"
    @echo ""
    @echo "Service Status:"
    @echo "  - Web app: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null | sed 's/200/ Running/;s/500/⚠️  Running (errors)/;s/.*/❌ Not running/' || echo '❌ Not running')"
    @echo "  - Mock API: $(curl -s http://localhost:8080/health >/dev/null 2>&1 && echo ' Running' || echo '❌ Not running')"
    @echo "  - Prisma Studio: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:5555 2>/dev/null | sed 's/200/ Running/;s/.*/❌ Not running/' || echo '❌ Not running')"

#  Show development logs
logs:
    @echo " Showing development logs..."
    tail -f logs/*.log 2>/dev/null || echo "No logs found. Start services first."

#  Update git hooks
hooks:
    @echo " Setting up git hooks..."
    pre-commit install --install-hooks

# === Environment Variables ===

#  Show environment variables (safe ones only)
env-show:
    @echo " Current environment variables:"
    @echo "NODE_ENV: $(echo $NODE_ENV)"
    @echo "DATABASE_URL: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/')"
    @echo "NEXTAUTH_URL: $(echo $NEXTAUTH_URL)"
    @echo "REDIS_URL: $(echo $REDIS_URL)"

#  Create .env.local from template
env-create:
    @if [ ! -f ".env.local" ]; then \
        if [ -f ".env.example" ]; then \
            cp .env.example .env.local; \
            echo " Created .env.local from .env.example"; \
        else \
            echo " No .env.example found"; \
        fi; \
    else \
        echo "️ .env.local already exists"; \
    fi

# === Quick Start Recipes ===

#  Quick start (auto-detects NixOS vs other systems)
quick-start:
    #!/usr/bin/env bash
    if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v nixos-version >/dev/null 2>&1; then
        echo " NixOS detected - using Docker"
        just docker-start
    else
        echo "️ Non-NixOS system - using native setup"
        just quick-start-local-native
    fi

#  Complete native setup for new developers (local mode)
quick-start-local-native:
    @echo " Complete native setup for local development..."
    @echo "️  Note: On NixOS, use 'just docker-start' instead"
    just setup-local
    just install
    just db-sqlite
    just db-migrate
    @echo ""
    @echo " Setup complete! Run 'just dev-local' to start development"

#  Complete native setup for full development (with external APIs)
quick-start-full-native:
    @echo " Complete native setup for full development..."
    @echo "️  Note: On NixOS, use 'just docker-start' instead"
    just setup
    just install
    just db-setup
    just db-migrate
    @echo ""
    @echo " Setup complete!"
    @echo "️ Configure your .env.local with API keys, then run 'just dev'"

# === Docker Testing (All Systems) ===

#  Test AI design generation
test-ai:
    @echo " Testing AI design generation..."
    curl -X POST http://localhost:8080/ai/generate-design -H "Content-Type: application/json" -d '{"prompt": "Cool vintage logo", "product_type": "tshirt"}'

# === Backup & Restore ===

#  Backup database (PostgreSQL)
backup-db:
    @echo " Backing up database..."
    pg_dump $DATABASE_URL > "backup-$(date +%Y%m%d-%H%M%S).sql"
    @echo " Database backed up to backup-$(date +%Y%m%d-%H%M%S).sql"

#  Backup database (SQLite)
backup-db-sqlite:
    @echo " Backing up SQLite database..."
    cp data/tshop_dev.db "data/backup-$(date +%Y%m%d-%H%M%S).db"
    @echo " SQLite database backed up"

# === Performance & Analytics ===

#  Analyze bundle size
analyze-bundle:
    @echo " Analyzing bundle size..."
    npx @next/bundle-analyzer .next

#  Run lighthouse audit
lighthouse:
    @echo " Running Lighthouse audit..."
    npx lighthouse http://localhost:3000 --output=html --output-path=./reports/lighthouse.html
    @echo " Report saved to ./reports/lighthouse.html"

#  Check for unused dependencies
unused-deps:
    @echo " Checking for unused dependencies..."
    npx depcheck

# === Security ===

#  Security audit
security-audit:
    @echo " Running security audit..."
    npm audit
    npx auditjs

#  Check for secrets in code
check-secrets:
    @echo " Checking for potential secrets..."
    git secrets --scan || echo "Install git-secrets for secret scanning"

# === Maintenance ===

#  Update project dependencies
update-deps:
    @echo " Updating project dependencies..."
    npx npm-check-updates -u
    npm install

#  Clean node_modules and reinstall
reinstall:
    @echo " Cleaning and reinstalling dependencies..."
    rm -rf node_modules package-lock.json
    npm install

#  Project stats
stats:
    @echo " Project Statistics"
    @echo "==================="
    @echo "Lines of code:"
    @find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l | tail -1
    @echo ""
    @echo "File count by type:"
    @find src -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn

#  Fix common development issues
fix-common:
    @echo " Fixing common development issues..."
    rm -rf .next
    rm -rf node_modules/.cache
    npx prisma generate
    @echo " Common issues fixed"

# === Help & Documentation ===

#  Show detailed help
help:
    @echo " TShop Development Commands Help"
    @echo "=================================="
    @echo ""
    @just detect-os
    @echo ""
    @echo " Quick Start:"
    @echo "  just quick-start          # Auto-detect system and start"
    @echo "  just docker-start         # Docker development (recommended for NixOS)"
    @echo "  ./docker-start.sh         # Alternative Docker start script"
    @echo ""
    @echo " Docker Development (NixOS Recommended):"
    @echo "  just docker-build         # Build Docker images"
    @echo "  just docker-up            # Start services in background"
    @echo "  just docker-down          # Stop services"
    @echo "  just docker-logs          # View logs"
    @echo "  just docker-health        # Check service health"
    @echo ""
    @echo "️  Native Development (Non-NixOS):"
    @echo "  just setup-local          # Set up everything locally"
    @echo "  just dev-local            # Start local development server"
    @echo "  just mock-server          # Start mock API server"
    @echo ""
    @echo " Database:"
    @echo "  just db-sqlite            # Use SQLite for local development"
    @echo "  just db-setup             # Use PostgreSQL (requires running instance)"
    @echo "  just db-migrate           # Run database migrations"
    @echo ""
    @echo " Testing & Quality:"
    @echo "  just test                 # Run tests"
    @echo "  just lint                 # Check code style"
    @echo "  just type-check           # TypeScript validation"
    @echo "  just test-ai              # Test AI generation endpoint"
    @echo ""
    @echo " Utilities:"
    @echo "  just health               # Check environment health"
    @echo "  just info                 # Show project information"
    @echo "  just clean                # Clean development environment"
    @echo ""
    @echo " For more commands, run: just --list"