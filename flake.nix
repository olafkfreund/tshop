{
  description = "TShop AI-powered custom apparel platform - comprehensive development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    gitignore = {
      url = "github:hercules-ci/gitignore.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, gitignore, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Node.js 22 LTS as specified in requirements
        nodejs = pkgs.nodejs_22;
        
        # Python for supporting tools and scripts
        python = pkgs.python311;
        
        # Development tools and utilities
        devTools = with pkgs; [
          # Core development environment
          nodejs
          nodePackages.npm
          nodePackages.yarn # Alternative package manager
          corepack # For package manager version management
          
          # Development servers and tools
          redis
          postgresql_17
          
          # SSL certificate generation for HTTPS development
          mkcert
          openssl
          
          # Image processing for design generation
          imagemagick
          vips
          graphicsmagick
          
          # Git and version control
          git
          git-lfs
          gh # GitHub CLI for PR management
          
          # Development utilities
          jq # JSON processing
          yq # YAML processing
          curl
          wget
          tree
          ripgrep
          fd
          bat
          eza
          
          # Process management
          overmind # Process manager for development services
          tmux
          
          # Code quality and formatting
          nodePackages.prettier
          nodePackages.eslint
          
          # Database tools
          postgresql # psql client
          pgcli # Enhanced PostgreSQL CLI
          
          # Docker for containerized services (optional)
          docker
          docker-compose
          
          # Performance monitoring
          htop
          iotop
          nethogs
          
          # Development certificates
          libressl
          
          # Shell utilities
          zsh
          fish
          starship # Cross-shell prompt
          
          # File watching (for hot reload optimization)
          fswatch
          watchman
          
          # Network tools for API testing
          httpie
          postman
          
          # Archive tools for asset processing
          unzip
          zip
          
          # Text processing
          gnused
          gnugrep
          
          # Development environment setup
          direnv
          
          # TypeScript and JavaScript tooling
          nodePackages.typescript
          nodePackages.tsx # Fast TypeScript runner
          nodePackages.ts-node
          
          # Build tools
          pkg-config
          
          # System utilities
          procps
          psmisc
          
          # 3D model processing tools (for Three.js assets)
          blender # For 3D model optimization (headless mode)
          
          # AI/ML development support
          python311Packages.pip
          python311Packages.pillow
          python311Packages.numpy
        ];

        # Python packages for supporting AI workflows
        pythonEnv = python.withPackages (ps: with ps; [
          pillow      # Image processing
          numpy       # Numerical computing
          requests    # HTTP requests for API testing
          python-dotenv # Environment variable management
        ]);

        # Custom development scripts
        devScripts = {
          # Database management
          db-setup = pkgs.writeShellScriptBin "db-setup" ''
            set -e
            echo "🗄️ Setting up TShop development database..."
            
            # Check if PostgreSQL is running
            if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
              echo "❌ PostgreSQL is not running. Start it with: overmind start"
              exit 1
            fi
            
            # Create database if it doesn't exist
            createdb tshop_dev 2>/dev/null || echo "📋 Database tshop_dev already exists"
            
            # Create test database
            createdb tshop_test 2>/dev/null || echo "📋 Database tshop_test already exists"
            
            # Run Prisma migrations
            if [ -f "prisma/schema.prisma" ]; then
              echo "🔧 Running Prisma migrations..."
              npx prisma migrate dev --name init
              echo "🌱 Seeding database..."
              npx prisma db seed 2>/dev/null || echo "⚠️ No seed script found"
            else
              echo "⚠️ No Prisma schema found. Run project initialization first."
            fi
            
            echo "✅ Database setup complete!"
          '';

          # SSL certificate setup for HTTPS development
          ssl-setup = pkgs.writeShellScriptBin "ssl-setup" ''
            set -e
            echo "🔒 Setting up local SSL certificates..."
            
            CERT_DIR="./certs"
            mkdir -p "$CERT_DIR"
            
            if [ ! -f "$CERT_DIR/localhost.pem" ]; then
              echo "📜 Generating SSL certificate for localhost..."
              mkcert -install
              mkcert -cert-file "$CERT_DIR/localhost.pem" -key-file "$CERT_DIR/localhost-key.pem" \
                localhost 127.0.0.1 ::1 *.localhost
              echo "✅ SSL certificates generated in $CERT_DIR/"
              echo "🔗 Add to your .env.local:"
              echo "HTTPS=true"
              echo "SSL_CRT=./certs/localhost.pem"
              echo "SSL_KEY=./certs/localhost-key.pem"
            else
              echo "✅ SSL certificates already exist"
            fi
          '';

          # Development server orchestration
          dev-start = pkgs.writeShellScriptBin "dev-start" ''
            set -e
            echo "🚀 Starting TShop development environment..."
            
            # Check for required files
            if [ ! -f ".env.local" ]; then
              if [ -f ".env.example" ]; then
                echo "📝 Creating .env.local from .env.example..."
                cp .env.example .env.local
                echo "⚠️ Please configure your environment variables in .env.local"
              else
                echo "❌ No .env.local or .env.example found"
                exit 1
              fi
            fi
            
            # Start services with Overmind
            if [ -f "Procfile" ]; then
              echo "🔧 Starting services with Overmind..."
              overmind start
            else
              echo "❌ No Procfile found. Creating one..."
              cat > Procfile << EOF
          web: npm run dev
          db: postgres -D ./postgres-data
          redis: redis-server
          EOF
              echo "📁 Created Procfile. Run 'dev-start' again."
            fi
          '';

          # Environment setup
          env-setup = pkgs.writeShellScriptBin "env-setup" ''
            set -e
            echo "⚙️ Setting up TShop development environment..."
            
            # Create .env.local from template if it doesn't exist
            if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
              cp .env.example .env.local
              echo "📝 Created .env.local from .env.example"
            fi
            
            # Create necessary directories
            mkdir -p {logs,certs,postgres-data,redis-data,uploads,public/uploads}
            echo "📁 Created necessary directories"
            
            # Set up git hooks if .git exists
            if [ -d ".git" ]; then
              echo "🔧 Setting up git hooks..."
              if command -v pre-commit >/dev/null 2>&1; then
                pre-commit install --install-hooks
              fi
            fi
            
            echo "✅ Environment setup complete!"
            echo ""
            echo "📋 Next steps:"
            echo "1. Configure .env.local with your API keys"
            echo "2. Run 'ssl-setup' for HTTPS development"
            echo "3. Run 'db-setup' to initialize database"
            echo "4. Run 'npm install' to install dependencies"
            echo "5. Run 'dev-start' to start development server"
          '';

          # Project initialization
          init-project = pkgs.writeShellScriptBin "init-project" ''
            set -e
            echo "🎨 Initializing TShop project structure..."
            
            # Create package.json if it doesn't exist
            if [ ! -f "package.json" ]; then
              echo "📦 Creating package.json..."
              npm init -y
              
              # Update package.json with TShop configuration
              cat > package.json << 'EOF'
          {
            "name": "tshop",
            "version": "0.1.0",
            "private": true,
            "description": "AI-powered custom apparel platform",
            "engines": {
              "node": "22.x",
              "npm": "10.x"
            },
            "scripts": {
              "dev": "next dev --turbo",
              "build": "next build",
              "start": "next start",
              "lint": "next lint --fix",
              "lint:check": "next lint",
              "type-check": "tsc --noEmit",
              "test": "jest --watch",
              "test:ci": "jest --coverage --watchAll=false",
              "test:e2e": "playwright test",
              "test:e2e:ui": "playwright test --ui",
              "db:generate": "prisma generate",
              "db:push": "prisma db push",
              "db:migrate": "prisma migrate dev",
              "db:studio": "prisma studio",
              "postinstall": "prisma generate"
            },
            "dependencies": {
              "next": "^15.0.0",
              "react": "^19.0.0",
              "react-dom": "^19.0.0",
              "typescript": "^5.6.0",
              "@types/react": "^19.0.0",
              "@types/react-dom": "^19.0.0",
              "tailwindcss": "^4.0.0",
              "prisma": "^5.17.0",
              "@prisma/client": "^5.17.0",
              "next-auth": "5.0.0-beta.20"
            }
          }
          EOF
            fi
            
            # Create basic project structure
            mkdir -p {src/{app,components,lib,hooks,store,types,styles},public,tests,docs}
            
            # Create .env.example
            if [ ! -f ".env.example" ]; then
              cat > .env.example << 'EOF'
          # Database
          DATABASE_URL="postgresql://postgres:password@localhost:5432/tshop_dev"
          
          # NextAuth.js
          NEXTAUTH_URL="http://localhost:3000"
          NEXTAUTH_SECRET="your-secret-key-here"
          
          # Google AI (Gemini)
          GEMINI_API_KEY="your-gemini-api-key"
          
          # Stripe
          STRIPE_PUBLISHABLE_KEY="pk_test_..."
          STRIPE_SECRET_KEY="sk_test_..."
          STRIPE_WEBHOOK_SECRET="whsec_..."
          
          # Redis
          REDIS_URL="redis://localhost:6379"
          
          # File Storage
          CLOUDINARY_CLOUD_NAME="your-cloud-name"
          CLOUDINARY_API_KEY="your-api-key"
          CLOUDINARY_API_SECRET="your-api-secret"
          
          # Printful/Printify
          PRINTFUL_API_KEY="your-printful-key"
          PRINTIFY_API_KEY="your-printify-key"
          
          # Development
          HTTPS="true"
          SSL_CRT="./certs/localhost.pem"
          SSL_KEY="./certs/localhost-key.pem"
          EOF
            fi
            
            echo "✅ Project structure initialized!"
            echo "📋 Run 'env-setup' to complete environment configuration"
          '';

          # Database migration helper
          db-migrate = pkgs.writeShellScriptBin "db-migrate" ''
            set -e
            echo "🔄 Running database migrations..."
            
            if [ ! -f "prisma/schema.prisma" ]; then
              echo "❌ No Prisma schema found"
              exit 1
            fi
            
            npx prisma migrate dev
            npx prisma generate
            
            echo "✅ Migrations complete!"
          '';

          # Development environment health check
          health-check = pkgs.writeShellScriptBin "health-check" ''
            set -e
            echo "🏥 TShop Development Environment Health Check"
            echo "============================================="
            
            # Check Node.js version
            node_version=$(node --version)
            echo "📦 Node.js: $node_version"
            
            # Check npm version
            npm_version=$(npm --version)
            echo "📦 npm: $npm_version"
            
            # Check PostgreSQL
            if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
              echo "✅ PostgreSQL: Running"
            else
              echo "❌ PostgreSQL: Not running"
            fi
            
            # Check Redis
            if redis-cli ping >/dev/null 2>&1; then
              echo "✅ Redis: Running"
            else
              echo "❌ Redis: Not running"
            fi
            
            # Check SSL certificates
            if [ -f "./certs/localhost.pem" ]; then
              echo "✅ SSL certificates: Present"
            else
              echo "⚠️ SSL certificates: Missing (run ssl-setup)"
            fi
            
            # Check environment file
            if [ -f ".env.local" ]; then
              echo "✅ Environment: .env.local exists"
            else
              echo "❌ Environment: .env.local missing"
            fi
            
            # Check git hooks
            if [ -f ".git/hooks/pre-commit" ]; then
              echo "✅ Git hooks: Installed"
            else
              echo "⚠️ Git hooks: Not installed"
            fi
            
            echo "============================================="
            echo "🔍 For detailed logs, check the logs/ directory"
          '';

          # Clean development environment
          dev-clean = pkgs.writeShellScriptBin "dev-clean" ''
            set -e
            echo "🧹 Cleaning TShop development environment..."
            
            # Stop all processes
            overmind stop 2>/dev/null || true
            
            # Clean Node.js
            rm -rf node_modules/.cache
            rm -rf .next
            
            # Clean databases (with confirmation)
            read -p "❓ Reset databases? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
              dropdb tshop_dev 2>/dev/null || true
              dropdb tshop_test 2>/dev/null || true
              echo "🗑️ Databases dropped"
            fi
            
            # Clean logs
            rm -rf logs/*
            
            echo "✅ Environment cleaned!"
          '';
        };

        # Pre-commit configuration
        pre-commit-config = pkgs.writeTextFile {
          name = "pre-commit-config.yaml";
          text = ''
            repos:
              - repo: https://github.com/pre-commit/pre-commit-hooks
                rev: v4.4.0
                hooks:
                  - id: trailing-whitespace
                  - id: end-of-file-fixer
                  - id: check-yaml
                  - id: check-json
                  - id: check-toml
                  - id: check-merge-conflict
                  - id: check-added-large-files
                    args: ['--maxkb=1000']
                  
              - repo: local
                hooks:
                  - id: eslint
                    name: ESLint
                    entry: npm run lint:check
                    language: system
                    files: \.(ts|tsx|js|jsx)$
                    
                  - id: type-check
                    name: TypeScript Type Check
                    entry: npm run type-check
                    language: system
                    files: \.(ts|tsx)$
                    pass_filenames: false
          '';
        };

        # Procfile for Overmind process management
        procfile = pkgs.writeTextFile {
          name = "Procfile";
          text = ''
            # TShop Development Services
            web: npm run dev
            db: postgres -D ./postgres-data -k /tmp -p 5432
            redis: redis-server --port 6379 --dir ./redis-data
          '';
        };

        # Development configuration files
        devConfigs = {
          # TypeScript configuration
          tsconfig = pkgs.writeTextFile {
            name = "tsconfig.json";
            text = builtins.toJSON {
              compilerOptions = {
                target = "ES2022";
                lib = ["dom" "dom.iterable" "ES2022"];
                allowJs = true;
                skipLibCheck = true;
                strict = true;
                noEmit = true;
                esModuleInterop = true;
                module = "esnext";
                moduleResolution = "bundler";
                resolveJsonModule = true;
                isolatedModules = true;
                jsx = "preserve";
                incremental = true;
                plugins = [{ name = "next"; }];
                baseUrl = ".";
                paths = {
                  "@/*" = ["./src/*"];
                };
              };
              include = ["next-env.d.ts" "**/*.ts" "**/*.tsx" ".next/types/**/*.ts"];
              exclude = ["node_modules"];
            };
          };

          # Next.js configuration
          nextConfig = pkgs.writeTextFile {
            name = "next.config.js";
            text = ''
              /** @type {import('next').NextConfig} */
              const nextConfig = {
                experimental: {
                  turbo: {
                    rules: {
                      '*.svg': {
                        loaders: ['@svgr/webpack'],
                        as: '*.js',
                      },
                    },
                  },
                },
                // Performance optimizations
                images: {
                  domains: ['res.cloudinary.com', 'printful.com', 'printify.com'],
                  formats: ['image/avif', 'image/webp'],
                  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
                  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
                },
                // Security headers
                async headers() {
                  return [
                    {
                      source: '/(.*)',
                      headers: [
                        {
                          key: 'X-Content-Type-Options',
                          value: 'nosniff',
                        },
                        {
                          key: 'X-Frame-Options',
                          value: 'DENY',
                        },
                        {
                          key: 'X-XSS-Protection',
                          value: '1; mode=block',
                        },
                      ],
                    },
                  ];
                },
              };

              module.exports = nextConfig;
            '';
          };

          # TailwindCSS configuration
          tailwindConfig = pkgs.writeTextFile {
            name = "tailwind.config.ts";
            text = ''
              import type { Config } from 'tailwindcss'

              const config: Config = {
                content: [
                  './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
                  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
                  './src/app/**/*.{js,ts,jsx,tsx,mdx}',
                ],
                theme: {
                  extend: {
                    // Custom breakpoints for mobile-first design
                    screens: {
                      'xs': '400px',
                      'sm': '640px',
                      'md': '768px',
                      'lg': '1024px',
                      'xl': '1280px',
                      '2xl': '1536px',
                      '3xl': '1920px',
                    },
                    // Design system colors
                    colors: {
                      primary: {
                        50: '#eff6ff',
                        100: '#dbeafe',
                        500: '#3b82f6',
                        600: '#2563eb',
                        700: '#1d4ed8',
                        900: '#1e3a8a',
                      },
                      secondary: {
                        50: '#f8fafc',
                        100: '#f1f5f9',
                        500: '#64748b',
                        600: '#475569',
                        700: '#334155',
                        900: '#0f172a',
                      },
                    },
                    // Typography
                    fontFamily: {
                      sans: ['Inter', 'system-ui', 'sans-serif'],
                      mono: ['JetBrains Mono', 'monospace'],
                    },
                  },
                },
                plugins: [],
                darkMode: 'class',
              }

              export default config
            '';
          };
        };

      in
      {
        devShells.default = pkgs.mkShell {
          name = "tshop-dev";
          
          buildInputs = devTools ++ [ pythonEnv ] ++ (builtins.attrValues devScripts);

          shellHook = ''
            echo "🎨 Welcome to TShop Development Environment!"
            echo "=========================================="
            echo ""
            echo "📋 Available Commands:"
            echo "  init-project  - Initialize project structure"
            echo "  env-setup     - Set up development environment"
            echo "  ssl-setup     - Generate SSL certificates"
            echo "  db-setup      - Initialize database"
            echo "  db-migrate    - Run database migrations"
            echo "  dev-start     - Start development server"
            echo "  health-check  - Check environment health"
            echo "  dev-clean     - Clean development environment"
            echo ""
            echo "🔧 Tech Stack:"
            echo "  Node.js ${nodejs.version}"
            echo "  PostgreSQL ${pkgs.postgresql_17.version}"
            echo "  Redis ${pkgs.redis.version}"
            echo ""
            echo "📖 Documentation:"
            echo "  For setup instructions, run: cat README.md"
            echo "  For API docs, visit: http://localhost:3000/api-docs"
            echo ""
            echo "🚀 Quick Start:"
            echo "  1. Run 'init-project' to set up project structure"
            echo "  2. Run 'env-setup' to configure environment"
            echo "  3. Run 'npm install' to install dependencies"  
            echo "  4. Run 'dev-start' to begin development"
            echo ""

            # Set up environment variables
            export NODE_ENV=development
            export DATABASE_URL="postgresql://postgres:password@localhost:5432/tshop_dev"
            export REDIS_URL="redis://localhost:6379"
            export NEXTAUTH_URL="http://localhost:3000"
            
            # Add node_modules/.bin to PATH for direct npm script access
            export PATH="$PWD/node_modules/.bin:$PATH"
            
            # Enable turbo mode for Next.js
            export TURBO=1
            
            # Set PostgreSQL data directory
            export PGDATA="$PWD/postgres-data"
            
            # Create necessary directories
            mkdir -p {logs,certs,postgres-data,redis-data,uploads,public/uploads}
            
            # Copy configuration files if they don't exist
            [ ! -f "Procfile" ] && cp ${procfile} Procfile
            [ ! -f ".pre-commit-config.yaml" ] && cp ${pre-commit-config} .pre-commit-config.yaml
            
            # Initialize git repository if it doesn't exist
            if [ ! -d ".git" ]; then
              echo "📝 Initializing git repository..."
              git init
              echo "✅ Git repository initialized"
            fi

            echo "✅ Development shell ready!"
          '';

          # Environment variables for development
          NODEJS_VERSION = nodejs.version;
          NPM_CONFIG_PREFIX = "$HOME/.npm-global";
          PLAYWRIGHT_BROWSERS_PATH = "$HOME/.cache/ms-playwright";
          
          # SSL/HTTPS development support
          HTTPS = "true";
          SSL_CRT = "./certs/localhost.pem";
          SSL_KEY = "./certs/localhost-key.pem";

          # Performance optimizations
          NODE_OPTIONS = "--max-old-space-size=4096";
          NEXT_TELEMETRY_DISABLED = "1";
          
          # Development convenience
          BROWSER = "none"; # Prevent auto-opening browser
          FORCE_COLOR = "1"; # Force colored output
        };

        # Additional development tools and utilities
        packages = {
          inherit (pkgs) 
            nodejs_22
            postgresql_17
            redis
            docker
            docker-compose
            ;
        };

        # Formatter for nix files
        formatter = pkgs.nixpkgs-fmt;

        # Development apps
        apps = {
          init = {
            type = "app";
            program = "${devScripts.init-project}/bin/init-project";
          };
          
          setup = {
            type = "app"; 
            program = "${devScripts.env-setup}/bin/env-setup";
          };
          
          start = {
            type = "app";
            program = "${devScripts.dev-start}/bin/dev-start";
          };

          health = {
            type = "app";
            program = "${devScripts.health-check}/bin/health-check";
          };
        };
      });

  # NixOS module for production deployment (optional)
  nixosModules.tshop = { config, lib, pkgs, ... }:
    with lib;
    let
      cfg = config.services.tshop;
    in {
      options.services.tshop = {
        enable = mkEnableOption "TShop AI-powered apparel platform";
        
        package = mkPackageOption pkgs "tshop" {
          default = null;
        };
        
        domain = mkOption {
          type = types.str;
          description = "Domain name for TShop";
          example = "tshop.example.com";
        };
        
        port = mkOption {
          type = types.port;
          default = 3000;
          description = "Port to run TShop on";
        };

        environmentFile = mkOption {
          type = types.nullOr types.path;
          default = null;
          description = "Environment file containing secrets";
        };
        
        database = {
          createLocally = mkEnableOption "Create PostgreSQL database locally";
          
          name = mkOption {
            type = types.str;
            default = "tshop";
            description = "Database name";
          };
          
          user = mkOption {
            type = types.str;
            default = "tshop";
            description = "Database user";
          };
        };
        
        redis = {
          createLocally = mkEnableOption "Create Redis instance locally";
          
          port = mkOption {
            type = types.port;
            default = 6379;
            description = "Redis port";
          };
        };
      };

      config = mkIf cfg.enable {
        # PostgreSQL setup
        services.postgresql = mkIf cfg.database.createLocally {
          enable = true;
          ensureDatabases = [ cfg.database.name ];
          ensureUsers = [{
            name = cfg.database.user;
            ensureDBOwnership = true;
          }];
        };

        # Redis setup  
        services.redis.servers.tshop = mkIf cfg.redis.createLocally {
          enable = true;
          port = cfg.redis.port;
        };

        # Reverse proxy with SSL
        services.nginx = {
          enable = true;
          virtualHosts.${cfg.domain} = {
            enableACME = true;
            forceSSL = true;
            locations."/" = {
              proxyPass = "http://127.0.0.1:${toString cfg.port}";
              proxyWebsockets = true;
            };
          };
        };

        # TShop systemd service
        systemd.services.tshop = {
          description = "TShop AI-powered apparel platform";
          wantedBy = [ "multi-user.target" ];
          after = [ "network.target" ]
            ++ optional cfg.database.createLocally "postgresql.service"
            ++ optional cfg.redis.createLocally "redis-tshop.service";
          
          environment = {
            NODE_ENV = "production";
            PORT = toString cfg.port;
          };
          
          serviceConfig = {
            Type = "simple";
            User = "tshop";
            Group = "tshop";
            EnvironmentFile = mkIf (cfg.environmentFile != null) cfg.environmentFile;
            ExecStart = "${cfg.package}/bin/tshop start";
            Restart = "always";
            RestartSec = "10";
            
            # Security hardening
            NoNewPrivileges = true;
            ProtectSystem = "strict";
            ProtectHome = true;
            PrivateTmp = true;
            PrivateDevices = true;
            ProtectKernelTunables = true;
            ProtectControlGroups = true;
            RestrictSUIDSGID = true;
            
            # Resource limits
            MemoryMax = "2G";
            TasksMax = 1000;
          };
        };

        # User for TShop service
        users.users.tshop = {
          isSystemUser = true;
          group = "tshop";
          home = "/var/lib/tshop";
          createHome = true;
        };
        
        users.groups.tshop = {};

        # Firewall
        networking.firewall.allowedTCPPorts = [ 80 443 ];
        
        # ACME certificates
        security.acme.acceptTerms = true;
        security.acme.defaults.email = "admin@${cfg.domain}";
        
        meta.maintainers = with maintainers; [ "tshop-team" ];
      };
    };
}