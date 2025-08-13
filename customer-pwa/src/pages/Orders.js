import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Button } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isSignedIn, isLoaded } = useAuth();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
  }, [isLoaded, isSignedIn]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await user.getToken();
      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401) {
        setError('Please sign in to view your orders.');
      } else {
        setError('Failed to load orders. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', icon: 'clock', text: 'Pending' },
      confirmed: { variant: 'info', icon: 'check-circle', text: 'Confirmed' },
      preparing: { variant: 'primary', icon: 'utensils', text: 'Preparing' },
      ready: { variant: 'success', icon: 'check', text: 'Ready' },
      out_for_delivery: { variant: 'warning', icon: 'truck', text: 'Out for Delivery' },
      delivered: { variant: 'success', icon: 'check-double', text: 'Delivered' },
      cancelled: { variant: 'danger', icon: 'times', text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge bg={config.variant} className="status-badge">
        <i className={`fas fa-${config.icon} me-1`}></i>
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstimatedDeliveryTime = (createdAt) => {
    const orderTime = new Date(createdAt);
    const estimatedTime = new Date(orderTime.getTime() + 45 * 60000); // Add 45 minutes
    return estimatedTime.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show sign-in prompt if user is not authenticated - Updated 2025
  if (isLoaded && !isSignedIn) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className="text-center">
              <div className="mb-4">
                <i className="fas fa-user-lock fa-4x text-muted mb-3"></i>
                <h2 className="h3 mb-3">Sign In Required</h2>
                <p className="text-muted mb-4">
                  You need to sign in to view your order history and track your deliveries.
                </p>
              </div>
              
              <div className="d-grid gap-2 d-md-block">
                <Link to="/login" className="btn btn-primary btn-lg me-md-2">
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-outline-primary btn-lg">
                  <i className="fas fa-user-plus me-2"></i>
                  Create Account
                </Link>
              </div>
              
              <div className="mt-4 pt-4 border-top">
                <p className="text-muted mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  Want to browse first?
                </p>
                <Link to="/menu" className="btn btn-outline-secondary">
                  <i className="fas fa-utensils me-2"></i>
                  View Menu
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-5">
        <Row>
          <Col>
            <div className="text-center">
              <div className="loading-spinner mb-3"></div>
              <p>Loading your orders...</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Row>
          <Col>
            <Alert variant="danger" className="alert-custom">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
            <div className="text-center">
              <Button onClick={fetchOrders} variant="primary">
                <i className="fas fa-redo me-2"></i>
                Try Again
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container className="py-5">
        <Row>
          <Col>
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fas fa-receipt"></i>
              </div>
              <h3 className="empty-state-title">No orders yet</h3>
              <p className="empty-state-description">
                You haven't placed any orders yet. Start by exploring our delicious menu!
              </p>
              <Button href="/menu" size="lg" className="mt-3">
                <i className="fas fa-utensils me-2"></i>
                Browse Menu
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col>
          <h1 className="h2 mb-4">
            <i className="fas fa-receipt me-2 text-primary"></i>
            My Orders
          </h1>
        </Col>
      </Row>

      <Row>
        <Col>
          {orders.map(order => (
            <Card key={order.id} className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">
                    Order #{order.id}
                  </h6>
                  <small className="text-muted">
                    Placed on {formatDate(order.created_at)}
                  </small>
                </div>
                <div className="text-end">
                  {getStatusBadge(order.status)}
                </div>
              </Card.Header>

              <Card.Body>
                <Row>
                  <Col md={8}>
                    {/* Order Items */}
                    <div className="mb-3">
                      <h6 className="mb-2">
                        <i className="fas fa-list me-2"></i>
                        Items Ordered
                      </h6>
                      {order.items.map((item, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <span className="fw-medium">{item.name}</span>
                            {item.category && (
                              <span className="category-badge ms-2">{item.category}</span>
                            )}
                            <div className="small text-muted">
                              Quantity: {item.quantity}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-medium">
                              {(item.price * item.quantity).toLocaleString()} KSh
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Address */}
                    <div className="mb-3">
                      <h6 className="mb-2">
                        <i className="fas fa-map-marker-alt me-2"></i>
                        Delivery Address
                      </h6>
                      <div className="small">
                        <div>{order.delivery_address.address}</div>
                        {order.delivery_address.building && (
                          <div>{order.delivery_address.building}</div>
                        )}
                        {order.delivery_address.floor && order.delivery_address.office && (
                          <div>{order.delivery_address.floor}, {order.delivery_address.office}</div>
                        )}
                        {order.delivery_address.landmark && (
                          <div className="text-muted">Near: {order.delivery_address.landmark}</div>
                        )}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mb-3">
                      <h6 className="mb-2">
                        <i className="fas fa-phone me-2"></i>
                        Contact
                      </h6>
                      <div className="small">
                        {order.phone}
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    {/* Order Summary */}
                    <div className="bg-light p-3 rounded">
                      <h6 className="mb-3">Order Summary</h6>
                      
                      <div className="d-flex justify-content-between mb-2">
                        <span>Total Amount</span>
                        <strong>{order.total_amount.toLocaleString()} KSh</strong>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-3">
                        <span>Payment Status</span>
                        <Badge bg={order.payment_status === 'completed' ? 'success' : 'warning'}>
                          {order.payment_status || 'Pending'}
                        </Badge>
                      </div>

                      {order.status === 'preparing' && (
                        <Alert variant="info" className="alert-custom small mb-3">
                          <i className="fas fa-clock me-2"></i>
                          Estimated delivery: {getEstimatedDeliveryTime(order.created_at)}
                        </Alert>
                      )}

                      {order.status === 'out_for_delivery' && (
                        <Alert variant="warning" className="alert-custom small mb-3">
                          <i className="fas fa-truck me-2"></i>
                          Your order is on the way!
                        </Alert>
                      )}

                      {order.status === 'delivered' && (
                        <Alert variant="success" className="alert-custom small mb-3">
                          <i className="fas fa-check-circle me-2"></i>
                          Order delivered successfully!
                        </Alert>
                      )}

                      {/* Action Buttons */}
                      <div className="d-grid gap-2">
                        {order.status === 'pending' && (
                          <Button variant="outline-danger" size="sm">
                            <i className="fas fa-times me-2"></i>
                            Cancel Order
                          </Button>
                        )}
                        
                        <Button 
                          href={`https://wa.me/254700000000?text=Hi, I need help with order ${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outline-success" 
                          size="sm"
                        >
                          <i className="fab fa-whatsapp me-2"></i>
                          Contact Support
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Col>
      </Row>

      {/* Support Section */}
      <Row className="mt-5">
        <Col>
          <Card className="border-0 bg-light">
            <Card.Body className="text-center">
              <h5 className="mb-3">
                <i className="fas fa-headset text-primary me-2"></i>
                Need Help?
              </h5>
              <p className="mb-3">
                Our support team is here to help with any questions about your orders.
              </p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <Button 
                  href="https://wa.me/254700000000" 
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="success"
                >
                  <i className="fab fa-whatsapp me-2"></i>
                  WhatsApp
                </Button>
                <Button 
                  href="tel:+254700000000" 
                  variant="primary"
                >
                  <i className="fas fa-phone me-2"></i>
                  Call Us
                </Button>
                <Button 
                  href="mailto:support@choprice.co.ke" 
                  variant="outline-primary"
                >
                  <i className="fas fa-envelope me-2"></i>
                  Email
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Orders;