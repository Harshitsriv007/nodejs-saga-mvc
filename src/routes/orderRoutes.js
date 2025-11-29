const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       202:
 *         description: Order creation accepted and saga started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order creation in progress
 *                 sagaId:
 *                   type: string
 *                 orderId:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.post('/', orderController.createOrder);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.get('/:orderId', orderController.getOrder);

/**
 * @swagger
 * /api/orders/saga/{sagaId}:
 *   get:
 *     summary: Get saga execution status
 *     tags: [Saga]
 *     parameters:
 *       - in: path
 *         name: sagaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Saga ID
 *     responses:
 *       200:
 *         description: Saga execution details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SagaState'
 *       404:
 *         description: Saga not found
 *       500:
 *         description: Internal server error
 */
router.get('/saga/:sagaId', orderController.getSagaStatus);

module.exports = router;