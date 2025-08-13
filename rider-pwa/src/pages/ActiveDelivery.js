import React, { useContext, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Form } from 'react-bootstrap';
import { RiderContext } from '../context/RiderContext';

const ActiveDelivery = () => {
  const { activeOrder, updateDeliveryStatus, completeDelivery } = useContext(RiderContext);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const handleStatusUpdate = async (status) => {
    try {
      await updateDeliveryStatus(activeOrder.id, status);
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const handleCompleteDelivery = async () => {
    try {
      await completeDelivery(activeOrder.id, deliveryNotes);
      setDeliveryNotes('');
    } catch (error) {
      console.error('Error completing delivery:', error);
    }
  };

  if (!activeOrder) {
    return (
      <Container fluid>
        <Row>
          <Col>
            <Alert variant="info" className="text-center">
              <h5>No Active Delivery</h5>
              <p className="mb-0">You don't have any active deliveries at the moment.</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          <h2 className="mb-4">Active Delivery</h2>
          
          <Row>
            <Col lg={8}>
              <Card className="order-card mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <strong>Order #{activeOrder.id}</strong>
                  <Badge bg="primary">
                    {activeOrder.status?.replace('_', ' ').toUpperCase() || 'OUT FOR DELIVERY'}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6>Customer Information</h6>
                      <p><strong>Name:</strong> {activeOrder.customer_name}</p>
                      <p><strong>Phone:</strong> {activeOrder.customer_phone}</p>
                      <p><strong>Order Value:</strong> KSH {activeOrder.total_amount}</p>
                    </Col>
                    <Col md={6}>
                      <h6>Delivery Address</h6>
                      <p>{activeOrder.delivery_address}</p>
                      <Button variant="outline-primary" size="sm">
                        📍 Open in Maps
                      </Button>
                    </Col>
                  </Row>
                  
                  <hr />
                  
                  <h6>Order Items</h6>
                  <ul className="list-unstyled">
                    {activeOrder.items?.map((item, index) => (
                      <li key={index} className="mb-1">
                        {item.quantity}x {item.name} - KSH {item.price * item.quantity}
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>

              {/* Delivery Progress */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Delivery Progress</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex gap-2 flex-wrap mb-3">
                    <Button 
                      variant={activeOrder.status === 'picked_up' ? 'success' : 'outline-success'}
                      size="sm"
                      onClick={() => handleStatusUpdate('picked_up')}
                      disabled={activeOrder.status === 'delivered'}
                    >
                      ✅ Picked Up
                    </Button>
                    <Button 
                      variant={activeOrder.status === 'en_route' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleStatusUpdate('en_route')}
                      disabled={activeOrder.status === 'delivered'}
                    >
                      🚴 En Route
                    </Button>
                    <Button 
                      variant={activeOrder.status === 'arrived' ? 'warning' : 'outline-warning'}
                      size="sm"
                      onClick={() => handleStatusUpdate('arrived')}
                      disabled={activeOrder.status === 'delivered'}
                    >
                      📍 Arrived
                    </Button>
                  </div>
                  
                  {activeOrder.status !== 'delivered' && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Delivery Notes (Optional)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          placeholder="Add any delivery notes or customer feedback..."
                        />
                      </Form.Group>
                      
                      <Button 
                        variant="success" 
                        size="lg"
                        onClick={handleCompleteDelivery}
                        className="w-100"
                      >
                        🎉 Complete Delivery
                      </Button>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button variant="outline-primary" size="sm">
                      📞 Call Customer
                    </Button>
                    <Button variant="outline-info" size="sm">
                      💬 Message Customer
                    </Button>
                    <Button variant="outline-warning" size="sm">
                      🏪 Call Restaurant
                    </Button>
                    <Button variant="outline-secondary" size="sm">
                      📍 Share Location
                    </Button>
                  </div>
                </Card.Body>
              </Card>
              
              <Card className="mt-4">
                <Card.Header>
                  <h5 className="mb-0">Delivery Tips</h5>
                </Card.Header>
                <Card.Body>
                  <ul className="list-unstyled small">
                    <li>✅ Confirm order items before pickup</li>
                    <li>🔒 Keep food secure during transport</li>
                    <li>📞 Call if you can't find the address</li>
                    <li>😊 Be polite and professional</li>
                    <li>📸 Take delivery photo if needed</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default ActiveDelivery;