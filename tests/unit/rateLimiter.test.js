const request = require('supertest');
const express = require('express');
const { createRateLimiter, apiRateLimiter } = require('../../src/middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('createRateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 5
      });

      app.use(limiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
      }
    });

    it('should block requests exceeding limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 2
      });

      app.use(limiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      // Make 2 requests (within limit)
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);

      // 3rd request should be rate limited
      const response = await request(app).get('/test');
      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error');
    });

    it('should include rate limit headers', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 10
      });

      app.use(limiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');
      
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });

    it('should skip rate limiting for health checks', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 1
      });

      app.use(limiter);
      app.get('/health', (req, res) => res.json({ status: 'OK' }));
      app.get('/test', (req, res) => res.json({ success: true }));

      // Health check should not be rate limited
      await request(app).get('/health').expect(200);
      await request(app).get('/health').expect(200);
      await request(app).get('/health').expect(200);

      // Regular endpoint should be rate limited
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(429);
    });
  });

  describe('apiRateLimiter', () => {
    it('should apply default API rate limits', async () => {
      app.use(apiRateLimiter);
      app.get('/api/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/api/test');
      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('ratelimit-limit');
    });
  });

  describe('Custom rate limiter options', () => {
    it('should respect custom window and max values', async () => {
      const limiter = createRateLimiter({
        windowMs: 1000, // 1 second
        max: 3
      });

      app.use(limiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      // Make 3 requests
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);

      // 4th request should be blocked
      await request(app).get('/test').expect(429);
    });

    it('should provide custom error message', async () => {
      const customMessage = 'Custom rate limit message';
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 1,
        message: { error: customMessage }
      });

      app.use(limiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      await request(app).get('/test').expect(200);
      
      const response = await request(app).get('/test');
      expect(response.status).toBe(429);
      expect(response.body.error).toBe('Too many requests');
    });
  });
});
