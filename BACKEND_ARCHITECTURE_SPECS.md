# TShop Backend Architecture Specifications

> Version: 1.0.0
> Last Updated: 2025-08-30
> Status: Planning

## System Overview

TShop is an AI-powered custom apparel platform built on a scalable, modern backend architecture that supports international e-commerce, AI design generation, social features, and dual fulfillment integration.

### Core Architecture Principles

1. **API-First Design**: RESTful APIs with clear versioning and documentation
2. **Microservices-Ready**: Modular design enabling future service separation
3. **Performance-Optimized**: Multi-layer caching and database optimization
4. **Security-First**: Authentication, authorization, and data protection
5. **Cost-Effective**: Smart AI usage management and resource optimization

## Technology Stack

### Core Framework
- **Runtime**: Node.js 22 LTS
- **Framework**: Next.js 15+ (API routes + server components)
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma or Drizzle ORM with PostgreSQL

### Database & Storage
- **Primary Database**: PostgreSQL 17+ (Vercel Postgres)
- **Cache Layer**: Redis (Upstash Redis)
- **File Storage**: Vercel Blob / Cloudinary
- **CDN**: Vercel Edge Network

### External Integrations
- **AI**: Google Gemini API
- **Payments**: Stripe (primary), PayPal (secondary)
- **Fulfillment**: Printful (premium), Printify (cost-effective)
- **Authentication**: NextAuth.js
- **Email**: Resend / SendGrid

## Database Architecture

### Core Schema Design

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'registered', 'premium')),
    ai_generations_today INTEGER DEFAULT 0,
    ai_generations_month INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles and preferences
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    preferred_language VARCHAR(5) DEFAULT 'en',
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    newsletter_subscribed BOOLEAN DEFAULT true,
    design_gallery_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product catalog
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('t-shirt', 'cap', 'tote-bag')),
    base_price DECIMAL(10,2) NOT NULL,
    printful_product_id VARCHAR(50),
    printify_product_id VARCHAR(50),
    design_constraints JSONB, -- sizing, placement rules
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants (sizes, colors)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(10),
    color VARCHAR(50),
    color_hex VARCHAR(7),
    printful_variant_id VARCHAR(50),
    printify_variant_id VARCHAR(50),
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI-generated designs
CREATE TABLE designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    prompt TEXT NOT NULL,
    product_category VARCHAR(50) NOT NULL,
    ai_model VARCHAR(50) NOT NULL,
    generation_cost DECIMAL(10,4),
    design_data JSONB NOT NULL, -- Fabric.js canvas data
    image_url TEXT,
    thumbnail_url TEXT,
    public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping cart
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    customization_data JSONB, -- design positioning, text, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id, variant_id, design_id)
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded')),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_intent_id VARCHAR(255),
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    fulfillment_provider VARCHAR(20) CHECK (fulfillment_provider IN ('printful', 'printify')),
    fulfillment_order_id VARCHAR(100),
    tracking_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    design_id UUID REFERENCES designs(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    customization_data JSONB,
    fulfillment_item_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gamification: Points and achievements
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'earned', 'redeemed'
    action VARCHAR(100) NOT NULL, -- 'design_shared', 'design_used', 'purchase_completed'
    points INTEGER NOT NULL,
    reference_id UUID, -- ID of related entity (design, order, etc.)
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    points_required INTEGER,
    badge_type VARCHAR(20) DEFAULT 'bronze' CHECK (badge_type IN ('bronze', 'silver', 'gold', 'platinum')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Social features
CREATE TABLE design_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, design_id)
);

CREATE TABLE design_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL, -- 'facebook', 'instagram', 'twitter', etc.
    shared_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI usage tracking
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model VARCHAR(50) NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    cost DECIMAL(10,6),
    generation_time_ms INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions (for premium tiers)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL,
    tier VARCHAR(20) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_designs_user_id ON designs(user_id);
