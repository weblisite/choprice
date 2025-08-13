const { Server } = require('socket.io');

class RealtimeService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.connectedAdmins = new Set(); // admin socketIds
    this.connectedRiders = new Map(); // riderId -> socketId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          process.env.FRONTEND_URL,
          process.env.ADMIN_URL,
          process.env.RIDER_URL,
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupEventHandlers();
    console.log('🚀 Real-time service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data) => {
        const { userId, userType, riderId } = data;
        
        if (userType === 'customer' && userId) {
          this.connectedUsers.set(userId, socket.id);
          socket.join(`user_${userId}`);
          console.log(`Customer ${userId} authenticated`);
        } else if (userType === 'admin') {
          this.connectedAdmins.add(socket.id);
          socket.join('admins');
          console.log(`Admin authenticated: ${socket.id}`);
        } else if (userType === 'rider' && riderId) {
          this.connectedRiders.set(riderId, socket.id);
          socket.join(`rider_${riderId}`);
          socket.join('riders');
          console.log(`Rider ${riderId} authenticated`);
        }
      });

      // Handle location updates from riders
      socket.on('rider_location_update', (data) => {
        const { riderId, location, orderId } = data;
        
        // Broadcast location to admins
        socket.to('admins').emit('rider_location_updated', {
          riderId,
          location,
          orderId,
          timestamp: new Date().toISOString()
        });

        // If there's an active order, notify the customer
        if (orderId) {
          this.notifyOrderUpdate(orderId, {
            type: 'location_update',
            location,
            message: 'Your rider is on the way!'
          });
        }
      });

      // Handle rider status updates
      socket.on('rider_status_update', (data) => {
        const { riderId, status, orderId } = data;
        
        // Notify admins
        socket.to('admins').emit('rider_status_updated', {
          riderId,
          status,
          orderId,
          timestamp: new Date().toISOString()
        });

        // Notify customer if there's an active order
        if (orderId) {
          let message = '';
          switch (status) {
            case 'picked_up':
              message = 'Your order has been picked up and is on the way!';
              break;
            case 'nearby':
              message = 'Your rider is nearby. Please be ready to receive your order.';
              break;
            case 'delivered':
              message = 'Your order has been delivered. Enjoy your meal!';
              break;
            default:
              message = `Order status updated: ${status}`;
          }

          this.notifyOrderUpdate(orderId, {
            type: 'status_update',
            status,
            message
          });
        }
      });

      // Handle admin actions
      socket.on('admin_order_update', (data) => {
        const { orderId, status, message } = data;
        this.notifyOrderUpdate(orderId, {
          type: 'admin_update',
          status,
          message: message || `Order status updated to ${status}`
        });

        // Notify all admins and riders
        socket.to('admins').emit('order_updated', {
          orderId,
          status,
          timestamp: new Date().toISOString()
        });

        socket.to('riders').emit('order_updated', {
          orderId,
          status,
          timestamp: new Date().toISOString()
        });
      });

      // Handle kitchen status updates
      socket.on('kitchen_update', (data) => {
        const { orderId, status, estimatedTime } = data;
        
        let message = '';
        switch (status) {
          case 'confirmed':
            message = 'Your order has been confirmed and is being prepared.';
            break;
          case 'preparing':
            message = `Your order is being prepared. Estimated time: ${estimatedTime || '30-45'} minutes.`;
            break;
          case 'ready':
            message = 'Your order is ready and will be picked up shortly.';
            break;
          case 'out_for_delivery':
            message = 'Your order is out for delivery!';
            break;
          default:
            message = `Kitchen update: ${status}`;
        }

        this.notifyOrderUpdate(orderId, {
          type: 'kitchen_update',
          status,
          message,
          estimatedTime
        });

        // Notify riders about ready orders
        if (status === 'ready') {
          socket.to('riders').emit('order_ready_for_pickup', {
            orderId,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Remove from connected users
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            break;
          }
        }

        // Remove from connected admins
        this.connectedAdmins.delete(socket.id);

        // Remove from connected riders
        for (const [riderId, socketId] of this.connectedRiders.entries()) {
          if (socketId === socket.id) {
            this.connectedRiders.delete(riderId);
            break;
          }
        }
      });
    });
  }

  // Notify specific user about order updates
  notifyOrderUpdate(orderId, updateData) {
    // This would typically require a database lookup to find the user
    // For now, we'll emit to a room based on order ID
    this.io.to(`order_${orderId}`).emit('order_update', {
      orderId,
      ...updateData,
      timestamp: new Date().toISOString()
    });
  }

  // Notify user about order updates (when we have userId)
  notifyUser(userId, eventType, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(eventType, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Notify all admins
  notifyAdmins(eventType, data) {
    this.io.to('admins').emit(eventType, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Notify all riders
  notifyRiders(eventType, data) {
    this.io.to('riders').emit(eventType, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Notify specific rider
  notifyRider(riderId, eventType, data) {
    const socketId = this.connectedRiders.get(riderId);
    if (socketId) {
      this.io.to(socketId).emit(eventType, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Broadcast new order to admins and available riders
  broadcastNewOrder(orderData) {
    this.notifyAdmins('new_order', orderData);
    this.notifyRiders('new_order_available', orderData);
  }

  // Send order confirmation to user
  sendOrderConfirmation(userId, orderData) {
    this.notifyUser(userId, 'order_confirmed', orderData);
  }

  // Send payment confirmation
  sendPaymentConfirmation(userId, paymentData) {
    this.notifyUser(userId, 'payment_confirmed', paymentData);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return {
      customers: this.connectedUsers.size,
      admins: this.connectedAdmins.size,
      riders: this.connectedRiders.size,
      total: this.connectedUsers.size + this.connectedAdmins.size + this.connectedRiders.size
    };
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Check if rider is online
  isRiderOnline(riderId) {
    return this.connectedRiders.has(riderId);
  }

  // Send system notification to all users
  broadcastSystemNotification(message, type = 'info') {
    this.io.emit('system_notification', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  // Emergency broadcast (service interruption, etc.)
  emergencyBroadcast(message) {
    this.io.emit('emergency_notification', {
      message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new RealtimeService();