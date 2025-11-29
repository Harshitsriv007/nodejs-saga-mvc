# Event Sourcing & Testing Guide

## 📚 Event Sourcing Implementation

Event Sourcing is a pattern where all changes to application state are stored as a sequence of events. Instead of storing just the current state, we store all the events that led to that state.

### Benefits

1. **Complete Audit Trail** - Every change is recorded
2. **Time Travel** - Rebuild state at any point in time
3. **Event Replay** - Replay events to rebuild state
4. **Debugging** - Understand exactly what happened
5. **Analytics** - Analyze historical data
6. **Compliance** - Meet regulatory requirements

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (Controllers, Services, Saga Orchestrator)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Event Store                           │
│  • Store Events                                          │
│  • Retrieve Events                                       │
│  • Rebuild State                                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  MongoDB (Events Collection)             │
│  • eventId                                               │
│  • eventType                                             │
│  • aggregateId                                           │
│  • aggregateType                                         │
│  • payload                                               │
│  • metadata                                              │
└─────────────────────────────────────────────────────────┘
```

### Event Types

#### Order Events
- `ORDER_CREATED` - Order was created
- `ORDER_UPDATED` - Order was updated
- `ORDER_COMPLETED` - Order completed successfully
- `ORDER_FAILED` - Order failed

#### Saga Events
- `SAGA_STARTED` - Saga execution started
- `SAGA_STEP_STARTED` - Saga step started
- `SAGA_STEP_COMPLETED` - Saga step completed
- `SAGA_STEP_FAILED` - Saga step failed
- `SAGA_COMPLETED` - Saga completed successfully
- `SAGA_COMPENSATING` - Saga compensation started
- `SAGA_COMPENSATED` - Saga compensation completed

#### Service Events
- `INVENTORY_RESERVED` - Inventory reserved
- `INVENTORY_RELEASED` - Inventory released
- `PAYMENT_PROCESSED` - Payment processed
- `PAYMENT_REFUNDED` - Payment refunded
- `NOTIFICATION_SENT` - Notification sent

### API Endpoints

#### Get Events for Aggregate
```bash
GET /api/events/aggregate/{aggregateId}
```

Example:
```bash
curl http://localhost:3001/api/events/aggregate/ORD-1764450450581
```

Response:
```json
{
  "aggregateId": "ORD-1764450450581",
  "eventCount": 5,
  "events": [
    {
      "eventId": "evt-123",
      "eventType": "ORDER_CREATED",
      "aggregateId": "ORD-1764450450581",
      "aggregateType": "ORDER",
      "payload": {
        "userId": "user123",
        "productId": "prod456",
        "quantity": 2,
        "totalAmount": 99.98
      },
      "metadata": {
        "userId": "user123",
        "timestamp": "2025-11-29T21:10:53.722Z"
      }
    }
  ]
}
```

#### Get Audit Trail
```bash
GET /api/events/audit/{aggregateId}
```

Example:
```bash
curl http://localhost:3001/api/events/audit/ORD-1764450450581
```

Response:
```json
{
  "aggregateId": "ORD-1764450450581",
  "auditTrail": [
    {
      "timestamp": "2025-11-29T21:10:53.722Z",
      "eventType": "ORDER_CREATED",
      "userId": "user123",
      "changes": {
        "userId": "user123",
        "productId": "prod456",
        "quantity": 2,
        "totalAmount": 99.98
      }
    },
    {
      "timestamp": "2025-11-29T21:10:53.816Z",
      "eventType": "ORDER_COMPLETED",
      "userId": "user123",
      "changes": {
        "status": "COMPLETED"
      }
    }
  ]
}
```

#### Get Events by Type
```bash
GET /api/events/type/{eventType}?limit=100
```

Example:
```bash
curl http://localhost:3001/api/events/type/ORDER_CREATED?limit=10
```

#### Get Event Statistics
```bash
GET /api/events/statistics
```

Response:
```json
{
  "totalEvents": 150,
  "eventTypes": [
    {
      "_id": "ORDER_CREATED",
      "count": 30,
      "lastOccurrence": "2025-11-29T21:10:53.722Z"
    },
    {
      "_id": "SAGA_STARTED",
      "count": 30,
      "lastOccurrence": "2025-11-29T21:10:53.725Z"
    }
  ]
}
```

#### Rebuild Aggregate State
```bash
GET /api/events/rebuild/{aggregateId}
```

Example:
```bash
curl http://localhost:3001/api/events/rebuild/ORD-1764450450581
```

Response:
```json
{
  "aggregateId": "ORD-1764450450581",
  "rebuiltState": {
    "orderId": "ORD-1764450450581",
    "userId": "user123",
    "productId": "prod456",
    "quantity": 2,
    "totalAmount": 99.98,
    "status": "COMPLETED",
    "sagaId": "saga-123",
    "createdAt": "2025-11-29T21:10:53.722Z",
    "completedAt": "2025-11-29T21:10:53.816Z"
  }
}
```

### Usage in Code

#### Storing Events
```javascript
const eventStore = require('./services/eventStore');

