const Order = require('../models/Order');
const sagaOrchestrator = require('../sagas/sagaOrchestrator');
const logger = require('../utils/logger');

class OrderController {
  async createOrder(req, res) {
    try {
      const { userId, productId, quantity, totalAmount, paymentMethod } = req.body;

      // Validate input
      if (!userId || !productId || !quantity || !totalAmount) {
        return res.status(400).json({
          error: 'Missing required fields: userId, productId, quantity, totalAmount'
        });
      }

      const orderData = {
        userId,
        productId,
        quantity,
        totalAmount,
        paymentMethod
      };

      const result = await sagaOrchestrator.createOrderSaga(orderData);

      res.status(202).json({
        message: 'Order creation in progress',
        ...result
      });
    } catch (error) {
      logger.error('Order creation failed:', error);
      res.status(500).json({
        error: 'Order creation failed',
        details: error.message
      });
    }
  }

  async getOrder(req, res) {
    try {
      const { orderId } = req.params;
      const order = await Order.findOne({ orderId });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      logger.error('Order retrieval failed:', error);
      res.status(500).json({ error: 'Order retrieval failed' });
    }
  }

  async getSagaStatus(req, res) {
    try {
      const { sagaId } = req.params;
      const sagaStatus = await sagaOrchestrator.getSagaStatus(sagaId);

      if (!sagaStatus) {
        return res.status(404).json({ error: 'Saga not found' });
      }

      res.json(sagaStatus);
    } catch (error) {
      logger.error('Saga status retrieval failed:', error);
      res.status(500).json({ error: 'Saga status retrieval failed' });
    }
  }
}

module.exports = new OrderController();