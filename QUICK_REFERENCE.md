# Quick Reference Guide

## 🚀 Quick Start

```bash
# Setup everything
./setup-advanced-features.sh

# Start all services
./start-all-services.sh

# Test the API
./test-saga.sh
```

## 📍 Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| Main API | http://localhost:3001 | Saga Orchestrator |
| API Docs | http://localhost:3001/api-docs | Swagger UI |
| Metrics | http://localhost:3001/metrics/circuit-breakers | Circuit Breaker Stats |
| Health | http://localhost:3001/health | Health Check |
| Jaeger UI | http://localhost:16686 | Distributed Tracing |
| Inventory | http://localhost:3002 | Inventory Service |
| Payment | http://localhost:3003 | Payment Service |
| Notification | http://localhost:3004 | Notification Service |

## 🔧 Common Commands

### Start Services
```bash
# All services at once
./start-all-services.sh

# Individual services
node src/server.js                                    # Main
node microservices/inventory-service/server.js        # Inventory
node microservices/payment-service/server.js          # Payment
node microservices/notification-service/server.js     # Notification
```

### API Calls

#### Create Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "productId": "prod456",
    "quantity": 2,
    "totalAmount": 99.98,
    "paymentMethod": "credit_card"
  }'
```

#### Get Order
```bash
curl http://localhost:3001/api/orders/ORD-xxxxx
```

#### Get Saga Status
```bash
curl http://localhost:3001/api/orders/saga/SAGA-xxxxx
```

#### Health Check
```bash
curl http://localhost:3001/health
```

#### Circuit Breaker Metrics
```bash
curl http://localhost:3001/metrics/circuit-breakers | jq .
```

### MongoDB Commands
```bash
# Connect to MongoDB
mongosh saga-demo

# View orders
db.orders.find().pretty()

# View saga states
db.sagastates.find().pretty()

# Count completed orders
db.orders.countDocuments({ status: "COMPLETED" })

# Count failed orders
db.orders.countDocuments({ status: "FAILED" })

# Clear all data
db.orders.deleteMany({})
db.sagastates.deleteMany({})
```

### Docker Commands
```bash
# Start Jaeger
docker-compose up -d jaeger

# Start MongoDB
docker-compose up -d mongodb

# Start all infrastructure
docker-compose up -d

# Stop all
docker-compose down

# View logs
docker-compose logs -f jaeger
```

## 🔍 Monitoring

### Watch Circuit Breaker Status
```bash
watch -n 2 'curl -s http://localhost:3001/metrics/circuit-breakers | jq .'
```

### Watch Logs
```bash
# Main service
tail -f combined.log

# Errors only
tail -f error.log

# Follow in real-time
tail -f combined.log | jq .
```

### Monitor All Services
```bash
# Check if all services are running
curl -s http://localhost:3001/health && echo "✅ Main"
curl -s http://localhost:3002/health && echo "✅ Inventory"
curl -s http://localhost:3003/health && echo "✅ Payment"
curl -s http://localhost:3004/health && echo "✅ Notification"
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process
lsof -ti:3001

# Kill process
kill $(lsof -ti:3001)
```

### MongoDB Not Running
```bash
# Check status
pgrep -x mongod

# Start MongoDB
mongod --dbpath /path/to/data

# Or use Docker
docker-compose up -d mongodb
```

### Services Not Communicating
```bash
# Check all health endpoints
for port in 3001 3002 3003 3004; do
  echo "Port $port:"
  curl -s http://localhost:$port/health || echo "❌ Not responding"
done
```

### Clear Logs
```bash
> combined.log
> error.log
```

## 📊 Testing Scenarios

### Test Successful Flow
```bash
# Ensure all services are running
./start-all-services.sh

# Create order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "productId": "prod456",
    "quantity": 2,
    "totalAmount": 99.98
  }'

# Check status (should be COMPLETED)
curl http://localhost:3001/api/orders/ORD-xxxxx
```

### Test Failure & Compensation
```bash
# Stop payment service
# (Find and kill the process on port 3003)

# Create order (will fail at payment step)
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "productId": "prod456",
    "quantity": 2,
    "totalAmount": 99.98
  }'

# Check status (should be FAILED with COMPENSATED saga)
curl http://localhost:3001/api/orders/ORD-xxxxx
curl http://localhost:3001/api/orders/saga/SAGA-xxxxx
```

### Test Retry Logic
```bash
# Stop inventory service temporarily
# Watch logs for retry attempts
tail -f combined.log | grep -i retry

# Create order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","productId":"prod456","quantity":2,"totalAmount":99.98}'

# Restart inventory service within 10 seconds
# Order should succeed after retries
```

### Test Circuit Breaker
```bash
# Stop inventory service
# Make 10 requests quickly
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/orders \
    -H "Content-Type: application/json" \
    -d '{"userId":"test","productId":"prod456","quantity":1,"totalAmount":50}'
  sleep 0.5
done

# Check circuit breaker state (should be OPEN)
curl http://localhost:3001/metrics/circuit-breakers | jq '.inventory.reserve.state'

# Wait 30 seconds for reset
sleep 30

# Restart inventory service
# Circuit should go to HALF_OPEN then CLOSED
```

## 🔐 Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/saga-demo

# Microservices
INVENTORY_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004

# Tracing
ENABLE_TRACING=false
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Circuit Breaker
CIRCUIT_BREAKER_TIMEOUT=5000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=30000

# Retry
RETRY_ATTEMPTS=3
```

## 📚 Documentation Files

- **README.md** - Main documentation
- **ADVANCED_FEATURES.md** - Advanced features guide
- **IMPLEMENTATION_SUMMARY.md** - Implementation details
- **MICROSERVICES_SETUP.md** - Microservices setup
- **GITIGNORE_SUMMARY.md** - Git configuration
- **VALIDATION_REPORT.md** - Validation results
- **QUICK_REFERENCE.md** - This file

## 🎯 Key Metrics to Monitor

1. **Circuit Breaker State** - Should be CLOSED during normal operation
2. **Success Rate** - Should be >95%
3. **Latency** - P95 should be <200ms
4. **Retry Attempts** - Should be minimal
5. **Saga Completion Rate** - Should be >90%

## 💡 Tips

- Use `jq` for pretty JSON output
- Enable tracing only when debugging
- Monitor circuit breaker metrics regularly
- Keep logs clean by rotating them
- Test compensation logic regularly
- Document any custom configurations

---

**Quick Help**: For detailed information, see the full documentation in README.md and ADVANCED_FEATURES.md
