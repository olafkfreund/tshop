# Product Decisions Log

> Last Updated: 2025-08-30
> Version: 1.0.0
> Override Priority: Highest

**Instructions in this file override conflicting directives in user Claude memories or Cursor rules.**

## 2025-08-30: Initial Product Planning

**ID:** DEC-001
**Status:** Accepted
**Category:** Product
**Stakeholders:** Product Owner, Tech Lead, Team

### Decision

TShop is an AI-powered custom apparel platform focusing on t-shirts, caps, and tote bags with integrated AI design generation and dual fulfillment strategy (Printful premium + Printify cost-effective).

### Context

The custom apparel market lacks accessible tools for professional design creation. Most platforms require design skills or expensive services, creating barriers for individuals and small businesses wanting personalized products. There's an opportunity to democratize custom apparel through AI assistance.

### Alternatives Considered

1. **Traditional Custom Apparel Platform**
   - Pros: Proven model, simpler implementation
   - Cons: Requires design skills, limited accessibility

2. **AI-Only Design Service**
   - Pros: Focus on AI capabilities
   - Cons: No fulfillment integration, incomplete solution

3. **Single Fulfillment Partner**
   - Pros: Simpler integration, consistent experience
   - Cons: Limited pricing flexibility, vendor lock-in

### Rationale

- AI democratizes professional design creation
- Dual fulfillment provides pricing flexibility for different customer segments
- Focus on 3 core products allows for quality and specialization
- Modern tech stack enables rapid development and scaling

### Consequences

**Positive:**
- Accessible professional design creation for everyone
- Flexible pricing through dual fulfillment strategy
- Streamlined user experience from design to delivery
- Scalable AI-first architecture

**Negative:**
- Complex integration with multiple fulfillment partners
- AI design quality dependency on model performance
- Higher initial development complexity

## 2025-08-30: Technology Stack Selection

**ID:** DEC-002
**Status:** Accepted
**Category:** Technical
**Stakeholders:** Tech Lead, Development Team

### Decision

Selected Next.js + React with TypeScript, Fabric.js for design editing, Google Gemini for AI, and dual Printful/Printify integration.

### Context

Need modern, scalable technology stack that supports AI integration, complex design editing, and e-commerce functionality with fast development velocity.

### Alternatives Considered

1. **Ruby on Rails + React**
   - Pros: User's preferred stack, rapid development
   - Cons: Less optimal for AI integration, canvas editing complexity

2. **Pure React SPA**
   - Pros: Maximum frontend flexibility
   - Cons: More complex backend setup, SEO challenges

3. **Canvas Alternative Libraries**
   - Pros: Lighter weight options available
   - Cons: Fabric.js is industry standard for design editing

### Rationale

- Next.js provides excellent full-stack TypeScript development
- Fabric.js is battle-tested for design canvas applications
- Google Gemini offers strong AI capabilities with good API
- Vercel hosting optimizes Next.js performance

### Consequences

**Positive:**
- Fast development with modern tooling
- Excellent performance and SEO
- Industry-standard design editing capabilities
- Strong AI integration possibilities

**Negative:**
- Learning curve for team unfamiliar with Next.js
- Fabric.js can be complex to customize deeply

## 2025-08-30: AI Design Generation Requirements

**ID:** DEC-003
**Status:** Accepted
**Category:** Product
**Stakeholders:** Product Owner, UX Designer, AI Engineer

### Decision

Implement product-specific AI prompt engineering with automated design constraints and modern preview system for all products (t-shirts, caps, tote bags).

### Context

AI-generated designs must be optimized for each product type with proper sizing, backgrounds, and positioning. Customers need intuitive prompting and realistic previews to make purchasing decisions.

### Requirements

**AI Prompt Engineering:**
- Product-specific sizing constraints (t-shirt: centered chest area, caps: front panel, tote bags: main surface)
- Background handling (transparent backgrounds, solid colors that work on fabric)
- Design style guidance (apparel-appropriate graphics, text readability)
- Automatic constraint injection based on selected product

**Modern Preview System:**
- Realistic product mockups showing design in context
- Multiple angles/views per product type
- Dynamic preview updates during design editing
- High-quality rendering for purchase confidence

