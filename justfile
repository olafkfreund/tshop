# TShop Development Tasks
# This file defines common development tasks using the `just` command runner
# Install: https://github.com/casey/just
# Usage: just <command>

# Default recipe - show available commands
default:
    @just --list

# ===========================================
# ENVIRONMENT SETUP
# ===========================================

# Initialize the development environment
init:
    @echo "🎨 Initializing TShop development environment..."
    @./scripts/dev-setup.sh

# Set up environment variables  
env-setup:
    @echo "⚙️ Setting up environment configuration..."
    @env-setup

# Generate SSL certificates for HTTPS development
ssl-setup:
    @echo "🔒 Setting up SSL certificates..."
    @ssl-setup

# Full environment health check
health:
    @echo "🏥 Running environment health check..."
    @health-check

# ===========================================
# DATABASE OPERATIONS
# ===========================================

# Initialize and set up database
db-init:
    @echo "🗄️ Initializing database..."
    @db-setup

# Run database migrations
db-migrate:
    @echo "🔄 Running database migrations..."
    @db-migrate

# Reset database (destructive!)
db-reset:
    @echo "⚠️ Resetting database (this will delete all data)..."
    @echo "Press Ctrl+C to cancel, or Enter to continue..."
    @read
    dropdb tshop_dev || true
    dropdb tshop_test || true
    createdb tshop_dev
    createdb tshop_test
    @just db-migrate

# Open Prisma Studio
db-studio:
    @echo "📊 Opening Prisma Studio..."
    npx prisma studio

# Seed database with sample data
db-seed:
    @echo "🌱 Seeding database..."
    npx prisma db seed

# ===========================================
# DEVELOPMENT SERVERS
# ===========================================

# Start all development services
dev:
    @echo "🚀 Starting TShop development environment..."
    overmind start -f Procfile.dev

# Start only the Next.js development server
dev-web:
    @echo "🌐 Starting Next.js development server..."
    npm run dev

# Start only database services
dev-db:
    @echo "🗄️ Starting database services..."
    overmind start -f Procfile.dev postgres redis

# Stop all development services
stop:
    @echo "🛑 Stopping development services..."
    overmind stop || true
    @dev-clean-processes

# ===========================================
# BUILDING AND TESTING
# ===========================================

# Install dependencies
install:
    @echo "📦 Installing dependencies..."
    npm ci

# Run type checking
type-check:
    @echo "🔍 Running TypeScript type check..."
    npm run type-check

# Run linting
lint:
    @echo "🧹 Running ESLint..."
    npm run lint

# Fix linting issues automatically
lint-fix:
    @echo "🔧 Fixing ESLint issues..."
    npm run lint --fix

# Run unit tests
test:
    @echo "🧪 Running unit tests..."
    npm run test

# Run unit tests with coverage
test-coverage:
    @echo "📊 Running tests with coverage..."
    npm run test:ci

# Run end-to-end tests
test-e2e:
    @echo "🎭 Running Playwright E2E tests..."
    npm run test:e2e

# Run E2E tests in UI mode
test-e2e-ui:
    @echo "🎭 Running Playwright E2E tests in UI mode..."
    npm run test:e2e:ui

# Build the application
build:
    @echo "🏗️ Building application..."
    npm run build

# Build and analyze bundle
build-analyze:
    @echo "📈 Building and analyzing bundle..."
    ANALYZE=true npm run build

# ===========================================
# CODE QUALITY
# ===========================================

# Format code with Prettier
format:
    @echo "✨ Formatting code..."
    npx prettier --write .

# Run all quality checks
quality: lint type-check test-coverage
    @echo "✅ All quality checks passed!"

# Install git hooks
hooks:
    @echo "🪝 Installing git hooks..."
    pre-commit install --install-hooks

# Run pre-commit hooks on all files
hooks-run:
    @echo "🪝 Running pre-commit hooks on all files..."
    pre-commit run --all-files

# ===========================================
# DOCKER OPERATIONS
# ===========================================

# Build Docker image
docker-build:
    @echo "🐳 Building Docker image..."
    docker build -t tshop:latest .

# Run Docker container
docker-run:
    @echo "🐳 Running Docker container..."
    docker run -p 3000:3000 --env-file .env.local tshop:latest

# Docker compose up
docker-up:
    @echo "🐳 Starting Docker services..."
    docker-compose up -d

# Docker compose down
docker-down:
    @echo "🐳 Stopping Docker services..."
    docker-compose down

# ===========================================
# DEPLOYMENT
# ===========================================

# Deploy to Vercel
deploy:
    @echo "🚀 Deploying to Vercel..."
    vercel --prod

# Deploy to staging
deploy-staging:
    @echo "🚀 Deploying to staging..."
    vercel

# ===========================================
# UTILITIES
# ===========================================

# Clean development environment
clean:
    @echo "🧹 Cleaning development environment..."
    @dev-clean

# Clean and reinstall dependencies
clean-install: clean
    @echo "🧹 Clean installing dependencies..."
    rm -rf node_modules package-lock.json
    npm install

# Generate Prisma client
generate:
    @echo "⚡ Generating Prisma client..."
    npx prisma generate

# Update dependencies
update:
    @echo "📦 Updating dependencies..."
    npm update

# Check for security vulnerabilities
security:
    @echo "🔒 Checking for security vulnerabilities..."
    npm audit

# Fix security vulnerabilities
security-fix:
    @echo "🔧 Fixing security vulnerabilities..."
    npm audit fix

# Show development logs
logs:
    @echo "📋 Showing development logs..."
    tail -f logs/*.log

# Open project in VS Code
code:
    @echo "💻 Opening project in VS Code..."
    code .

# Open project documentation
docs:
    @echo "📚 Opening project documentation..."
    @echo "Available documentation:"
    @echo "- README.md"
    @echo "- FRONTEND_TECHNICAL_SPECS.md"
    @echo "- BACKEND_ARCHITECTURE_SPECS.md"
    @ls docs/ || echo "No additional docs found"

# ===========================================
# HELPERS
# ===========================================

# Kill any running processes on common ports
dev-clean-processes:
    @echo "🧹 Cleaning up running processes..."
    -pkill -f "next dev" || true
    -pkill -f "postgres" || true
    -pkill -f "redis-server" || true

# Show environment information
info:
    @echo "ℹ️ TShop Development Environment Info"
    @echo "======================================"
    @echo "Node.js: $(node --version)"
    @echo "npm: $(npm --version)"
    @echo "PostgreSQL: $(postgres --version | head -1)"
    @echo "Redis: $(redis-server --version)"
    @echo "Git: $(git --version)"
    @echo "======================================"
    @echo "Project structure:"
    @tree -L 2 -I 'node_modules|.git|.next|dist'

# Create a new migration
migration name:
    @echo "📝 Creating new migration: {{name}}"
    npx prisma migrate dev --name {{name}}

# Run a specific test file
test-file file:
    @echo "🧪 Running test file: {{file}}"
    npm test -- {{file}}

# Open browser to local development server
open:
    @echo "🌐 Opening browser..."
    open https://localhost:3000

# Backup database
db-backup:
    @echo "💾 Creating database backup..."
    pg_dump tshop_dev > backups/tshop_dev_$(date +%Y%m%d_%H%M%S).sql
    @echo "Backup saved to backups/"

# Restore database from backup
db-restore file:
    @echo "📥 Restoring database from {{file}}..."
    dropdb tshop_dev || true
    createdb tshop_dev
    psql tshop_dev < {{file}}