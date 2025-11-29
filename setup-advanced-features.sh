#!/bin/bash

echo "🚀 Setting up Advanced Features for Saga Pattern Orchestrator"
echo "=============================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not installed. Jaeger tracing will not be available.${NC}"
    echo "   Install Docker from: https://docs.docker.com/get-docker/"
    DOCKER_AVAILABLE=false
else
    DOCKER_AVAILABLE=true
fi

echo "📦 Step 1: Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Install microservices dependencies
echo "📦 Step 2: Installing microservices dependencies..."
cd microservices/inventory-service && npm install && cd ../..
cd microservices/payment-service && npm install && cd ../..
cd microservices/notification-service && npm install && cd ../..
echo -e "${GREEN}✅ Microservices dependencies installed${NC}"
echo ""

# Setup Jaeger if Docker is available
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "🐳 Step 3: Setting up Jaeger for distributed tracing..."
    
    # Check if Jaeger is already running
    if docker ps | grep -q jaeger; then
        echo -e "${YELLOW}⚠️  Jaeger is already running${NC}"
    else
        echo "   Starting Jaeger container..."
        docker-compose up -d jaeger
        
        # Wait for Jaeger to be ready
        echo "   Waiting for Jaeger to be ready..."
        sleep 5
        
        if docker ps | grep -q jaeger; then
            echo -e "${GREEN}✅ Jaeger started successfully${NC}"
            echo "   Jaeger UI: http://localhost:16686"
        else
            echo -e "${RED}❌ Failed to start Jaeger${NC}"
        fi
    fi
else
    echo "⏭️  Step 3: Skipping Jaeger setup (Docker not available)"
fi
echo ""

# Create .env file if it doesn't exist
echo "⚙️  Step 4: Configuring environment variables..."
if [ ! -f .env ]; then
    cat > .env << EOF
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/saga-demo

# Microservices URLs
INVENTORY_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004

# Distributed Tracing
ENABLE_TRACING=false
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Circuit Breaker Configuration
CIRCUIT_BREAKER_TIMEOUT=5000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=30000

# Retry Configuration
RETRY_ATTEMPTS=3
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists (not modified)${NC}"
fi
echo ""

# Check MongoDB
echo "🗄️  Step 5: Checking MongoDB..."
if pgrep -x mongod > /dev/null; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB is not running${NC}"
    echo "   Start MongoDB with: mongod --dbpath /path/to/data"
    echo "   Or use Docker: docker-compose up -d mongodb"
fi
echo ""

echo "=============================================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📚 Advanced Features Enabled:"
echo "   1. ✅ Retry Logic with Exponential Backoff"
echo "   2. ✅ Circuit Breaker Pattern"
echo "   3. ✅ API Documentation (Swagger/OpenAPI)"
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "   4. ✅ Distributed Tracing (Jaeger)"
else
    echo "   4. ⏭️  Distributed Tracing (requires Docker)"
fi
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Start all services:"
echo "   ./start-all-services.sh"
echo ""
echo "2. View API Documentation:"
echo "   http://localhost:3001/api-docs"
echo ""
echo "3. Monitor Circuit Breakers:"
echo "   curl http://localhost:3001/metrics/circuit-breakers"
echo ""
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "4. Enable Distributed Tracing:"
    echo "   Set ENABLE_TRACING=true in .env"
    echo "   View traces: http://localhost:16686"
    echo ""
fi
echo "5. Read documentation:"
echo "   cat ADVANCED_FEATURES.md"
echo ""
echo "=============================================================="
