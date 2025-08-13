import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { isSignedIn } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="fas fa-utensils me-2"></i>
          Choprice
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                <i className="fas fa-home me-1"></i>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/menu">
                <i className="fas fa-list me-1"></i>
                Menu
              </Link>
            </li>
            {isSignedIn && (
              <li className="nav-item">
                <Link className="nav-link" to="/orders">
                  <i className="fas fa-receipt me-1"></i>
                  My Orders
                </Link>
              </li>
            )}
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item">
              <button
                className="nav-link btn btn-link position-relative"
                onClick={() => navigate('/cart')}
                style={{ border: 'none', background: 'none' }}
              >
                <i className="fas fa-shopping-cart me-1"></i>
                Cart
                {cartItemsCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {cartItemsCount}
                    <span className="visually-hidden">items in cart</span>
                  </span>
                )}
              </button>
            </li>
            
            {isSignedIn ? (
              <li className="nav-item d-flex align-items-center ms-2">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </li>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;