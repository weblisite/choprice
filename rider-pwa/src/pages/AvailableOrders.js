import React, { useContext } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { RiderContext } from '../context/RiderContext';

const AvailableOrders = () => {
  const { availableOrders, acceptOrder } = useContext(RiderContext);

  const handleAcceptOrder = async (orderId) => {
    try {
      await acceptOrder(orderId);
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col>
          <h2 className="mb-4">Available Orders</h2>
          
          {availableOrders.length === 0 ? (
            <Alert variant="info" className="text-center">
              <h5>No orders available</h5>
              <p className="mb-0">Check back later for new delivery opportunities.</p>
            </Alert>
          ) : (
            <Row>
              {availableOrders.map(order => (
                <Col md={6} lg={4} key={order.id} className="mb-4">
                  <Card className="order-card h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <strong>Order #{order.id}</strong>
                      <Badge bg="warning">Ready for Pickup</Badge>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <strong>Customer:</strong> {order.customer_name}
                      </div>
                      <div className="mb-2">
                        <strong>Phone:</strong> {order.customer_phone}
                      </div>
                      <div className="mb-2">
                        <strong>Pickup:</strong> Choprice Kitchen
                      </div>
                      <div className="mb-2">
                        <strong>Delivery Address:</strong><br />
                        <small>{order.delivery_address}</small>
                      </div>
                      <div className="mb-3">
                        <strong>Order Value:</strong> KSH {order.total_amount}
                      </div>
                      
                      <div className="mb-3">
                        <strong>Items:</strong>
                        <ul className="list-unstyled mt-1">
                          {order.items?.map((item, index) => (
                            <li key={index} className="small">
                              {item.quantity}x {item.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="d-grid">
                        <Button 
                          variant="primary"
                          onClick={() => handleAcceptOrder(order.id)}
                        >
                          Accept Delivery
                        </Button>
                      </div>
                    </Card.Body>
                    <Card.Footer className="text-muted small">
                      Ready since: {new Date(order.updated_at).toLocaleTimeString()}
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AvailableOrders;