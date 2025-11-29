const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const orderRoutes = require('./routes/orderRoutes');
const eventRoutes = require('./routes/eventRoutes');
const swaggerSpecs = require('./config/swagger');
const { apiRateLimiter, readOnlyRateLimiter, createOrderRateLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const inventoryService = require('./services/inventoryService');
const paymentService = require('./services/paymentService');
const notificationService = require('./services/notificationService');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupDatabase();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Add CORS for cross-origin requests
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      next();
    });

    // Apply global rate limiting
    this.app.use(apiRateLimiter);
  }

  setupRoutes() {
    // API Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Saga Pattern API Documentation'
    }));

    // API Routes with rate limiting
    this.app.use('/api/orders', orderRoutes);
    this.app.use('/api/events', readOnlyRateLimiter, eventRoutes);
    
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Service is healthy
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthCheck'
     */
    this.app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date(),
        service: 'Saga Pattern API'
      });
    });

    /**
     * @swagger
     * /metrics/circuit-breakers:
     *   get:
     *     summary: Get circuit breaker statistics
     *     tags: [Monitoring]
     *     responses:
     *       200:
     *         description: Circuit breaker statistics for all services
     */
    this.app.get('/metrics/circuit-breakers', (req, res) => {
      try {
        const stats = {
          inventory: inventoryService.getCircuitBreakerStats(),
          payment: paymentService.getCircuitBreakerStats(),
          notification: notificationService.getCircuitBreakerStats()
        };
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve circuit breaker stats' });
      }
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.status(200).json({
        message: 'Saga Pattern API is running',
        documentation: '/api-docs',
        endpoints: {
          createOrder: 'POST /api/orders',
          getOrder: 'GET /api/orders/:orderId',
          getSagaStatus: 'GET /api/orders/saga/:sagaId',
          health: 'GET /health',
          metrics: 'GET /metrics/circuit-breakers',
          apiDocs: 'GET /api-docs'
        },
        timestamp: new Date()
      });
    });

    // Handle 404
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  async setupDatabase() {
    try {
      // Use more compatible connection string
      await mongoose.connect('mongodb://127.0.0.1:27017/saga-demo', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      });
      logger.info('Connected to MongoDB successfully');
    } catch (error) {
      logger.error('Database connection failed:', error.message);
      // Don't exit process in development, just log error
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }

  start(port = 3001) {
    // Handle port already in use error
    this.server = this.app.listen(port, '0.0.0.0', () => {
      logger.info(`Server running on http://localhost:${port}`);
      logger.info(`Health check: http://localhost:${port}/health`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use`);
        logger.info('Try using a different port: npm start 3001');
      } else {
        logger.error('Server error:', err);
      }
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      mongoose.connection.close();
      logger.info('Server stopped');
    }
  }
}

module.exports = App;