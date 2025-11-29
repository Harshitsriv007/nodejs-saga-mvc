const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const SagaState = require('../models/SagaState');
const inventoryService = require('../services/inventoryService');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

class SagaOrchestrator {
  constructor() {
    this.sagas = new Map();
  }

  async createOrderSaga(orderData) {
    const sagaId = uuidv4();
    const orderId = `ORD-${Date.now()}`;
    
    // Create initial order
    const order = new Order({
      ...orderData,
      orderId,
      sagaId,
      status: 'PROCESSING'
    });

    // Create saga state
    const sagaState = new SagaState({
      sagaId,
      orderId,
      currentStep: 'STARTED',
      steps: [
        { name: 'CREATE_ORDER', status: 'PENDING' },
        { name: 'RESERVE_INVENTORY', status: 'PENDING' },
        { name: 'PROCESS_PAYMENT', status: 'PENDING' },
        { name: 'SEND_NOTIFICATION', status: 'PENDING' }
      ],
      status: 'IN_PROGRESS'
    });

    try {
      await order.save();
      await sagaState.save();
      
      // Start saga execution
      await this.executeSaga(sagaId);
      
      return { sagaId, orderId, status: 'PROCESSING' };
    } catch (error) {
      logger.error('Failed to create order saga:', error);
      throw error;
    }
  }

  async executeSaga(sagaId) {
    try {
      const sagaState = await SagaState.findOne({ sagaId });
      
      // Step 1: Reserve Inventory
      await this.executeStep(sagaState, 'RESERVE_INVENTORY', () =>
        inventoryService.reserveInventory(sagaState.orderId, sagaState.steps[1].data)
      );

      // Step 2: Process Payment
      await this.executeStep(sagaState, 'PROCESS_PAYMENT', () =>
        paymentService.processPayment(sagaState.orderId, sagaState.steps[2].data)
      );

      // Step 3: Send Notification
      await this.executeStep(sagaState, 'SEND_NOTIFICATION', () =>
        notificationService.sendOrderConfirmation(sagaState.orderId)
      );

      // Mark saga as completed
      sagaState.status = 'COMPLETED';
      sagaState.currentStep = 'COMPLETED';
      await sagaState.save();

      // Update order status
      await Order.findOneAndUpdate(
        { orderId: sagaState.orderId },
        { status: 'COMPLETED' }
      );

      logger.info(`Saga ${sagaId} completed successfully`);

    } catch (error) {
      logger.error(`Saga ${sagaId} failed:`, error);
      await this.compensateSaga(sagaId);
    }
  }

  async executeStep(sagaState, stepName, action) {
    const step = sagaState.steps.find(s => s.name === stepName);
    
    try {
      step.data = await action();
      step.status = 'SUCCESS';
      step.executedAt = new Date();
      sagaState.currentStep = stepName;
      
      await sagaState.save();
      logger.info(`Step ${stepName} completed for saga ${sagaState.sagaId}`);
    } catch (error) {
      step.status = 'FAILED';
      await sagaState.save();
      throw error;
    }
  }

  async compensateSaga(sagaId) {
    const sagaState = await SagaState.findOne({ sagaId });
    sagaState.status = 'COMPENSATING';
    await sagaState.save();

    try {
      // Compensate in reverse order
      const stepsToCompensate = sagaState.steps
        .filter(step => step.status === 'SUCCESS')
        .reverse();

      for (const step of stepsToCompensate) {
        await this.compensateStep(sagaState, step);
      }

      sagaState.status = 'COMPENSATED';
      await sagaState.save();

      // Update order status
      await Order.findOneAndUpdate(
        { orderId: sagaState.orderId },
        { status: 'FAILED' }
      );

      logger.info(`Saga ${sagaId} compensated successfully`);
    } catch (compensationError) {
      logger.error(`Saga compensation failed for ${sagaId}:`, compensationError);
      sagaState.status = 'FAILED';
      await sagaState.save();
    }
  }

  async compensateStep(sagaState, step) {
    try {
      switch (step.name) {
        case 'PROCESS_PAYMENT':
          await paymentService.refundPayment(sagaState.orderId, step.data);
          break;
        case 'RESERVE_INVENTORY':
          await inventoryService.releaseInventory(sagaState.orderId, step.data);
          break;
        case 'SEND_NOTIFICATION':
          await notificationService.sendOrderCancellation(sagaState.orderId);
          break;
      }

      step.status = 'COMPENSATED';
      step.compensatedAt = new Date();
      await sagaState.save();
      
      logger.info(`Step ${step.name} compensated for saga ${sagaState.sagaId}`);
    } catch (error) {
      logger.error(`Compensation failed for step ${step.name}:`, error);
      throw error;
    }
  }

  async getSagaStatus(sagaId) {
    return await SagaState.findOne({ sagaId });
  }
}

module.exports = new SagaOrchestrator();