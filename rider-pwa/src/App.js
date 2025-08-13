import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AvailableOrders from './pages/AvailableOrders';
import ActiveDelivery from './pages/ActiveDelivery';
import DeliveryHistory from './pages/DeliveryHistory';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { RiderProvider } from './context/RiderContext';
import './App.css';

function App() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading Choprice Rider...</p>
        </div>
      </div>
    );
  }

  return (
    <RiderProvider>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/available-orders" element={<AvailableOrders />} />
                    <Route path="/active-delivery" element={<ActiveDelivery />} />
                    <Route path="/history" element={<DeliveryHistory />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </main>
              </ProtectedRoute>
            }
          />
        </Routes>
        
        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
              maxWidth: '400px'
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff'
              }
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff'
              }
            }
          }}
        />
      </div>
    </RiderProvider>
  );
}

export default App;