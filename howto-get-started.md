# 🚀 TShop Development Guide

This guide will help you set up and run TShop locally with the optimal approach for your system.

## 🐳 Quick Start - Docker (Recommended for NixOS)

**For NixOS users**, Docker provides the most reliable development experience:

```bash
# Simple start - everything automated
./docker-start.sh

# Or using justfile
just docker-start
# or
just quick-start  # Auto-detects your system
```

**That's it!** Your TShop instance will be running at:
- 🌐 Web App: http://localhost:3000
- 🎭 Mock APIs: http://localhost:8080
- 📊 Prisma Studio: http://localhost:5555

## 🖥️ Native Development (Non-NixOS Systems)

For Ubuntu, macOS, and other systems:

```bash
# Quick native setup
just quick-start-local-native

# Or manual steps:
just setup-local
npm install
just db-sqlite
just db-migrate
just dev-local
```

**That's it!** Your TShop instance will be running at:
- 🌐 Web App: http://localhost:3000
- 🎭 Mock APIs: http://localhost:8080

## 🐳 Docker Development Features

### ✅ Complete Isolated Environment
- **Consistent Dependencies**: Same environment across all systems
- **No NixOS Compatibility Issues**: Prisma and all tools work perfectly
- **Automatic Setup**: All services configured and started automatically
- **Easy Cleanup**: `docker-compose down` removes everything cleanly

### ✅ What You Get Out of the Box
- **Mock AI Design Generation**: Python-based mock server with PIL image generation
- **SQLite Database**: Pre-configured with schema migration
- **All Services Running**: Web app, mock APIs, and Prisma Studio
- **Hot Reloading**: Code changes reflected instantly
- **Service Health Monitoring**: Built-in health checks and status reporting

### 🎯 Fully Functional Features
- ✅ User authentication (NextAuth.js with local providers)
- ✅ Product browsing and filtering
- ✅ Design creation and editing (with mock AI generation)
- ✅ Shopping cart and checkout flow
- ✅ User dashboard and order history
- ✅ Template gallery and community features
- ✅ Social sharing (mock endpoints)
- ✅ Gamification system
- ✅ All UI/UX components and interactions

## 🔧 Manual Setup Steps

If you prefer to set up step by step:

### 1. Enter NixOS Development Environment

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd tshop

# Enter the development shell
nix develop
```

### 2. Set Up Local Environment

```bash
# Create all local services and configurations
setup-local-dev

# Install Node.js dependencies
npm install
```

### 3. Set Up Database

Choose between SQLite (recommended for local) or PostgreSQL:

```bash
# SQLite is already set up by setup-local-dev
# Just run database migrations
npx prisma migrate dev
```

### 4. Start Development Services

```bash
# Start all services (web app + mock APIs)
overmind start -f Procfile.local

# Alternative: Start services individually
# python scripts/mock-services.py  # In one terminal
# npm run dev                      # In another terminal
```

## 🗂️ Project Structure After Setup

```
tshop/
├── data/                   # SQLite databases
│   ├── tshop_dev.db
│   └── tshop_test.db
├── public/
│   ├── uploads/designs/    # Local design storage
│   └── mockups/           # Product mockup images
├── scripts/
│   └── mock-services.py   # Mock API server
├── Procfile.local         # Local services configuration
├── .env.local             # Local environment variables
└── logs/                  # Development logs
```

## ⚙️ Configuration Files

### Environment Variables (.env.local)

The local setup creates this automatically:

```env
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
```

### Local Services (Procfile.local)

```procfile
# Local development services (no external APIs)
web: npm run dev
mock: python scripts/mock-services.py
```

## 🎭 Mock Services Overview

The local setup includes a Python-based mock server that simulates:

### AI Design Generation
- **Endpoint**: `POST http://localhost:8080/ai/generate-design`
- **Response**: Simple placeholder designs with text overlay
- **Supports**: Different product types (t-shirt, cap, tote bag)

### Image Processing
- **Endpoint**: `POST http://localhost:8080/images/process`
- **Response**: Mock processed image URLs
- **Features**: Simulated resize, optimize, and format conversion

### Payment Webhooks
- **Endpoint**: `POST http://localhost:8080/webhooks/stripe`
- **Purpose**: Simulate Stripe payment completion events
- **Testing**: Automatic order status updates

### Fulfillment APIs
- **Printful**: `GET/POST http://localhost:8080/printful/*`
- **Printify**: `GET/POST http://localhost:8080/printify/*`
- **Features**: Mock product catalogs, order creation, tracking

### Health Monitoring
- **Endpoint**: `GET http://localhost:8080/health`
- **Purpose**: Check mock service status
- **Command**: `just mock-health`

## 🤖 Using Real Google Gemini AI (Optional)

To use real AI generation instead of mock designs:

### 1. Get Google Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new API key
5. Copy the API key (starts with `AIza...`)

### 2. Update Environment

```bash
# Edit your .env.local file
nano .env.local

# Replace this line:
GEMINI_API_KEY="your-real-gemini-api-key-here"

# With your actual API key:
GEMINI_API_KEY="AIzaSyYour-Actual-API-Key-Here"
```

### 3. Install Google AI Dependencies

```bash
# Install the required package
npm install @google/generative-ai
```

### 4. Restart Development Server

```bash
# Stop current services
just dev-stop

# Start again to pick up new environment
just dev-local
```

### 🎨 AI vs Mock Comparison

| Feature | Mock AI | Real Gemini AI |
|---------|---------|----------------|
| **Setup** | No API key needed | Requires Google AI API key |
| **Speed** | Instant | 1-3 seconds |
| **Designs** | Simple placeholder shapes | AI-described design concepts |
| **Creativity** | Limited predefined patterns | Intelligent design suggestions |
| **Cost** | Free | Usage-based pricing |
| **Internet** | No connection required | Requires internet access |

### 💡 AI Design Generation Features

With real Gemini AI, you get:
- **Smart Design Concepts**: AI analyzes your prompt and suggests relevant designs
- **Product-Specific Layouts**: Different approaches for t-shirts, caps, and tote bags
- **Style Adaptation**: Designs adapt to vintage, modern, geometric styles
- **Creative Descriptions**: Detailed design breakdowns including colors and typography
- **Contextual Elements**: AI considers apparel printing requirements

### 🔄 Fallback Behavior

The system automatically falls back to mock generation if:
- No API key is provided
- API key is invalid or expired
- Google AI service is unavailable
- API rate limits are exceeded

You'll always get a design, ensuring uninterrupted development.

## 🧪 Testing Workflows

### 1. Design Creation Flow
1. Visit http://localhost:3000/editor
2. Enter a design prompt (e.g., "Cool vintage logo")
3. Click "Generate Design" - mock AI will create a placeholder
4. Test design editing tools (text, shapes, positioning)
5. Save design to local storage

### 2. Product Customization
1. Go to http://localhost:3000/products
2. Select a product (t-shirt, cap, or tote bag)
3. Choose "Customize" to apply designs
4. Test 3D preview and mockup generation
5. Add to cart

### 3. Checkout Process
1. Add items to cart
2. Proceed to checkout
3. Fill in shipping information
4. Use test payment methods (all payments succeed in local mode)
5. Receive order confirmation

### 4. Community Features
1. Visit http://localhost:3000/designs (design gallery)
2. Test design sharing and social features
3. Check http://localhost:3000/templates for template browsing
4. Test user dashboard at http://localhost:3000/dashboard

## 🔍 Troubleshooting

### Common Issues

#### "Command not found: just"
```bash
# Install just command runner
nix-env -iA nixpkgs.just
```

#### "Python module not found"
```bash
# Re-enter the development shell
exit
nix develop
```

#### "Database not found"
```bash
# Reset SQLite database
just db-sqlite
just db-migrate
```

#### "Port already in use"
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :8080

# Stop all services and restart
just dev-stop
just dev-local
```

#### "Next.js build errors"
```bash
# Fix common Next.js issues
just fix-common
```

### Service Health Check

```bash
# Check overall environment health
just health

