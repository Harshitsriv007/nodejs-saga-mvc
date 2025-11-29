const express = require('express');
const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// In-memory notification log
const notifications = [];

// Send order confirmation
app.post('/api/notifications/order-confirmation', (req, res) => {
  const { orderId, userId, email } = req.body;

  console.log(`[NOTIFICATION] Order confirmation - Order: ${orderId}`);

  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }

  const notificationId = `NOTIF-${Date.now()}`;
  const notification = {
    notificationId,
    type: 'ORDER_CONFIRMATION',
    orderId,
    userId,
    email,
    message: `Your order ${orderId} has been confirmed and is being processed.`,
    sentAt: new Date(),
    status: 'SENT'
  };

  notifications.push(notification);

  console.log(`[NOTIFICATION] Confirmation sent - Notification: ${notificationId}`);

  res.status(200).json({
    success: true,
    notificationId,
    orderId,
    message: 'Order confirmation sent'
  });
});

// Send order cancellation
app.post('/api/notifications/order-cancellation', (req, res) => {
  const { orderId, userId, email } = req.body;

  console.log(`[NOTIFICATION] Order cancellation - Order: ${orderId}`);

  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }

  const notificationId = `NOTIF-${Date.now()}`;
  const notification = {
    notificationId,
    type: 'ORDER_CANCELLATION',
    orderId,
    userId,
    email,
    message: `Your order ${orderId} has been cancelled. Any charges will be refunded.`,
    sentAt: new Date(),
    status: 'SENT'
  };

  notifications.push(notification);

  console.log(`[NOTIFICATION] Cancellation sent - Notification: ${notificationId}`);

  res.status(200).json({
    success: true,
    notificationId,
    orderId,
    message: 'Order cancellation sent'
  });
});

// Get all notifications
app.get('/api/notifications', (req, res) => {
  res.json({
    total: notifications.length,
    notifications: notifications.slice(-10) // Last 10 notifications
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Notification Service' });
});

app.listen(PORT, () => {
  console.log(`[NOTIFICATION SERVICE] Running on http://localhost:${PORT}`);
});
