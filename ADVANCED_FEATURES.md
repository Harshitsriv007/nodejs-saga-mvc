# Advanced Features Documentation

This document describes the advanced features implemented in the Saga Pattern Orchestrator.

## 🔄 1. Retry Logic with Exponential Backoff

### Overview
Automatic retry mechanism for transient failures using `axios-retry` library.

### Configuration
- **Retries**: 3 attempts
- **Strategy**: Exponential backoff
- **Retry Conditions**: Network errors and 5xx server errors

### Implementation
```javascript
const { createRetryableAxios } = require('./utils/retryConfig');

// Create axios instance with retry
const axios = createRetryableAxios({
  baseURL: 'http://localhost:3002',
  timeout: 5000
});
```

### Retry Behavior
```
Attempt 1: Immediate
Attempt 2: ~1 second delay
Attempt 3: ~2 seconds delay
Attempt 4: ~4 seconds delay
```

### Logs
Retry attempts are logged with details:
```json
{
  "level": "warn",
  "message": "Retry attempt 2 for http://localhost:3002/api/inventory/reserve",
  "error": "ECONNREFUSED",
  "method": "POST",
  "url": "/api/inventory/reserve"
}
```

## 🔌 2. Circuit Breaker Pattern

### Overview
Prevents cascade failures using the `opossum` library. When a service fails repeatedly, the circuit breaker opens and fails fast instead of waiting for timeouts.

### Configuration
- **Timeout**: 5 seconds
- **Error Threshold**: 50% failure rate
- **Reset Timeout**: 30 seconds
- **Rolling Window**: 10 seconds

### Circuit States

#### CLOSED (Normal Operation)
- All requests pass through
- Failures are counted

#### OPEN (Service Down)
- Requests fail immediately
- No calls to the failing service
- Prevents resource exhaustion

#### HALF_OPEN (Testing)
- After reset timeout
- Limited requests allowed
- Tests if service recovered

### Implementation
```javascript
const { createCircuitBreaker } = require('./utils/circuitBreaker');

const breaker = createCircuitBreaker(
  serviceCall,
  { 
    name: 'InventoryService',
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000
  }
);

// Use circuit breaker
const result = await breaker.fire(orderId, data);
```

### Monitoring
Get circuit breaker statistics:
```bash
curl http://localhost:3001/metrics/circuit-breakers
```

Response:
```json
{
  "inventory": {
    "reserve": {
      "name": "InventoryReserve",
      "state": "CLOSED",
      "failures": 0,
      "successes": 10,
      "rejects": 0,
      "timeouts": 0,
      "fallbacks": 0,
      "fires": 10,
      "latencyMean": 45.2,
      "percentiles": {
        "0.0": 20,
        "0.5": 42,
        "0.95": 78,
        "0.99": 95,
        "1.0": 120
      }
    }
  }
}
```

### Events
Circuit breaker emits events for monitoring:
- `open` - Circuit opened (too many failures)
- `halfOpen` - Testing service recovery
- `close` - Circuit closed (service recovered)
- `success` - Successful call
- `failure` - Failed call
- `timeout` - Call timeout
- `reject` - Call rejected (circuit open)
- `fallback` - Fallback executed

## 📊 3. Distributed Tracing with OpenTelemetry

### Overview
End-to-end request tracing across microservices using OpenTelemetry and Jaeger.

### Setup Jaeger (Local Development)

#### Using Docker:
```bash
docker run -d --name jaeger \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14250:14250 \
  -p 14268:14268 \
  -p 14269:14269 \
  -p 9411:9411 \
  jaegertracing/all-in-one:latest
```

#### Access Jaeger UI:
```
http://localhost:16686
```

### Enable Tracing
Set environment variable:
```bash
export ENABLE_TRACING=true
npm start
```

Or in `.env`:
```env
ENABLE_TRACING=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

### What Gets Traced
- HTTP requests/responses
- Database queries (MongoDB)
- Service-to-service calls
- Saga execution steps
- Error traces

### Trace Example
```
Saga Orchestrator
  ├─ POST /api/orders (150ms)
  │   ├─ MongoDB: Insert Order (20ms)
  │   ├─ MongoDB: Insert SagaState (15ms)
  │   └─ Execute Saga (100ms)
  │       ├─ HTTP POST: Inventory Reserve (30ms)
  │       ├─ HTTP POST: Payment Process (40ms)
  │       └─ HTTP POST: Notification Send (25ms)
  └─ MongoDB: Update Order Status (10ms)
