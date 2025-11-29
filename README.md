# Node.js Saga Pattern with Microservices Architecture

A complete implementation of the Saga pattern for distributed transactions in a microservices architecture using Node.js, Express, and MongoDB.

## 🏗️ Architecture Overview

This project demonstrates a distributed transaction management system using the Saga orchestration pattern with automatic compensation for failed transactions.

```
┌─────────────────────────────────────────────────────────┐
│                   Client Application                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Saga Orchestrator (Port 3001)                   │
│  • Coordinates distributed transactions                  │
│  • Manages compensation logic                            │
│  • Persists saga state in MongoDB                        │
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────────┐
│Inventory │   │ Payment  │   │ Notification │
│ Service  │   │ Service  │   │   Service    │
│Port 3002 │   │Port 3003 │   │  Port 3004   │
└──────────┘   └──────────┘   └──────────────┘
```

## 🚀 Features

### Core Features
- ✅ **Saga Pattern Implementation** - Orchestrated saga with automatic compensation
- ✅ **Microservices Architecture** - Independent, scalable services
- ✅ **MongoDB Integration** - Persistent storage for orders and saga states
- ✅ **Automatic Compensation** - Rollback on failures
- ✅ **Comprehensive Logging** - Winston logger with file and console output
- ✅ **RESTful APIs** - Clean, well-documented endpoints
- ✅ **Error Handling** - Robust error handling and validation
- ✅ **Health Checks** - Monitor service availability

### Advanced Features 🆕
- ✅ **Retry Logic** - Automatic retries with exponential backoff for transient failures
- ✅ **Circuit Breaker** - Prevent cascade failures with Opossum circuit breaker
- ✅ **Distributed Tracing** - End-to-end request tracing with OpenTelemetry & Jaeger
- ✅ **API Documentation** - Interactive Swagger/OpenAPI documentation
- ✅ **Metrics & Monitoring** - Circuit breaker statistics and health metrics

📖 **[View Advanced Features Documentation](ADVANCED_FEATURES.md)**

## 📦 Services

### 1. Main Saga Orchestrator (Port 3001)
Coordinates the entire order processing workflow.

**Endpoints:**
- `POST /api/orders` - Create a new order
- `GET /api/orders/:orderId` - Get order details
- `GET /api/orders/saga/:sagaId` - Get saga execution status
- `GET /health` - Health check
- `GET /api-docs` - Interactive API documentation (Swagger UI)
- `GET /metrics/circuit-breakers` - Circuit breaker statistics
- `GET /` - API information

### 2. Inventory Service (Port 3002)
Manages product inventory and reservations.

**Endpoints:**
- `POST /api/inventory/reserve` - Reserve inventory
- `POST /api/inventory/release` - Release inventory (compensation)
- `GET /api/inventory/:productId` - Get inventory status
- `GET /health` - Health check

### 3. Payment Service (Port 3003)
Handles payment processing and refunds.

**Endpoints:**
- `POST /api/payments/process` - Process payment
- `POST /api/payments/refund` - Refund payment (compensation)
- `GET /api/payments/:transactionId` - Get payment status
- `GET /health` - Health check

### 4. Notification Service (Port 3004)
Sends notifications to users.

**Endpoints:**
- `POST /api/notifications/order-confirmation` - Send confirmation
- `POST /api/notifications/order-cancellation` - Send cancellation
- `GET /api/notifications` - Get recent notifications
- `GET /health` - Health check

## 🛠️ Prerequisites

- **Node.js** v14+ 
- **MongoDB** v4.4+
- **npm** or **yarn**

## 📥 Installation

### Quick Setup (with Advanced Features)
```bash
# Run the automated setup script
./setup-advanced-features.sh
```

This will:
- Install all dependencies
- Setup Jaeger for distributed tracing (if Docker is available)
- Create .env configuration file
- Verify MongoDB connection

### Manual Installation

#### 1. Clone the repository
```bash
git clone <repository-url>
cd nodejs-saga-mvc
```

