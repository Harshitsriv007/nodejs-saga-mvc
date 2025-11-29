// Jest setup file
// Runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.ENABLE_TRACING = 'false';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/saga-demo-test';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock logger to reduce noise in tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Global test utilities
global.testUtils = {
  createMockOrder: () => ({
    userId: 'test-user',
    productId: 'test-product',
    quantity: 1,
    totalAmount: 50.00,
    paymentMethod: 'credit_card'
  }),
  
  createMockEvent: (type = 'ORDER_CREATED') => ({
    eventType: type,
    aggregateId: 'test-aggregate-123',
    aggregateType: 'ORDER',
    payload: { test: 'data' },
    userId: 'test-user'
  })
};