```

### Benefits
- **Performance Analysis**: Identify slow operations
- **Error Tracking**: Trace errors across services
- **Dependency Mapping**: Visualize service dependencies
- **Bottleneck Detection**: Find performance bottlenecks

## 📚 4. API Documentation with Swagger/OpenAPI

### Access Documentation
```
http://localhost:3001/api-docs
```

### Features
- **Interactive API Explorer**: Test endpoints directly from browser
- **Request/Response Examples**: See sample data
- **Schema Validation**: View data models
- **Authentication**: Document security requirements
- **Multiple Servers**: Switch between environments

### Swagger UI Features
- Try out API calls
- View request/response schemas
- Download OpenAPI specification
- Generate client SDKs

### Adding Documentation to New Endpoints

```javascript
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       202:
 *         description: Order accepted
 *       400:
 *         description: Invalid request
 */
router.post('/', orderController.createOrder);
```

### Export OpenAPI Spec
```bash
curl http://localhost:3001/api-docs.json > openapi.json
```

## 🔧 Configuration

### Environment Variables

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
ENABLE_TRACING=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Circuit Breaker
CIRCUIT_BREAKER_TIMEOUT=5000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=30000

# Retry
RETRY_ATTEMPTS=3
RETRY_DELAY=exponential
```

## 📈 Monitoring Dashboard

### Metrics Endpoints

#### Circuit Breaker Stats
```bash
GET /metrics/circuit-breakers
```

#### Health Check
```bash
GET /health
```

### Sample Monitoring Script
```bash
#!/bin/bash
while true; do
  echo "=== Circuit Breaker Stats ==="
  curl -s http://localhost:3001/metrics/circuit-breakers | jq .
  echo ""
  sleep 5
done
```

## 🧪 Testing Advanced Features

### Test Retry Logic
```bash
# Stop inventory service to trigger retries
# Watch logs for retry attempts
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "productId": "prod456",
    "quantity": 2,
    "totalAmount": 99.98
  }'
```

### Test Circuit Breaker
```bash
# Make multiple failing requests
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/orders \
    -H "Content-Type: application/json" \
    -d '{"userId":"test","productId":"prod456","quantity":1,"totalAmount":50}'
  sleep 1
done

# Check circuit breaker status
curl http://localhost:3001/metrics/circuit-breakers | jq '.inventory.reserve.state'
```

### Test Distributed Tracing
```bash
# Enable tracing
export ENABLE_TRACING=true

# Start services
npm start

# Make requests
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "productId": "prod456",
    "quantity": 2,
    "totalAmount": 99.98
  }'

# View traces in Jaeger UI
open http://localhost:16686
```

## 🎯 Best Practices

### Retry Logic
- ✅ Use exponential backoff
- ✅ Limit retry attempts (3-5)
- ✅ Only retry idempotent operations
- ✅ Log retry attempts
- ❌ Don't retry on 4xx errors

### Circuit Breaker
- ✅ Set appropriate timeout values
- ✅ Monitor circuit breaker state
- ✅ Implement fallback strategies
- ✅ Use different breakers per operation
- ❌ Don't use same breaker for all services

### Distributed Tracing
- ✅ Trace critical paths
- ✅ Add custom spans for business logic
- ✅ Include relevant metadata
- ✅ Sample traces in production (e.g., 10%)
- ❌ Don't trace everything (performance impact)

### API Documentation
- ✅ Keep documentation up to date
- ✅ Include examples
- ✅ Document error responses
- ✅ Version your API
- ❌ Don't expose internal implementation details

## 🚀 Performance Impact

### Retry Logic
- **Latency**: +0-12 seconds (on failures only)
- **Throughput**: No impact on success
- **Memory**: Minimal

### Circuit Breaker
- **Latency**: +1-2ms per request
- **Throughput**: Improves during failures (fail fast)
- **Memory**: ~1KB per breaker

### Distributed Tracing
- **Latency**: +5-10ms per request
- **Throughput**: -5% (with 100% sampling)
- **Memory**: ~10MB for trace buffer
- **Recommendation**: Use 10% sampling in production

### API Documentation
- **Latency**: No impact (static files)
- **Memory**: ~5MB for Swagger UI
- **Recommendation**: Disable in production or use separate docs server

## 📚 Additional Resources

- [Axios Retry Documentation](https://github.com/softonic/axios-retry)
- [Opossum Circuit Breaker](https://nodeshift.dev/opossum/)
- [OpenTelemetry Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [Jaeger Tracing](https://www.jaegertracing.io/)
- [Swagger/OpenAPI](https://swagger.io/specification/)
