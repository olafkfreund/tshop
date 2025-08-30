#!/usr/bin/env bash
# TShop Development Environment Setup Script
# This script automates the complete setup of the development environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if we're in a Nix shell
check_nix_shell() {
    if [[ -z "${IN_NIX_SHELL:-}" ]]; then
        log_error "This script must be run from within the Nix development shell. Run 'nix develop' first."
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    local dirs=(
        "logs"
        "certs" 
        "postgres-data"
        "redis-data"
        "uploads"
        "public/uploads"
        "src/app"
        "src/components"
        "src/lib"
        "src/hooks"
        "src/store"
        "src/types"
        "src/styles"
        "tests/__tests__"
        "tests/e2e"
        "tests/fixtures"
        "docs"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
    done
    
    log_success "Directories created"
}

# Setup environment configuration
setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [[ ! -f ".env.local" ]]; then
        if [[ -f ".env.example" ]]; then
            cp .env.example .env.local
            log_success "Created .env.local from .env.example"
            log_warning "Please edit .env.local and add your actual API keys and configuration"
        else
            log_error ".env.example not found. Please create it first."
        fi
    else
        log_warning ".env.local already exists. Skipping..."
    fi
}

# Initialize PostgreSQL
setup_database() {
    log_info "Setting up PostgreSQL database..."
    
    # Check if PostgreSQL is running
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log_info "PostgreSQL not running. Starting..."
        
        # Initialize PostgreSQL data directory if it doesn't exist
        if [[ ! -d "postgres-data/base" ]]; then
            log_info "Initializing PostgreSQL data directory..."
            initdb -D ./postgres-data --auth-local=trust --encoding=UTF8 --locale=C
        fi
        
        # Start PostgreSQL
        pg_ctl -D ./postgres-data -l logs/postgres.log -o "-k /tmp -p 5432" start
        sleep 3
        
        log_success "PostgreSQL started"
    else
        log_info "PostgreSQL already running"
    fi
    
    # Create databases
    createdb tshop_dev 2>/dev/null || log_info "Database tshop_dev already exists"
    createdb tshop_test 2>/dev/null || log_info "Database tshop_test already exists"
    
    log_success "Databases ready"
}

# Initialize Redis
setup_redis() {
    log_info "Setting up Redis server..."
    
    if ! redis-cli ping >/dev/null 2>&1; then
        log_info "Redis not running. Starting..."
        
        # Start Redis in the background
        redis-server --port 6379 --dir ./redis-data --daemonize yes --logfile logs/redis.log
        sleep 2
        
        if redis-cli ping >/dev/null 2>&1; then
            log_success "Redis started"
        else
            log_error "Failed to start Redis"
        fi
    else
        log_info "Redis already running"
    fi
}

# Generate SSL certificates for HTTPS development
setup_ssl() {
    log_info "Setting up SSL certificates for HTTPS development..."
    
    if [[ ! -f "certs/localhost.pem" ]]; then
        log_info "Generating SSL certificate for localhost..."
        
        # Install mkcert CA
        mkcert -install
        
        # Generate certificate
        mkcert -cert-file certs/localhost.pem -key-file certs/localhost-key.pem \
            localhost 127.0.0.1 ::1 "*.localhost"
        
        log_success "SSL certificates generated in certs/"
        log_info "HTTPS development enabled at https://localhost:3000"
    else
        log_success "SSL certificates already exist"
    fi
}

# Initialize Git repository and hooks
setup_git() {
    log_info "Setting up Git repository and hooks..."
    
    # Initialize git if not already done
    if [[ ! -d ".git" ]]; then
        log_info "Initializing Git repository..."
        git init
        git add .
        git commit -m "Initial commit: TShop development environment setup"
        log_success "Git repository initialized"
    fi
    
    # Install pre-commit hooks
    if command -v pre-commit >/dev/null 2>&1; then
        pre-commit install --install-hooks
        log_success "Pre-commit hooks installed"
    else
        log_warning "pre-commit not found. Install it to enable git hooks."
    fi
}