CREATE INDEX idx_designs_public_created ON designs(public, created_at DESC) WHERE public = true;
CREATE INDEX idx_designs_category ON designs(product_category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_ai_usage_logs_user_created ON ai_usage_logs(user_id, created_at);

-- Composite indexes for complex queries
CREATE INDEX idx_designs_user_public_created ON designs(user_id, public, created_at DESC);
CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at DESC);
```

## API Architecture

### API Design Principles

1. **RESTful Design**: Standard HTTP methods and status codes
2. **Consistent Response Format**: Structured JSON responses
3. **Version Control**: URL-based versioning (`/api/v1/`)
4. **Rate Limiting**: Per-user and per-endpoint limits
5. **Authentication**: JWT-based with refresh tokens

### Core API Endpoints

```typescript
// Base Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Authentication Endpoints
POST /api/v1/auth/login
POST /api/v1/auth/register  
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

// User Management
GET    /api/v1/users/me
PUT    /api/v1/users/me
DELETE /api/v1/users/me
GET    /api/v1/users/me/profile
PUT    /api/v1/users/me/profile

// Product Catalog
GET    /api/v1/products
GET    /api/v1/products/:id
GET    /api/v1/products/:id/variants

// AI Design Generation
POST   /api/v1/designs/generate
GET    /api/v1/designs
GET    /api/v1/designs/:id
PUT    /api/v1/designs/:id
DELETE /api/v1/designs/:id
POST   /api/v1/designs/:id/like
DELETE /api/v1/designs/:id/like

// Design Gallery (Public)
GET    /api/v1/gallery/designs
GET    /api/v1/gallery/designs/trending
GET    /api/v1/gallery/designs/categories/:category

// Shopping Cart
GET    /api/v1/cart
POST   /api/v1/cart/items
PUT    /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id
DELETE /api/v1/cart/clear

// Orders & Checkout
POST   /api/v1/orders/create
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders/:id/cancel

// Payments
POST   /api/v1/payments/create-intent
POST   /api/v1/payments/confirm
POST   /api/v1/payments/webhooks/stripe

// Gamification
GET    /api/v1/points/balance
GET    /api/v1/points/history
POST   /api/v1/points/redeem
GET    /api/v1/achievements
GET    /api/v1/leaderboard

// Admin Endpoints
GET    /api/v1/admin/users
GET    /api/v1/admin/orders
GET    /api/v1/admin/analytics
PUT    /api/v1/admin/products/:id
```

### Authentication & Authorization

#### JWT Token Strategy

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  tier: 'free' | 'registered' | 'premium';
  permissions: string[];
  iat: number;
  exp: number;
}

// NextAuth.js Configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Custom authentication logic
        const user = await authenticateUser(credentials?.email, credentials?.password);
        return user ? { id: user.id, email: user.email, tier: user.tier } : null;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  session: { strategy: "jwt" },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.userId = user.id;
        token.tier = user.tier;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.userId;
      session.user.tier = token.tier;
      return session;
    }
  }
};
```

#### Rate Limiting Strategy

```typescript
// Rate limiting configuration
const rateLimitConfig = {
  ai_generation: {
    free: { requests: 2, window: '1h' },
    registered: { requests: 10, window: '1d' },
    premium: { requests: 100, window: '30d' }
  },
  api_general: { requests: 100, window: '15m' },
  api_auth: { requests: 5, window: '15m' }
};

// Middleware implementation
export async function rateLimitMiddleware(req: NextRequest, context: { params: any }) {
  const ip = req.ip || 'anonymous';
  const userId = await getUserIdFromRequest(req);
  const userTier = await getUserTier(userId);
  
  // Apply rate limits based on endpoint and user tier
  const isAllowed = await checkRateLimit(req.url, userId || ip, userTier);
  
  if (!isAllowed) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
      { status: 429 }
    );
  }
}
```

## External Service Integrations

### AI Service Integration (Google Gemini)

