#!/bin/bash

echo "🧪 Testing Saga Pattern Microservices"
echo "======================================"
echo ""

# Test health checks
echo "1️⃣  Testing Health Checks..."
echo "Main Service:"
curl -s http://localhost:3001/health | jq .
echo ""
echo "Inventory Service:"
curl -s http://localhost:3002/health | jq .
echo ""
echo "Payment Service:"
curl -s http://localhost:3003/health | jq .
echo ""
echo "Notification Service:"
curl -s http://localhost:3004/health | jq .
echo ""

# Create an order
echo "2️⃣  Creating a new order..."
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "testuser",
    "productId": "prod456",
    "quantity": 1,
    "totalAmount": 49.99,
    "paymentMethod": "credit_card"
  }')

echo "$ORDER_RESPONSE" | jq .
ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r .orderId)
SAGA_ID=$(echo "$ORDER_RESPONSE" | jq -r .sagaId)
echo ""

# Wait for saga to complete
echo "3️⃣  Waiting for saga to complete..."
sleep 2
echo ""

# Check order status
echo "4️⃣  Checking order status..."
curl -s "http://localhost:3001/api/orders/$ORDER_ID" | jq .
echo ""

# Check saga status
echo "5️⃣  Checking saga status..."
curl -s "http://localhost:3001/api/orders/saga/$SAGA_ID" | jq .
echo ""

# Check inventory
echo "6️⃣  Checking inventory status..."
curl -s http://localhost:3002/api/inventory/prod456 | jq .
echo ""

echo "✅ Test completed!"
