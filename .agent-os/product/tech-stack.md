# Technical Stack

> Last Updated: 2025-08-30
> Version: 1.0.0

## Core Technologies

### Application Framework
- **Framework:** Next.js
- **Version:** 15.0+
- **Language:** TypeScript
- **Runtime:** Node.js 22 LTS

### Database
- **Primary:** PostgreSQL
- **Version:** 17+
- **ORM:** Prisma or Drizzle

## Frontend Stack

### JavaScript Framework
- **Framework:** React
- **Version:** Latest stable (via Next.js)
- **Build Tool:** Next.js built-in Turbopack

### Import Strategy
- **Strategy:** ES Modules
- **Package Manager:** npm
- **Node Version:** 22 LTS

### CSS Framework
- **Framework:** TailwindCSS
- **Version:** 4.0+
- **PostCSS:** Yes

### UI Components
- **Library:** Radix UI + shadcn/ui
- **Version:** Latest
- **Design System:** Custom components built on Radix primitives

### Internationalization
- **Framework:** Next.js i18n with react-i18next
- **Initial Languages:** English, Spanish, French, German
- **Translation Management:** Professional translation service integration
- **Localization:** Currency, dates, cultural adaptations

### Design Editor
- **Library:** Fabric.js
- **Version:** Latest stable
- **Purpose:** Interactive design canvas and editing tools

### 3D Visualization
- **Library:** Three.js with React Three Fiber
- **Version:** Latest stable
- **Purpose:** High-quality 3D product previews and interactive visualization
- **Additional:** Drei library for enhanced 3D components and utilities

## AI Integration

### AI Provider
- **Primary:** Google Gemini API
- **Backup:** OpenAI GPT-4 (if needed)
- **Usage:** Design generation, product descriptions, user assistance

## Fulfillment Integration

### Print-on-Demand Partners
- **Premium:** Printful API
- **Cost-Effective:** Printify API
- **Integration:** REST APIs with webhook support

## Assets & Media

### Fonts
- **Provider:** Google Fonts
- **Loading Strategy:** Self-hosted via next/font for performance

### Icons
- **Library:** Lucide React
- **Implementation:** React components

### Image Processing
- **Service:** Cloudinary or similar
- **Purpose:** Product mockups, design previews, optimization

## Infrastructure

### Application Hosting
- **Platform:** Vercel
- **Service:** Next.js hosting with edge functions
- **Region:** Global edge network

### Database Hosting
- **Provider:** Vercel Postgres or Railway
- **Service:** Managed PostgreSQL
- **Backups:** Automated daily backups

### Asset Storage
- **Provider:** Vercel Blob or Cloudinary
- **CDN:** Built-in CDN
- **Access:** Public assets, secure design storage

## Deployment

### CI/CD Pipeline
- **Platform:** Vercel (built-in)
- **Trigger:** Push to main/staging branches
- **Tests:** Jest + Playwright for E2E

### Environments
- **Production:** main branch (auto-deploy)
- **Preview:** PR-based preview deployments
- **Development:** Local Next.js dev server

## Payment Processing

### Payment Gateway
- **Provider:** Stripe
- **Features:** Cards, digital wallets, subscription billing
- **Webhooks:** Order completion, payment status updates

## Additional Services

### Analytics
- **Service:** Vercel Analytics + Google Analytics 4
- **Purpose:** User behavior, conversion tracking

### Monitoring
- **Service:** Vercel monitoring + Sentry
- **Purpose:** Error tracking, performance monitoring

### Email
- **Service:** Resend or SendGrid
- **Purpose:** Order confirmations, shipping updates

### Authentication
- **Service:** NextAuth.js or Clerk
- **Providers:** Email, Google, GitHub
- **Features:** User accounts, order history