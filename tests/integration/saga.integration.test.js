const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const App = require('../../src/app');
const Order = require('../../src/models/Order');
const SagaState = require('../../src/models/SagaState');
const Event = require('../../src/models/Event');

let mongoServer;
let app;
let server;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  
  // Create app instance
  const appInstance = new App();
  app = appInstance.app;
  server = appInstance.server;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  if (server) {
    server.close();
  }
});

beforeEach(async () => {
  // Clear collections before each test
  await Order.deleteMany({});
  await SagaState.deleteMany({});
  await Event.deleteMany({});
});

describe('Saga Integration Tests', () => {
  describe('POST /api/orders', () => {
    it('should create an order and start saga', async () => {
      const orderData = {
        userId: 'user123',
        productId: 'prod456',
        quantity: 2,
        totalAmount: 99.98,
        paymentMethod: 'credit_card'
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(202);

      expect(response.body).toHaveProperty('sagaId');
      expect(response.body).toHaveProperty('orderId');
      expect(response.body.status).toBe('PROCESSING');

      // Verify order was created
      const order = await Order.findOne({ orderId: response.body.orderId });
      expect(order).toBeDefined();
      expect(order.userId).toBe('user123');

      // Verify saga state was created
      const sagaState = await SagaState.findOne({ sagaId: response.body.sagaId });
      expect(sagaState).toBeDefined();
      expect(sagaState.orderId).toBe(response.body.orderId);

      // Verify events were stored
      const events = await Event.find({ aggregateId: response.body.orderId });
      expect(events.length).toBeGreaterThan(0);
      
      const orderCreatedEvent = events.find(e => e.eventType === 'ORDER_CREATED');
      expect(orderCreatedEvent).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        userId: 'user123'
        // Missing productId, quantity, totalAmount
      };

      const response = await request(app)
        .post('/api/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/orders/:orderId', () => {
    it('should retrieve an order by ID', async () => {
      // Create an order first
      const order = new Order({
        orderId: 'ORD-TEST-123',
        userId: 'user123',
        productId: 'prod456',
        quantity: 2,
        totalAmount: 99.98,
        status: 'COMPLETED',
        sagaId: 'saga-123'
      });
      await order.save();

      const response = await request(app)
        .get('/api/orders/ORD-TEST-123')
        .expect(200);

      expect(response.body.orderId).toBe('ORD-TEST-123');
      expect(response.body.userId).toBe('user123');
      expect(response.body.status).toBe('COMPLETED');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/NON-EXISTENT')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/orders/saga/:sagaId', () => {
    it('should retrieve saga status', async () => {
      // Create a saga state
      const sagaState = new SagaState({
        sagaId: 'saga-test-123',
        orderId: 'ORD-TEST-123',
        currentStep: 'COMPLETED',
        steps: [
          { name: 'RESERVE_INVENTORY', status: 'SUCCESS' },
          { name: 'PROCESS_PAYMENT', status: 'SUCCESS' }
        ],
        status: 'COMPLETED'
      });
      await sagaState.save();

      const response = await request(app)
        .get('/api/orders/saga/saga-test-123')
        .expect(200);

      expect(response.body.sagaId).toBe('saga-test-123');
      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.steps).toHaveLength(2);
    });

    it('should return 404 for non-existent saga', async () => {
      const response = await request(app)
        .get('/api/orders/saga/NON-EXISTENT')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Event Sourcing Endpoints', () => {
    beforeEach(async () => {
      // Create test events
      const event1 = new Event({
        eventId: 'evt-1',
        eventType: 'ORDER_CREATED',
        aggregateId: 'ORD-TEST-123',
        aggregateType: 'ORDER',
        payload: { userId: 'user123', productId: 'prod456' },
        metadata: { userId: 'user123', timestamp: new Date() }
      });

      const event2 = new Event({
        eventId: 'evt-2',
        eventType: 'ORDER_COMPLETED',
        aggregateId: 'ORD-TEST-123',
        aggregateType: 'ORDER',
        payload: { status: 'COMPLETED' },
        metadata: { userId: 'user123', timestamp: new Date() }
      });

      await event1.save();
      await event2.save();
    });

    it('should retrieve events for an aggregate', async () => {
      const response = await request(app)
        .get('/api/events/aggregate/ORD-TEST-123')
        .expect(200);

      expect(response.body.aggregateId).toBe('ORD-TEST-123');
      expect(response.body.events).toHaveLength(2);
    });

    it('should retrieve audit trail', async () => {
      const response = await request(app)
        .get('/api/events/audit/ORD-TEST-123')
        .expect(200);

      expect(response.body.aggregateId).toBe('ORD-TEST-123');
      expect(response.body.auditTrail).toBeDefined();
      expect(response.body.auditTrail.length).toBeGreaterThan(0);
    });

    it('should retrieve event statistics', async () => {
      const response = await request(app)
        .get('/api/events/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('totalEvents');
      expect(response.body).toHaveProperty('eventTypes');
    });
  });
});
