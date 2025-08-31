{
  description = "TShop AI-powered custom apparel platform - local development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Node.js 22 LTS
        nodejs = pkgs.nodejs_22;
        
        # Python for mock services
        python = pkgs.python311;

        # Core development tools
        devTools = with pkgs; [
          # Node.js ecosystem
          nodejs
          nodePackages.npm
          corepack
          
          # Databases
          sqlite
          postgresql_17
          
          # Essential tools
          git
          jq
          curl
          just
          overmind
          
          # Image processing
          imagemagick
          
          # Code quality
          nodePackages.prettier
          nodePackages.eslint
          nodePackages.typescript
        ];

        # Python environment for mock services
        pythonEnv = python.withPackages (ps: with ps; [
          flask
          flask-cors
          pillow
          requests
          faker
        ]);

        # Local setup script
        setup-local-script = pkgs.writeShellScriptBin "setup-local-dev" ''
          set -e
          echo "🏠 Setting up local TShop development environment..."
          
          # Create directories
          mkdir -p {data,logs,public/{uploads,mockups},scripts}
          
          # Create mock services script
          cat > scripts/mock-services.py << 'EOF'
#!/usr/bin/env python3
import json
import random
import time
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/ai/generate-design', methods=['POST'])
def generate_design():
    data = request.json
    prompt = data.get('prompt', 'Default design')
    
    time.sleep(random.uniform(0.5, 2))
    
    return jsonify({
        'success': True,
        'design_url': f'/api/mock-design-image?prompt={prompt}&seed={int(time.time())}',
        'design_id': f'mock_{int(time.time())}',
        'prompt_used': prompt,
        'processing_time': random.uniform(0.5, 2)
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    print("🎭 Mock services running on http://localhost:8080")
    app.run(host='0.0.0.0', port=8080, debug=True)
EOF
          
          chmod +x scripts/mock-services.py
          
          # Create databases
          touch data/tshop_dev.db
          touch data/tshop_test.db
          
          # Create Procfile for local development
          cat > Procfile.local << 'EOF'
web: npm run dev
mock: python scripts/mock-services.py
EOF
          
          echo "✅ Local environment setup complete!"
          echo ""
          echo "Next steps:"
          echo "1. npm install"
          echo "2. npx prisma migrate dev"
          echo "3. overmind start -f Procfile.local"
        '';

      in
      {
        devShells.default = pkgs.mkShell {
          name = "tshop-dev";
          
          buildInputs = devTools ++ [ pythonEnv setup-local-script ];

          shellHook = ''
            echo "🎨 Welcome to TShop Development Environment!"
            echo "=========================================="
            echo ""
            echo "🏠 Quick Start (Local Mode):"
            echo "  setup-local-dev     # Set up everything locally"
            echo "  npm install         # Install Node dependencies" 
            echo "  npx prisma migrate dev  # Setup database"
            echo "  overmind start -f Procfile.local  # Start services"
            echo ""
            echo "📖 For detailed instructions: cat howto-get-started.md"
            echo ""
            echo "🚀 Web App: http://localhost:3000"
            echo "🎭 Mock APIs: http://localhost:8080"
            echo ""

            # Set up environment
            export NODE_ENV=development
            export DATABASE_URL="file:./data/tshop_dev.db"
            export NEXTAUTH_URL="http://localhost:3000"
            export PATH="$PWD/node_modules/.bin:$PATH"
            
            # Create basic directories
            mkdir -p {logs,data,public/uploads}
          '';

          NODE_ENV = "development";
          FORCE_COLOR = "1";
        };

        formatter = pkgs.nixpkgs-fmt;
      });
}