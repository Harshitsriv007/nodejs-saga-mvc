const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

router.post('/', orderController.createOrder);
router.get('/:orderId', orderController.getOrder);
router.get('/saga/:sagaId', orderController.getSagaStatus);

module.exports = router;