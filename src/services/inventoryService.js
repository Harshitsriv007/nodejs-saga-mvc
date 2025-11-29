const { createRetryableAxios } = require('../utils/retryConfig');
const { createCircuitBreaker } = require('../utils/circuitBreaker');
const logger = require('../utils/logger');

class InventoryService {
  constructor() {
    this.baseURL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';
    this.axios = createRetryableAxios({ baseURL: this.baseURL });
    
    // Create circuit breakers for each operation
    this.reserveBreaker = createCircuitBreaker(
      this._reserveInventory.bind(this),
      { 
        name: 'InventoryReserve',
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
      }
    );

    this.releaseBreaker = createCircuitBreaker(
      this._releaseInventory.bind(this),
      { 
        name: 'InventoryRelease',
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
      }
    );
  }

  async _reserveInventory(orderId, inventoryData) {
    const response = await this.axios.post('/api/inventory/reserve', {
      orderId,
      productId: inventoryData.productId,
      quantity: inventoryData.quantity
    });

    logger.info(`Inventory reserved for order ${orderId}`);
    return response.data;
  }

  async reserveInventory(orderId, inventoryData) {
    try {
      return await this.reserveBreaker.fire(orderId, inventoryData);
    } catch (error) {
      logger.error(`Inventory reservation failed for order ${orderId}:`, error.message);
      throw new Error(`Inventory reservation failed: ${error.message}`);
    }
  }

  async _releaseInventory(orderId, reservationData) {
    await this.axios.post('/api/inventory/release', {
      orderId,
      ...reservationData
    });

    logger.info(`Inventory released for order ${orderId}`);
  }

  async releaseInventory(orderId, reservationData) {
    try {
      await this.releaseBreaker.fire(orderId, reservationData);
    } catch (error) {
      logger.error(`Inventory release failed for order ${orderId}:`, error.message);
      throw new Error(`Inventory release failed: ${error.message}`);
    }
  }

  getCircuitBreakerStats() {
    const { getStats } = require('../utils/circuitBreaker');
    return {
      reserve: getStats(this.reserveBreaker),
      release: getStats(this.releaseBreaker)
    };
  }
}

module.exports = new InventoryService();