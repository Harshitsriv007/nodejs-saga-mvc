const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Saga Pattern Orchestrator API',
      version: '1.0.0',
      description: 'Distributed transaction management using Saga pattern with microservices architecture',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/app.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
