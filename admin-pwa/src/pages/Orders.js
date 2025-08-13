import React, { useContext, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Alert } from 'react-bootstrap';
import { AdminContext } from '../context/AdminContext';

const Orders = () => {
  const { orders, updateOrderStatus, assignRiderToOrder, riders } = useContext(AdminContext);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [alertMessage, setAlertMessage] = useState('');

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setAlertMessage(`Order ${orderId} status updated to ${newStatus}`);
      setTimeout(() => setAlertMessage(''), 3000);
    } catch (error) {
      setAlertMessage(`Error updating order: ${error.message}`);
      setTimeout(() => setAlertMessage(''), 3000);
    }
  };

  const handleRiderAssignment = async (orderId, riderId) => {
    try {
      await assignRiderToOrder(orderId, riderId);
      setAlertMessage(`Rider assigned to order ${orderId}`);
      setTimeout(() => setAlertMessage(''), 3000);
    } catch (error) {
      setAlertMessage(`Error assigning rider: ${error.message}`);
      setTimeout(() => setAlertMessage(''), 3000);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'primary';
      case 'ready': return 'success';
      case 'out_for_delivery': return 'dark';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  return (
    <Container fluid>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Order Management</h2>
            <Form.Select 
              style={{ width: '200px' }} 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
          </div>

          {alertMessage && (
            <Alert variant="info" dismissible onClose={() => setAlertMessage('')}>
              {alertMessage}
            </Alert>
          )}

          <Row>
            {filteredOrders.length === 0 ? (
              <Col>
                <Card className="text-center p-4">
                  <h5>No orders found</h5>
                  <p className="text-muted">
                    {selectedStatus === 'all' 
                      ? 'No orders have been placed yet.' 
                      : `No orders with status "${selectedStatus}" found.`}
                  </p>
                </Card>
              </Col>
            ) : (
              filteredOrders.map(order => (
                <Col md={6} lg={4} key={order.id} className="mb-4">
                  <Card className="order-card h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <strong>Order #{order.id}</strong>
                      <Badge bg={getStatusVariant(order.status)}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <strong>Customer:</strong> {order.customer_name || 'Guest'}
                      </div>
                      <div className="mb-2">
                        <strong>Phone:</strong> {order.customer_phone || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <strong>Address:</strong> {order.delivery_address || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <strong>Total:</strong> KSH {order.total_amount}
                      </div>
                      <div className="mb-3">
                        <strong>Items:</strong>
                        <ul className="list-unstyled mt-1">
                          {order.items?.map((item, index) => (
                            <li key={index} className="small">
                              {item.quantity}x {item.name} - KSH {item.price * item.quantity}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="d-flex gap-2 flex-wrap">
                        {order.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                          >
                            Confirm
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            variant="primary"
                            onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button 
                            size="sm" 
                            variant="info"
                            onClick={() => handleStatusUpdate(order.id, 'ready')}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Form.Select 
                            size="sm"
                            onChange={(e) => e.target.value && handleRiderAssignment(order.id, e.target.value)}
                          >
                            <option value="">Assign Rider</option>
                            {riders.map(rider => (
                              <option key={rider.id} value={rider.id}>
                                {rider.name}
                              </option>
                            ))}
                          </Form.Select>
                        )}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                    <Card.Footer className="text-muted small">
                      Created: {new Date(order.created_at).toLocaleString()}
                    </Card.Footer>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Orders;