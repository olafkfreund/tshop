# TShop Development Guide

> Comprehensive guide for developing with the TShop NixOS environment

## Table of Contents

- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Database Management](#database-management)
- [AI Integration](#ai-integration)
- [Testing Strategy](#testing-strategy)
- [Performance Optimization](#performance-optimization)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Environment Setup

### Prerequisites

Before starting development, ensure you have:

1. **Nix with Flakes**: Install Nix and enable flakes
2. **Git**: For version control
3. **direnv** (optional): For automatic environment loading

### Initial Setup Process

```bash
# 1. Clone the repository
git clone <repository-url> tshop
cd tshop

# 2. Enter Nix development shell
nix develop

# 3. Run automated setup
./scripts/dev-setup.sh

# 4. Install dependencies
npm install

# 5. Start development services
just dev
```

### Environment Verification

After setup, verify your environment:

```bash
# Run health check
just health

# Expected output:
# Node.js: v22.x.x
# PostgreSQL: Running  
# Redis: Running
# SSL certificates: Present
# Environment: .env.local exists
# Git: Repository initialized
```

## Development Workflow

### Daily Development Routine

1. **Start Environment**
   ```bash
   # Enter Nix shell (if not using direnv)
   nix develop
   
   # Start all services
   just dev
   ```

2. **Check Service Health**
   ```bash
   just health
   ```

3. **Begin Development**
   - Access app: https://localhost:3000
   - Database UI: http://localhost:5555 (run `just db-studio`)
   - Check logs: `just logs`

### Code Quality Workflow

Before committing code:

```bash
# Format code
just format

# Run linting
just lint-fix

# Type checking
just type-check

# Run tests
just test

# Or run all quality checks
just quality
```

### Git Workflow

The project uses pre-commit hooks for quality assurance:

```bash
# Install hooks (done automatically during setup)
just hooks

# Run hooks manually
just hooks-run

# Make commits (hooks run automatically)
git add .
git commit -m "feat: add new feature"
```

### Branch Strategy

- `main`: Production-ready code
- `staging`: Integration testing
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

## Database Management

### Schema Management with Prisma

```bash
# Generate Prisma client
just generate

# Create migration
just migration "add-user-preferences"

# Apply migrations
just db-migrate

# Reset database (destructive!)
just db-reset

# Seed with sample data
just db-seed
```

### Database Operations

```bash
# Start only database services
just dev-db

# Open Prisma Studio
just db-studio

# Manual database operations
psql tshop_dev

# Backup database
just db-backup

# Restore from backup
just db-restore backups/tshop_dev_20231201_120000.sql
```

### Custom Queries

For complex queries, use the optimized query patterns in `src/lib/db/queries.ts`:

```typescript
// Example: Get user with analytics
const userAnalytics = await getUserAnalytics(userId);

// Example: Get paginated public designs
const designs = await getPublicDesigns({
  page: 1,
  limit: 20,
  category: 't-shirt',
  sortBy: 'trending'
});
```

## AI Integration

### Google Gemini Setup

1. **Get API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/)
   - Create API key
   - Add to `.env.local`: `GEMINI_API_KEY=your-key-here`

2. **Usage Patterns**
   ```typescript
   // Smart model selection based on complexity
   const design = await generateDesign(prompt, {
     category: 'tshirt',
     complexity: 'simple', // or 'complex'
     style: 'modern'
   });
   ```

3. **Cost Optimization**
   - Simple prompts use `gemini-pro-flash` (cheaper)
   - Complex prompts use `gemini-pro` (higher quality)
   - Usage tracking prevents overspending

### AI Rate Limiting

The system implements tiered rate limiting:

- **Free Users**: 2 generations/hour
- **Registered Users**: 10 generations/day  
- **Premium Users**: 100 generations/month

Monitor usage in the admin dashboard or database:

```sql
SELECT user_id, COUNT(*) as generations_today
FROM ai_usage_logs 
WHERE created_at >= CURRENT_DATE
GROUP BY user_id;
```

## Testing Strategy

### Unit Testing

```bash
# Run all unit tests
just test

# Run specific test file
just test-file components/ProductCard.test.tsx

# Run with coverage
just test-coverage
```

### End-to-End Testing

```bash
# Run all E2E tests
just test-e2e

# Run in UI mode for debugging
just test-e2e-ui

# Run specific test
npx playwright test design-editor.spec.ts
```

### Writing Tests

#### Component Tests

```typescript
// Example: ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/product/ProductCard';

describe('ProductCard', () => {
  it('renders product information', () => {
    render(<ProductCard product={mockProduct} onAddToCart={jest.fn()} />);
    expect(screen.getByText('Cool T-Shirt')).toBeInTheDocument();
  });
});
```

#### E2E Tests

```typescript
// Example: design-editor.spec.ts
import { test, expect } from '@playwright/test';

test('should create AI design', async ({ page }) => {
  await page.goto('/design/editor');
  await page.fill('[data-testid="ai-prompt"]', 'Cool mountain landscape');
  await page.click('[data-testid="generate-button"]');
  
  await expect(page.locator('[data-testid="generated-design"]')).toBeVisible();
});
```

## Performance Optimization

### Frontend Performance

#### Code Splitting
```typescript
// Route-level splitting
const DesignEditor = dynamic(() => import('@/components/design/DesignEditor'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

// Component-level splitting
const Preview3D = lazy(() => import('@/components/product/Preview3D'));
```

#### Image Optimization
```typescript
// Use OptimizedImage component
<OptimizedImage
  src={product.imageUrl}
  alt={product.name}
  width={400}
  height={400}
  priority={false}
/>
```

#### Bundle Analysis
```bash
# Analyze bundle size
just build-analyze

# View report at http://localhost:8888
```

### Backend Performance

#### Database Optimization
- Use proper indexes (defined in `db-init.sql`)
- Implement query optimization in `src/lib/db/queries.ts`
- Use connection pooling with Prisma

#### Caching Strategy
- L1: In-memory cache (Node.js)
- L2: Redis cache  
- L3: CDN cache (Vercel/Cloudflare)

#### API Rate Limiting
- Per-user limits based on tier
- Per-endpoint limits
- AI generation limits with cost tracking

## Deployment

### Development Deployment

```bash
# Deploy to Vercel staging
just deploy-staging

# Deploy to Vercel production  
just deploy
```

### Environment Variables

Ensure all production environment variables are set in Vercel:

- Database: `DATABASE_URL`
- AI: `GEMINI_API_KEY`
- Payments: Stripe keys and webhook secrets
- Storage: Cloudinary or Vercel Blob tokens
- Fulfillment: Printful/Printify API keys

### Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates valid
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Error tracking enabled
- [ ] Performance monitoring active

### Self-Hosting with NixOS

The flake includes a NixOS module for self-hosting:

```nix
# In your NixOS configuration
{
  services.tshop = {
    enable = true;
    domain = "tshop.example.com";
    database.createLocally = true;
    redis.createLocally = true;
    environmentFile = "/secrets/tshop.env";
  };
}
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill conflicting processes
just dev-clean-processes

# Check what's using port 3000
lsof -i :3000
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Restart database
just stop && just dev-db
```

#### SSL Certificate Issues
```bash
# Regenerate certificates
rm -rf certs/
just ssl-setup

# Check certificate validity
openssl x509 -in certs/localhost.pem -text -noout
```

#### Node Module Issues
```bash
# Clean install
just clean-install

# Clear npm cache
npm cache clean --force
```

#### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Check Redis logs
tail -f logs/redis.log
```

### Performance Issues

#### Slow Build Times
```bash
# Enable Turbo mode (already enabled in config)
export TURBO=1

# Use more memory for Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Clear cache
rm -rf .next node_modules/.cache
```

#### Database Slow Queries
```bash
# Enable query logging in Prisma
# Check logs/postgres.log for slow queries
# Add indexes as needed
```

#### Memory Issues
```bash
# Check memory usage
htop

# Increase memory limits in .env.local
NODE_OPTIONS="--max-old-space-size=8192"
```

### Getting Debug Information

#### Environment Info
```bash
just info
```

#### Service Logs  
```bash
# View all logs
just logs

# View specific service
tail -f logs/postgres.log
tail -f logs/redis.log
tail -f logs/next.log
```

#### Database Debugging
```bash
# Connect to database
psql tshop_dev

# Check table sizes
\dt+

# Check indexes
\di+

# Check query performance
EXPLAIN ANALYZE SELECT ...;
```

### Recovery Procedures

#### Reset Everything
```bash
just clean
just init
npm install
just dev
```

#### Database Recovery
```bash
# Restore from backup
just db-restore backups/latest.sql

# Or reset with sample data
just db-reset
just db-seed
```

#### SSL Recovery
```bash
# Remove and regenerate
rm -rf certs/
just ssl-setup
```

## Best Practices

### Code Organization
- Use feature-based folder structure
- Implement proper TypeScript types
- Follow Next.js conventions
- Use consistent naming patterns

### State Management
- Use server state for API data (React Query/SWR)
- Use client state for UI state (Zustand)
- Use global state sparingly (Redux Toolkit)

### API Design
- Follow RESTful conventions
- Implement proper error handling
- Use TypeScript for request/response types
- Document APIs with OpenAPI/Swagger

### Security
- Never commit secrets to Git
- Use environment variables for configuration
- Implement proper input validation
- Follow OWASP security guidelines

### Performance
- Implement proper caching strategies
- Use code splitting and lazy loading
- Optimize images and assets
- Monitor performance metrics

This guide covers the essential aspects of developing with the TShop NixOS environment. For specific implementation details, refer to the technical specification documents and inline code comments.