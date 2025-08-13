import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { RiderProvider } from './context/RiderContext';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || 'pk_test_your_key_here';

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <RiderProvider>
          <App />
        </RiderProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);