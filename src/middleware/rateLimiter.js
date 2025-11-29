const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const logger = require('../utils/logger');

// Create Redis client for rate limiting
let redisClient;
let useRedis = false;

try {
  if (process.env.REDIS_URL || process.env.NODE_ENV === 'production') {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return retries * 100;
        }
      }
    });

    redisClient.connect().then(() => {
      logger.info('Redis connected for rate limiting');
      useRedis = true;
    }).catch((error) => {
      logger.warn('Redis connection failed, using memory store for rate limiting:', error.message);
      useRedis = false;
    });
  }
} catch (error) {
  logger.warn('Redis setup failed, using memory store for rate limiting:', error.message);
  useRedis = false;
}

/**
 * Create rate limiter middleware
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 'Check the Retry-After header for when you can retry.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        path: req.path,
        method: req.method
      });
      res.status(429).json({
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: res.getHeader('Retry-After')
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  };

  const config = { ...defaultOptions, ...options };

  // Use Redis store if available, otherwise use memory store
  if (useRedis && redisClient) {
    config.store = new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    });
  }

  return rateLimit(config);
}

/**
 * Strict rate limiter for sensitive endpoints
 */
const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 requests per 15 minutes
  message: {
    error: 'Too many requests to this sensitive endpoint.',
    retryAfter: 'Please wait before trying again.'
  }
});

/**
 * Standard rate limiter for API endpoints
 */
const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit to 100 requests per 15 minutes
});

/**
 * Lenient rate limiter for read-only endpoints
 */
const readOnlyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit to 300 requests per 15 minutes
});

/**
 * Create order rate limiter (more restrictive)
 */
const createOrderRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit to 5 order creations per minute
  message: {
    error: 'Too many order creation attempts.',
    retryAfter: 'Please wait before creating another order.'
  }
});

/**
 * Get rate limit status for an IP
 * @param {String} ip - IP address
 * @returns {Promise<Object>} Rate limit status
 */
async function getRateLimitStatus(ip) {
  if (!useRedis || !redisClient) {
    return { error: 'Rate limit status not available (using memory store)' };
  }

  try {
    const keys = await redisClient.keys(`rl:${ip}:*`);
    const status = {};

    for (const key of keys) {
      const value = await redisClient.get(key);
      const ttl = await redisClient.ttl(key);
      status[key] = {
        count: parseInt(value),
        expiresIn: ttl
      };
    }

    return status;
  } catch (error) {
    logger.error('Failed to get rate limit status:', error);
    return { error: 'Failed to retrieve rate limit status' };
  }
}

/**
 * Reset rate limit for an IP
 * @param {String} ip - IP address
 * @returns {Promise<Boolean>} Success status
 */
async function resetRateLimit(ip) {
  if (!useRedis || !redisClient) {
    return false;
  }

  try {
    const keys = await redisClient.keys(`rl:${ip}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Rate limit reset for IP: ${ip}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to reset rate limit:', error);
    return false;
  }
}

module.exports = {
  createRateLimiter,
  strictRateLimiter,
  apiRateLimiter,
  readOnlyRateLimiter,
  createOrderRateLimiter,
  getRateLimitStatus,
  resetRateLimit,
  redisClient
};