#### 2. Install main service dependencies
```bash
npm install
```

#### 3. Install microservices dependencies
```bash
cd microservices/inventory-service && npm install && cd ../..
cd microservices/payment-service && npm install && cd ../..
cd microservices/notification-service && npm install && cd ../..
```

#### 4. Ensure MongoDB is running
```bash
# Check if MongoDB is running
pgrep -x mongod

# If not running, start MongoDB
mongod --dbpath /path/to/data

# Or use Docker
docker-compose up -d mongodb
```

#### 5. (Optional) Setup Jaeger for Distributed Tracing
```bash
# Start Jaeger using Docker Compose
docker-compose up -d jaeger

# Access Jaeger UI at http://localhost:16686
```

## 🚀 Running the Application

### Option 1: Run all services at once (Recommended)
```bash
./start-all-services.sh
```

### Option 2: Run services individually

**Terminal 1 - Inventory Service:**
```bash
cd microservices/inventory-service
npm start
```

**Terminal 2 - Payment Service:**
```bash
cd microservices/payment-service
npm start
```

**Terminal 3 - Notification Service:**
```bash
cd microservices/notification-service
npm start
```

**Terminal 4 - Main Saga Orchestrator:**
```bash
npm start
```

### Development Mode (with auto-reload)
```bash
npm run dev
```

## 🧪 Testing

### Run the automated test script:
```bash
./test-saga.sh
```

### Test Advanced Features

**View API Documentation:**
```bash
open http://localhost:3001/api-docs
```

**Check Circuit Breaker Status:**
```bash
curl http://localhost:3001/metrics/circuit-breakers | jq .
```

**Enable Distributed Tracing:**
```bash
# Set in .env file
ENABLE_TRACING=true

# Restart services
./start-all-services.sh

# View traces in Jaeger UI
open http://localhost:16686
```

### Manual API Testing

**1. Create an order:**
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

**Response:**
```json
{
  "message": "Order creation in progress",
  "sagaId": "4b9bdae5-232e-47ec-9ac6-72a7551bbf0f",
  "orderId": "ORD-1764450450581",
  "status": "PROCESSING"
}
```

**2. Check order status:**
```bash
curl http://localhost:3001/api/orders/ORD-1764450450581
```

**Response (Success):**
```json
{
  "orderId": "ORD-1764450450581",
  "userId": "user123",
  "productId": "prod456",
  "quantity": 2,
  "totalAmount": 99.98,
  "status": "COMPLETED",
  "sagaId": "4b9bdae5-232e-47ec-9ac6-72a7551bbf0f"
}
```

**3. Check saga execution details:**
```bash
curl http://localhost:3001/api/orders/saga/4b9bdae5-232e-47ec-9ac6-72a7551bbf0f
```

**Response:**
```json
{
  "sagaId": "4b9bdae5-232e-47ec-9ac6-72a7551bbf0f",
  "orderId": "ORD-1764450450581",
  "currentStep": "COMPLETED",
  "steps": [
    {
      "name": "RESERVE_INVENTORY",
      "status": "SUCCESS",
      "executedAt": "2025-11-29T21:10:53.760Z",
      "data": {
        "reservationId": "RES-1764450653756",
        "productId": "prod456",
        "quantity": 2
      }
    },
    {
      "name": "PROCESS_PAYMENT",
      "status": "SUCCESS",
      "executedAt": "2025-11-29T21:10:53.787Z",
      "data": {
        "transactionId": "TXN-1764450653782",
        "amount": 99.98
      }
    },
    {
      "name": "SEND_NOTIFICATION",
      "status": "SUCCESS",
      "executedAt": "2025-11-29T21:10:53.809Z"
    }
  ],
  "status": "COMPLETED"
}
```

## 📊 Saga Flow

### Successful Transaction Flow:
1. **Create Order** → Order created with status "PROCESSING"
2. **Reserve Inventory** → Inventory reserved for the order
3. **Process Payment** → Payment processed successfully
4. **Send Notification** → Confirmation email sent
5. **Complete** → Order status updated to "COMPLETED"

