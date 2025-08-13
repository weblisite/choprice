import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="col-md-6 col-lg-4 mb-4">
            <h5 className="text-primary mb-3">
              <i className="fas fa-utensils me-2"></i>
              Choprice
            </h5>
            <p className="mb-3">
              Premium rice dishes delivered fresh to your office in Nairobi. 
              Experience the finest selection of local and international rice delicacies.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-decoration-none">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-decoration-none">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-decoration-none">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://wa.me/254700000000" className="text-decoration-none" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
          </div>

          <div className="col-md-6 col-lg-2 mb-4">
            <h6 className="mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-decoration-none">Home</Link>
              </li>
              <li className="mb-2">
                <Link to="/menu" className="text-decoration-none">Menu</Link>
              </li>
              <li className="mb-2">
                <Link to="/orders" className="text-decoration-none">My Orders</Link>
              </li>
              <li className="mb-2">
                <Link to="/profile" className="text-decoration-none">Profile</Link>
              </li>
            </ul>
          </div>

          <div className="col-md-6 col-lg-3 mb-4">
            <h6 className="mb-3">Delivery Areas</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                Kilimani
              </li>
              <li className="mb-2">
                <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                Kileleshwa
              </li>
              <li className="mb-2">
                <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                Lavington
              </li>
              <li className="mb-2">
                <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                Westlands
              </li>
              <li className="mb-2">
                <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                Upper Hill
              </li>
            </ul>
          </div>

          <div className="col-md-6 col-lg-3 mb-4">
            <h6 className="mb-3">Contact Info</h6>
            <div className="mb-2">
              <i className="fas fa-phone me-2 text-primary"></i>
              <a href="tel:+254700000000" className="text-decoration-none">
                +254 700 000 000
              </a>
            </div>
            <div className="mb-2">
              <i className="fas fa-envelope me-2 text-primary"></i>
              <a href="mailto:support@choprice.co.ke" className="text-decoration-none">
                support@choprice.co.ke
              </a>
            </div>
            <div className="mb-2">
              <i className="fas fa-clock me-2 text-primary"></i>
              Mon-Fri: 11AM - 4PM
            </div>
            <div className="mb-2">
              <i className="fas fa-motorcycle me-2 text-primary"></i>
              30-45 min delivery
            </div>
          </div>
        </div>

        <hr className="my-4" />

        <div className="row align-items-center">
          <div className="col-md-6">
            <p className="mb-0">
              &copy; 2024 Choprice. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <small>
              <a href="#" className="text-decoration-none me-3">Privacy Policy</a>
              <a href="#" className="text-decoration-none me-3">Terms of Service</a>
              <a href="#" className="text-decoration-none">FAQ</a>
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;