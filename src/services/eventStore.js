const { v4: uuidv4 } = require('uuid');
const Event = require('../models/Event');
const logger = require('../utils/logger');

/**
 * Event Store Service
 * Handles storing and retrieving domain events
 */
class EventStore {
  /**
   * Store a new event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Stored event
   */
  async storeEvent(eventData) {
    try {
      const event = new Event({
        eventId: uuidv4(),
        eventType: eventData.eventType,
        aggregateId: eventData.aggregateId,
        aggregateType: eventData.aggregateType,
        payload: eventData.payload,
        metadata: {
          userId: eventData.userId,
          correlationId: eventData.correlationId || uuidv4(),
          causationId: eventData.causationId,
          timestamp: new Date(),
          version: eventData.version || 1
        }
      });

      await event.save();
      
      logger.info(`Event stored: ${eventData.eventType}`, {
        eventId: event.eventId,
        aggregateId: eventData.aggregateId,
        aggregateType: eventData.aggregateType
      });

      return event;
    } catch (error) {
      logger.error('Failed to store event:', error);
      throw error;
    }
  }

  /**
   * Get all events for an aggregate
   * @param {String} aggregateId - Aggregate ID
   * @returns {Promise<Array>} List of events
   */
  async getEventsByAggregateId(aggregateId) {
    try {
      const events = await Event.find({ aggregateId })
        .sort({ createdAt: 1 })
        .lean();
      
      return events;
    } catch (error) {
      logger.error('Failed to retrieve events:', error);
      throw error;
    }
  }

  /**
   * Get events by type
   * @param {String} eventType - Event type
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of events
   */
  async getEventsByType(eventType, options = {}) {
    try {
      const query = Event.find({ eventType });

      if (options.startDate) {
        query.where('createdAt').gte(options.startDate);
      }

      if (options.endDate) {
        query.where('createdAt').lte(options.endDate);
      }

      if (options.limit) {
        query.limit(options.limit);
      }

      const events = await query.sort({ createdAt: -1 }).lean();
      return events;
    } catch (error) {
      logger.error('Failed to retrieve events by type:', error);
      throw error;
    }
  }

  /**
   * Get events by aggregate type
   * @param {String} aggregateType - Aggregate type
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of events
   */
  async getEventsByAggregateType(aggregateType, options = {}) {
    try {
      const query = Event.find({ aggregateType });

      if (options.startDate) {
        query.where('createdAt').gte(options.startDate);
      }

      if (options.endDate) {
        query.where('createdAt').lte(options.endDate);
      }

      if (options.limit) {
        query.limit(options.limit);
      }

      const events = await query.sort({ createdAt: -1 }).lean();
      return events;
    } catch (error) {
      logger.error('Failed to retrieve events by aggregate type:', error);
      throw error;
    }
  }

  /**
   * Rebuild aggregate state from events
   * @param {String} aggregateId - Aggregate ID
   * @returns {Promise<Object>} Rebuilt state
   */
  async rebuildAggregateState(aggregateId) {
    try {
      const events = await this.getEventsByAggregateId(aggregateId);
      
      // Apply events to rebuild state
      let state = {};
      
      for (const event of events) {
        state = this.applyEvent(state, event);
      }

      return state;
    } catch (error) {
      logger.error('Failed to rebuild aggregate state:', error);
      throw error;
    }
  }

  /**
   * Apply event to state (event sourcing projection)
   * @param {Object} state - Current state
   * @param {Object} event - Event to apply
   * @returns {Object} New state
   */
  applyEvent(state, event) {
    switch (event.eventType) {
      case 'ORDER_CREATED':
        return {
          ...state,
          orderId: event.aggregateId,
          ...event.payload,
          status: 'PENDING',
          createdAt: event.createdAt
        };

      case 'ORDER_UPDATED':
        return {
          ...state,
          ...event.payload,
          updatedAt: event.createdAt
        };

      case 'ORDER_COMPLETED':
        return {
          ...state,
          status: 'COMPLETED',
          completedAt: event.createdAt
        };

      case 'ORDER_FAILED':
        return {
          ...state,
          status: 'FAILED',
          failedAt: event.createdAt,
          failureReason: event.payload.reason
        };

      case 'SAGA_STARTED':
        return {
          ...state,
          sagaId: event.aggregateId,
          sagaStatus: 'IN_PROGRESS',
          sagaStartedAt: event.createdAt
        };

      case 'SAGA_COMPLETED':
        return {
          ...state,
          sagaStatus: 'COMPLETED',
          sagaCompletedAt: event.createdAt
        };

      case 'SAGA_COMPENSATED':
        return {
          ...state,
          sagaStatus: 'COMPENSATED',
          sagaCompensatedAt: event.createdAt
        };

      default:
        return state;
    }
  }

  /**
   * Get event statistics
   * @returns {Promise<Object>} Event statistics
   */
  async getEventStatistics() {
    try {
      const stats = await Event.aggregate([
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            lastOccurrence: { $max: '$createdAt' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const totalEvents = await Event.countDocuments();

      return {
        totalEvents,
        eventTypes: stats
      };
    } catch (error) {
      logger.error('Failed to get event statistics:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for an aggregate
   * @param {String} aggregateId - Aggregate ID
   * @returns {Promise<Array>} Audit trail
   */
  async getAuditTrail(aggregateId) {
    try {
      const events = await Event.find({ aggregateId })
        .sort({ createdAt: 1 })
        .select('eventType payload metadata.timestamp metadata.userId')
        .lean();

      return events.map(event => ({
        timestamp: event.metadata.timestamp,
        eventType: event.eventType,
        userId: event.metadata.userId,
        changes: event.payload
      }));
    } catch (error) {
      logger.error('Failed to get audit trail:', error);
      throw error;
    }
  }
}

module.exports = new EventStore();
