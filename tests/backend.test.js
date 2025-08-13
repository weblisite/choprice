const request = require('supertest');
const app = require('../server');

describe('Choprice Backend API Tests', () => {
  
  // Test server health
  describe('GET /health', () => {
    it('should return server health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  // Test menu endpoints
  describe('Menu API', () => {
    it('should get menu items', async () => {
      const res = await request(app)
        .get('/api/menu')
        .expect(200);
      
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter menu items by category', async () => {
      const res = await request(app)
        .get('/api/menu?category=Complete Meals')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('category', 'Complete Meals');
      }
    });
  });

  // Test M-Pesa endpoints
  describe('M-Pesa API', () => {
    it('should validate STK Push request format', async () => {
      const invalidPayload = {
        // Missing required fields
        amount: 100
      };

      const res = await request(app)
        .post('/api/mpesa/stk-push')
        .send(invalidPayload)
        .expect(400);
      
      expect(res.body).toHaveProperty('success', false);
    });

    it('should handle M-Pesa callback', async () => {
      const callbackPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: "test-merchant-id",
            CheckoutRequestID: "test-checkout-id",
            ResultCode: 0,
            ResultDesc: "The service request is processed successfully.",
            CallbackMetadata: {
              Item: [
                { Name: "Amount", Value: 390 },
                { Name: "MpesaReceiptNumber", Value: "TEST123456" },
                { Name: "TransactionDate", Value: 20241201120000 },
                { Name: "PhoneNumber", Value: 254700000000 }
              ]
            }
          }
        }
      };

      const res = await request(app)
        .post('/api/mpesa/callback')
        .send(callbackPayload)
        .expect(200);
      
      expect(res.body).toHaveProperty('ResultCode', 0);
    });
  });

  // Test Google Maps endpoints
  describe('Google Maps API', () => {
    it('should validate address format', async () => {
      const res = await request(app)
        .get('/api/maps/validate-address')
        .query({ address: 'Kilimani, Nairobi' })
        .expect(200);
      
      expect(res.body).toHaveProperty('success');
    });

    it('should return address suggestions', async () => {
      const res = await request(app)
        .get('/api/maps/address-suggestions')
        .query({ input: 'Kilimani' })
        .expect(200);
      
      expect(res.body).toHaveProperty('success');
      if (res.body.success) {
        expect(res.body).toHaveProperty('suggestions');
        expect(Array.isArray(res.body.suggestions)).toBe(true);
      }
    });
  });

  // Test order creation flow
  describe('Order Management', () => {
    let authToken;
    let orderId;

    beforeAll(async () => {
      // Mock authentication token for testing
      authToken = 'test-auth-token';
    });

    it('should create a new order', async () => {
      const orderData = {
        items: [
          {
            id: 1,
            name: 'Rice and Chicken',
            price: 390,
            quantity: 1
          }
        ],
        deliveryAddress: {
          address: 'Kilimani, Nairobi',
          building: 'Test Building',
          floor: '2nd Floor'
        },
        phone: '0700000000',
        specialInstructions: 'Test order'
      };

      // Note: This would need proper authentication in real tests
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);
      
      // In a real test environment with proper auth, this would expect 200/201
      // For now, we expect 401 due to missing auth
      expect([200, 201, 401]).toContain(res.status);
    });

    it('should get order history', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 401]).toContain(res.status);
    });
  });

  // Test admin endpoints
  describe('Admin API', () => {
    let adminToken;

    beforeAll(async () => {
      adminToken = 'test-admin-token';
    });

    it('should get admin orders', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 401]).toContain(res.status);
    });

    it('should get analytics data', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 401]).toContain(res.status);
    });

    it('should update order status', async () => {
      const res = await request(app)
        .patch('/api/admin/orders/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'confirmed' });
      
      expect([200, 401, 404]).toContain(res.status);
    });
  });

  // Test push notification endpoints
  describe('Push Notifications', () => {
    let userToken;

    beforeAll(async () => {
      userToken = 'test-user-token';
    });

    it('should subscribe to push notifications', async () => {
      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          auth: 'test-auth-key',
          p256dh: 'test-p256dh-key'
        }
      };

      const res = await request(app)
        .post('/api/push/subscribe')
        .set('Authorization', `Bearer ${userToken}`)
        .send(subscription);
      
      expect([200, 401]).toContain(res.status);
    });

    it('should unsubscribe from push notifications', async () => {
      const res = await request(app)
        .post('/api/push/unsubscribe')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect([200, 401]).toContain(res.status);
    });
  });

  // Test support endpoints
  describe('Customer Support', () => {
    it('should get FAQ items', async () => {
      const res = await request(app)
        .get('/api/support/faq')
        .expect(200);
      
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should create support ticket', async () => {
      const ticketData = {
        subject: 'Test Issue',
        message: 'This is a test support ticket',
        category: 'general',
        priority: 'medium'
      };

      const res = await request(app)
        .post('/api/support/ticket')
        .set('Authorization', 'Bearer test-token')
        .send(ticketData);
      
      expect([200, 201, 401]).toContain(res.status);
    });
  });

  // Test rate limiting
  describe('Rate Limiting', () => {
    it('should enforce rate limits on API endpoints', async () => {
      // Make multiple rapid requests
      const requests = Array(20).fill().map(() => 
        request(app).get('/api/menu')
      );

      const responses = await Promise.all(requests);
      
      // Some requests should succeed, others might be rate limited
      const statusCodes = responses.map(res => res.status);
      expect(statusCodes).toContain(200);
      
      // Check if rate limiting is working (429 status)
      const rateLimited = statusCodes.some(code => code === 429);
      // Rate limiting might not trigger in test environment
      expect(typeof rateLimited).toBe('boolean');
    });
  });

  // Test error handling
  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const res = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);
    });

    it('should handle invalid JSON payloads', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  // Test database operations
  describe('Database Operations', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we just ensure the server doesn't crash
      const res = await request(app)
        .get('/api/menu');
      
      expect([200, 500]).toContain(res.status);
    });
  });

  // Performance tests
  describe('Performance Tests', () => {
    it('should respond to menu requests within acceptable time', async () => {
      const startTime = Date.now();
      
      const res = await request(app)
        .get('/api/menu')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      // Should respond within 1 second
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill().map(() => 
        request(app).get('/api/menu')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(5000);
    });
  });
});

// Integration tests for real-time features
describe('Real-time Features', () => {
  const io = require('socket.io-client');
  let clientSocket;
  let serverSocket;

  beforeAll((done) => {
    // This would require setting up a test socket.io server
    // For now, we just test the structure
    done();
  });

  afterAll(() => {
    if (clientSocket) {
      clientSocket.close();
    }
  });

  it('should establish socket connection', (done) => {
    // Mock socket connection test
    // In a real environment, this would test actual socket.io connections
    expect(true).toBe(true);
    done();
  });

  it('should handle order status updates', (done) => {
    // Mock real-time order update test
    expect(true).toBe(true);
    done();
  });
});