// Store an event
await eventStore.storeEvent({
  eventType: 'ORDER_CREATED',
  aggregateId: orderId,
  aggregateType: 'ORDER',
  payload: orderData,
  userId: orderData.userId,
  correlationId: sagaId
});
```

#### Retrieving Events
```javascript
// Get all events for an order
const events = await eventStore.getEventsByAggregateId(orderId);

// Get events by type
const orderCreatedEvents = await eventStore.getEventsByType('ORDER_CREATED', {
  limit: 100,
  startDate: new Date('2025-11-01'),
  endDate: new Date('2025-11-30')
});
```

#### Rebuilding State
```javascript
// Rebuild order state from events
const state = await eventStore.rebuildAggregateState(orderId);
console.log(state); // Current state rebuilt from all events
```

## 🔒 Rate Limiting

Rate limiting protects your API from abuse and ensures fair usage.

### Configuration

#### Global Rate Limit
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Applied to**: All API endpoints

#### Create Order Rate Limit
- **Window**: 1 minute
- **Max Requests**: 5 per IP
- **Applied to**: POST /api/orders

#### Read-Only Rate Limit
- **Window**: 15 minutes
- **Max Requests**: 300 per IP
- **Applied to**: Event sourcing endpoints

### Rate Limit Headers

Every response includes rate limit information:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1638360000
```

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": "900"
}
```

HTTP Status: `429 Too Many Requests`

### Testing Rate Limits

```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/orders \
    -H "Content-Type: application/json" \
    -d '{"userId":"test","productId":"prod456","quantity":1,"totalAmount":50}'
  echo ""
done
```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/
│   ├── eventStore.test.js
│   ├── rateLimiter.test.js
│   └── circuitBreaker.test.js
└── integration/
    └── saga.integration.test.js
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/eventStore.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Unit Tests

Unit tests test individual components in isolation:

```javascript
describe('EventStore Service', () => {
  it('should store an event successfully', async () => {
    const mockEvent = {
      eventType: 'ORDER_CREATED',
      aggregateId: 'ORD-123',
      aggregateType: 'ORDER',
      payload: { userId: 'user123' }
    };

    const result = await eventStore.storeEvent(mockEvent);
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

Integration tests test the entire system:

```javascript
describe('Saga Integration Tests', () => {
  it('should create an order and start saga', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(orderData)
      .expect(202);

    expect(response.body).toHaveProperty('sagaId');
  });
});
```

### Test Coverage

Aim for:
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Happy path + error scenarios

### Mocking

Use Jest mocks for external dependencies:

```javascript
jest.mock('../../src/models/Event');
jest.mock('../../src/utils/logger');
```

## 📊 Monitoring Event Sourcing

### Event Statistics Dashboard

```bash
# Get event statistics
curl http://localhost:3001/api/events/statistics | jq .
```

### Monitor Event Growth

```bash
# Count events by type
mongosh saga-demo --eval "db.events.aggregate([
  { \$group: { _id: '\$eventType', count: { \$sum: 1 } } },
  { \$sort: { count: -1 } }
])"
```

### Audit Trail Analysis

```bash
# Get audit trail for an order
curl http://localhost:3001/api/events/audit/ORD-123 | jq .
```

## 🎯 Best Practices

### Event Sourcing
1. ✅ Store immutable events
2. ✅ Include all necessary data in payload
3. ✅ Use meaningful event types
4. ✅ Add metadata (userId, timestamp, correlationId)
5. ✅ Version your events
6. ❌ Don't modify existing events
7. ❌ Don't delete events (use tombstone events instead)

### Rate Limiting
1. ✅ Apply different limits for different endpoints
2. ✅ Use Redis for distributed rate limiting
3. ✅ Provide clear error messages
4. ✅ Include Retry-After header
5. ✅ Skip rate limiting for health checks
6. ❌ Don't rate limit too aggressively
7. ❌ Don't forget to monitor rate limit hits

### Testing
1. ✅ Write tests before implementing features (TDD)
2. ✅ Test happy paths and error scenarios
3. ✅ Use in-memory database for integration tests
4. ✅ Mock external dependencies
5. ✅ Aim for high test coverage
6. ❌ Don't test implementation details
7. ❌ Don't skip edge cases

## 🚀 Performance Considerations

### Event Store
- **Indexing**: Events are indexed by aggregateId, eventType, and timestamp
- **Query Optimization**: Use pagination for large result sets
- **Caching**: Consider caching frequently accessed aggregates

### Rate Limiting
- **Redis**: Use Redis for distributed rate limiting in production
- **Memory Store**: Acceptable for development/single instance
- **Performance**: Minimal overhead (~1-2ms per request)

## 📚 Additional Resources

- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS and Event Sourcing](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
