import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { FaUser, FaPhone, FaMapMarkerAlt, FaEnvelope } from 'react-icons/fa';

const GuestCheckout = ({ show, onHide, onGuestOrder, cartTotal, isLoading }) => {
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    area: '',
    landmark: '',
    specialInstructions: ''
  });
  const [errors, setErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!guestInfo.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!guestInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+254|0)[17]\d{8}$/.test(guestInfo.phone)) {
      newErrors.phone = 'Please enter a valid Kenyan phone number';
    }
    
    if (!guestInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(guestInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!guestInfo.address.trim()) {
      newErrors.address = 'Delivery address is required';
    }
    
    if (!guestInfo.area.trim()) {
      newErrors.area = 'Area is required';
    }
    
    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onGuestOrder(guestInfo);
    }
  };

  const handleInputChange = (field, value) => {
    setGuestInfo(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatPhoneNumber = (phone) => {
    // Auto-format Kenyan phone numbers
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      cleaned = '+254' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      cleaned = '+254' + cleaned;
    }
    return cleaned;
  };

  const handlePhoneChange = (value) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phone', formatted);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaUser className="me-2" />
          Guest Checkout
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Alert variant="info" className="mb-4">
          <strong>Quick Order:</strong> No account needed! Just provide your details below to place your order.
        </Alert>

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaUser className="me-2" />
                  Full Name *
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your full name"
                  value={guestInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaPhone className="me-2" />
                  Phone Number *
                </Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="+254712345678"
                  value={guestInfo.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  isInvalid={!!errors.phone}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phone}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>
              <FaEnvelope className="me-2" />
              Email Address *
            </Form.Label>
            <Form.Control
              type="email"
              placeholder="your.email@example.com"
              value={guestInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              isInvalid={!!errors.email}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              We'll send your order confirmation to this email
            </Form.Text>
          </Form.Group>

          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaMapMarkerAlt className="me-2" />
                  Delivery Address *
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Building name, street, house number"
                  value={guestInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  isInvalid={!!errors.address}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.address}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Area *</Form.Label>
                <Form.Select
                  value={guestInfo.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  isInvalid={!!errors.area}
                >
                  <option value="">Select Area</option>
                  <option value="Kilimani">Kilimani</option>
                  <option value="Kileleshwa">Kileleshwa</option>
                  <option value="Lavington">Lavington</option>
                  <option value="Hurlingham">Hurlingham</option>
                  <option value="Upper Hill">Upper Hill</option>
                  <option value="Westlands">Westlands</option>
                  <option value="Parklands">Parklands</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.area}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Landmark (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Near Nakumatt, opposite police station"
              value={guestInfo.landmark}
              onChange={(e) => handleInputChange('landmark', e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Special Instructions (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Any special delivery instructions or dietary requirements"
              value={guestInfo.specialInstructions}
              onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check
              type="checkbox"
              id="terms-checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              isInvalid={!!errors.terms}
              label={
                <span>
                  I agree to the <a href="#terms" target="_blank">Terms & Conditions</a> and <a href="#privacy" target="_blank">Privacy Policy</a>
                </span>
              }
            />
            <Form.Control.Feedback type="invalid">
              {errors.terms}
            </Form.Control.Feedback>
          </Form.Group>

          <Alert variant="success" className="mb-3">
            <strong>Order Total: {cartTotal.toLocaleString()} KSh</strong>
            <br />
            <small>Payment via M-Pesa on delivery</small>
          </Alert>
        </Form>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Placing Order...' : 'Place Order'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default GuestCheckout;