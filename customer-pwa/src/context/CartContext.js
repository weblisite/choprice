import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      } else {
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }]
        };
      }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };

    case 'SET_DELIVERY_ADDRESS':
      return {
        ...state,
        deliveryAddress: action.payload
      };

    case 'UPDATE_ADDON':
      return {
        ...state,
        addOns: {
          ...state.addOns,
          [action.payload.id]: action.payload.quantity > 0 ? {
            ...action.payload.addOn,
            quantity: action.payload.quantity
          } : undefined
        }
      };

    case 'CLEAR_ADDONS':
      return {
        ...state,
        addOns: {}
      };

    default:
      return state;
  }
};

const initialState = {
  items: [],
  addOns: {},
  deliveryAddress: null
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('choprice_cart');
    if (savedCart) {
      const cartData = JSON.parse(savedCart);
      cartData.items.forEach(item => {
        dispatch({ type: 'ADD_TO_CART', payload: item });
        if (item.quantity > 1) {
          dispatch({
            type: 'UPDATE_QUANTITY',
            payload: { id: item.id, quantity: item.quantity }
          });
        }
      });
    }

    const savedAddress = localStorage.getItem('choprice_delivery_address');
    if (savedAddress) {
      dispatch({
        type: 'SET_DELIVERY_ADDRESS',
        payload: JSON.parse(savedAddress)
      });
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('choprice_cart', JSON.stringify(state));
  }, [state]);

  // Save delivery address to localStorage whenever it changes
  useEffect(() => {
    if (state.deliveryAddress) {
      localStorage.setItem('choprice_delivery_address', JSON.stringify(state.deliveryAddress));
    }
  }, [state.deliveryAddress]);

  const addToCart = (item) => {
    dispatch({ type: 'ADD_TO_CART', payload: item });
  };

  const removeFromCart = (itemId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const setDeliveryAddress = (address) => {
    dispatch({ type: 'SET_DELIVERY_ADDRESS', payload: address });
  };

  const updateAddOn = (addOnId, quantity, addOn) => {
    dispatch({ type: 'UPDATE_ADDON', payload: { id: addOnId, quantity, addOn } });
  };

  const clearAddOns = () => {
    dispatch({ type: 'CLEAR_ADDONS' });
  };

  const getCartTotal = () => {
    const itemsTotal = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const addOnsTotal = Object.values(state.addOns).reduce((total, addOn) => {
      return addOn ? total + (addOn.price * addOn.quantity) : total;
    }, 0);
    return itemsTotal + addOnsTotal;
  };

  const getCartItemsCount = () => {
    const itemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
    const addOnsCount = Object.values(state.addOns).reduce((total, addOn) => {
      return addOn ? total + addOn.quantity : total;
    }, 0);
    return itemsCount + addOnsCount;
  };

  const getAddOnsTotal = () => {
    return Object.values(state.addOns).reduce((total, addOn) => {
      return addOn ? total + (addOn.price * addOn.quantity) : total;
    }, 0);
  };

  const value = {
    cartItems: state.items,
    selectedAddOns: state.addOns,
    deliveryAddress: state.deliveryAddress,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setDeliveryAddress,
    updateAddOn,
    clearAddOns,
    getCartTotal,
    getCartItemsCount,
    getAddOnsTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};