### Failed Transaction Flow (with Compensation):
1. **Create Order** → Order created
2. **Reserve Inventory** → ✅ Success
3. **Process Payment** → ❌ Fails
4. **Compensation Triggered** → Automatically rollback:
   - Release reserved inventory
   - Update order status to "FAILED"
   - Send cancellation notification

## 📈 Sequence Diagrams

### Successful Order Flow

```
┌────────┐    ┌──────────────┐    ┌───────────┐    ┌─────────┐    ┌──────────────┐
│ Client │    │    Saga      │    │ Inventory │    │ Payment │    │ Notification │
│        │    │ Orchestrator │    │  Service  │    │ Service │    │   Service    │
└───┬────┘    └──────┬───────┘    └─────┬─────┘    └────┬────┘    └──────┬───────┘
    │                │                   │               │                │
    │ POST /orders   │                   │               │                │
    │───────────────>│                   │               │                │
    │                │                   │               │                │
    │                │ 1. Create Order   │               │                │
    │                │   in MongoDB      │               │                │
    │                │──────────┐        │               │                │
    │                │          │        │               │                │
    │                │<─────────┘        │               │                │
    │                │                   │               │                │
    │  202 Accepted  │                   │               │                │
    │  (sagaId,      │                   │               │                │
    │   orderId)     │                   │               │                │
    │<───────────────│                   │               │                │
    │                │                   │               │                │
    │                │ 2. Reserve        │               │                │
    │                │    Inventory      │               │                │
    │                │──────────────────>│               │                │
    │                │                   │               │                │
    │                │                   │ Check Stock   │                │
    │                │                   │──────┐        │                │
    │                │                   │      │        │                │
    │                │                   │<─────┘        │                │
    │                │                   │               │                │
    │                │  reservationId    │               │                │
    │                │<──────────────────│               │                │
    │                │                   │               │                │
    │                │ Update Saga State │               │                │
    │                │──────────┐        │               │                │
    │                │          │        │               │                │
    │                │<─────────┘        │               │                │
    │                │                   │               │                │
    │                │ 3. Process Payment│               │                │
    │                │───────────────────────────────────>│                │
    │                │                   │               │                │
    │                │                   │               │ Charge Card    │
    │                │                   │               │──────┐         │
    │                │                   │               │      │         │
    │                │                   │               │<─────┘         │
    │                │                   │               │                │
    │                │  transactionId    │               │                │
    │                │<───────────────────────────────────│                │
    │                │                   │               │                │
    │                │ Update Saga State │               │                │
    │                │──────────┐        │               │                │
    │                │          │        │               │                │
    │                │<─────────┘        │               │                │
    │                │                   │               │                │
    │                │ 4. Send Notification              │                │
    │                │────────────────────────────────────────────────────>│
    │                │                   │               │                │
    │                │                   │               │                │ Send Email
    │                │                   │               │                │──────┐
    │                │                   │               │                │      │
    │                │                   │               │                │<─────┘
    │                │                   │               │                │
    │                │  notificationId   │               │                │
    │                │<────────────────────────────────────────────────────│
    │                │                   │               │                │
    │                │ 5. Complete Saga  │               │                │
    │                │   Update Order    │               │                │
    │                │   Status=COMPLETED│               │                │
    │                │──────────┐        │               │                │
    │                │          │        │               │                │
    │                │<─────────┘        │               │                │
    │                │                   │               │                │
    │ GET /orders/   │                   │               │                │
    │    {orderId}   │                   │               │                │
    │───────────────>│                   │               │                │
    │                │                   │               │                │
    │ 200 OK         │                   │               │                │
    │ status:        │                   │               │                │
    │ "COMPLETED"    │                   │               │                │
    │<───────────────│                   │               │                │
    │                │                   │               │                │
```

### Failed Order Flow with Compensation

