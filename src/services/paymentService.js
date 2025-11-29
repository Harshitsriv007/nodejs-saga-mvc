const axios = require('axios');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.baseURL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003';
  }

  async processPayment(orderId, paymentData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/payments/process`, {
        orderId,
        totalAmount: paymentData.totalAmount,
        paymentMethod: paymentData.paymentMethod,
        userId: paymentData.userId
      });

      logger.info(`Payment processed for order ${orderId}`);
      return response.data;
    } catch (error) {
      logger.error(`Payment processing failed for order ${orderId}:`, error.message);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  async refundPayment(orderId, paymentResult) {
    try {
      await axios.post(`${this.baseURL}/api/payments/refund`, {
        orderId,
        ...paymentResult
      });

      logger.info(`Payment refunded for order ${orderId}`);
    } catch (error) {
      logger.error(`Payment refund failed for order ${orderId}:`, error);
      throw new Error(`Payment refund failed: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();