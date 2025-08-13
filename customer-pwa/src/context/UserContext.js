import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user, isSignedIn } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [preferences, setPreferences] = useState({
    notifications: true,
    emailUpdates: true,
    smsUpdates: true,
    defaultAddress: null,
    dietaryRestrictions: [],
    preferredCategories: []
  });
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    if (isSignedIn && user) {
      loadUserProfile();
      loadFavorites();
      loadSavedAddresses();
      loadOrderHistory();
      loadPreferences();
    }
  }, [isSignedIn, user]);

  const loadUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setUserProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Create profile if it doesn't exist
      if (error.response?.status === 404) {
        await createUserProfile();
      }
    }
  };

  const createUserProfile = async () => {
    try {
      const profileData = {
        email: user.emailAddresses[0]?.emailAddress,
        phone: user.phoneNumbers[0]?.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        preferences: preferences
      };

      const response = await axios.post(`${API_BASE_URL}/api/user/profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setUserProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      setLoading(true);
      const response = await axios.patch(`${API_BASE_URL}/api/user/profile`, updates, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setUserProfile(prev => ({ ...prev, ...updates }));
        toast.success('Profile updated successfully');
        return true;
      } else {
        toast.error('Failed to update profile');
        return false;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/favorites`, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setFavoriteItems(response.data.data);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const addToFavorites = async (menuItem) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/favorites`, {
        menuItemId: menuItem.id,
        menuItem: menuItem
      }, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setFavoriteItems(prev => [...prev, menuItem]);
        toast.success(`${menuItem.name} added to favorites!`);
        return true;
      } else {
        toast.error('Failed to add to favorites');
        return false;
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error('Failed to add to favorites');
      return false;
    }
  };

  const removeFromFavorites = async (menuItemId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/user/favorites/${menuItemId}`, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setFavoriteItems(prev => prev.filter(item => item.id !== menuItemId));
        toast.success('Removed from favorites');
        return true;
      } else {
        toast.error('Failed to remove from favorites');
        return false;
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Failed to remove from favorites');
      return false;
    }
  };

  const isFavorite = (menuItemId) => {
    return favoriteItems.some(item => item.id === menuItemId);
  };

  const loadSavedAddresses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/addresses`, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setSavedAddresses(response.data.data);
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  const saveAddress = async (addressData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/addresses`, addressData, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setSavedAddresses(prev => [response.data.data, ...prev]);
        toast.success('Address saved successfully');
        return response.data.data;
      } else {
        toast.error('Failed to save address');
        return null;
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
      return null;
    }
  };

  const updateAddress = async (addressId, updates) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/user/addresses/${addressId}`, updates, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setSavedAddresses(prev => 
          prev.map(addr => addr.id === addressId ? { ...addr, ...updates } : addr)
        );
        toast.success('Address updated successfully');
        return true;
      } else {
        toast.error('Failed to update address');
        return false;
      }
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('Failed to update address');
      return false;
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/user/addresses/${addressId}`, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setSavedAddresses(prev => prev.filter(addr => addr.id !== addressId));
        toast.success('Address deleted successfully');
        return true;
      } else {
        toast.error('Failed to delete address');
        return false;
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
      return false;
    }
  };

  const loadOrderHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setOrderHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error loading order history:', error);
    }
  };

  const reorderItems = async (orderItems) => {
    try {
      // Add items to cart (assuming we have access to cart context)
      return orderItems;
    } catch (error) {
      console.error('Error reordering items:', error);
      toast.error('Failed to reorder items');
      return null;
    }
  };

  const rateOrder = async (orderId, rating, review) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/orders/${orderId}/rate`, {
        rating,
        review
      }, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setOrderHistory(prev => 
          prev.map(order => 
            order.id === orderId 
              ? { ...order, rating, review, rated: true }
              : order
          )
        );
        toast.success('Thank you for your feedback!');
        return true;
      } else {
        toast.error('Failed to submit rating');
        return false;
      }
    } catch (error) {
      console.error('Error rating order:', error);
      toast.error('Failed to submit rating');
      return false;
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/preferences`, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setPreferences(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/user/preferences`, newPreferences, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        setPreferences(prev => ({ ...prev, ...newPreferences }));
        toast.success('Preferences updated successfully');
        return true;
      } else {
        toast.error('Failed to update preferences');
        return false;
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      return false;
    }
  };

  const getUserStats = () => {
    const completedOrders = orderHistory.filter(order => order.status === 'delivered');
    const totalSpent = completedOrders.reduce((total, order) => total + (order.total_amount || 0), 0);
    const favoriteCategories = favoriteItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    return {
      totalOrders: orderHistory.length,
      completedOrders: completedOrders.length,
      totalSpent,
      averageOrderValue: completedOrders.length > 0 ? Math.round(totalSpent / completedOrders.length) : 0,
      favoriteCount: favoriteItems.length,
      savedAddressCount: savedAddresses.length,
      favoriteCategories: Object.keys(favoriteCategories).sort((a, b) => favoriteCategories[b] - favoriteCategories[a])
    };
  };

  const value = {
    userProfile,
    favoriteItems,
    savedAddresses,
    orderHistory,
    preferences,
    loading,
    updateUserProfile,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    saveAddress,
    updateAddress,
    deleteAddress,
    reorderItems,
    rateOrder,
    updatePreferences,
    getUserStats,
    loadOrderHistory
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};