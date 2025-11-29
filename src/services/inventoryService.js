const axios = require('axios');
const logger = require('../utils/logger');

class InventoryService {
  constructor() {
    this.baseURL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';
  }

  async reserveInventory(orderId, inventoryData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/inventory/reserve`, {
        orderId,
        ...inventoryData
      });

      logger.info(`Inventory reserved for order ${orderId}`);
      return response.data;
    } catch (error) {
      logger.error(`Inventory reservation failed for order ${orderId}:`, error);
      throw new Error(`Inventory reservation failed: ${error.message}`);
    }
  }

  async releaseInventory(orderId, reservationData) {
    try {
      await axios.post(`${this.baseURL}/api/inventory/release`, {
        orderId,
        ...reservationData
      });

      logger.info(`Inventory released for order ${orderId}`);
    } catch (error) {
      logger.error(`Inventory release failed for order ${orderId}:`, error);
      throw new Error(`Inventory release failed: ${error.message}`);
    }
  }
}

module.exports = new InventoryService();