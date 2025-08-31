# TShop Docker Development Environment
FROM node:22-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    sqlite \
    openssl \
    openssl-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install Node.js dependencies
RUN npm ci

# Install Python dependencies for mock services
RUN pip3 install flask flask-cors pillow requests faker --break-system-packages

# Generate Prisma client
RUN npx prisma generate

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data logs public/uploads public/mockups

# Create SQLite database
RUN touch data/tshop_dev.db

# Expose ports
EXPOSE 3000 8080

# Development stage
FROM base AS development

# Install development tools
RUN npm install -g nodemon

# Start command for development
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Build the application
RUN npm run build

# Start command for production
CMD ["npm", "start"]