# Setup Node.js dependencies (if package.json exists)
setup_node_dependencies() {
    if [[ -f "package.json" ]]; then
        log_info "Installing Node.js dependencies..."
        npm ci --silent
        log_success "Node.js dependencies installed"
    else
        log_info "No package.json found. Creating initial project structure..."
        
        # Create basic package.json
        cat > package.json << 'EOF'
{
  "name": "tshop",
  "version": "0.1.0",
  "private": true,
  "description": "AI-powered custom apparel platform",
  "engines": {
    "node": "22.x",
    "npm": "10.x"
  },
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --fix",
    "lint:check": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest --watch",
    "test:ci": "jest --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:generate": "prisma generate",
    "db:push": "prisma db push", 
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
EOF
        
        log_info "Created initial package.json. Run 'npm install' to install dependencies."
    fi
}

# Setup Prisma database schema (if it doesn't exist)
setup_prisma() {
    if [[ ! -d "prisma" ]]; then
        log_info "Setting up Prisma..."
        mkdir -p prisma
        
        # Create basic Prisma schema
        cat > prisma/schema.prisma << 'EOF'
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Basic User model for authentication
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password_hash String?
  first_name    String?
  last_name     String?
  tier          String    @default("free") // free, registered, premium
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  @@map("users")
}

// Basic Product model
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  category    String   // t-shirt, cap, tote-bag
  base_price  Decimal  @db.Decimal(10, 2)
  active      Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@map("products")
}
EOF
        
        log_success "Created basic Prisma schema"
        
        # Generate Prisma client if npm is available
        if command -v npx >/dev/null 2>&1; then
            npx prisma generate
            log_success "Generated Prisma client"
        fi
    else
        log_info "Prisma directory already exists"
    fi
}

# Health check function
health_check() {
    log_info "Running health check..."
    
    local checks_passed=0
    local total_checks=7
    
    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        log_success "Node.js: $(node --version)"
        ((checks_passed++))
    else
        log_error "Node.js not found"
    fi
    
    # Check npm
    if command -v npm >/dev/null 2>&1; then
        log_success "npm: v$(npm --version)"
        ((checks_passed++))
    else
        log_warning "npm not found"
    fi
    
    # Check PostgreSQL
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log_success "PostgreSQL: Running"
        ((checks_passed++))
    else
        log_warning "PostgreSQL: Not running"
    fi
    
    # Check Redis
    if redis-cli ping >/dev/null 2>&1; then
        log_success "Redis: Running"
        ((checks_passed++))
    else
        log_warning "Redis: Not running" 
    fi
    
    # Check SSL certificates
    if [[ -f "certs/localhost.pem" ]]; then
        log_success "SSL certificates: Present"
        ((checks_passed++))
    else
        log_warning "SSL certificates: Missing"
    fi
    
    # Check environment file
    if [[ -f ".env.local" ]]; then
        log_success "Environment: .env.local exists"
        ((checks_passed++))
    else
        log_warning "Environment: .env.local missing"
    fi
    
    # Check git
    if [[ -d ".git" ]]; then
        log_success "Git: Repository initialized"
        ((checks_passed++))
    else
        log_warning "Git: Not initialized"
    fi
    
    echo ""
    log_info "Health check complete: $checks_passed/$total_checks checks passed"
    
    if [[ $checks_passed -eq $total_checks ]]; then
        log_success "Environment is ready for development! 🚀"
        echo ""
        echo "Next steps:"
        echo "1. Edit .env.local with your API keys"
        echo "2. Run 'npm install' to install dependencies"
        echo "3. Run 'overmind start -f Procfile.dev' to start services"
        echo "4. Visit https://localhost:3000 to view your application"
    else
        log_warning "Some checks failed. Please review the output above."
    fi
}

# Main setup function
main() {
    echo "🎨 TShop Development Environment Setup"
    echo "====================================="
    echo ""
    
    check_nix_shell
    create_directories
    setup_environment
    setup_database
    setup_redis
    setup_ssl
    setup_git
    setup_node_dependencies
    setup_prisma
    
    echo ""
    health_check
}

# Run main function
main "$@"