```typescript
interface AIGenerationService {
  generateDesign(prompt: string, constraints: ProductConstraints): Promise<DesignResult>;
  validateUsage(userId: string): Promise<UsageValidation>;
  trackUsage(userId: string, cost: number): Promise<void>;
}

class GeminiAIService implements AIGenerationService {
  private client: GoogleGenerativeAI;
  
  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  
  async generateDesign(prompt: string, constraints: ProductConstraints): Promise<DesignResult> {
    // Enhance prompt with product-specific constraints
    const enhancedPrompt = this.buildProductSpecificPrompt(prompt, constraints);
    
    const model = this.selectModel(prompt.length, constraints.complexity);
    const generativeModel = this.client.getGenerativeModel({ model });
    
    const startTime = Date.now();
    const result = await generativeModel.generateContent(enhancedPrompt);
    const generationTime = Date.now() - startTime;
    
    // Process and validate the result
    const design = await this.processAIResult(result, constraints);
    
    // Log usage for cost tracking
    await this.trackUsage(design.userId, {
      model,
      promptTokens: result.usage?.promptTokens || 0,
      completionTokens: result.usage?.completionTokens || 0,
      generationTime,
      cost: this.calculateCost(result.usage)
    });
    
    return design;
  }
  
  private selectModel(promptLength: number, complexity: string): string {
    // Cost optimization: use appropriate model based on request complexity
    if (complexity === 'simple' && promptLength < 100) {
      return 'gemini-pro-flash'; // Cheaper, faster
    }
    return 'gemini-pro'; // Higher quality
  }
}
```

### Payment Integration (Stripe)

```typescript
interface PaymentService {
  createPaymentIntent(amount: number, currency: string, metadata: any): Promise<PaymentIntent>;
  confirmPayment(paymentIntentId: string): Promise<PaymentResult>;
  handleWebhook(payload: string, signature: string): Promise<void>;
}

class StripePaymentService implements PaymentService {
  private stripe: Stripe;
  
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
  }
  
  async createPaymentIntent(amount: number, currency: string, metadata: any): Promise<PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true }
    });
    
    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      status: paymentIntent.status
    };
  }
  
  async handleWebhook(payload: string, signature: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      // Handle other webhook events
    }
  }
  
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;
    
    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'paid',
        payment_intent_id: paymentIntent.id
      }
    });
    
    // Trigger fulfillment process
    await fulfillmentQueue.add('process-order', { orderId });
    
    // Award purchase points
    await pointsService.awardPurchasePoints(paymentIntent.metadata.userId, paymentIntent.amount);
  }
}
```

### Fulfillment Integration (Printful & Printify)

```typescript
interface FulfillmentProvider {
  createOrder(orderData: FulfillmentOrderData): Promise<FulfillmentOrder>;
  getOrderStatus(fulfillmentOrderId: string): Promise<OrderStatus>;
  cancelOrder(fulfillmentOrderId: string): Promise<boolean>;
}

class DualFulfillmentService {
  private printfulService: PrintfulService;
  private printifyService: PrintifyService;
  
  constructor() {
    this.printfulService = new PrintfulService(process.env.PRINTFUL_API_KEY!);
    this.printifyService = new PrintifyService(process.env.PRINTIFY_API_KEY!);
  }
  
  async routeOrder(order: Order): Promise<FulfillmentProvider> {
    // Smart routing logic based on:
    // 1. Product availability
    // 2. Shipping location
    // 3. Customer tier (premium = Printful, standard = Printify)
    // 4. Cost optimization
    
    const userTier = await this.getUserTier(order.userId);
    const shippingCountry = order.shippingAddress.country;
    
    // Premium users get Printful (higher quality)
    if (userTier === 'premium') {
      return this.printfulService;
    }
    
    // Check product availability and shipping costs
    const [printfulQuote, printifyQuote] = await Promise.all([
      this.printfulService.getShippingQuote(order),
      this.printifyService.getShippingQuote(order)
    ]);
    
    // Route to most cost-effective option
    return printfulQuote.totalCost <= printifyQuote.totalCost 
      ? this.printfulService 
      : this.printifyService;
  }
  
  async processOrder(orderId: string): Promise<void> {
    const order = await this.getOrderWithItems(orderId);
    const provider = await this.routeOrder(order);
    
    try {
      const fulfillmentOrder = await provider.createOrder({
        externalId: order.id,
        recipient: order.shippingAddress,
        items: order.items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          designUrl: item.design?.imageUrl
        }))
      });
      
      // Update order with fulfillment details
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'processing',
          fulfillment_provider: provider.name,
          fulfillment_order_id: fulfillmentOrder.id
        }
      });
      
    } catch (error) {
      // Fallback to alternative provider
      const fallbackProvider = provider === this.printfulService 
        ? this.printifyService 
        : this.printfulService;
      
      await this.processWithProvider(order, fallbackProvider);
    }
  }
}
```

