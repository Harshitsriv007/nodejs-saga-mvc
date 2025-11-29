const express = require('express');
const eventStore = require('../services/eventStore');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/events/aggregate/{aggregateId}:
 *   get:
 *     summary: Get all events for an aggregate
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: aggregateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Aggregate ID (orderId or sagaId)
 *     responses:
 *       200:
 *         description: List of events
 *       500:
 *         description: Internal server error
 */
router.get('/aggregate/:aggregateId', async (req, res) => {
  try {
    const { aggregateId } = req.params;
    const events = await eventStore.getEventsByAggregateId(aggregateId);
    
    res.json({
      aggregateId,
      eventCount: events.length,
      events
    });
  } catch (error) {
    logger.error('Failed to retrieve events:', error);
    res.status(500).json({ error: 'Failed to retrieve events' });
  }
});

/**
 * @swagger
 * /api/events/audit/{aggregateId}:
 *   get:
 *     summary: Get audit trail for an aggregate
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: aggregateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Aggregate ID
 *     responses:
 *       200:
 *         description: Audit trail
 *       500:
 *         description: Internal server error
 */
router.get('/audit/:aggregateId', async (req, res) => {
  try {
    const { aggregateId } = req.params;
    const auditTrail = await eventStore.getAuditTrail(aggregateId);
    
    res.json({
      aggregateId,
      auditTrail
    });
  } catch (error) {
    logger.error('Failed to retrieve audit trail:', error);
    res.status(500).json({ error: 'Failed to retrieve audit trail' });
  }
});

/**
 * @swagger
 * /api/events/type/{eventType}:
 *   get:
 *     summary: Get events by type
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventType
 *         required: true
 *         schema:
 *           type: string
 *         description: Event type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of events to return
 *     responses:
 *       200:
 *         description: List of events
 *       500:
 *         description: Internal server error
 */
router.get('/type/:eventType', async (req, res) => {
  try {
    const { eventType } = req.params;
    const { limit } = req.query;
    
    const events = await eventStore.getEventsByType(eventType, {
      limit: limit ? parseInt(limit) : 100
    });
    
    res.json({
      eventType,
      eventCount: events.length,
      events
    });
  } catch (error) {
    logger.error('Failed to retrieve events by type:', error);
    res.status(500).json({ error: 'Failed to retrieve events by type' });
  }
});

/**
 * @swagger
 * /api/events/statistics:
 *   get:
 *     summary: Get event statistics
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Event statistics
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await eventStore.getEventStatistics();
    res.json(statistics);
  } catch (error) {
    logger.error('Failed to retrieve event statistics:', error);
    res.status(500).json({ error: 'Failed to retrieve event statistics' });
  }
});

/**
 * @swagger
 * /api/events/rebuild/{aggregateId}:
 *   get:
 *     summary: Rebuild aggregate state from events
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: aggregateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Aggregate ID
 *     responses:
 *       200:
 *         description: Rebuilt state
 *       500:
 *         description: Internal server error
 */
router.get('/rebuild/:aggregateId', async (req, res) => {
  try {
    const { aggregateId } = req.params;
    const state = await eventStore.rebuildAggregateState(aggregateId);
    
    res.json({
      aggregateId,
      rebuiltState: state
    });
  } catch (error) {
    logger.error('Failed to rebuild aggregate state:', error);
    res.status(500).json({ error: 'Failed to rebuild aggregate state' });
  }
});

module.exports = router;
