#!/bin/bash

# TShop Docker Development Starter
# Makes it easy to run TShop with Docker

set -e

echo "🐳 TShop Docker Development Environment"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
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
    echo "✅ Created .env.local with default configuration"
fi

# Check what command to use for Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

echo ""
echo "🚀 Starting TShop development environment..."
echo ""
echo "Services will be available at:"
echo "  🌐 Web App:      http://localhost:3000"
echo "  🎭 Mock APIs:    http://localhost:8080"
echo "  📊 Prisma Studio: http://localhost:5555"
echo ""

# Start the services
$COMPOSE_CMD up --build

echo ""
echo "🛑 TShop services have been stopped."
echo ""
echo "💡 Tips:"
echo "  - To run in background: $COMPOSE_CMD up -d --build"
echo "  - To stop services: $COMPOSE_CMD down"
echo "  - To see logs: $COMPOSE_CMD logs -f"
echo "  - To rebuild: $COMPOSE_CMD up --build --force-recreate"