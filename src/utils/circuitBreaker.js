const CircuitBreaker = require('opossum');
const logger = require('./logger');

/**
 * Circuit Breaker Configuration
 */
const defaultOptions = {
  timeout: 5000, // If function takes longer than 5 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
  resetTimeout: 30000, // After 30 seconds, try again
  rollingCountTimeout: 10000, // Rolling window for error calculation
  rollingCountBuckets: 10, // Number of buckets in the rolling window
  name: 'defaultCircuitBreaker'
};

/**
 * Create a circuit breaker for a service call
 * @param {Function} serviceCall - The async function to wrap
 * @param {Object} options - Circuit breaker options
 * @returns {CircuitBreaker} Circuit breaker instance
 */
function createCircuitBreaker(serviceCall, options = {}) {
  const config = { ...defaultOptions, ...options };
  const breaker = new CircuitBreaker(serviceCall, config);

  // Event listeners for monitoring
  breaker.on('open', () => {
    logger.error(`Circuit breaker [${config.name}] opened - too many failures`);
  });

  breaker.on('halfOpen', () => {
    logger.warn(`Circuit breaker [${config.name}] half-open - testing service`);
  });

  breaker.on('close', () => {
    logger.info(`Circuit breaker [${config.name}] closed - service recovered`);
  });

  breaker.on('success', (result) => {
    logger.debug(`Circuit breaker [${config.name}] - successful call`);
  });

  breaker.on('failure', (error) => {
    logger.warn(`Circuit breaker [${config.name}] - call failed`, {
      error: error.message
    });
  });

  breaker.on('timeout', () => {
    logger.error(`Circuit breaker [${config.name}] - call timeout`);
  });

  breaker.on('reject', () => {
    logger.error(`Circuit breaker [${config.name}] - call rejected (circuit open)`);
  });

  breaker.on('fallback', (result) => {
    logger.info(`Circuit breaker [${config.name}] - fallback executed`);
  });

  return breaker;
}

/**
 * Get circuit breaker statistics
 * @param {CircuitBreaker} breaker - Circuit breaker instance
 * @returns {Object} Statistics
 */
function getStats(breaker) {
  const stats = breaker.stats;
  return {
    name: breaker.name,
    state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
    failures: stats.failures,
    successes: stats.successes,
    rejects: stats.rejects,
    timeouts: stats.timeouts,
    fallbacks: stats.fallbacks,
    fires: stats.fires,
    latencyMean: stats.latencyMean,
    percentiles: {
      '0.0': stats.percentiles['0.0'],
      '0.5': stats.percentiles['0.5'],
      '0.95': stats.percentiles['0.95'],
      '0.99': stats.percentiles['0.99'],
      '1.0': stats.percentiles['1.0']
    }
  };
}

module.exports = {
  createCircuitBreaker,
  getStats
};