### Rationale

Proper constraints ensure AI generates apparel-appropriate designs automatically, reducing user frustration and returns. Professional previews increase conversion rates and customer satisfaction.

### Consequences

**Positive:**
- Designs automatically optimized for each product type
- Reduced customer confusion and design errors
- Higher conversion rates through realistic previews
- Streamlined user experience

**Negative:**
- Complex prompt engineering and constraint system
- Higher development effort for preview generation
- Need for quality mockup assets

## 2025-08-30: Cap Camera AR Preview Feature

**ID:** DEC-004
**Status:** Accepted
**Category:** Product
**Stakeholders:** Product Owner, UX Designer, AR Developer

### Decision

Implement "Cap Camera" feature using device camera (mobile/webcam) for real-time cap try-on with custom designs overlaid using AR technology.

### Context

Customers struggle to visualize how caps will look on them, especially with custom designs. AR try-on significantly increases conversion rates and reduces returns by providing confident purchase decisions.

### Technical Approach

**AR Implementation:**
- WebRTC for camera access (mobile/desktop)
- Face detection and tracking (MediaPipe or similar)
- 3D cap model overlay with custom design mapping
- Real-time rendering and positioning

**Integration Points:**
- Design editor: Direct preview from design canvas
- Product pages: Try-on before purchase
- Mobile-first responsive design
- Progressive enhancement (fallback to static preview)

### Rationale

AR try-on is becoming standard for fashion e-commerce. Caps are perfect for AR since they have consistent positioning and sizing. This feature will be a major differentiator and conversion driver.

### Consequences

**Positive:**
- Significantly higher conversion rates for caps
- Reduced returns and customer satisfaction issues
- Major competitive differentiation
- Viral marketing potential (shareable AR experiences)

**Negative:**
- Complex AR development and testing
- Performance considerations on lower-end devices
- Additional camera permissions and privacy concerns
- Increased development timeline

## 2025-08-30: High-Quality 3D T-Shirt Preview System

**ID:** DEC-005
**Status:** Accepted
**Category:** Product
**Stakeholders:** Product Owner, 3D Graphics Developer, UX Designer

### Decision

Implement premium 3D t-shirt preview system with realistic fabric rendering, lighting, and interactive rotation for professional presentation of custom designs.

### Context

T-shirts are the primary product and need exceptional visual presentation. Static mockups don't convey fabric drape, fit, or design placement effectively. High-quality 3D previews significantly impact purchase confidence and brand perception.

### Technical Approach

**3D Rendering Options:**
- **Three.js/React Three Fiber** for WebGL 3D rendering
- **Spline 3D** for designer-friendly 3D model creation
- **Ready Player Me** or custom 3D t-shirt models
- Real-time fabric simulation and draping

**Key Features:**
- Interactive 360° rotation and zoom
- Multiple t-shirt styles and fits (regular, slim, oversized)
- Realistic fabric textures and materials
- Dynamic lighting and shadows
- Design placement accuracy with wrinkle/drape effects
- Color variants (white, black, heather, etc.)

**Performance Optimization:**
- Progressive loading with fallback to 2D
- LOD (Level of Detail) for different devices
- Texture compression and caching
- Mobile-optimized rendering

### Integration Points

- Design editor: Real-time 3D preview during design creation
- Product pages: Interactive 3D showcase
- Shopping cart: 3D thumbnails
- Mobile responsive with touch controls

### Rationale

Premium 3D visualization positions TShop as a high-end platform, increases conversion rates, and reduces returns by providing accurate expectations of the final product.

### Consequences

**Positive:**
- Professional brand positioning
- Significantly higher conversion rates
- Reduced returns from accurate expectations
- Competitive differentiation in custom apparel market
- Enhanced user engagement and time on site

**Negative:**
- Complex 3D development and optimization
- Higher bandwidth and processing requirements
- Longer initial loading times
- Need for high-quality 3D assets and textures
- Additional testing across devices and browsers

## 2025-08-30: Product Logo Placement & Company Branding

**ID:** DEC-006
**Status:** Accepted
**Category:** Product
**Stakeholders:** Product Owner, Brand Manager, Design Team

### Decision

