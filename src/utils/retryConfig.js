const axiosRetry = require('axios-retry');
const axios = require('axios');
const logger = require('./logger');

/**
 * Configure axios with retry logic for transient failures
 */
function configureRetry(axiosInstance = axios) {
  axiosRetry(axiosInstance, {
    retries: 3, // Number of retry attempts
    retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
    retryCondition: (error) => {
      // Retry on network errors or 5xx server errors
      return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
             (error.response && error.response.status >= 500);
    },
    onRetry: (retryCount, error, requestConfig) => {
      logger.warn(`Retry attempt ${retryCount} for ${requestConfig.url}`, {
        error: error.message,
        method: requestConfig.method,
        url: requestConfig.url
      });
    }
  });

  return axiosInstance;
}

/**
 * Create a new axios instance with retry configuration
 */
function createRetryableAxios(config = {}) {
  const instance = axios.create({
    timeout: 5000,
    ...config
  });

  return configureRetry(instance);
}

module.exports = {
  configureRetry,
  createRetryableAxios
};
