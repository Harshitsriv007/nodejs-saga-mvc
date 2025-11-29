const App = require('./app');

const app = new App();
app.start(process.env.PORT || 3001);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  app.stop();
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  app.stop();
});

module.exports = app;