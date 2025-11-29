const eventStore = require('../../src/services/eventStore');
const Event = require('../../src/models/Event');

// Mock dependencies
jest.mock('../../src/models/Event');
jest.mock('../../src/utils/logger');

describe('EventStore Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeEvent', () => {
    it('should store an event successfully', async () => {
      const mockEvent = {
        eventType: 'ORDER_CREATED',
        aggregateId: 'ORD-123',
        aggregateType: 'ORDER',
        payload: { userId: 'user123', productId: 'prod456' },
        userId: 'user123'
      };

      const mockSavedEvent = {
        ...mockEvent,
        eventId: 'evt-123',
        save: jest.fn().mockResolvedValue(true)
      };

      Event.mockImplementation(() => mockSavedEvent);

      const result = await eventStore.storeEvent(mockEvent);

      expect(result).toBeDefined();
      expect(mockSavedEvent.save).toHaveBeenCalled();
    });

    it('should handle errors when storing events', async () => {
      const mockEvent = {
        eventType: 'ORDER_CREATED',
        aggregateId: 'ORD-123',
        aggregateType: 'ORDER',
        payload: {},
        userId: 'user123'
      };

      Event.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      await expect(eventStore.storeEvent(mockEvent)).rejects.toThrow('Database error');
    });
  });

  describe('getEventsByAggregateId', () => {
    it('should retrieve events for an aggregate', async () => {
      const mockEvents = [
        { eventType: 'ORDER_CREATED', aggregateId: 'ORD-123' },
        { eventType: 'ORDER_UPDATED', aggregateId: 'ORD-123' }
      ];

      Event.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockEvents)
        })
      });

      const result = await eventStore.getEventsByAggregateId('ORD-123');

      expect(result).toEqual(mockEvents);
      expect(Event.find).toHaveBeenCalledWith({ aggregateId: 'ORD-123' });
    });
  });

  describe('applyEvent', () => {
    it('should apply ORDER_CREATED event', () => {
      const state = {};
      const event = {
        eventType: 'ORDER_CREATED',
        aggregateId: 'ORD-123',
        payload: { userId: 'user123', productId: 'prod456' },
        createdAt: new Date()
      };

      const newState = eventStore.applyEvent(state, event);

      expect(newState.orderId).toBe('ORD-123');
      expect(newState.status).toBe('PENDING');
      expect(newState.userId).toBe('user123');
    });

    it('should apply ORDER_COMPLETED event', () => {
      const state = { orderId: 'ORD-123', status: 'PROCESSING' };
      const event = {
        eventType: 'ORDER_COMPLETED',
        createdAt: new Date()
      };

      const newState = eventStore.applyEvent(state, event);

      expect(newState.status).toBe('COMPLETED');
      expect(newState.completedAt).toBeDefined();
    });

    it('should apply ORDER_FAILED event', () => {
      const state = { orderId: 'ORD-123', status: 'PROCESSING' };
      const event = {
        eventType: 'ORDER_FAILED',
        payload: { reason: 'Payment failed' },
        createdAt: new Date()
      };

      const newState = eventStore.applyEvent(state, event);

      expect(newState.status).toBe('FAILED');
      expect(newState.failureReason).toBe('Payment failed');
    });
  });

  describe('rebuildAggregateState', () => {
    it('should rebuild state from events', async () => {
      const mockEvents = [
        {
          eventType: 'ORDER_CREATED',
          aggregateId: 'ORD-123',
          payload: { userId: 'user123', productId: 'prod456', quantity: 2 },
          createdAt: new Date()
        },
        {
          eventType: 'ORDER_COMPLETED',
          createdAt: new Date()
        }
      ];

      Event.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockEvents)
        })
      });

      const state = await eventStore.rebuildAggregateState('ORD-123');

      expect(state.orderId).toBe('ORD-123');
      expect(state.status).toBe('COMPLETED');
      expect(state.userId).toBe('user123');
    });
  });
});
