const axios = require('axios');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.baseURL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
  }

  async sendOrderConfirmation(orderId) {
    try {
      await axios.post(`${this.baseURL}/api/notifications/order-confirmation`, {
        orderId
      });

      logger.info(`Order confirmation sent for order ${orderId}`);
    } catch (error) {
      logger.error(`Order confirmation failed for order ${orderId}:`, error);
      throw new Error(`Order confirmation failed: ${error.message}`);
    }
  }

  async sendOrderCancellation(orderId) {
    try {
      await axios.post(`${this.baseURL}/api/notifications/order-cancellation`, {
        orderId
      });

      logger.info(`Order cancellation sent for order ${orderId}`);
    } catch (error) {
      logger.error(`Order cancellation failed for order ${orderId}:`, error);
      throw new Error(`Order cancellation failed: ${error.message}`);
    }
  }
}

module.exports = new NotificationService();