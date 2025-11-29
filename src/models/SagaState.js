const mongoose = require('mongoose');

const sagaStateSchema = new mongoose.Schema({
  sagaId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: String,
    required: true
  },
  currentStep: {
    type: String,
    enum: ['STARTED', 'RESERVE_INVENTORY', 'PROCESS_PAYMENT', 'SEND_NOTIFICATION', 'COMPLETED', 'COMPENSATING', 'FAILED'],
    default: 'STARTED'
  },
  steps: [{
    name: String,
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'COMPENSATED']
    },
    executedAt: Date,
    compensatedAt: Date,
    data: mongoose.Schema.Types.Mixed
  }],
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED', 'COMPENSATED', 'COMPENSATING'],
    default: 'IN_PROGRESS'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

sagaStateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SagaState', sagaStateSchema);