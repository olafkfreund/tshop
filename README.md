# TShop - AI-Powered Custom Apparel Platform

## Overview

TShop is a comprehensive e-commerce platform for custom apparel design and fulfillment. It combines AI-powered design generation with integrated print-on-demand services to enable users to create and purchase custom t-shirts, caps, and tote bags.

## Key Features

### Core Platform Features
- **AI Design Generation**: Instant professional design creation using Google Gemini AI
- **Interactive Design Editor**: Real-time design customization with Fabric.js
- **Product Catalog**: Support for t-shirts, caps, and tote bags with multiple variants
- **Dual Fulfillment Integration**: Seamless connection to Printful (premium) and Printify (cost-effective)
- **Shopping Cart System**: Persistent cart with user and guest support
- **Payment Processing**: Secure checkout with Stripe integration
- **Order Management**: Real-time tracking and status updates

### Advanced Features
- **3D Product Preview**: Interactive 3D visualization for product previews
- **Multi-language Support**: Internationalization ready (EN, ES, FR, DE)
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Dark Mode Support**: Full theme customization with TailwindCSS
- **AI Usage Limits**: Tiered rate limiting system for cost control
- **User Authentication**: Complete auth system with NextAuth.js
- **Admin Interface**: Comprehensive administration panel for platform management

## Technology Stack

### Core Technologies
- **Framework**: Next.js 15.0+ with TypeScript
- **Database**: PostgreSQL 17+ with direct SQL queries (no ORM)
- **Authentication**: NextAuth.js v5
- **Payment**: Stripe API
- **AI Integration**: Google Gemini API
- **Styling**: TailwindCSS 4.0+
- **Design Editor**: Fabric.js
- **3D Visualization**: Three.js with React Three Fiber

### Infrastructure
- **Hosting**: Vercel
- **Database Hosting**: Local PostgreSQL (production: Vercel Postgres or Railway)
- **Asset Storage**: Vercel Blob or Cloudinary
- **CDN**: Built-in Vercel CDN

## Installation

### Prerequisites
- Node.js 22 LTS or higher
- PostgreSQL 17 or higher
- npm or yarn package manager
- Git

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tshop.git
cd tshop
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:

Create a PostgreSQL database and user:
```sql
CREATE DATABASE tshop_dev;
CREATE USER tshop_user WITH PASSWORD 'tshop_password';
GRANT ALL PRIVILEGES ON DATABASE tshop_dev TO tshop_user;
```

4. Initialize the database schema:
```bash
psql -U tshop_user -d tshop_dev -p 5433 -h localhost -f init-db.sql
```

5. Configure environment variables:

Create a `.env.local` file in the root directory:
```env
# Database Configuration
DATABASE_URL=postgresql://tshop_user:tshop_password@localhost:5433/tshop_dev

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Stripe Configuration
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Google Gemini AI
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Fulfillment APIs (optional)
PRINTFUL_API_KEY=your-printful-api-key
PRINTIFY_API_KEY=your-printify-api-key
```

6. Set up the admin user:
```bash
npx tsx scripts/setup-admin.ts
```

7. Start the development server:
```bash
npm run dev -- --port 3001
```

The application will be available at `http://localhost:3001`

## Database Configuration

### Direct PostgreSQL Connection

The application uses direct PostgreSQL connections via the `pg` library instead of an ORM. The database configuration is located in `lib/db-direct.ts`:

```javascript
const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'tshop_dev',
  user: 'tshop_user',
  password: 'tshop_password',
  ssl: false, // Set to true for production
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
})
```

### Database Schema

The database includes the following main tables:
- `users`: User accounts with authentication and role management
- `products`: Product catalog with categories and base pricing
- `product_variants`: Size and color variations for products
- `product_images`: Product image assets
- `product_specs`: Product specifications and details
- `cart_items`: Shopping cart persistence for users and guests
- `orders`: Order records with payment and fulfillment status
- `order_items`: Individual items within orders
- `ai_usage_stats`: AI generation usage tracking
- `designs`: Saved design templates and user creations

## API Documentation

### Public API Endpoints

#### AI Design Generation
- `POST /api/ai/generate` - Generate AI design
  - Body: `{ prompt, productCategory, style }`
  - Returns: Generated design data and usage stats