```
┌────────┐    ┌──────────────┐    ┌───────────┐    ┌─────────┐    ┌──────────────┐
│ Client │    │    Saga      │    │ Inventory │    │ Payment │    │ Notification │
│        │    │ Orchestrator │    │  Service  │    │ Service │    │   Service    │
└───┬────┘    └──────┬───────┘    └─────┬─────┘    └────┬────┘    └──────┬───────┘
    │                │                   │               │                │
    │ POST /orders   │                   │               │                │
    │───────────────>│                   │               │                │
    │                │                   │               │                │
    │                │ 1. Create Order   │               │                │
    │                │──────────┐        │               │                │
    │                │          │        │               │                │
    │                │<─────────┘        │               │                │
    │                │                   │               │                │
    │  202 Accepted  │                   │               │                │
    │<───────────────│                   │               │                │
    │                │                   │               │                │
    │                │ 2. Reserve        │               │                │
    │                │    Inventory      │               │                │
    │                │──────────────────>│               │                │
    │                │                   │               │                │
    │                │  ✅ SUCCESS       │               │                │
    │                │  reservationId    │               │                │
    │                │<──────────────────│               │                │
    │                │                   │               │                │
    │                │ Update Saga State │               │                │
    │                │──────────┐        │               │                │
    │                │          │        │               │                │
    │                │<─────────┘        │               │                │
    │                │                   │               │                │
    │                │ 3. Process Payment│               │                │
    │                │───────────────────────────────────>│                │
    │                │                   │               │                │
    │                │                   │               │ ❌ FAILED      │
    │                │  ❌ ERROR         │               │ (Insufficient  │
    │                │  Payment Failed   │               │  Funds)        │
    │                │<───────────────────────────────────│                │
    │                │                   │               │                │
    │                │ ⚠️ COMPENSATION   │               │                │
    │                │    TRIGGERED      │               │                │
    │                │──────────┐        │               │                │
    │                │          │        │               │                │
    │                │<─────────┘        │               │                │
    │                │                   │               │                │
    │                │ 4. Release        │               │                │
    │                │    Inventory      │               │                │
    │                │    (Compensate)   │               │                │
    │                │──────────────────>│               │                │
    │                │                   │               │                │
    │                │                   │ Unreserve     │                │
    │                │                   │ Stock         │                │
    │                │                   │──────┐        │                │
    │                │                   │      │        │                │
    │                │                   │<─────┘        │                │
    │                │                   │               │                │
    │                │  ✅ Released      │               │                │
    │                │<──────────────────│               │                │
    │                │                   │               │                │
    │                │ 5. Send           │               │                │
    │                │    Cancellation   │               │                │
    │                │    Notification   │               │                │
    │                │────────────────────────────────────────────────────>│
    │                │                   │               │                │
    │                │                   │               │                │ Send Cancel
    │                │                   │               │                │ Email
    │                │                   │               │                │──────┐
    │                │                   │               │                │      │
    │                │                   │               │                │<─────┘
    │                │                   │               │                │
    │                │  ✅ Sent          │               │                │
    │                │<────────────────────────────────────────────────────│
    │                │                   │               │                │
    │                │ 6. Update Order   │               │                │
    │                │    Status=FAILED  │               │                │
    │                │    Saga=COMPENSATED│              │                │
    │                │──────────┐        │               │                │
    │                │          │        │               │                │
    │                │<─────────┘        │               │                │
    │                │                   │               │                │
    │ GET /orders/   │                   │               │                │
    │    {orderId}   │                   │               │                │
    │───────────────>│                   │               │                │
    │                │                   │               │                │
    │ 200 OK         │                   │               │                │
    │ status:        │                   │               │                │
    │ "FAILED"       │                   │               │                │
    │<───────────────│                   │               │                │
    │                │                   │               │                │
```

### Saga State Transitions

