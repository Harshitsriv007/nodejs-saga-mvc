# Microservices Architecture

This directory contains three independent microservices that work with the main Saga Orchestrator.

## Services

### 1. Inventory Service (Port 3002)
Manages product inventory and reservations.

**Endpoints:**
- `POST /api/inventory/reserve` - Reserve inventory for an order
- `POST /api/inventory/release` - Release reserved inventory (compensation)
- `GET /api/inventory/:productId` - Get inventory status
- `GET /health` - Health check

### 2. Payment Service (Port 3003)
Handles payment processing and refunds.

**Endpoints:**
- `POST /api/payments/process` - Process payment
- `POST /api/payments/refund` - Refund payment (compensation)
- `GET /api/payments/:transactionId` - Get payment status
- `GET /health` - Health check

### 3. Notification Service (Port 3004)
Sends notifications to users.

**Endpoints:**
- `POST /api/notifications/order-confirmation` - Send order confirmation
- `POST /api/notifications/order-cancellation` - Send cancellation notice
- `GET /api/notifications` - Get recent notifications
- `GET /health` - Health check

## Running Services

### Option 1: Run all services at once
```bash
./start-all-services.sh
```

### Option 2: Run services individually

**Terminal 1 - Inventory Service:**
```bash
cd microservices/inventory-service
npm install
npm start
```

**Terminal 2 - Payment Service:**
```bash
cd microservices/payment-service
npm install
npm start
```

**Terminal 3 - Notification Service:**
```bash
cd microservices/notification-service
npm install
npm start
```

**Terminal 4 - Main Service:**
```bash
npm start
```

## Testing

Once all services are running, test the complete flow:

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

Check the order status:
```bash
curl http://localhost:3001/api/orders/ORD-xxxxx
```

The order should now show status "COMPLETED" instead of "FAILED"!
