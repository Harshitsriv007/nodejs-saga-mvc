#!/bin/bash

echo "🚀 Starting all microservices..."

# Install dependencies for each service if needed
echo "📦 Installing dependencies..."

cd microservices/inventory-service && npm install --silent && cd ../..
cd microservices/payment-service && npm install --silent && cd ../..
cd microservices/notification-service && npm install --silent && cd ../..

echo ""
echo "✅ Dependencies installed"
echo ""
echo "Starting services..."
echo "- Main Service (Saga Orchestrator): http://localhost:3001"
echo "- Inventory Service: http://localhost:3002"
echo "- Payment Service: http://localhost:3003"
echo "- Notification Service: http://localhost:3004"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start all services in background
node microservices/inventory-service/server.js &
PID1=$!

node microservices/payment-service/server.js &
PID2=$!

node microservices/notification-service/server.js &
PID3=$!

node src/server.js &
PID4=$!

# Wait for all processes
wait $PID1 $PID2 $PID3 $PID4
