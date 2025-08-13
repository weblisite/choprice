import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const RealtimeContext = createContext();

export const RealtimeProvider = ({ children }) => {
  const { user, isSignedIn } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    if (isSignedIn && user) {
      // Initialize socket connection
      const newSocket = io(API_BASE_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to real-time service');
        setConnected(true);
        
        // Authenticate user
        newSocket.emit('authenticate', {
          userId: user.id,
          userType: 'customer'
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from real-time service');
        setConnected(false);
      });

      // Order status updates
      newSocket.on('order_status_updated', (data) => {
        console.log('Order status update:', data);
        
        setOrderUpdates(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 updates
        
        // Show toast notification
        toast.success(data.message || 'Order status updated', {
          icon: getStatusIcon(data.status),
          duration: 5000
        });

        // Add to notifications
        addNotification({
          id: Date.now(),
          type: 'order_update',
          title: 'Order Update',
          message: data.message,
          orderId: data.orderId,
          timestamp: data.timestamp,
          read: false
        });
      });

      // Payment confirmations
      newSocket.on('payment_confirmed', (data) => {
        console.log('Payment confirmed:', data);
        
        toast.success('Payment successful! Your order is being prepared.', {
          icon: '💳',
          duration: 6000
        });

        addNotification({
          id: Date.now(),
          type: 'payment',
          title: 'Payment Confirmed',
          message: `Payment of ${data.amount} KSh confirmed. Receipt: ${data.receipt}`,
          orderId: data.orderId,
          timestamp: data.timestamp,
          read: false
        });
      });

      // Order confirmations
      newSocket.on('order_confirmed', (data) => {
        console.log('Order confirmed:', data);
        
        toast.success('Order confirmed! Your meal is being prepared.', {
          icon: '🍚',
          duration: 5000
        });

        addNotification({
          id: Date.now(),
          type: 'order',
          title: 'Order Confirmed',
          message: 'Your order has been confirmed and is being prepared.',
          orderId: data.orderId,
          timestamp: data.timestamp,
          read: false
        });
      });

      // Kitchen updates
      newSocket.on('kitchen_update', (data) => {
        console.log('Kitchen update:', data);
        
        const messages = {
          'preparing': 'Your order is being prepared',
          'ready': 'Your order is ready for pickup',
          'out_for_delivery': 'Your order is out for delivery!'
        };

        const message = messages[data.status] || data.message;
        
        toast.success(message, {
          icon: getStatusIcon(data.status),
          duration: 5000
        });

        addNotification({
          id: Date.now(),
          type: 'kitchen',
          title: 'Kitchen Update',
          message: message,
          orderId: data.orderId,
          timestamp: data.timestamp,
          read: false
        });
      });

      // Rider location updates
      newSocket.on('rider_location_updated', (data) => {
        console.log('Rider location update:', data);
        
        if (data.orderId) {
          toast('Your rider is on the way! 🏍️', {
            icon: '📍',
            duration: 3000
          });
        }
      });

      // System notifications
      newSocket.on('system_notification', (data) => {
        console.log('System notification:', data);
        
        const toastType = data.type === 'error' ? toast.error : 
                         data.type === 'warning' ? toast : toast.success;
        
        toastType(data.message, {
          duration: 6000
        });

        addNotification({
          id: Date.now(),
          type: 'system',
          title: 'System Notification',
          message: data.message,
          timestamp: data.timestamp,
          read: false
        });
      });

      // Emergency notifications
      newSocket.on('emergency_notification', (data) => {
        console.log('Emergency notification:', data);
        
        toast.error(data.message, {
          icon: '🚨',
          duration: 10000
        });

        addNotification({
          id: Date.now(),
          type: 'emergency',
          title: 'Important Notice',
          message: data.message,
          timestamp: data.timestamp,
          read: false
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isSignedIn, user, API_BASE_URL]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const getUnreadNotificationsCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '✅',
      'preparing': '👨‍🍳',
      'ready': '🍽️',
      'out_for_delivery': '🚚',
      'delivered': '🎉',
      'cancelled': '❌'
    };
    return icons[status] || '📱';
  };

  const joinOrderRoom = (orderId) => {
    if (socket && connected) {
      socket.emit('join_order_room', { orderId });
    }
  };

  const leaveOrderRoom = (orderId) => {
    if (socket && connected) {
      socket.emit('leave_order_room', { orderId });
    }
  };

  const value = {
    socket,
    connected,
    orderUpdates,
    notifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationsCount,
    joinOrderRoom,
    leaveOrderRoom
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};