- `GET /api/ai/usage` - Check AI usage limits
  - Returns: Current usage and remaining limits

- `POST /api/ai/suggestions` - Get design suggestions
  - Body: `{ category, style }`
  - Returns: AI-generated design suggestions

#### Cart Management
- `GET /api/cart` - Get current cart
- `POST /api/cart` - Add item to cart
  - Body: `{ productId, variantId, quantity, customization }`
- `PUT /api/cart/[id]` - Update cart item quantity
- `DELETE /api/cart/[id]` - Remove item from cart

#### Products
- `GET /api/products` - List all products
- `GET /api/products/[id]` - Get product details

#### Checkout
- `POST /api/checkout` - Create Stripe checkout session
  - Body: `{ items, successUrl, cancelUrl }`
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Protected API Endpoints

#### User Authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/session` - Get current session
- `POST /api/auth/[...nextauth]` - NextAuth.js dynamic handler

### Admin API Endpoints

All admin endpoints require authentication and admin role.

#### Admin Check
- `GET /api/admin/check` - Verify admin status

#### User Management
- `POST /api/admin/users/role` - Update user role
  - Body: `{ userId, role }`

## User Features

### AI Design Generation System

The platform offers AI-powered design generation with intelligent constraints for each product type:

#### Product-Specific Design Optimization
- **T-Shirts**: Centered chest area design placement
- **Caps**: Front panel design with curved adaptation
- **Tote Bags**: Main surface design with proportional sizing

#### Usage Tiers
1. **FREE Tier** (Guest users)
   - 2 AI generations per session
   - Basic templates only
   - Watermarked previews

2. **REGISTERED Tier** (Logged-in users)
   - 10 AI generations per day
   - 50 AI generations per month
   - Access to premium templates

3. **PREMIUM Tier** (Paid subscription)
   - 100 AI generations per month
   - Priority generation queue
   - Advanced AI features

### Shopping Cart Features
- Persistent cart storage for registered users
- Guest cart support via session cookies
- Automatic cart transfer on user login
- Product customization storage
- Real-time price calculations

### Order Management
- Order history and tracking
- Order status updates (pending, processing, completed, cancelled)
- Shipping information
- Invoice generation
- Email notifications

## Admin Interface

### Accessing the Admin Panel

1. Login with an admin account
2. Navigate to `/admin` or click "Admin Panel" in the user dropdown
3. Admin users are identified by the `role` field in the database

### Admin Dashboard Features

#### Main Dashboard (`/admin`)
- **Revenue Metrics**: Total revenue (30-day), average order value, conversion rates
- **Order Overview**: Pending, completed, and cancelled orders summary
- **AI Usage Statistics**: Daily generations, user tier distribution
- **System Health**: Real-time monitoring of active users, carts, and system status
- **Quick Navigation**: Direct links to all management sections

#### User Management (`/admin/users`)
- Complete user listing with search functionality
- Role management (promote/demote users to admin)
- User activity tracking:
  - Total orders placed
  - AI generations used
  - Account creation date
- Pagination support for large user bases
- Export user data functionality

#### Order Management (`/admin/orders`)
- Comprehensive order listing with filters:
  - Status filtering (all, pending, completed, cancelled)
  - Date range selection
  - Customer search
- Order details view:
  - Customer information
  - Order items with customizations
  - Payment status
  - Shipping details
- Bulk order operations
- Revenue analytics per order

#### Product Management (`/admin/products`)
- Visual product catalog with image previews
- Product operations:
  - Add new products
  - Edit existing products
  - Manage product status (active/inactive)
- Variant management:
  - Size variations
  - Color options
  - Pricing per variant
- Category organization
- Stock tracking

#### Advanced Analytics (`/admin/analytics`)
- **Revenue Analytics**:
  - Daily revenue trend charts
  - Monthly comparisons
  - Product category performance
- **AI Usage Patterns**:
  - Usage by tier visualization
  - Peak usage times
  - Generation success rates
- **System Monitoring**:
  - Active users in real-time
  - Database performance metrics
  - API response times
- **Conversion Metrics**:
  - Cart abandonment rates
  - User registration conversion
  - Product view to purchase ratios

### Creating an Admin User

To make an existing user an admin:

1. Run the admin setup script:
```bash
npx tsx scripts/setup-admin.ts
```

