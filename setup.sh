#!/usr/bin/env bash

# TShop Local Development Setup Script
# This script helps you get started before entering the Nix development environment

set -e

echo "🎨 TShop Local Development Setup"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "flake.nix" ]; then
    echo "❌ Error: flake.nix not found. Please run this script from the TShop project root."
    exit 1
fi

# Check if Nix is installed
if ! command -v nix &> /dev/null; then
    echo "❌ Nix is not installed. Please install Nix first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install"
    exit 1
fi

# Check if flakes are enabled
if ! nix --version &> /dev/null; then
    echo "❌ Nix flakes not available. Please enable flakes in your Nix configuration."
    exit 1
fi

echo "✅ Nix environment detected"
echo ""

# Create basic directories that might be needed
mkdir -p {data,logs,certs,public/uploads,public/mockups,scripts}
echo "📁 Created basic directory structure"

# Create a basic .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# Local Development Configuration
LOCAL_MODE=true
NODE_ENV=development

# Database
DATABASE_URL="file:./data/tshop_dev.db"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-development-secret-key"

# Google Gemini AI (put your real API key here to test AI generation)
# Get your key from: https://ai.google.dev/
GEMINI_API_KEY="your-real-gemini-api-key-here"
# GEMINI_API_KEY="mock-key"  # Uncomment to use mock AI instead

# Local Services
MOCK_API_URL="http://localhost:8080"
USE_LOCAL_STORAGE=true

# Optional: Real service keys for local testing
# STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-key"
# STRIPE_SECRET_KEY="sk_test_your-stripe-key"
# CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
# CLOUDINARY_API_KEY="your-cloudinary-key"
# CLOUDINARY_API_SECRET="your-cloudinary-secret"
EOF
    echo "📝 Created .env.local with default configuration"
else
    echo "✅ .env.local already exists"
fi

# Create a basic package.json if it doesn't exist
if [ ! -f "package.json" ]; then
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
    "typescript": "^5.6.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "prisma": "^5.17.0",
    "@prisma/client": "^5.17.0",
    "next-auth": "5.0.0-beta.20",
    "@google/generative-ai": "^0.19.0"
  }
}
EOF
    echo "📦 Created basic package.json"
else
    echo "✅ package.json already exists"
fi

echo ""
echo "🎉 Basic setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Enter the Nix development environment:"
echo "   nix develop"
echo ""
echo "2. Once in the Nix shell, run quick setup:"
echo "   just quick-start-local"
echo ""
echo "3. Start development:"
echo "   just dev-local"
echo ""
echo "📖 For detailed instructions, read: howto-get-started.md"
echo ""
echo "🤖 To use real AI generation:"
echo "1. Get API key from: https://ai.google.dev/"
echo "2. Replace 'your-real-gemini-api-key-here' in .env.local"
echo "3. Run: npm install @google/generative-ai"
echo ""
echo "Happy coding! 🎨"