-- TShop Database Initialization Script
-- This script creates the complete database schema for TShop

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS AND AUTHENTICATION
-- ============================================

-- Core user table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- ============================================
-- PRODUCT CATALOG
-- ============================================

-- Base products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('t-shirt', 'cap', 'tote-bag', 'hoodie', 'tank-top')),
    base_price DECIMAL(10,2) NOT NULL,
    printful_product_id VARCHAR(50),
    printify_product_id VARCHAR(50),
    design_constraints JSONB, -- sizing, placement rules
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants (sizes, colors)
CREATE TABLE IF NOT EXISTS product_variants (
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

-- ============================================
-- AI DESIGNS
-- ============================================

-- AI-generated designs
CREATE TABLE IF NOT EXISTS designs (
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

-- ============================================
-- SHOPPING CART AND ORDERS
-- ============================================

-- Shopping cart
CREATE TABLE IF NOT EXISTS cart_items (
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
CREATE TABLE IF NOT EXISTS orders (
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
CREATE TABLE IF NOT EXISTS order_items (
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

-- ============================================
-- GAMIFICATION SYSTEM
-- ============================================

-- Points and transactions
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'earned', 'redeemed'
    action VARCHAR(100) NOT NULL, -- 'design_shared', 'design_used', 'purchase_completed'
    points INTEGER NOT NULL,
    reference_id UUID, -- ID of related entity (design, order, etc.)
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements system
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    points_required INTEGER,
    badge_type VARCHAR(20) DEFAULT 'bronze' CHECK (badge_type IN ('bronze', 'silver', 'gold', 'platinum')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- ============================================
-- SOCIAL FEATURES
-- ============================================

-- Design likes
CREATE TABLE IF NOT EXISTS design_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, design_id)
);

-- Design shares
CREATE TABLE IF NOT EXISTS design_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL, -- 'facebook', 'instagram', 'twitter', etc.
    shared_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ANALYTICS AND LOGGING
-- ============================================

-- AI usage tracking
CREATE TABLE IF NOT EXISTS ai_usage_logs (
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
CREATE TABLE IF NOT EXISTS subscriptions (
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

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);

-- Design indexes
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_public_created ON designs(public, created_at DESC) WHERE public = true;
CREATE INDEX IF NOT EXISTS idx_designs_category ON designs(product_category);
CREATE INDEX IF NOT EXISTS idx_designs_user_public_created ON designs(user_id, public, created_at DESC);

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created ON orders(user_id, status, created_at DESC);

-- Cart indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Points and gamification indexes
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_created ON point_transactions(user_id, created_at);

-- AI usage indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created ON ai_usage_logs(user_id, created_at);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_product_available ON product_variants(product_id, available) WHERE available = true;

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_designs_updated_at ON designs;
CREATE TRIGGER update_designs_updated_at BEFORE UPDATE ON designs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_number TEXT;
    counter INTEGER;
BEGIN
    -- Get today's date in YYYYMMDD format
    order_number := 'TS' || to_char(NOW(), 'YYYYMMDD');
    
    -- Get count of orders today
    SELECT COUNT(*) + 1 INTO counter
    FROM orders 
    WHERE created_at::date = CURRENT_DATE;
    
    -- Append zero-padded counter
    order_number := order_number || LPAD(counter::TEXT, 4, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE 'plpgsql';

-- Function to update design likes count
CREATE OR REPLACE FUNCTION update_design_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE designs 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.design_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE designs 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.design_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger for design likes count
DROP TRIGGER IF EXISTS update_design_likes_count_trigger ON design_likes;
CREATE TRIGGER update_design_likes_count_trigger
    AFTER INSERT OR DELETE ON design_likes
    FOR EACH ROW EXECUTE FUNCTION update_design_likes_count();

-- ============================================
-- SAMPLE DATA (DEVELOPMENT ONLY)
-- ============================================

-- Insert sample achievements
INSERT INTO achievements (name, description, icon, points_required, badge_type) VALUES
('First Design', 'Create your first AI-generated design', '🎨', 0, 'bronze'),
('Design Master', 'Create 10 AI-generated designs', '🏆', 100, 'silver'),
('Social Butterfly', 'Share your first design on social media', '📱', 10, 'bronze'),
('Popular Creator', 'Get 50 likes on your designs', '❤️', 250, 'gold'),
('Shopping Spree', 'Complete your first purchase', '🛍️', 50, 'bronze'),
('VIP Customer', 'Spend over $100 in total', '💎', 500, 'gold'),
('Design Trendsetter', 'Have your design used by 10 other users', '🌟', 1000, 'platinum')
ON CONFLICT DO NOTHING;

-- Insert sample products (development)
INSERT INTO products (name, description, category, base_price, design_constraints, active) VALUES
('Classic T-Shirt', 'Premium cotton t-shirt perfect for custom designs', 't-shirt', 19.99, 
 '{"maxWidth": 2800, "maxHeight": 3200, "dpi": 300, "printArea": {"width": 11, "height": 14}}', true),
('Baseball Cap', 'Adjustable baseball cap with embroidery area', 'cap', 24.99,
 '{"maxWidth": 1800, "maxHeight": 1800, "dpi": 300, "printArea": {"width": 4, "height": 3}}', true),
('Tote Bag', 'Eco-friendly canvas tote bag', 'tote-bag', 16.99,
 '{"maxWidth": 3000, "maxHeight": 3000, "dpi": 300, "printArea": {"width": 12, "height": 12}}', true),
('Pullover Hoodie', 'Comfortable pullover hoodie', 'hoodie', 39.99,
 '{"maxWidth": 2800, "maxHeight": 3200, "dpi": 300, "printArea": {"width": 11, "height": 14}}', true)
ON CONFLICT DO NOTHING;

-- Insert sample product variants
INSERT INTO product_variants (product_id, size, color, color_hex, available) 
SELECT 
    p.id,
    size_variant.size,
    color_variant.color,
    color_variant.hex,
    true
FROM products p
CROSS JOIN (VALUES 
    ('XS'), ('S'), ('M'), ('L'), ('XL'), ('XXL')
) AS size_variant(size)
CROSS JOIN (VALUES
    ('White', '#FFFFFF'),
    ('Black', '#000000'),
    ('Navy', '#001f3f'),
    ('Gray', '#808080'),
    ('Red', '#FF4136')
) AS color_variant(color, hex)
WHERE p.category IN ('t-shirt', 'hoodie')
ON CONFLICT DO NOTHING;

-- Insert cap variants (no sizes)
INSERT INTO product_variants (product_id, color, color_hex, available)
SELECT 
    p.id,
    color_variant.color,
    color_variant.hex,
    true
FROM products p
CROSS JOIN (VALUES
    ('White', '#FFFFFF'),
    ('Black', '#000000'),
    ('Navy', '#001f3f'),
    ('Red', '#FF4136')
) AS color_variant(color, hex)
WHERE p.category = 'cap'
ON CONFLICT DO NOTHING;

-- Insert tote bag variants (one size)
INSERT INTO product_variants (product_id, size, color, color_hex, available)
SELECT 
    p.id,
    'One Size',
    color_variant.color,
    color_variant.hex,
    true
FROM products p
CROSS JOIN (VALUES
    ('Natural', '#F5F5DC'),
    ('Black', '#000000'),
    ('Navy', '#001f3f')
) AS color_variant(color, hex)
WHERE p.category = 'tote-bag'
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tshop_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tshop_user;
-- GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO tshop_user;

COMMIT;