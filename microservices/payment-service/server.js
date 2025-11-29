const express = require('express');
const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// In-memory payment storage
const payments = new Map();

// Process payment
app.post('/api/payments/process', (req, res) => {
  const { orderId, totalAmount, paymentMethod, userId } = req.body;

  console.log(`[PAYMENT] Process request - Order: ${orderId}, Amount: $${totalAmount}`);

  if (!orderId || !totalAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Simulate payment processing
  const transactionId = `TXN-${Date.now()}`;
  const paymentRecord = {
    transactionId,
    orderId,
    amount: totalAmount,
    paymentMethod: paymentMethod || 'credit_card',
    userId,
    status: 'SUCCESS',
    processedAt: new Date()
  };

  payments.set(transactionId, paymentRecord);

  console.log(`[PAYMENT] Payment processed - Transaction: ${transactionId}`);

  res.status(200).json({
    success: true,
    transactionId,
    orderId,
    amount: totalAmount,
    status: 'SUCCESS'
  });
});

// Refund payment (compensation)
app.post('/api/payments/refund', (req, res) => {
  const { orderId, transactionId, amount } = req.body;

  console.log(`[PAYMENT] Refund request - Order: ${orderId}, Transaction: ${transactionId}`);

  const payment = payments.get(transactionId);
  
  if (payment) {
    payment.status = 'REFUNDED';
    payment.refundedAt = new Date();
    console.log(`[PAYMENT] Refund processed for transaction: ${transactionId}`);
  }

  const refundId = `REF-${Date.now()}`;

  res.status(200).json({
    success: true,
    refundId,
    transactionId,
    orderId,
    amount,
    status: 'REFUNDED'
  });
});

// Get payment status
app.get('/api/payments/:transactionId', (req, res) => {
  const { transactionId } = req.params;
  const payment = payments.get(transactionId);

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  res.json(payment);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Payment Service' });
});

app.listen(PORT, () => {
  console.log(`[PAYMENT SERVICE] Running on http://localhost:${PORT}`);
});
