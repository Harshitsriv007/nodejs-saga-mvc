const { createRetryableAxios } = require('../utils/retryConfig');
const { createCircuitBreaker } = require('../utils/circuitBreaker');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.baseURL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
    this.axios = createRetryableAxios({ baseURL: this.baseURL });
    
    // Create circuit breakers for each operation
    this.confirmationBreaker = createCircuitBreaker(
      this._sendOrderConfirmation.bind(this),
      { 
        name: 'NotificationConfirmation',
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
      }
    );

    this.cancellationBreaker = createCircuitBreaker(
      this._sendOrderCancellation.bind(this),
      { 
        name: 'NotificationCancellation',
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
      }
    );
  }

  async _sendOrderConfirmation(orderId) {
    await this.axios.post('/api/notifications/order-confirmation', {
      orderId
    });

    logger.info(`Order confirmation sent for order ${orderId}`);
  }

  async sendOrderConfirmation(orderId) {
    try {
      await this.confirmationBreaker.fire(orderId);
    } catch (error) {
      logger.error(`Order confirmation failed for order ${orderId}:`, error.message);
      throw new Error(`Order confirmation failed: ${error.message}`);
    }
  }

  async _sendOrderCancellation(orderId) {
    await this.axios.post('/api/notifications/order-cancellation', {
      orderId
    });

    logger.info(`Order cancellation sent for order ${orderId}`);
  }

  async sendOrderCancellation(orderId) {
    try {
      await this.cancellationBreaker.fire(orderId);
    } catch (error) {
      logger.error(`Order cancellation failed for order ${orderId}:`, error.message);
      throw new Error(`Order cancellation failed: ${error.message}`);
    }
  }

  getCircuitBreakerStats() {
    const { getStats } = require('../utils/circuitBreaker');
    return {
      confirmation: getStats(this.confirmationBreaker),
      cancellation: getStats(this.cancellationBreaker)
    };
  }
}

module.exports = new NotificationService();