2. Or manually update via SQL:
```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

3. Or use the admin interface:
   - Login as an existing admin
   - Navigate to `/admin/users`
   - Click the role toggle for the user

## Development

### Project Structure
```
tshop/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin interface pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── ai-design/         # AI design generation page
│   ├── products/          # Product catalog
│   └── checkout/          # Checkout flow
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── cart/             # Shopping cart components
│   ├── design/           # Design editor components
│   └── navigation/       # Navigation components
├── lib/                   # Utility functions and configurations
│   ├── db-direct.ts      # Database connection and queries
│   ├── auth.ts           # NextAuth configuration
│   ├── stripe.ts         # Stripe integration
│   ├── cart.ts           # Cart service logic
│   └── ai/               # AI integration modules
├── scripts/              # Utility scripts
│   ├── setup-admin.ts    # Admin user setup
│   └── check-admin.ts    # Admin verification
└── public/               # Static assets
```

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm run start
```

### Database Operations

Check database connection:
```bash
npx tsx scripts/check-admin.ts
```

Run custom SQL queries:
```bash
psql -U tshop_user -d tshop_dev -p 5433 -h localhost
```

### Code Style

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Conventional commits

Run linting:
```bash
npm run lint
```

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Database Setup for Production

1. Use a managed PostgreSQL service:
   - Vercel Postgres
   - Railway
   - Supabase
   - Neon

2. Update the connection configuration in `lib/db-direct.ts`:
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
```

3. Run the database initialization script on production database

### Environment Variables for Production

Critical environment variables to configure:

```env
# Required
DATABASE_URL=your-production-database-url
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-strong-secret
GOOGLE_GEMINI_API_KEY=your-api-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Optional but recommended
GOOGLE_CLIENT_ID=for-oauth-login
GOOGLE_CLIENT_SECRET=for-oauth-login
PRINTFUL_API_KEY=for-fulfillment
PRINTIFY_API_KEY=for-fulfillment
```

### Security Checklist

- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Enable SSL for database connections
- [ ] Configure CORS for API endpoints
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure CSP (Content Security Policy)
- [ ] Set up monitoring and alerting
- [ ] Regular security audits

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify connection details
psql -U tshop_user -d tshop_dev -p 5433 -h localhost -c "SELECT 1"

# Check database exists
psql -U postgres -c "\l"
```

#### AI Generation Not Working
- Verify Google Gemini API key is valid
- Check usage limits in `/admin/analytics`
- Review error logs in browser console
- Ensure network connectivity to Google APIs

#### Authentication Issues
- Verify NEXTAUTH_SECRET is set
- Check OAuth provider configurations
- Ensure callback URLs match configuration
- Clear browser cookies and retry

#### Payment Processing Issues
- Verify Stripe keys (publishable and secret)
- Check webhook endpoint configuration
- Test with Stripe CLI for local development:
```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

#### Admin Access Issues
- Verify user role in database:
```sql
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
```
- Run admin setup script if needed
- Check browser console for API errors

### Performance Optimization

#### Database Performance
- Add indexes for frequently queried columns
- Use connection pooling (already configured)
- Monitor slow queries
- Regular VACUUM and ANALYZE

#### Application Performance
- Enable Next.js production optimizations
- Use CDN for static assets
- Implement caching strategies
- Optimize images with Next.js Image component

### Monitoring and Logs

#### Server Logs
- Check terminal output in development
- Use Vercel Functions logs in production
- Implement structured logging with winston or pino

#### Database Logs
- Enable query logging in PostgreSQL
- Monitor connection pool statistics
- Track slow queries

#### Error Tracking
- Implement Sentry for production error tracking
- Use browser error boundaries
- Log API errors with context

## Support and Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Google Gemini API](https://ai.google.dev/)

### Community
- GitHub Issues for bug reports
- Discord community for support
- Stack Overflow for technical questions

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Roadmap

See `.agent-os/product/roadmap.md` for detailed development phases:

- Phase 1: Core Platform Foundation (Completed)
- Phase 2: AI Design Generation (Completed)
- Phase 3: Advanced Design Editor (In Progress)
- Phase 4: Fulfillment Integration (Planned)
- Phase 5: Platform Polish & Advanced Features (Planned)

## Acknowledgments

Built with modern web technologies and best practices for scalability, security, and user experience.