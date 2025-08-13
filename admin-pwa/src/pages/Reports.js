import React, { useContext } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { AdminContext } from '../context/AdminContext';

const Reports = () => {
  const { analytics } = useContext(AdminContext);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Container fluid>
      <Row>
        <Col>
          <h2 className="mb-4">Business Reports & Analytics</h2>
          
          {/* Revenue Overview */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="dashboard-card text-center">
                <Card.Body>
                  <h3 className="text-primary">{formatCurrency(analytics.totalRevenue || 0)}</h3>
                  <p className="text-muted mb-0">Total Revenue</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="dashboard-card text-center">
                <Card.Body>
                  <h3 className="text-success">{analytics.totalOrders || 0}</h3>
                  <p className="text-muted mb-0">Total Orders</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="dashboard-card text-center">
                <Card.Body>
                  <h3 className="text-info">{analytics.averageOrderValue || 0}</h3>
                  <p className="text-muted mb-0">Avg Order Value</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="dashboard-card text-center">
                <Card.Body>
                  <h3 className="text-warning">{analytics.activeCustomers || 0}</h3>
                  <p className="text-muted mb-0">Active Customers</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Daily Stats */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Today's Performance</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Orders Today:</span>
                    <strong>{analytics.ordersToday || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Revenue Today:</span>
                    <strong>{formatCurrency(analytics.revenueToday || 0)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Pending Orders:</span>
                    <strong className="text-warning">{analytics.pendingOrders || 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Completed Orders:</span>
                    <strong className="text-success">{analytics.completedOrders || 0}</strong>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Popular Items</h5>
                </Card.Header>
                <Card.Body>
                  {analytics.popularItems && analytics.popularItems.length > 0 ? (
                    analytics.popularItems.map((item, index) => (
                      <div key={index} className="d-flex justify-content-between mb-2">
                        <span>{item.name}</span>
                        <strong>{item.orders_count} orders</strong>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No data available</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Weekly Trends */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Weekly Trends</h5>
                </Card.Header>
                <Card.Body>
                  <div className="row text-center">
                    <div className="col">
                      <h6>Monday</h6>
                      <p className="text-muted">
                        {analytics.weeklyStats?.monday || 0} orders
                      </p>
                    </div>
                    <div className="col">
                      <h6>Tuesday</h6>
                      <p className="text-muted">
                        {analytics.weeklyStats?.tuesday || 0} orders
                      </p>
                    </div>
                    <div className="col">
                      <h6>Wednesday</h6>
                      <p className="text-muted">
                        {analytics.weeklyStats?.wednesday || 0} orders
                      </p>
                    </div>
                    <div className="col">
                      <h6>Thursday</h6>
                      <p className="text-muted">
                        {analytics.weeklyStats?.thursday || 0} orders
                      </p>
                    </div>
                    <div className="col">
                      <h6>Friday</h6>
                      <p className="text-muted">
                        {analytics.weeklyStats?.friday || 0} orders
                      </p>
                    </div>
                    <div className="col">
                      <h6>Saturday</h6>
                      <p className="text-muted">
                        {analytics.weeklyStats?.saturday || 0} orders
                      </p>
                    </div>
                    <div className="col">
                      <h6>Sunday</h6>
                      <p className="text-muted">
                        {analytics.weeklyStats?.sunday || 0} orders
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Payment Methods */}
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Payment Methods</h5>
                </Card.Header>
                <Card.Body>
                  {analytics.paymentMethods && analytics.paymentMethods.length > 0 ? (
                    analytics.paymentMethods.map((method, index) => (
                      <div key={index} className="d-flex justify-content-between mb-2">
                        <span>{method.method}</span>
                        <strong>{method.count} orders</strong>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No data available</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Delivery Areas</h5>
                </Card.Header>
                <Card.Body>
                  {analytics.deliveryAreas && analytics.deliveryAreas.length > 0 ? (
                    analytics.deliveryAreas.map((area, index) => (
                      <div key={index} className="d-flex justify-content-between mb-2">
                        <span>{area.area}</span>
                        <strong>{area.orders} orders</strong>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No data available</p>
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

export default Reports;