```
                    ┌─────────────┐
                    │   STARTED   │
                    └──────┬──────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  RESERVE_INVENTORY   │
                └──────┬───────────────┘
                       │
                ┌──────┴──────┐
                │             │
            ✅ Success    ❌ Failed
                │             │
                ▼             ▼
        ┌───────────────┐  ┌──────────────┐
        │PROCESS_PAYMENT│  │COMPENSATING  │
        └───────┬───────┘  └──────┬───────┘
                │                 │
         ┌──────┴──────┐          │
         │             │          │
     ✅ Success    ❌ Failed       │
         │             │          │
         ▼             ▼          ▼
  ┌──────────────┐  ┌──────────────────┐
  │SEND_NOTIFICATION│ │  COMPENSATING   │
  └──────┬───────┘  └──────┬───────────┘
         │                 │
         ▼                 ▼
  ┌──────────────┐  ┌──────────────┐
  │  COMPLETED   │  │ COMPENSATED  │
  │ (Order:      │  │ (Order:      │
  │  COMPLETED)  │  │  FAILED)     │
  └──────────────┘  └──────────────┘
```

### Data Flow in MongoDB

```
┌─────────────────────────────────────────────────────────────┐
│                     MongoDB (saga-demo)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────┐    ┌─────────────────────────┐ │
│  │   orders Collection    │    │ sagastates Collection   │ │
│  ├────────────────────────┤    ├─────────────────────────┤ │
│  │ • orderId              │◄───┤ • sagaId                │ │
│  │ • userId               │    │ • orderId (ref)         │ │
│  │ • productId            │    │ • currentStep           │ │
│  │ • quantity             │    │ • steps[]               │ │
│  │ • totalAmount          │    │   - name                │ │
│  │ • status               │    │   - status              │ │
│  │   - PENDING            │    │   - executedAt          │ │
│  │   - PROCESSING         │    │   - data                │ │
│  │   - COMPLETED ✅       │    │ • status                │ │
│  │   - FAILED ❌          │    │   - IN_PROGRESS         │ │
│  │ • sagaId (ref)         │    │   - COMPLETED ✅        │ │
│  │ • createdAt            │    │   - COMPENSATED ❌      │ │
│  │ • updatedAt            │    │ • createdAt             │ │
│  └────────────────────────┘    │ • updatedAt             │ │
│                                └─────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
nodejs-saga-mvc/
├── src/
│   ├── app.js                      # Express app setup
│   ├── server.js                   # Server entry point
│   ├── controllers/
│   │   └── orderController.js      # Order endpoints
│   ├── models/
│   │   ├── Order.js                # Order schema
│   │   └── SagaState.js            # Saga state schema
│   ├── routes/
│   │   └── orderRoutes.js          # API routes
│   ├── sagas/
│   │   └── sagaOrchestrator.js     # Saga coordination logic
│   ├── services/
│   │   ├── inventoryService.js     # Inventory API client
│   │   ├── paymentService.js       # Payment API client
│   │   └── notificationService.js  # Notification API client
│   └── utils/
│       └── logger.js               # Winston logger config
├── microservices/
│   ├── inventory-service/
│   │   ├── server.js               # Inventory service
│   │   └── package.json
│   ├── payment-service/
│   │   ├── server.js               # Payment service
│   │   └── package.json
│   └── notification-service/
│       ├── server.js               # Notification service
│       └── package.json
├── tests/
│   └── saga.test.js                # Test suite
├── package.json                    # Main dependencies
├── start-all-services.sh           # Start all services
├── test-saga.sh                    # Test script
├── cleanup-git.sh                  # Git cleanup utility
├── .gitignore                      # Git ignore patterns
├── MICROSERVICES_SETUP.md          # Microservices guide
├── GITIGNORE_SUMMARY.md            # Git configuration guide
├── VALIDATION_REPORT.md            # Validation results
└── README.md                       # This file
```

## 🗄️ Database

**Database Name:** `saga-demo`

**Collections:**
- `orders` - Stores order information
- `sagastates` - Stores saga execution state

