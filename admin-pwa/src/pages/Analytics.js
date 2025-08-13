import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, Button } from 'react-bootstrap';
import { useAdmin } from '../context/AdminContext';

const Analytics = () => {
  const { analytics, orders, menuItems, riders, loading } = useAdmin();
  const [dateRange, setDateRange] = useState('today');
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    revenue: [],
    orders: [],
    popularItems: [],
    customerInsights: [],
    riderPerformance: []
  });

  useEffect(() => {
    generateReports();
  }, [dateRange, selectedPeriod, orders]);

  const generateReports = () => {
    const filteredOrders = getFilteredOrders();
    
    setReportData({
      revenue: generateRevenueReport(filteredOrders),
      orders: generateOrdersReport(filteredOrders),
      popularItems: generatePopularItemsReport(filteredOrders),
      customerInsights: generateCustomerInsights(filteredOrders),
      riderPerformance: generateRiderPerformance(filteredOrders)
    });
  };

  const getFilteredOrders = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at || order.createdAt);
      
      switch (dateRange) {
        case 'today':
          return orderDate >= today;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          return orderDate >= monthAgo;
        case 'custom':
          const startDate = new Date(selectedPeriod.startDate);
          const endDate = new Date(selectedPeriod.endDate + 'T23:59:59');
          return orderDate >= startDate && orderDate <= endDate;
        default:
          return true;
      }
    });
  };

  const generateRevenueReport = (filteredOrders) => {
    const revenueByDate = {};
    const revenueByHour = Array(24).fill(0);
    let totalRevenue = 0;
    let completedOrders = 0;

    filteredOrders.forEach(order => {
      if (order.payment_status === 'completed' || order.paymentStatus === 'completed') {
        const amount = order.total_amount || order.totalAmount || 0;
        totalRevenue += amount;
        completedOrders++;

        // Revenue by date
        const date = new Date(order.created_at || order.createdAt).toISOString().split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + amount;

        // Revenue by hour
        const hour = new Date(order.created_at || order.createdAt).getHours();
        revenueByHour[hour] += amount;
      }
    });

    const avgOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;
    const peakHour = revenueByHour.indexOf(Math.max(...revenueByHour));

    return {
      totalRevenue,
      completedOrders,
      avgOrderValue,
      revenueByDate: Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue })),
      revenueByHour,
      peakHour: `${peakHour}:00 - ${peakHour + 1}:00`
    };
  };

  const generateOrdersReport = (filteredOrders) => {
    const ordersByStatus = {};
    const ordersByDate = {};
    const ordersByHour = Array(24).fill(0);

    filteredOrders.forEach(order => {
      // Orders by status
      const status = order.status;
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;

      // Orders by date
      const date = new Date(order.created_at || order.createdAt).toISOString().split('T')[0];
      ordersByDate[date] = (ordersByDate[date] || 0) + 1;

      // Orders by hour
      const hour = new Date(order.created_at || order.createdAt).getHours();
      ordersByHour[hour]++;
    });

    const peakHour = ordersByHour.indexOf(Math.max(...ordersByHour));

    return {
      totalOrders: filteredOrders.length,
      ordersByStatus,
      ordersByDate: Object.entries(ordersByDate).map(([date, count]) => ({ date, count })),
      ordersByHour,
      peakHour: `${peakHour}:00 - ${peakHour + 1}:00`,
      conversionRate: ordersByStatus.delivered ? 
        Math.round((ordersByStatus.delivered / filteredOrders.length) * 100) : 0
    };
  };

  const generatePopularItemsReport = (filteredOrders) => {
    const itemCounts = {};
    const itemRevenue = {};

    filteredOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const name = item.name;
          const quantity = item.quantity || 1;
          const price = item.price || 0;

          itemCounts[name] = (itemCounts[name] || 0) + quantity;
          itemRevenue[name] = (itemRevenue[name] || 0) + (price * quantity);
        });
      }
    });

    const popularItems = Object.entries(itemCounts)
      .map(([name, count]) => ({
        name,
        orders: count,
        revenue: itemRevenue[name] || 0,
        avgPrice: count > 0 ? Math.round((itemRevenue[name] || 0) / count) : 0
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);

    return popularItems;
  };

  const generateCustomerInsights = (filteredOrders) => {
    const customerOrders = {};
    const customerSpending = {};

    filteredOrders.forEach(order => {
      const userId = order.user_id;
      const amount = order.total_amount || order.totalAmount || 0;

      customerOrders[userId] = (customerOrders[userId] || 0) + 1;
      if (order.payment_status === 'completed' || order.paymentStatus === 'completed') {
        customerSpending[userId] = (customerSpending[userId] || 0) + amount;
      }
    });

    const uniqueCustomers = Object.keys(customerOrders).length;
    const repeatCustomers = Object.values(customerOrders).filter(count => count > 1).length;
    const repeatRate = uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0;

    const topCustomers = Object.entries(customerSpending)
      .map(([userId, spending]) => ({
        userId,
        orders: customerOrders[userId] || 0,
        totalSpent: spending,
        avgOrderValue: Math.round(spending / (customerOrders[userId] || 1))
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      uniqueCustomers,
      repeatCustomers,
      repeatRate,
      topCustomers
    };
  };

  const generateRiderPerformance = (filteredOrders) => {
    const riderStats = {};

    filteredOrders.forEach(order => {
      if (order.rider_id && order.status === 'delivered') {
        const riderId = order.rider_id;
        
        riderStats[riderId] = riderStats[riderId] || {
          deliveries: 0,
          totalRevenue: 0,
          avgDeliveryTime: 0
        };

        riderStats[riderId].deliveries++;
        riderStats[riderId].totalRevenue += order.total_amount || order.totalAmount || 0;
      }
    });

    const riderPerformance = Object.entries(riderStats)
      .map(([riderId, stats]) => ({
        riderId,
        deliveries: stats.deliveries,
        revenue: stats.totalRevenue,
        avgOrderValue: Math.round(stats.totalRevenue / stats.deliveries)
      }))
      .sort((a, b) => b.deliveries - a.deliveries);

    return riderPerformance;
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString()} KSh`;
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      'pending': 'warning',
      'confirmed': 'info',
      'preparing': 'primary',
      'ready': 'success',
      'out_for_delivery': 'warning',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    return variants[status] || 'secondary';
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading analytics...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>📊 Business Intelligence</h2>
              <p className="text-muted">Comprehensive analytics and reporting dashboard</p>
            </div>
            
            {/* Date Range Selector */}
            <div className="d-flex gap-3 align-items-center">
              <Form.Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ width: '150px' }}
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </Form.Select>
              
              {dateRange === 'custom' && (
                <>
                  <Form.Control
                    type="date"
                    value={selectedPeriod.startDate}
                    onChange={(e) => setSelectedPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                    style={{ width: '150px' }}
                  />
                  <Form.Control
                    type="date"
                    value={selectedPeriod.endDate}
                    onChange={(e) => setSelectedPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                    style={{ width: '150px' }}
                  />
                </>
              )}
              
              <Button variant="primary" onClick={generateReports}>
                <i className="fas fa-sync-alt me-2"></i>
                Refresh
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Revenue Analytics */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-chart-line text-success me-2"></i>
                Revenue Analytics
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center p-3 border rounded">
                    <h4 className="text-success">{formatCurrency(reportData.revenue.totalRevenue)}</h4>
                    <small className="text-muted">Total Revenue</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 border rounded">
                    <h4 className="text-primary">{reportData.revenue.completedOrders}</h4>
                    <small className="text-muted">Completed Orders</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 border rounded">
                    <h4 className="text-info">{formatCurrency(reportData.revenue.avgOrderValue)}</h4>
                    <small className="text-muted">Avg Order Value</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 border rounded">
                    <h4 className="text-warning">{reportData.revenue.peakHour}</h4>
                    <small className="text-muted">Peak Revenue Hour</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Orders Analytics */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-clipboard-list text-primary me-2"></i>
                Order Analytics
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Total Orders: </strong>
                <Badge bg="primary" className="fs-6">{reportData.orders.totalOrders}</Badge>
              </div>
              
              <div className="mb-3">
                <strong>Peak Hour: </strong>
                <span className="text-warning">{reportData.orders.peakHour}</span>
              </div>
              
              <div className="mb-3">
                <strong>Conversion Rate: </strong>
                <Badge bg="success">{reportData.orders.conversionRate}%</Badge>
              </div>
              
              <h6>Orders by Status:</h6>
              {Object.entries(reportData.orders.ordersByStatus || {}).map(([status, count]) => (
                <div key={status} className="d-flex justify-content-between mb-2">
                  <span>
                    <Badge bg={getStatusBadgeVariant(status)} className="me-2">
                      {status}
                    </Badge>
                  </span>
                  <strong>{count}</strong>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-star text-warning me-2"></i>
                Popular Items
              </h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {reportData.popularItems.length === 0 ? (
                <p className="text-muted text-center">No data available</p>
              ) : (
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.popularItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>
                          <Badge bg="primary">{item.orders}</Badge>
                        </td>
                        <td className="text-success">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Customer Insights */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-users text-info me-2"></i>
                Customer Insights
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={4}>
                  <div className="text-center p-2 border rounded">
                    <h5 className="text-info">{reportData.customerInsights.uniqueCustomers}</h5>
                    <small>Unique Customers</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-2 border rounded">
                    <h5 className="text-success">{reportData.customerInsights.repeatCustomers}</h5>
                    <small>Repeat Customers</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-2 border rounded">
                    <h5 className="text-warning">{reportData.customerInsights.repeatRate}%</h5>
                    <small>Repeat Rate</small>
                  </div>
                </Col>
              </Row>

              <h6>Top Customers by Spending:</h6>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {reportData.customerInsights.topCustomers?.map((customer, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div>
                      <small className="text-muted">Customer #{customer.userId.slice(-6)}</small>
                      <div className="small">
                        {customer.orders} orders • Avg: {formatCurrency(customer.avgOrderValue)}
                      </div>
                    </div>
                    <Badge bg="success">{formatCurrency(customer.totalSpent)}</Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-motorcycle text-warning me-2"></i>
                Rider Performance
              </h5>
            </Card.Header>
            <Card.Body>
              {reportData.riderPerformance.length === 0 ? (
                <p className="text-muted text-center">No delivery data available</p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {reportData.riderPerformance.map((rider, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-3 p-3 border rounded">
                      <div>
                        <h6 className="mb-1">Rider #{rider.riderId}</h6>
                        <small className="text-muted">
                          {rider.deliveries} deliveries • Avg: {formatCurrency(rider.avgOrderValue)}
                        </small>
                      </div>
                      <div className="text-end">
                        <Badge bg="success" className="d-block mb-1">
                          {formatCurrency(rider.revenue)}
                        </Badge>
                        <Badge bg="primary">
                          {rider.deliveries} orders
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Export Options */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-download text-secondary me-2"></i>
                Export Reports
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-3">
                <Button variant="outline-success" onClick={() => alert('CSV export functionality would be implemented here')}>
                  <i className="fas fa-file-csv me-2"></i>
                  Export to CSV
                </Button>
                <Button variant="outline-primary" onClick={() => alert('PDF export functionality would be implemented here')}>
                  <i className="fas fa-file-pdf me-2"></i>
                  Export to PDF
                </Button>
                <Button variant="outline-info" onClick={() => alert('Email report functionality would be implemented here')}>
                  <i className="fas fa-envelope me-2"></i>
                  Email Report
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Analytics;