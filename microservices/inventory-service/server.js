const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// In-memory inventory storage
const inventory = new Map();

// Initialize some sample inventory
inventory.set('prod456', { productId: 'prod456', stock: 100, reserved: 0 });
inventory.set('prod789', { productId: 'prod789', stock: 50, reserved: 0 });

// Reserve inventory
app.post('/api/inventory/reserve', (req, res) => {
  const { orderId, productId, quantity } = req.body;

  console.log(`[INVENTORY] Reserve request - Order: ${orderId}, Product: ${productId}, Qty: ${quantity}`);

  if (!orderId || !productId || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const item = inventory.get(productId);
  
  if (!item) {
    console.log(`[INVENTORY] Product not found: ${productId}`);
    return res.status(404).json({ error: 'Product not found' });
  }

  const availableStock = item.stock - item.reserved;
  
  if (availableStock < quantity) {
    console.log(`[INVENTORY] Insufficient stock for ${productId}`);
    return res.status(400).json({ 
      error: 'Insufficient stock',
      available: availableStock,
      requested: quantity
    });
  }

  // Reserve the inventory
  item.reserved += quantity;
  
  const reservationId = `RES-${Date.now()}`;
  console.log(`[INVENTORY] Reserved ${quantity} units of ${productId} - Reservation: ${reservationId}`);

  res.status(200).json({
    success: true,
    reservationId,
    productId,
    quantity,
    orderId
  });
});

// Release inventory (compensation)
app.post('/api/inventory/release', (req, res) => {
  const { orderId, productId, quantity, reservationId } = req.body;

  console.log(`[INVENTORY] Release request - Order: ${orderId}, Reservation: ${reservationId}`);

  const item = inventory.get(productId);
  
  if (item) {
    item.reserved = Math.max(0, item.reserved - quantity);
    console.log(`[INVENTORY] Released ${quantity} units of ${productId}`);
  }

  res.status(200).json({
    success: true,
    message: 'Inventory released',
    orderId
  });
});

// Get inventory status
app.get('/api/inventory/:productId', (req, res) => {
  const { productId } = req.params;
  const item = inventory.get(productId);

  if (!item) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({
    productId: item.productId,
    totalStock: item.stock,
    reserved: item.reserved,
    available: item.stock - item.reserved
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Inventory Service' });
});

app.listen(PORT, () => {
  console.log(`[INVENTORY SERVICE] Running on http://localhost:${PORT}`);
});
