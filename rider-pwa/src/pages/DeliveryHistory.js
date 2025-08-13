import React, { useContext, useState } from 'react';
import { Container, Row, Col, Card, Badge, Form } from 'react-bootstrap';
import { RiderContext } from '../context/RiderContext';

const DeliveryHistory = () => {
  const { deliveryHistory } = useContext(RiderContext);
  const [filterPeriod, setFilterPeriod] = useState('week');

  const getStatusVariant = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateEarnings = () => {
    return deliveryHistory
      .filter(delivery => delivery.status === 'delivered')
      .reduce((total, delivery) => total + (delivery.delivery_fee || 50), 0);
  };

  const filteredHistory = deliveryHistory.filter(delivery => {
    const deliveryDate = new Date(delivery.completed_at || delivery.created_at);
    const now = new Date();
    const daysDiff = Math.floor((now - deliveryDate) / (1000 * 60 * 60 * 24));
    
    switch (filterPeriod) {
      case 'today': return daysDiff === 0;
      case 'week': return daysDiff <= 7;
      case 'month': return daysDiff <= 30;
      default: return true;
    }
  });

  return (
    <Container fluid>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Delivery History</h2>
            <Form.Select 
              style={{ width: '200px' }} 
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </Form.Select>
          </div>

          {/* Summary Stats */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-primary">{filteredHistory.length}</h3>
                  <p className="text-muted mb-0">Total Deliveries</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-success">
                    {filteredHistory.filter(d => d.status === 'delivered').length}
                  </h3>
                  <p className="text-muted mb-0">Completed</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-success">KSH {calculateEarnings()}</h3>
                  <p className="text-muted mb-0">Earnings</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-info">
                    {filteredHistory.length > 0 ? 
                      (calculateEarnings() / filteredHistory.filter(d => d.status === 'delivered').length || 0).toFixed(0) : 
                      0
                    }
                  </h3>
                  <p className="text-muted mb-0">Avg per Delivery</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Delivery List */}
          <Row>
            {filteredHistory.length === 0 ? (
              <Col>
                <Card className="text-center p-4">
                  <h5>No deliveries found</h5>
                  <p className="text-muted">
                    {filterPeriod === 'today' 
                      ? 'No deliveries completed today.' 
                      : `No deliveries found for the selected period.`}
                  </p>
                </Card>
              </Col>
            ) : (
              filteredHistory.map(delivery => (
                <Col md={6} lg={4} key={delivery.id} className="mb-4">
                  <Card className="order-card h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <strong>Order #{delivery.id}</strong>
                      <Badge bg={getStatusVariant(delivery.status)}>
                        {delivery.status?.toUpperCase()}
                      </Badge>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <strong>Customer:</strong> {delivery.customer_name}
                      </div>
                      <div className="mb-2">
                        <strong>Address:</strong><br />
                        <small>{delivery.delivery_address}</small>
                      </div>
                      <div className="mb-2">
                        <strong>Order Value:</strong> KSH {delivery.total_amount}
                      </div>
                      <div className="mb-2">
                        <strong>Delivery Fee:</strong> KSH {delivery.delivery_fee || 50}
                      </div>
                      {delivery.rating && (
                        <div className="mb-2">
                          <strong>Rating:</strong> 
                          <span className="ms-1">
                            {'⭐'.repeat(delivery.rating)} ({delivery.rating}/5)
                          </span>
                        </div>
                      )}
                      {delivery.delivery_notes && (
                        <div className="mb-2">
                          <strong>Notes:</strong><br />
                          <small className="text-muted">{delivery.delivery_notes}</small>
                        </div>
                      )}
                    </Card.Body>
                    <Card.Footer className="text-muted small">
                      {delivery.status === 'delivered' ? 'Completed' : 'Created'}: {formatDate(delivery.completed_at || delivery.created_at)}
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

export default DeliveryHistory;