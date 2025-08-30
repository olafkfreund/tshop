# TShop - AI-Powered Custom Apparel Platform

> **Modern Development Environment with NixOS**  
> Complete Next.js 15+ application with AI integration, 3D rendering, and e-commerce functionality

[![Built with Nix](https://img.shields.io/static/v1?logo=nixos&logoColor=white&label=&message=Built%20with%20Nix&color=41439a)](https://nixos.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://postgresql.org/)

## 🎨 About TShop

TShop is an AI-powered custom apparel platform that allows users to create unique designs using artificial intelligence, visualize them in 3D, and order custom products. Built with modern web technologies and a focus on performance, security, and user experience.

### ✨ Key Features

- **🤖 AI Design Generation**: Create unique designs with Google Gemini AI
- **🎨 Interactive Design Editor**: Powered by Fabric.js with real-time editing
- **📱 3D/AR Visualization**: Three.js and WebXR for immersive product preview
- **🛒 E-commerce Integration**: Complete shopping cart and checkout with Stripe
- **🌍 Multi-Provider Fulfillment**: Printful (premium) and Printify (cost-effective)
- **🎮 Gamification**: Points, achievements, and social features
- **🌐 Internationalization**: Support for multiple languages and currencies
- **📱 Progressive Web App**: Optimized for mobile and desktop

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 15+ with React 19 and TypeScript
- **Database**: PostgreSQL 17+ with Prisma ORM
- **Cache**: Redis for session and application caching
- **AI**: Google Gemini API for design generation
- **3D Graphics**: Three.js with React Three Fiber
- **Design Editor**: Fabric.js for interactive canvas
- **Payments**: Stripe with webhook support
- **Authentication**: NextAuth.js with JWT
- **Styling**: TailwindCSS 4.0+ with Radix UI components

### Development Environment

This project uses **NixOS Flakes** for a completely reproducible development environment that includes:

- Node.js 22 LTS with npm
- PostgreSQL 17+ with sample data
- Redis server for caching
- SSL certificates for HTTPS development
- Pre-commit hooks for code quality
- Complete toolchain for testing and deployment

## 🚀 Quick Start

### Prerequisites

- [Nix](https://nixos.org/download.html) with flakes enabled
- [direnv](https://direnv.net/) (optional but recommended)

### 1. Clone and Enter Development Environment

```bash
# Clone the repository
git clone <repository-url> tshop
cd tshop

# Enter the Nix development shell
nix develop

# Or if you have direnv installed, it will activate automatically
# direnv allow
```

### 2. Initialize the Project

```bash
# Run the automated setup script
./scripts/dev-setup.sh

# Or use individual commands:
just init          # Initialize project structure
just env-setup      # Set up environment variables
just ssl-setup      # Generate SSL certificates
just db-init        # Set up database
```

### 3. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your API keys:
# - GEMINI_API_KEY: Get from Google AI Studio
# - STRIPE_PUBLISHABLE_KEY & STRIPE_SECRET_KEY: From Stripe Dashboard
# - Other service API keys as needed
```

### 4. Install Dependencies and Start Development

```bash
# Install Node.js dependencies
npm install

# Start all development services
just dev

# Or use individual services:
just dev-web        # Start only Next.js server
just dev-db         # Start only database services
```

### 5. Access the Application

- **Main App**: https://localhost:3000
- **Database Studio**: http://localhost:5555 (run `just db-studio`)
- **API Documentation**: https://localhost:3000/api-docs

## 🛠️ Development Commands

We use [just](https://github.com/casey/just) as our command runner. Here are the most common commands:

### Environment Management
```bash
just init           # Initialize development environment
just health         # Check environment health
just clean          # Clean development environment
```

### Development Servers
```bash
just dev            # Start all services with Overmind
just dev-web        # Start only Next.js development server
just dev-db         # Start only database services
just stop           # Stop all services
```

### Database Operations
```bash
just db-init        # Initialize database with schema
just db-migrate     # Run Prisma migrations
just db-studio      # Open Prisma Studio
just db-seed        # Seed with sample data
just db-reset       # Reset database (destructive!)
```

### Code Quality
```bash
just lint           # Run ESLint
just lint-fix       # Fix ESLint issues
just type-check     # Run TypeScript type checking
just format         # Format code with Prettier
just quality        # Run all quality checks
```

### Testing
```bash
just test           # Run unit tests
just test-coverage  # Run tests with coverage
just test-e2e       # Run Playwright E2E tests
just test-e2e-ui    # Run E2E tests in UI mode
```

### Building and Deployment
```bash
just build          # Build for production
just build-analyze  # Build with bundle analysis
just deploy         # Deploy to Vercel production
just deploy-staging # Deploy to Vercel staging
```

## 📁 Project Structure

```
tshop/
├── README.md                          # This file
├── flake.nix                         # Nix development environment
├── .envrc                           # direnv configuration
├── .env.example                     # Environment variables template
├── Procfile.dev                     # Development services definition
├── justfile                         # Command definitions
├──.pre-commit-config.yaml           # Git hooks configuration
│
├── scripts/                         # Development and deployment scripts
│   ├── dev-setup.sh                # Automated environment setup
│   └── db-init.sql                 # Database initialization script
│
├── src/                            # Application source code
│   ├── app/                        # Next.js 15 app directory
│   │   ├── (auth)/                 # Authentication routes
│   │   ├── (dashboard)/            # User dashboard
│   │   ├── (shop)/                 # Shopping and product pages
│   │   ├── (design)/               # Design editor and gallery
│   │   └── api/                    # API routes
│   │
│   ├── components/                 # Reusable React components
│   │   ├── ui/                     # shadcn/ui base components
│   │   ├── design/                 # Design editor components
│   │   ├── product/                # Product display components
│   │   └── ar/                     # AR/3D visualization
│   │
│   ├── lib/                        # Utilities and configurations
│   │   ├── auth.ts                 # Authentication logic
│   │   ├── db.ts                   # Database connection
│   │   ├── ai/                     # AI integration
│   │   ├── fabric/                 # Fabric.js utilities
│   │   └── three/                  # Three.js utilities
│   │
│   ├── hooks/                      # Custom React hooks
│   ├── store/                      # State management (Redux/Zustand)
│   ├── types/                      # TypeScript type definitions
│   └── styles/                     # CSS and styling files
│
├── public/                         # Static assets
├── tests/                         # Test files
├── docs/                          # Additional documentation
├── logs/                          # Development logs
├── certs/                         # SSL certificates
├── postgres-data/                 # PostgreSQL data directory
└── redis-data/                    # Redis data directory
```

## 🔧 Configuration Details

### Environment Variables

The development environment requires several API keys and configuration values. See `.env.example` for a complete list. Key variables include:

- **Database**: `DATABASE_URL` for PostgreSQL connection
- **AI**: `GEMINI_API_KEY` for Google Gemini AI
- **Payments**: Stripe API keys and webhook secrets
- **Authentication**: NextAuth.js configuration
- **File Storage**: Cloudinary or Vercel Blob configuration
- **Fulfillment**: Printful and Printify API keys

### SSL/HTTPS Development

The development environment is configured for HTTPS to support:
- Camera permissions for AR features
- Secure API testing
- Production-like environment

SSL certificates are automatically generated using `mkcert` and stored in the `certs/` directory.

### Database Schema

The PostgreSQL database includes comprehensive schemas for:
- User management and authentication
- Product catalog with variants
- AI-generated designs storage
- Shopping cart and orders
- Gamification (points, achievements)
- Social features (likes, shares)
- Analytics and usage tracking

## 🧪 Testing Strategy

### Unit Testing
- **Framework**: Jest with React Testing Library
- **Coverage**: Minimum 70% coverage required
- **Commands**: `just test` or `just test-coverage`

### End-to-End Testing
- **Framework**: Playwright with TypeScript
- **Features**: Design editor, checkout flow, AI generation
- **Commands**: `just test-e2e` or `just test-e2e-ui`

### Visual Regression Testing
- **Tool**: Playwright screenshots with comparison
- **Coverage**: Key user interface components
- **CI/CD**: Automated on pull requests

## 🚀 Deployment

### Development Workflow
1. Make changes in feature branches
2. Pre-commit hooks ensure code quality
3. Create pull request with automated testing
4. Deploy to staging for review
5. Merge to main for production deployment

### Vercel Deployment
The project is optimized for Vercel deployment with:
- Automatic deployments from Git
- Environment variable management
- Edge functions for API routes
- Image optimization and CDN

### Self-Hosting
The NixOS module included in `flake.nix` provides:
- Complete production deployment configuration
- Automatic SSL with Let's Encrypt
- Database and Redis setup
- Service hardening and monitoring

## 📊 Performance Optimizations

### Frontend Performance
- **Code Splitting**: Route and component-level splitting
- **Image Optimization**: Next.js Image with multiple formats
- **Bundle Analysis**: Webpack bundle analyzer integration
- **PWA**: Service worker for offline functionality

### Backend Performance
- **Database**: Optimized queries with proper indexing
- **Caching**: Multi-layer caching with Redis
- **API**: Rate limiting and request optimization
- **AI**: Smart model selection for cost efficiency

## 🔒 Security Features

### Application Security
- **Authentication**: Secure JWT with NextAuth.js
- **Authorization**: Role-based access control
- **API Security**: Rate limiting and input validation
- **Data Protection**: Encrypted sensitive data

### Infrastructure Security
- **HTTPS**: TLS 1.3 encryption everywhere
- **Headers**: Security headers implementation
- **Secrets**: Environment-based secret management
- **Database**: Connection encryption and access control

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Set up the development environment with `nix develop`
3. Run `just init` to initialize everything
4. Make your changes following the code style
5. Ensure all tests pass with `just quality`
6. Submit a pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for Next.js and React
- **Prettier**: Consistent code formatting
- **Commits**: Conventional commit messages

### Testing Requirements
- Unit tests for new features
- E2E tests for critical user flows
- Visual regression tests for UI changes
- Performance testing for optimization

## 📚 Documentation

- **Technical Specs**: [FRONTEND_TECHNICAL_SPECS.md](./FRONTEND_TECHNICAL_SPECS.md)
- **Backend Architecture**: [BACKEND_ARCHITECTURE_SPECS.md](./BACKEND_ARCHITECTURE_SPECS.md)
- **API Documentation**: Available at `/api-docs` when running
- **Component Documentation**: Storybook at `/storybook`

## 🐛 Troubleshooting

### Common Issues

**PostgreSQL Connection Issues**
```bash
# Check if PostgreSQL is running
just health

# Restart database
just stop && just dev-db
```

**SSL Certificate Issues**
```bash
# Regenerate certificates
rm -rf certs/
just ssl-setup
```

**Node Module Issues**
```bash
# Clean install
just clean-install
```

**Port Conflicts**
```bash
# Kill conflicting processes
just dev-clean-processes
```

### Getting Help

1. Check the [troubleshooting guide](./docs/TROUBLESHOOTING.md)
2. Review the [FAQ](./docs/FAQ.md)
3. Open an issue on GitHub
4. Join our Discord community

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NixOS Community** for the incredible package manager and ecosystem
- **Next.js Team** for the outstanding React framework
- **Vercel** for deployment and hosting solutions
- **Google** for Gemini AI API
- **Open Source Contributors** who make projects like this possible

---

**Built with ❤️ using NixOS, Next.js, and modern web technologies**