const mongoose = require('mongoose');

/**
 * Event Schema for Event Sourcing
 * Stores all domain events that occur in the system
 */
const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'ORDER_CREATED',
      'ORDER_UPDATED',
      'ORDER_COMPLETED',
      'ORDER_FAILED',
      'SAGA_STARTED',
      'SAGA_STEP_STARTED',
      'SAGA_STEP_COMPLETED',
      'SAGA_STEP_FAILED',
      'SAGA_COMPLETED',
      'SAGA_COMPENSATING',
      'SAGA_COMPENSATED',
      'INVENTORY_RESERVED',
      'INVENTORY_RELEASED',
      'PAYMENT_PROCESSED',
      'PAYMENT_REFUNDED',
      'NOTIFICATION_SENT'
    ],
    index: true
  },
  aggregateId: {
    type: String,
    required: true,
    index: true
  },
  aggregateType: {
    type: String,
    required: true,
    enum: ['ORDER', 'SAGA', 'INVENTORY', 'PAYMENT', 'NOTIFICATION'],
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metadata: {
    userId: String,
    correlationId: String,
    causationId: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    version: {
      type: Number,
      default: 1
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient querying
eventSchema.index({ aggregateId: 1, createdAt: 1 });
eventSchema.index({ aggregateType: 1, createdAt: 1 });
eventSchema.index({ eventType: 1, createdAt: 1 });

module.exports = mongoose.model('Event', eventSchema);