**View data:**
```bash
# Connect to MongoDB
mongosh saga-demo

# View orders
db.orders.find().pretty()

# View saga states
db.sagastates.find().pretty()

# Count completed orders
db.orders.countDocuments({ status: "COMPLETED" })
```

## 📝 Environment Variables

Create a `.env` file in the root directory (optional):

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/saga-demo

# Microservices URLs
INVENTORY_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004
```

## 🔧 Configuration

### Service Ports
| Service | Port | Environment Variable |
|---------|------|---------------------|
| Main Orchestrator | 3001 | `PORT` |
| Inventory | 3002 | `INVENTORY_SERVICE_URL` |
| Payment | 3003 | `PAYMENT_SERVICE_URL` |
| Notification | 3004 | `NOTIFICATION_SERVICE_URL` |

## 📋 Available Scripts

```bash
# Start main service
npm start

# Start with auto-reload (development)
npm run dev

# Run tests
npm test

# Start all microservices
./start-all-services.sh

# Test the complete saga flow
./test-saga.sh

# Clean up git repository
./cleanup-git.sh
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Find process using port 3001
lsof -ti:3001

# Kill the process
kill <PID>
```

### MongoDB connection failed
```bash
# Check if MongoDB is running
pgrep -x mongod

# Start MongoDB
mongod --dbpath /path/to/data

# Or use brew (macOS)
brew services start mongodb-community
```

### Services not communicating
1. Ensure all services are running
2. Check service logs for errors
3. Verify ports are not blocked by firewall
4. Test individual service health checks:
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3002/health
   curl http://localhost:3003/health
   curl http://localhost:3004/health
   ```

## 📚 Documentation

- **[MICROSERVICES_SETUP.md](MICROSERVICES_SETUP.md)** - Detailed microservices setup guide
- **[GITIGNORE_SUMMARY.md](GITIGNORE_SUMMARY.md)** - Git configuration and cleanup
- **[VALIDATION_REPORT.md](VALIDATION_REPORT.md)** - System validation results
- **[microservices/README.md](microservices/README.md)** - Microservices documentation

## 🎯 Key Concepts

### Saga Pattern
The Saga pattern manages distributed transactions by breaking them into a series of local transactions. Each local transaction updates the database and publishes an event or message. If a local transaction fails, the saga executes compensating transactions to undo the changes.

### Orchestration vs Choreography
This implementation uses **orchestration**, where a central coordinator (Saga Orchestrator) manages the transaction flow and compensation logic.

### Compensation
When a step fails, the saga automatically executes compensation actions in reverse order:
- Payment failure → Release inventory
- Notification failure → Refund payment → Release inventory

## 🚀 Next Steps

### Completed ✅
1. ~~**Implement Retry Logic**~~ - Automatic retries with exponential backoff
2. ~~**Add Distributed Tracing**~~ - OpenTelemetry with Jaeger integration
3. ~~**Implement Circuit Breaker**~~ - Opossum circuit breaker pattern
4. ~~**Add API Documentation**~~ - Interactive Swagger/OpenAPI docs
5. ~~**Add Monitoring**~~ - Circuit breaker metrics and health checks

### Roadmap 🚧
1. **Add Authentication** - Implement JWT-based authentication
2. **Add Authorization** - Role-based access control (RBAC)
3. **Containerization** - Complete Docker setup for all services
4. **Kubernetes Deployment** - Production-ready K8s manifests
5. **Add Prometheus & Grafana** - Advanced monitoring dashboards
6. **Implement Event Sourcing** - Complete audit trail
7. **Add Rate Limiting** - Protect APIs from abuse
8. **Unit & Integration Tests** - Comprehensive test coverage
9. **CI/CD Pipeline** - Automated testing and deployment
10. **GraphQL API** - Alternative API interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Harshit Srivastava - Initial work

## 🙏 Acknowledgments

- Saga pattern concepts from microservices.io
- Express.js framework
- MongoDB and Mongoose
- Winston logger
- Node.js community

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review logs in `combined.log` and `error.log`

---

**Built with ❤️ using Node.js, Express, and MongoDB**