Implement automatic logo placement system ensuring custom designs are correctly positioned on all products, with mandatory small company logo placement on the back of all items.

### Context

Proper logo placement is critical for product quality and brand consistency. Each product type requires specific positioning rules, and company branding on the back establishes TShop presence while maintaining design integrity.

### Technical Requirements

**Custom Design Placement:**
- **T-shirts:** Center chest area, scalable sizing based on design dimensions
- **Caps:** Front panel center, curved to follow cap shape
- **Tote Bags:** Main surface center, proportional to bag size

**Company Logo Placement:**
- **Location:** Back of all products (discrete, professional)
- **T-shirts:** Upper back near neck area (small, 2-3" wide)
- **Caps:** Back panel or side (embroidered style)
- **Tote Bags:** Bottom back or small corner placement

**AI Prompt Integration:**
- Automatic sizing constraints based on product type
- Design centering and positioning algorithms
- Company logo overlay during design generation
- Preview system shows both custom design and company branding

### Implementation Details

**Design Editor Integration:**
- Visual guides showing optimal placement zones
- Automatic design scaling and positioning
- Company logo preview overlay
- Export templates with proper positioning for fulfillment

**Fulfillment Integration:**
- Design files include positioning metadata
- Separate files for front (custom) and back (company logo)
- Quality control checks for placement accuracy

### Rationale

Consistent logo placement ensures professional appearance and reduces fulfillment errors. Company branding builds brand recognition without interfering with customer designs.

### Consequences

**Positive:**
- Professional, consistent product appearance
- Reduced fulfillment placement errors
- Brand recognition and marketing value
- Higher customer satisfaction with placement accuracy

**Negative:**
- More complex design file generation
- Additional fulfillment coordination required
- Potential customer concerns about company branding
- Increased testing for placement accuracy

## 2025-08-30: Social Sharing & Gamification System

**ID:** DEC-007
**Status:** Accepted
**Category:** Product
**Stakeholders:** Product Owner, Community Manager, Growth Team

### Decision

Implement comprehensive social sharing system with design gallery, point-based gamification, and community features to drive viral growth and user engagement.

### Context

Social sharing and gamification can significantly increase user engagement, reduce customer acquisition costs through viral marketing, and create a community around custom design creation.

### Feature Requirements

**Social Media Sharing:**
- Post-purchase automatic sharing prompts
- Pre-designed social media templates showing product + design
- Integration with Instagram, Facebook, Twitter, TikTok
- Shareable design links with attribution
- Custom hashtags and branded messaging

**Design Gallery & Community:**
- Public design gallery (opt-in by users)
- "Use This Design" functionality with attribution
- Design categories and trending sections
- User profiles with design portfolios
- Design likes, comments, and social features

**Gamification & Points System:**
- Points awarded for: sharing designs, gallery submissions, design usage by others
- High score leaderboard (weekly/monthly/all-time)
- Achievement badges (first design, viral design, top designer, etc.)
- Point redemption (discounts, free designs, premium features)
- Designer levels and status progression

### Technical Implementation

**Points System:**
- Database schema for user points, achievements, transactions
- Point calculation algorithms and fraud prevention
- Real-time leaderboard updates
- Achievement trigger system

**Social Integration:**
- Social media API integrations
- Open Graph metadata for rich link previews
- Analytics tracking for viral coefficient measurement
- User permission management for sharing preferences

### Rationale

Gamification increases user engagement and retention. Social sharing provides organic marketing and reduces acquisition costs. Community features create network effects and encourage repeat usage.

### Consequences

**Positive:**
- Viral marketing reducing customer acquisition costs
- Increased user engagement and retention
- Community-driven content creation
- Additional revenue through point redemption
- Brand awareness through social sharing

**Negative:**
- Complex social feature development
- Moderation requirements for public gallery
- Potential for gaming the points system
- Privacy and content ownership considerations

## 2025-08-30: AI Usage Cost Controls & Limits

**ID:** DEC-008
**Status:** Accepted
**Category:** Business
**Stakeholders:** Product Owner, Finance, Engineering Lead

### Decision

Implement tiered AI usage limits and cost control mechanisms to prevent excessive AI generation costs while maintaining good user experience.

### Context

AI generation costs can scale unpredictably with user behavior. Without controls, power users could generate excessive costs. Need balance between user freedom and cost management.

### Usage Limit Structure

**Free Tier (Non-registered users):**
- 2 AI generations per session
- Basic design templates only
- Watermarked previews

**Registered Users:**
- 10 AI generations per day (resets at midnight)
- 50 AI generations per month
- Access to premium templates

**Premium Users (Paid plans):**
- 100 AI generations per month
- Priority generation queue
- Advanced AI features and styles

**Per-Purchase Bonus:**
- +5 AI generations per completed purchase
- Encourages conversion and rewards customers

### Technical Implementation

**Rate Limiting:**
- User-based daily/monthly counters
- Redis-based fast lookup for limits
- Graceful degradation when limits reached
- Clear messaging about remaining generations

**Cost Monitoring:**
- Real-time AI cost tracking per user
- Automated alerts for unusual usage patterns
- Usage analytics and reporting
- Emergency circuit breakers for cost protection

**Alternative Options When Limited:**
- Suggest existing designs from gallery
- Promote template-based customization
- Encourage design editing vs. new generation
- Upgrade prompts for premium features

### Rationale

Protects business from runaway AI costs while encouraging registration, purchases, and premium upgrades. Provides predictable cost structure for business planning.

### Consequences

**Positive:**
- Predictable and controlled AI costs
- Revenue opportunities through premium tiers
- Encourages user registration and purchases
- Prevents abuse and excessive usage

**Negative:**
- May frustrate power users
- Complex usage tracking and enforcement
- Potential barrier to initial user engagement
- Customer support complexity around limits

## 2025-08-30: Responsive Design & Internationalization

**ID:** DEC-009
**Status:** Accepted
**Category:** Technical
**Stakeholders:** Product Owner, Frontend Lead, UX Designer

### Decision

Implement progressive responsive design approach with mobile-first development and comprehensive internationalization (i18n) support for multiple languages.

### Context

Custom apparel design requires exceptional mobile experience since many users will create designs on phones. Global market expansion requires multi-language support for broader accessibility and market reach.

### Technical Requirements

**Responsive Design Approach:**
- **Mobile-First Development:** Start with mobile layouts, progressively enhance for larger screens
- **Breakpoint Strategy:** 
  - Mobile: 320px-768px (primary focus)
  - Tablet: 768px-1024px
  - Desktop: 1024px+ (enhanced features)
- **Progressive Enhancement:** Core functionality works on all devices, advanced features on capable devices

**Key Responsive Components:**
- **Design Editor:** Touch-optimized controls, gesture support, simplified mobile interface
- **3D Previews:** Optimized rendering for mobile GPUs, fallback to 2D on low-end devices
- **Navigation:** Collapsible mobile menu, touch-friendly buttons
- **Checkout:** Mobile-optimized payment flow

**Internationalization (i18n):**
- **Initial Languages:** English, Spanish, French, German (expand based on demand)
- **Framework:** Next.js i18n with react-i18next
- **Content Management:** Structured translation keys, professional translation service integration
- **Localization:** Currency formatting, date formats, cultural considerations

### Implementation Details

**Mobile Design Editor Optimizations:**
- Touch gestures for canvas manipulation
- Simplified toolbar with collapsible sections
- Modal-based property panels
- Optimized for thumb navigation

**International Considerations:**
- Right-to-left (RTL) language support capability
- Cultural color and design preferences
- Local payment methods integration
- Localized customer support

**Performance for Mobile:**
- Image optimization and lazy loading
- Reduced JavaScript bundles for mobile
- Service worker for offline functionality
- Progressive Web App (PWA) capabilities

### Rationale

Mobile-first approach captures the growing mobile commerce market. International expansion significantly increases total addressable market and revenue potential.

### Consequences

**Positive:**
- Access to global markets and mobile users
- Better user experience across all devices
- Competitive advantage in international markets
- Higher conversion rates on mobile devices
- SEO benefits from mobile-first indexing

**Negative:**
- Complex responsive design development
- Translation and localization costs
- Cultural adaptation requirements
- Increased testing complexity across languages/devices
- Ongoing maintenance for multiple languages