# Check individual services
curl http://localhost:3000/api/health     # Web app
curl http://localhost:8080/health         # Mock APIs
```

### Logs and Debugging

```bash
# View development logs
just logs

# Check specific service logs
tail -f logs/web.log    # Next.js app
tail -f logs/mock.log   # Mock services
```

## 📊 Available Commands

### Quick Commands
- `just help` - Show detailed help
- `just info` - Project information and service status
- `just quick-start` - Auto-detect system and start

### Docker Commands (NixOS Recommended)
- `just docker-start` - Start with Docker (recommended)
- `./docker-start.sh` - Alternative Docker start script
- `just docker-up` - Start services in background
- `just docker-down` - Stop Docker services
- `just docker-logs` - View Docker logs
- `just docker-health` - Check service health
- `just docker-restart` - Restart Docker services

### Native Commands (Non-NixOS)
- `just dev-local` - Start native local development
- `just dev-stop` - Stop native services
- `just mock-server` - Start native mock API server

### Database Commands
- `just db-sqlite` - Set up SQLite database
- `just db-migrate` - Run migrations
- `just db-studio` - Open Prisma Studio

### Testing & Quality
- `just test` - Run test suite
- `just lint` - Check code quality
- `just type-check` - TypeScript validation
- `just test-ai` - Test AI generation endpoint

### Utilities
- `just clean` - Clean development environment
- `just mock-health` - Test mock API health

## 🌐 Transitioning to Production APIs

When ready to use real external services:

### 1. Get API Keys

Sign up for these services and get API keys:

- **Google Gemini AI**: https://ai.google.dev/
- **Stripe**: https://stripe.com/
- **Cloudinary**: https://cloudinary.com/
- **Printful**: https://www.printful.com/
- **Printify**: https://printify.com/

### 2. Update Environment

```bash
# Create production environment file
cp .env.local .env.production

# Edit .env.production with real API keys
nano .env.production
```

### 3. Switch to Full Mode

```bash
# Set up PostgreSQL database
just db-setup
just db-migrate

# Start full development server
just dev
```

## 🚀 Performance Tips

### NixOS-Specific Optimizations

#### 1. Use Direnv for Automatic Environment Loading
```bash
# Install direnv
echo "use flake" > .envrc
direnv allow
```

#### 2. Enable Nix Binary Cache
```nix
# Add to ~/.config/nix/nix.conf
trusted-public-keys = cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY= hydra.iohk.io:f/Ea+s+dFdN+3Y/G+FDgSq+a5NEWhJGzdjvKNGv0/EQ=
substituters = https://cache.nixos.org https://hydra.iohk.io
```

#### 3. Optimize Node.js Performance
```bash
# Set Node.js options for better performance
export NODE_OPTIONS="--max-old-space-size=4096 --experimental-worker"
```

### Development Performance

#### 1. Enable Turbo Mode
```bash
# Already enabled in local setup
export TURBO=1
npm run dev
```

#### 2. Use Fast Refresh
- Already configured in Next.js setup
- Changes appear instantly in browser

#### 3. Optimize Database
```bash
# SQLite optimizations are automatic
# For PostgreSQL, tune configuration
```

## 🔒 Security Notes

### Local Development Security

- **Self-signed certificates**: Generated automatically for HTTPS
- **Local-only access**: Services bind to localhost only
- **Mock authentication**: Simplified auth for development
- **No real payment processing**: All transactions are simulated

### Production Considerations

- **Environment isolation**: Never use local config in production
- **API key security**: Store keys securely, never commit to git
- **Database security**: Use proper authentication and encryption
- **SSL certificates**: Use real certificates (Let's Encrypt) in production

## 📚 Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **NixOS Development**: https://nixos.org/manual/nixos/stable/
- **TailwindCSS**: https://tailwindcss.com/docs

## 🆘 Getting Help

### Community Support
- **GitHub Issues**: Report bugs and feature requests
- **Discussions**: Ask questions and share ideas

### Development Team
- **Code Reviews**: Create pull requests for feedback
- **Architecture Discussions**: Discuss major changes

---

Happy coding! 🎨 Your local TShop development environment is ready to use.