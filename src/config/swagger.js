const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Saga Pattern Orchestrator API',
      version: '1.0.0',
      description: 'Distributed transaction management using Saga pattern with microservices architecture',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'http://localhost:3002',
        description: 'Inventory Service'
      },
      {
        url: 'http://localhost:3003',
        description: 'Payment Service'
      },
      {
        url: 'http://localhost:3004',
        description: 'Notification Service'
      }
    ],
    tags: [
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Saga',
        description: 'Saga orchestration endpoints'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Monitoring',
        description: 'Monitoring and metrics endpoints'
      }
    ],
    components: {
      schemas: {
        Order: {
          type: 'object',
          required: ['userId', 'productId', 'quantity', 'totalAmount'],
          properties: {
            orderId: {
              type: 'string',
              description: 'Unique order identifier',
              example: 'ORD-1764450450581'
            },
            userId: {
              type: 'string',
              description: 'User identifier',
              example: 'user123'
            },
            productId: {
              type: 'string',
              description: 'Product identifier',
              example: 'prod456'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Quantity of items',
              example: 2
            },
            totalAmount: {
              type: 'number',
              minimum: 0,
              description: 'Total order amount',
              example: 99.98
            },
            paymentMethod: {
              type: 'string',
              description: 'Payment method',
              example: 'credit_card',
              enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer']
            },
            status: {
              type: 'string',
              description: 'Order status',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'COMPENSATING'],
              example: 'COMPLETED'
            },
            sagaId: {
              type: 'string',
              description: 'Associated saga identifier',
              example: '4b9bdae5-232e-47ec-9ac6-72a7551bbf0f'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order last update timestamp'
            }
          }
        },
        SagaState: {
          type: 'object',
          properties: {
            sagaId: {
              type: 'string',
              description: 'Unique saga identifier',
              example: '4b9bdae5-232e-47ec-9ac6-72a7551bbf0f'
            },
            orderId: {
              type: 'string',
              description: 'Associated order identifier',
              example: 'ORD-1764450450581'
            },
            currentStep: {
              type: 'string',
              description: 'Current saga step',
              enum: ['STARTED', 'RESERVE_INVENTORY', 'PROCESS_PAYMENT', 'SEND_NOTIFICATION', 'COMPLETED', 'COMPENSATING', 'FAILED'],
              example: 'COMPLETED'
            },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'RESERVE_INVENTORY'
                  },
                  status: {
                    type: 'string',
                    enum: ['PENDING', 'SUCCESS', 'FAILED', 'COMPENSATED'],
                    example: 'SUCCESS'
                  },
                  executedAt: {
                    type: 'string',
                    format: 'date-time'
                  },
                  compensatedAt: {
                    type: 'string',
                    format: 'date-time'
                  },
                  data: {
                    type: 'object',
                    description: 'Step execution data'
                  }
                }
              }
            },
            status: {
              type: 'string',
              enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED', 'COMPENSATED', 'COMPENSATING'],
              example: 'COMPLETED'
            }
          }
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['userId', 'productId', 'quantity', 'totalAmount'],
          properties: {
            userId: {
              type: 'string',
              example: 'user123'
            },
            productId: {
              type: 'string',
              example: 'prod456'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 2
            },
            totalAmount: {
              type: 'number',
              minimum: 0,
              example: 99.98
            },
            paymentMethod: {
              type: 'string',
              example: 'credit_card'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'string',
              description: 'Detailed error information'
            }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'OK'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            service: {
              type: 'string',
              example: 'Saga Pattern API'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/app.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
