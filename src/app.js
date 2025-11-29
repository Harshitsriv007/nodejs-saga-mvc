const express = require('express');
const mongoose = require('mongoose');
const orderRoutes = require('./routes/orderRoutes');
const logger = require('./utils/logger');

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
  }

  setupRoutes() {
    this.app.use('/api/orders', orderRoutes);
    
    // Health check with better response
    this.app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date(),
        service: 'Saga Pattern API'
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.status(200).json({
        message: 'Saga Pattern API is running',
        endpoints: {
          createOrder: 'POST /api/orders',
          getOrder: 'GET /api/orders/:orderId',
          getSagaStatus: 'GET /api/orders/saga/:sagaId',
          health: 'GET /health'
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