import React, { useContext } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { RiderContext } from '../context/RiderContext';

const Dashboard = () => {
  const riderContext = useContext(RiderContext);
  
  // Provide safe defaults for all context values
  const activeOrder = riderContext?.activeOrder || null;
  const availableOrders = riderContext?.availableOrders || [];
  const deliveryStats = riderContext?.deliveryStats || {
    todayDeliveries: 0,
    todayEarnings: 0,
    averageRating: 0
  };
  const currentLocation = riderContext?.currentLocation || null;
  const acceptOrder = riderContext?.acceptOrder || (() => console.log('Accept order function not available'));

  const handleAcceptOrder = async (orderId) => {
    try {
      await acceptOrder(orderId);
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  // Debug: Check if context is available
  if (!riderContext) {
    return (
      <Container fluid>
        <Row>
          <Col>
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h4>Loading Rider Dashboard...</h4>
              <p className="text-muted">Connecting to rider services...</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          <h2 className="mb-4">🏍️ Rider Dashboard</h2>
          
          {/* Stats Overview */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="delivery-stats text-center">
                <Card.Body>
                  <h3>{deliveryStats.todayDeliveries || 0}</h3>
                  <p className="mb-0">Today's Deliveries</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-success">KSH {deliveryStats.todayEarnings || 0}</h3>
                  <p className="text-muted mb-0">Today's Earnings</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-info">{deliveryStats.averageRating || 0}</h3>
                  <p className="text-muted mb-0">Average Rating</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-warning">{availableOrders.length}</h3>
                  <p className="text-muted mb-0">Available Orders</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Current Location */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <span className="location-indicator connected"></span>
                    Current Location
                  </h5>
                </Card.Header>
                <Card.Body>
                  {currentLocation ? (
                    <>
                      <p><strong>Latitude:</strong> {currentLocation.latitude}</p>
                      <p><strong>Longitude:</strong> {currentLocation.longitude}</p>
                      <p className="text-muted mb-0">
                        Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted">Location not available</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Active Delivery</h5>
                </Card.Header>
                <Card.Body>
                  {activeOrder ? (
                    <>
                      <h6>Order #{activeOrder.id}</h6>
                      <p><strong>Customer:</strong> {activeOrder.customer_name}</p>
                      <p><strong>Address:</strong> {activeOrder.delivery_address}</p>
                      <Badge bg="primary">In Progress</Badge>
                    </>
                  ) : (
                    <p className="text-muted">No active delivery</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Available Orders */}
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Available Orders ({availableOrders.length})</h5>
                </Card.Header>
                <Card.Body>
                  {availableOrders.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-4">
                        <i className="fas fa-motorcycle fa-3x text-muted mb-3"></i>
                        <h5>No Orders Available</h5>
                        <p className="text-muted mb-3">
                          There are currently no delivery orders waiting for pickup.
                        </p>
                        <div className="row g-3 justify-content-center">
                          <div className="col-auto">
                            <div className="d-flex align-items-center">
                              <i className="fas fa-clock text-info me-2"></i>
                              <small className="text-muted">Check back soon for new orders</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Row>
                      {availableOrders.slice(0, 3).map(order => (
                        <Col md={4} key={order.id} className="mb-3">
                          <Card className="order-card">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6>Order #{order.id}</h6>
                                <Badge bg="warning">Ready</Badge>
                              </div>
                              <p className="small mb-1">
                                <strong>Customer:</strong> {order.customer_name}
                              </p>
                              <p className="small mb-1">
                                <strong>Address:</strong> {order.delivery_address}
                              </p>
                              <p className="small mb-2">
                                <strong>Value:</strong> KSH {order.total_amount}
                              </p>
                              <Button 
                                variant="primary" 
                                size="sm" 
                                className="w-100"
                                onClick={() => handleAcceptOrder(order.id)}
                              >
                                Accept Order
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;