const { createRetryableAxios } = require('../utils/retryConfig');
const { createCircuitBreaker } = require('../utils/circuitBreaker');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.baseURL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003';
    this.axios = createRetryableAxios({ baseURL: this.baseURL });
    
    // Create circuit breakers for each operation
    this.processBreaker = createCircuitBreaker(
      this._processPayment.bind(this),
      { 
        name: 'PaymentProcess',
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
      }
    );

    this.refundBreaker = createCircuitBreaker(
      this._refundPayment.bind(this),
      { 
        name: 'PaymentRefund',
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
      }
    );
  }

  async _processPayment(orderId, paymentData) {
    const response = await this.axios.post('/api/payments/process', {
      orderId,
      totalAmount: paymentData.totalAmount,
      paymentMethod: paymentData.paymentMethod,
      userId: paymentData.userId
    });

    logger.info(`Payment processed for order ${orderId}`);
    return response.data;
  }

  async processPayment(orderId, paymentData) {
    try {
      return await this.processBreaker.fire(orderId, paymentData);
    } catch (error) {
      logger.error(`Payment processing failed for order ${orderId}:`, error.message);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  async _refundPayment(orderId, paymentResult) {
    await this.axios.post('/api/payments/refund', {
      orderId,
      ...paymentResult
    });

    logger.info(`Payment refunded for order ${orderId}`);
  }

  async refundPayment(orderId, paymentResult) {
    try {
      await this.refundBreaker.fire(orderId, paymentResult);
    } catch (error) {
      logger.error(`Payment refund failed for order ${orderId}:`, error.message);
      throw new Error(`Payment refund failed: ${error.message}`);
    }
  }

  getCircuitBreakerStats() {
    const { getStats } = require('../utils/circuitBreaker');
    return {
      process: getStats(this.processBreaker),
      refund: getStats(this.refundBreaker)
    };
  }
}

module.exports = new PaymentService();