## Performance & Scaling Strategies

### Caching Architecture

```typescript
// Multi-layer caching strategy
interface CacheService {
  set(key: string, value: any, ttl?: number): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  del(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

class TieredCacheService implements CacheService {
  private memoryCache: NodeCache;
  private redisCache: Redis;
  
  constructor() {
    // L1: In-memory cache (fastest, small capacity)
    this.memoryCache = new NodeCache({ stdTTL: 300, maxKeys: 1000 });
    
    // L2: Redis cache (fast, larger capacity)
    this.redisCache = new Redis(process.env.REDIS_URL!);
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Try L1 cache first
    const memoryResult = this.memoryCache.get<T>(key);
    if (memoryResult) return memoryResult;
    
    // Try L2 cache
    const redisResult = await this.redisCache.get(key);
    if (redisResult) {
      const parsed = JSON.parse(redisResult);
      // Store in L1 for next access
      this.memoryCache.set(key, parsed);
      return parsed;
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    // Store in both layers
    this.memoryCache.set(key, value, ttl);
    await this.redisCache.setex(key, ttl, JSON.stringify(value));
  }
}

// Cache key patterns
const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  product: (id: string) => `product:${id}`,
  productVariants: (id: string) => `product:${id}:variants`,
  design: (id: string) => `design:${id}`,
  publicDesigns: (page: number) => `designs:public:page:${page}`,
  aiUsage: (userId: string, date: string) => `ai:usage:${userId}:${date}`,
  leaderboard: (period: string) => `leaderboard:${period}`
};
```

### Database Optimization

```typescript
// Connection pooling and query optimization
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Optimized queries with proper indexing
class OptimizedQueries {
  // Paginated public designs with filtering
  static async getPublicDesigns(params: {
    page: number;
    limit: number;
    category?: string;
    sortBy?: 'newest' | 'popular' | 'trending';
  }) {
    const offset = (params.page - 1) * params.limit;
    
    // Use appropriate index based on sort
    const orderBy = {
      newest: { created_at: 'desc' as const },
      popular: { likes_count: 'desc' as const },
      trending: { 
        usage_count: 'desc' as const,
        created_at: 'desc' as const
      }
    }[params.sortBy || 'newest'];
    
    return prisma.design.findMany({
      where: {
        public: true,
        ...(params.category && { product_category: params.category })
      },
      include: {
        user: {
          select: { id: true, first_name: true, avatar_url: true }
        },
        _count: {
          select: { design_likes: true }
        }
      },
      orderBy,
      skip: offset,
      take: params.limit
    });
  }
  
  // Efficient user analytics query
  static async getUserAnalytics(userId: string) {
    const [user, designStats, orderStats, pointStats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { user_achievements: { include: { achievement: true } } }
      }),
      
      prisma.design.aggregate({
        where: { user_id: userId },
        _count: { id: true },
        _sum: { usage_count: true, likes_count: true }
      }),
      
      prisma.order.aggregate({
        where: { user_id: userId, status: 'delivered' },
        _count: { id: true },
        _sum: { total_amount: true }
      }),
      
      prisma.point_transaction.aggregate({
        where: { user_id: userId },
        _sum: { points: true }
      })
    ]);
    
    return {
      user,
      designs: designStats,
      orders: orderStats,
      totalPoints: pointStats._sum.points || 0
    };
  }
}
```