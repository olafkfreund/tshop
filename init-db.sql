-- TShop Database Schema
-- Generated from Prisma schema for PostgreSQL

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Account table (NextAuth)
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- Session table (NextAuth)
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- Verification Token table (NextAuth)
CREATE TABLE IF NOT EXISTS "verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- AI Usage Stats table
CREATE TABLE IF NOT EXISTS "ai_usage_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "daily_count" INTEGER NOT NULL DEFAULT 0,
    "monthly_count" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "last_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_stats_pkey" PRIMARY KEY ("id")
);

-- Products table
CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "base_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- Product Images table
CREATE TABLE IF NOT EXISTS "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "angle" TEXT,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- Product Variants table
CREATE TABLE IF NOT EXISTS "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "color_name" TEXT NOT NULL,
    "color_hex" TEXT NOT NULL,
    "color_slug" TEXT NOT NULL,
    "size_name" TEXT,
    "size_slug" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "printful_id" TEXT,
    "printify_id" TEXT,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- Product Specs table
CREATE TABLE IF NOT EXISTS "product_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "care" TEXT NOT NULL,
    "sizing" TEXT NOT NULL,
    "print_area_front" TEXT NOT NULL,
    "print_area_back" TEXT,

    CONSTRAINT "product_specs_pkey" PRIMARY KEY ("id")
);

-- Designs table
CREATE TABLE IF NOT EXISTS "designs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT,
    "image_url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designs_pkey" PRIMARY KEY ("id")
);

-- Orders table
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "shipping" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "billing_address" TEXT NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- Order Items table
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "design_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "customization" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- Fulfillment Orders table
CREATE TABLE IF NOT EXISTS "fulfillment_orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "external_order_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tracking_number" TEXT,
    "tracking_url" TEXT,
    "estimated_delivery" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fulfillment_orders_pkey" PRIMARY KEY ("id")
);

-- Cart Items table
CREATE TABLE IF NOT EXISTS "cart_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "design_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customization" TEXT,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_session_token_key" ON "sessions"("session_token");
CREATE UNIQUE INDEX IF NOT EXISTS "verificationtokens_identifier_token_key" ON "verificationtokens"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "verificationtokens_token_key" ON "verificationtokens"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "ai_usage_stats_user_id_key" ON "ai_usage_stats"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_sku_key" ON "product_variants"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "product_specs_product_id_key" ON "product_specs"("product_id");

-- Foreign Key Constraints
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_usage_stats" ADD CONSTRAINT "ai_usage_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_specs" ADD CONSTRAINT "product_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "designs" ADD CONSTRAINT "designs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fulfillment_orders" ADD CONSTRAINT "fulfillment_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert sample products
INSERT INTO "products" ("id", "name", "description", "category", "base_price") VALUES
('tshirt-001', 'Classic T-Shirt', 'Comfortable cotton t-shirt perfect for custom designs', 'TSHIRT', 19.99),
('cap-001', 'Baseball Cap', 'Adjustable baseball cap with embroidery-ready front panel', 'CAP', 24.99),
('tote-001', 'Canvas Tote Bag', 'Eco-friendly canvas tote bag ideal for custom prints', 'TOTE_BAG', 16.99);

-- Insert product variants  
INSERT INTO "product_variants" ("id", "product_id", "name", "sku", "price", "color_name", "color_hex", "color_slug") VALUES
('tshirt-white-s', 'tshirt-001', 'White Small', 'TS-WHT-S', 19.99, 'White', '#FFFFFF', 'white'),
('tshirt-white-m', 'tshirt-001', 'White Medium', 'TS-WHT-M', 19.99, 'White', '#FFFFFF', 'white'),
('tshirt-white-l', 'tshirt-001', 'White Large', 'TS-WHT-L', 19.99, 'White', '#FFFFFF', 'white'),
('cap-black-os', 'cap-001', 'Black One Size', 'CP-BLK-OS', 24.99, 'Black', '#000000', 'black'),
('tote-natural-os', 'tote-001', 'Natural One Size', 'TB-NAT-OS', 16.99, 'Natural', '#F5F5DC', 'natural');

-- Insert product images
INSERT INTO "product_images" ("id", "product_id", "url", "alt_text", "is_primary", "angle") VALUES
('img-tshirt-001', 'tshirt-001', '/images/products/tshirt-white-front.jpg', 'White T-Shirt Front View', true, 'front'),
('img-cap-001', 'cap-001', '/images/products/cap-black-front.jpg', 'Black Cap Front View', true, 'front'),
('img-tote-001', 'tote-001', '/images/products/tote-natural-front.jpg', 'Natural Tote Bag Front View', true, 'front');