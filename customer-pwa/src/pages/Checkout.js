import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useCart } from '../context/CartContext';
import AddressAutocomplete from '../components/AddressAutocomplete';
import axios from 'axios';

const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart, deliveryAddress, setDeliveryAddress } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [addressValid, setAddressValid] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    building: '',
    floor: '',
    office: '',
    landmark: '',
    notes: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    // Redirect if cart is empty
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    // Pre-fill form with saved data
    if (deliveryAddress) {
      setFormData(prev => ({
        ...prev,
        ...deliveryAddress
      }));
    }

    // Pre-fill phone from user data
    if (user?.phoneNumbers?.[0]?.phoneNumber) {
      setFormData(prev => ({
        ...prev,
        phone: user.phoneNumbers[0].phoneNumber
      }));
    }
  }, [cartItems.length, navigate, deliveryAddress, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (address) => {
    setFormData(prev => ({
      ...prev,
      address
    }));
  };

  const handleAddressSelect = (addressData) => {
    setSelectedLocation(addressData.location);
    setAddressValid(addressData.success && addressData.isInDeliveryArea?.inArea);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.phone || !formData.address) {
        throw new Error('Phone number and address are required');
      }

      if (!addressValid) {
        throw new Error('Please select a valid delivery address in our service area');
      }

      // Format phone number for M-Pesa (ensure it starts with 254)
      let formattedPhone = formData.phone.replace(/\s+/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }

      const total = getCartTotal();
      const deliveryFee = total >= 390 ? 0 : 50;
      const finalTotal = total + deliveryFee;

      // Save delivery address
      const addressData = {
        address: formData.address,
        building: formData.building,
        floor: formData.floor,
        office: formData.office,
        landmark: formData.landmark,
        notes: formData.notes,
        phone: formattedPhone
      };
      setDeliveryAddress(addressData);

      // Create order
      const orderData = {
        items: cartItems,
        delivery_address: addressData,
        phone: formattedPhone,
        total_amount: finalTotal
      };

      const orderResponse = await axios.post(`${API_BASE_URL}/api/orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || 'Failed to create order');
      }

      const orderId = orderResponse.data.data.id;

      // Initiate M-Pesa payment
      const paymentData = {
        phone: formattedPhone,
        amount: finalTotal,
        order_id: orderId
      };

      const paymentResponse = await axios.post(`${API_BASE_URL}/api/mpesa/stkpush`, paymentData, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (paymentResponse.data.success) {
        setSuccess('Payment request sent to your phone. Please complete the M-Pesa payment.');
        
        // Clear cart after successful order creation
        setTimeout(() => {
          clearCart();
          navigate('/orders');
        }, 3000);
      } else {
        throw new Error(paymentResponse.data.message || 'Payment initiation failed');
      }

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const total = getCartTotal();
  const deliveryFee = total >= 390 ? 0 : 50;
  const finalTotal = total + deliveryFee;
  const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Container className="py-5">
      <Row>
        <Col>
          <h1 className="h2 mb-4">
            <i className="fas fa-credit-card me-2 text-primary"></i>
            Checkout
          </h1>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          {/* Delivery Information Form */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-map-marker-alt me-2"></i>
                Delivery Information
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Phone Number <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="0700000000 or +254700000000"
                        required
                      />
                      <Form.Text className="text-muted">
                        M-Pesa payment will be sent to this number
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Delivery Address <span className="text-danger">*</span>
                      </Form.Label>
                      <AddressAutocomplete
                        value={formData.address}
                        onChange={handleAddressChange}
                        onAddressSelect={handleAddressSelect}
                        placeholder="Start typing your address..."
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Building Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="building"
                        value={formData.building}
                        onChange={handleInputChange}
                        placeholder="e.g., ABC Place, XYZ Tower"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Floor</Form.Label>
                      <Form.Control
                        type="text"
                        name="floor"
                        value={formData.floor}
                        onChange={handleInputChange}
                        placeholder="e.g., 5th Floor"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Office/Room</Form.Label>
                      <Form.Control
                        type="text"
                        name="office"
                        value={formData.office}
                        onChange={handleInputChange}
                        placeholder="e.g., Room 503"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Landmark</Form.Label>
                  <Form.Control
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    placeholder="e.g., Near Sarit Centre, Opposite KFC"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Special Instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special delivery instructions..."
                  />
                </Form.Group>

                {error && (
                  <Alert variant="danger" className="alert-custom">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" className="alert-custom">
                    <i className="fas fa-check-circle me-2"></i>
                    {success}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner me-2"></div>
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-mobile-alt me-2"></i>
                      Pay with M-Pesa ({finalTotal.toLocaleString()} KSh)
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Order Summary */}
          <Card className="sticky-top" style={{ top: '2rem' }}>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-receipt me-2"></i>
                Order Summary
              </h5>
            </Card.Header>
            <Card.Body>
              {/* Order Items */}
              <div className="mb-3">
                {cartItems.map(item => (
                  <div key={item.id} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <div className="fw-medium">{item.name}</div>
                      <small className="text-muted">
                        {item.quantity} × {item.price} KSh
                      </small>
                    </div>
                    <div className="fw-medium">
                      {(item.price * item.quantity).toLocaleString()} KSh
                    </div>
                  </div>
                ))}
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal ({itemsCount} items)</span>
                <span>{total.toLocaleString()} KSh</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? 'text-success' : ''}>
                  {deliveryFee === 0 ? 'FREE' : `${deliveryFee} KSh`}
                </span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-3">
                <strong>Total</strong>
                <strong className="text-primary fs-5">
                  {finalTotal.toLocaleString()} KSh
                </strong>
              </div>

              <Alert variant="info" className="alert-custom small">
                <i className="fas fa-mobile-alt me-2"></i>
                Payment will be processed via M-Pesa STK Push
              </Alert>
            </Card.Body>
          </Card>

          {/* Security Info */}
          <Card className="mt-4">
            <Card.Body className="text-center">
              <h6 className="mb-3">
                <i className="fas fa-shield-alt text-success me-2"></i>
                Secure Payment
              </h6>
              <div className="small text-muted">
                <div className="mb-2">
                  <i className="fas fa-lock me-2"></i>
                  Your payment is secured by M-Pesa
                </div>
                <div className="mb-2">
                  <i className="fas fa-clock me-2"></i>
                  Order confirmation within minutes
                </div>
                <div>
                  <i className="fas fa-phone me-2"></i>
                  Support: +254 700 000 000
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout;