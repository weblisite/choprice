import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const RiderContext = createContext();

export { RiderContext };

export const RiderProvider = ({ children }) => {
  const { user, isSignedIn } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [riderStatus, setRiderStatus] = useState('offline'); // offline, available, busy
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [locationTracking, setLocationTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    if (isSignedIn && user) {
      // Initialize socket connection
      const newSocket = io(API_BASE_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Rider connected to real-time service');
        setConnected(true);
        
        // Authenticate as rider
        newSocket.emit('authenticate', {
          userId: user.id,
          userType: 'rider',
          riderId: user.id
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Rider disconnected from real-time service');
        setConnected(false);
      });

      // New order available
      newSocket.on('new_order_available', (orderData) => {
        console.log('New order available:', orderData);
        
        setAvailableOrders(prev => [orderData, ...prev]);
        
        toast('New delivery available! 🍚', {
          icon: '🚚',
          duration: 6000,
          onClick: () => {
            // Navigate to available orders
            window.location.href = '/available-orders';
          }
        });
      });

      // Order assignment
      newSocket.on('order_assigned', (orderData) => {
        console.log('Order assigned:', orderData);
        
        setActiveOrder(orderData);
        setRiderStatus('busy');
        
        toast.success('Order assigned to you!', {
          icon: '📦',
          duration: 5000
        });
        
        // Remove from available orders
        setAvailableOrders(prev => 
          prev.filter(order => order.orderId !== orderData.orderId)
        );
      });

      // Order updates
      newSocket.on('order_updated', (data) => {
        console.log('Order updated:', data);
        
        if (activeOrder && activeOrder.orderId === data.orderId) {
          setActiveOrder(prev => ({
            ...prev,
            status: data.status
          }));
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isSignedIn, user, API_BASE_URL]);

  // Start location tracking
  const startLocationTracking = () => {
    if ('geolocation' in navigator) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      };

      const id = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };

          setCurrentLocation(location);

          // Send location update to server
          if (socket && connected && activeOrder) {
            socket.emit('rider_location_update', {
              riderId: user.id,
              location,
              orderId: activeOrder.orderId
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Failed to get location. Please enable GPS.');
        },
        options
      );

      setWatchId(id);
      setLocationTracking(true);
      toast.success('Location tracking started');
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLocationTracking(false);
      toast('Location tracking stopped');
    }
  };

  // Update rider status
  const updateRiderStatus = (status) => {
    setRiderStatus(status);
    
    if (socket && connected) {
      socket.emit('rider_status_update', {
        riderId: user.id,
        status,
        orderId: activeOrder?.orderId
      });
    }

    const statusMessages = {
      'available': 'You are now available for deliveries',
      'busy': 'Status updated to busy',
      'offline': 'You are now offline'
    };

    toast(statusMessages[status] || `Status updated: ${status}`);
  };

  // Accept order
  const acceptOrder = async (order) => {
    try {
      // Call API to accept order
      const response = await fetch(`${API_BASE_URL}/api/rider/accept-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getToken()}`
        },
        body: JSON.stringify({
          orderId: order.orderId,
          riderId: user.id
        })
      });

      if (response.ok) {
        setActiveOrder(order);
        setRiderStatus('busy');
        
        // Remove from available orders
        setAvailableOrders(prev => 
          prev.filter(o => o.orderId !== order.orderId)
        );

        // Start location tracking
        startLocationTracking();

        toast.success('Order accepted! Navigate to pickup location.');
        
        return true;
      } else {
        toast.error('Failed to accept order');
        return false;
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order');
      return false;
    }
  };

  // Update delivery status
  const updateDeliveryStatus = (status) => {
    if (!activeOrder) return;

    if (socket && connected) {
      socket.emit('rider_status_update', {
        riderId: user.id,
        status,
        orderId: activeOrder.orderId
      });
    }

    setActiveOrder(prev => ({
      ...prev,
      status
    }));

    const statusMessages = {
      'picked_up': 'Order picked up successfully',
      'nearby': 'Marked as nearby customer',
      'delivered': 'Order delivered successfully'
    };

    toast.success(statusMessages[status] || `Status updated: ${status}`);

    // If delivered, complete the order
    if (status === 'delivered') {
      completeDelivery();
    }
  };

  // Complete delivery
  const completeDelivery = () => {
    if (activeOrder) {
      // Add to delivery history
      setDeliveryHistory(prev => [{
        ...activeOrder,
        completedAt: new Date().toISOString(),
        status: 'delivered'
      }, ...prev]);

      setActiveOrder(null);
      setRiderStatus('available');
      stopLocationTracking();

      toast.success('Delivery completed! 🎉');
    }
  };

  // Get current location once
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            setCurrentLocation(location);
            resolve(location);
          },
          (error) => {
            console.error('Geolocation error:', error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  const value = {
    socket,
    connected,
    riderStatus,
    currentLocation,
    activeOrder,
    availableOrders,
    deliveryHistory,
    locationTracking,
    updateRiderStatus,
    acceptOrder,
    updateDeliveryStatus,
    completeDelivery,
    startLocationTracking,
    stopLocationTracking,
    getCurrentLocation,
    calculateDistance
  };

  return (
    <RiderContext.Provider value={value}>
      {children}
    </RiderContext.Provider>
  );
};

export const useRider = () => {
  const context = useContext(RiderContext);
  if (!context) {
    throw new Error('useRider must be used within a RiderProvider');
  }
  return context;
};