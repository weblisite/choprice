import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const AdminContext = createContext();

export { AdminContext };

export const AdminProvider = ({ children }) => {
  const { user, isSignedIn } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [riders, setRiders] = useState([]);
  const [analytics, setAnalytics] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    popularDishes: []
  });
  const [loading, setLoading] = useState(false);
  
  // Demo data for development
  const [demoMode] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    // Initialize with demo data immediately for better UX
    if (demoMode) {
      setOrders([
        {
          id: 1,
          status: 'pending',
          total: 390,
          created_at: new Date().toISOString(),
          customer_name: 'Demo Customer',
          items: [{ name: 'Jollof Rice', quantity: 1, price: 390 }]
        }
      ]);
      setAnalytics({
        todayOrders: 12,
        todayRevenue: 4680,
        activeOrders: 3,
        completedOrders: 9,
        averageOrderValue: 390,
        totalCustomers: 45,
        popularDishes: []
      });
      setRiders([
        { id: 1, name: 'Demo Rider', status: 'available' }
      ]);
      setLoading(false);
    }

    if (isSignedIn && user) {
      // Initialize socket connection
      const newSocket = io(API_BASE_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Admin connected to real-time service');
        setConnected(true);
        
        // Authenticate as admin
        newSocket.emit('authenticate', {
          userId: user.id,
          userType: 'admin'
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Admin disconnected from real-time service');
        setConnected(false);
      });

      // New order notifications
      newSocket.on('new_order', (orderData) => {
        console.log('New order received:', orderData);
        
        setOrders(prev => [orderData, ...prev]);
        
        toast.success(`New order #${orderData.orderId} received!`, {
          icon: '🍚',
          duration: 6000
        });

        // Play notification sound
        playNotificationSound();
      });

      // Order confirmations
      newSocket.on('order_confirmed', (data) => {
        console.log('Order confirmed:', data);
        
        setOrders(prev => 
          prev.map(order => 
            order.orderId === data.orderId 
              ? { ...order, status: 'confirmed', paymentStatus: 'completed' }
              : order
          )
        );

        toast.success(`Order #${data.orderId} payment confirmed!`, {
          icon: '💳',
          duration: 4000
        });
      });

      // Order updates
      newSocket.on('order_updated', (data) => {
        console.log('Order updated:', data);
        
        setOrders(prev => 
          prev.map(order => 
            order.orderId === data.orderId 
              ? { ...order, status: data.status }
              : order
          )
        );
      });

      // Rider location updates
      newSocket.on('rider_location_updated', (data) => {
        console.log('Rider location updated:', data);
        
        setRiders(prev => 
          prev.map(rider => 
            rider.id === data.riderId 
              ? { ...rider, location: data.location, lastSeen: data.timestamp }
              : rider
          )
        );
      });

      // Rider status updates
      newSocket.on('rider_status_updated', (data) => {
        console.log('Rider status updated:', data);
        
        setRiders(prev => 
          prev.map(rider => 
            rider.id === data.riderId 
              ? { ...rider, status: data.status }
              : rider
          )
        );
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isSignedIn, user, API_BASE_URL, demoMode]);

  // Load initial data
  useEffect(() => {
    if (isSignedIn && user && !demoMode) {
      loadOrders().catch(console.error);
      loadMenuItems().catch(console.error);
      loadAnalytics().catch(console.error);
      loadRiders().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user, demoMode]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Could not play notification sound'));
    } catch (e) {
      console.log('Notification sound not available');
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/menu`);
      if (response.data.success) {
        setMenuItems(response.data.data);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadRiders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/riders`, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setRiders(response.data.data);
      }
    } catch (error) {
      console.error('Error loading riders:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/orders/${orderId}/status`, 
        { status },
        {
          headers: {
            'Authorization': `Bearer ${await user.getToken()}`
          }
        }
      );

      if (response.data.success) {
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId 
              ? { ...order, status, updatedAt: new Date().toISOString() }
              : order
          )
        );

        // Broadcast update via socket
        if (socket && connected) {
          socket.emit('admin_order_update', {
            orderId,
            status,
            message: getStatusMessage(status)
          });
        }

        toast.success(`Order #${orderId} status updated to ${status}`);
        return true;
      } else {
        toast.error('Failed to update order status');
        return false;
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      return false;
    }
  };

  const assignRiderToOrder = async (orderId, riderId) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/admin/orders/${orderId}/assign-rider`, 
        { riderId },
        {
          headers: {
            'Authorization': `Bearer ${await user.getToken()}`
          }
        }
      );

      if (response.data.success) {
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId 
              ? { ...order, riderId, status: 'out_for_delivery' }
              : order
          )
        );

        toast.success('Rider assigned successfully');
        return true;
      } else {
        toast.error('Failed to assign rider');
        return false;
      }
    } catch (error) {
      console.error('Error assigning rider:', error);
      toast.error('Failed to assign rider');
      return false;
    }
  };

  const updateMenuItemAvailability = async (itemId, isAvailable) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/admin/menu/${itemId}`, 
        { is_available: isAvailable },
        {
          headers: {
            'Authorization': `Bearer ${await user.getToken()}`
          }
        }
      );

      if (response.data.success) {
        setMenuItems(prev => 
          prev.map(item => 
            item.id === itemId 
              ? { ...item, is_available: isAvailable }
              : item
          )
        );

        toast.success(`Menu item ${isAvailable ? 'enabled' : 'disabled'}`);
        return true;
      } else {
        toast.error('Failed to update menu item');
        return false;
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error('Failed to update menu item');
      return false;
    }
  };

  const getStatusMessage = (status) => {
    const messages = {
      'pending': 'Order received and being processed',
      'confirmed': 'Order confirmed and payment received',
      'preparing': 'Order is being prepared in the kitchen',
      'ready': 'Order is ready for pickup',
      'out_for_delivery': 'Order is out for delivery',
      'delivered': 'Order has been delivered',
      'cancelled': 'Order has been cancelled'
    };
    return messages[status] || `Status updated to ${status}`;
  };

  const getOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status);
  };

  const getTodayOrders = () => {
    const today = new Date().toDateString();
    return orders.filter(order => 
      new Date(order.created_at || order.createdAt).toDateString() === today
    );
  };

  const getTodayRevenue = () => {
    const todayOrders = getTodayOrders();
    return todayOrders
      .filter(order => order.payment_status === 'completed' || order.paymentStatus === 'completed')
      .reduce((total, order) => total + (order.total_amount || order.totalAmount || 0), 0);
  };

  const getAverageOrderValue = () => {
    const completedOrders = orders.filter(order => 
      order.payment_status === 'completed' || order.paymentStatus === 'completed'
    );
    
    if (completedOrders.length === 0) return 0;
    
    const totalRevenue = completedOrders.reduce((total, order) => 
      total + (order.total_amount || order.totalAmount || 0), 0
    );
    
    return Math.round(totalRevenue / completedOrders.length);
  };

  const value = {
    socket,
    connected,
    orders,
    menuItems,
    riders,
    analytics: {
      ...analytics,
      todayOrders: getTodayOrders().length,
      todayRevenue: getTodayRevenue(),
      activeOrders: getOrdersByStatus('preparing').length + getOrdersByStatus('ready').length + getOrdersByStatus('out_for_delivery').length,
      completedOrders: getOrdersByStatus('delivered').length,
      averageOrderValue: getAverageOrderValue()
    },
    loading,
    updateOrderStatus,
    assignRiderToOrder,
    updateMenuItemAvailability,
    loadOrders,
    loadMenuItems,
    loadAnalytics,
    loadRiders,
    getOrdersByStatus,
    getTodayOrders,
    getTodayRevenue
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};