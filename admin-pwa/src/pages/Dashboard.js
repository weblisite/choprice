import React from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, ProgressBar } from 'react-bootstrap';
import { useAdmin } from '../context/AdminContext';
import { 
  FaChartLine, 
  FaShoppingCart, 
  FaUsers, 
  FaMotorcycle, 
  FaDollarSign,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTruck
} from 'react-icons/fa';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement 
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { 
    analytics, 
    orders, 
    riders, 
    connected, 
    loading,
    getOrdersByStatus,
    updateOrderStatus
  } = useAdmin();

  // Safely handle missing data with defaults
  const pendingOrders = getOrdersByStatus ? getOrdersByStatus('pending') : [];
  const preparingOrders = getOrdersByStatus ? getOrdersByStatus('preparing') : [];
  const readyOrders = getOrdersByStatus ? getOrdersByStatus('ready') : [];
  const outForDeliveryOrders = getOrdersByStatus ? getOrdersByStatus('out_for_delivery') : [];
  // const todayOrders = getTodayOrders ? getTodayOrders() : [];

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

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0 KSh';
    }
    return `${Number(amount).toLocaleString()} KSh`;
  };

  // const formatTime = (dateString) => {
  //   return new Date(dateString).toLocaleTimeString('en-KE', {
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   });
  // };

  const getOrderAge = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  // Chart data configurations
  const salesChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Daily Sales (KSh)',
        data: [12000, 15000, 18000, 14000, 22000, 25000, 20000],
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const ordersChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders',
        data: [32, 42, 51, 38, 65, 68, 55],
        backgroundColor: [
          '#0d6efd',
          '#198754',
          '#ffc107',
          '#dc3545',
          '#0dcaf0',
          '#6610f2',
          '#fd7e14'
        ],
      }
    ]
  };

  const statusChartData = {
    labels: ['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'],
    datasets: [
      {
        data: [
          pendingOrders.length,
          preparingOrders.length,
          readyOrders.length,
          outForDeliveryOrders.length,
          (orders || []).filter(o => o.status === 'delivered').length
        ],
        backgroundColor: [
          '#ffc107',
          '#0d6efd',
          '#198754',
          '#fd7e14',
          '#20c997'
        ],
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Only show loading if explicitly loading and no data available
  if (loading && (!orders || orders.length === 0) && (!analytics || Object.keys(analytics).length === 0)) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading dashboard...</p>
          <small className="text-muted">Debug: Loading state active</small>
        </div>
      </Container>
    );
  }

  // Fallback render if context is not working
  if (!analytics && !orders && !riders) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          <h4>Dashboard Loading Issue</h4>
          <p>The admin context is not providing data. This could be due to:</p>
          <ul>
            <li>Authentication issues</li>
            <li>Context provider not working</li>
            <li>Backend connection problems</li>
          </ul>
          <p><strong>Debug Info:</strong> Analytics: {JSON.stringify(analytics)}, Orders: {JSON.stringify(orders)}, Riders: {JSON.stringify(riders)}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Connection Status */}
      <Row className="mb-4">
        <Col>
          <Alert variant={connected ? 'success' : 'warning'} className="d-flex align-items-center">
            <i className={`fas fa-${connected ? 'wifi' : 'exclamation-triangle'} me-2`}></i>
            {connected ? 'Real-time connection active' : 'Connection issues - some features may be limited'}
          </Alert>
        </Col>
      </Row>

      {/* Analytics Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-primary mb-2">
                <FaShoppingCart />
              </div>
              <h5 className="card-title">Today's Orders</h5>
              <h2 className="text-primary">{analytics?.todayOrders || 0}</h2>
              <small className="text-muted">
                Target: 25-50 orders/day
              </small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-success mb-2">
                <FaDollarSign />
              </div>
              <h5 className="card-title">Today's Revenue</h5>
              <h2 className="text-success">{formatCurrency(analytics?.todayRevenue || 0)}</h2>
              <small className="text-muted">
                Target: 9,750+ KSh/day
              </small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-warning mb-2">
                <FaClock />
              </div>
              <h5 className="card-title">Active Orders</h5>
              <h2 className="text-warning">{analytics?.activeOrders || 0}</h2>
              <small className="text-muted">
                In progress
              </small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-info mb-2">
                <FaChartLine />
              </div>
              <h5 className="card-title">Avg Order Value</h5>
              <h2 className="text-info">{formatCurrency(analytics?.averageOrderValue || 390)}</h2>
              <small className="text-muted">
                Per order
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Analytics Charts */}
      <Row className="mb-4">
        <Col lg={8} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Weekly Sales Trend
              </h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Line data={salesChartData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaTruck className="me-2" />
                Order Status
              </h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Doughnut data={statusChartData} options={doughnutOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaShoppingCart className="me-2" />
                Daily Orders
              </h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '250px' }}>
                <Bar data={ordersChartData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaUsers className="me-2" />
                Quick Stats
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="row g-3">
                <div className="col-6">
                  <div className="text-center p-3 bg-light rounded">
                    <FaMotorcycle className="text-primary fa-2x mb-2" />
                    <h6>Active Riders</h6>
                    <h4 className="text-primary">{riders?.filter(r => r.status === 'available').length || 0}</h4>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center p-3 bg-light rounded">
                    <FaUsers className="text-success fa-2x mb-2" />
                    <h6>Total Customers</h6>
                    <h4 className="text-success">{analytics?.totalCustomers || 0}</h4>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center p-3 bg-light rounded">
                    <FaCheckCircle className="text-info fa-2x mb-2" />
                    <h6>Completed Today</h6>
                    <h4 className="text-info">{(orders || []).filter(o => o.status === 'delivered' && new Date(o.created_at).toDateString() === new Date().toDateString()).length}</h4>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center p-3 bg-light rounded">
                    <FaExclamationTriangle className="text-warning fa-2x mb-2" />
                    <h6>Pending</h6>
                    <h4 className="text-warning">{pendingOrders.length}</h4>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Order Management Sections */}
      <Row>
        {/* Pending Orders */}
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-exclamation-circle text-warning me-2"></i>
                Pending Orders ({pendingOrders.length})
              </h5>
              <Badge bg="warning">{pendingOrders.length}</Badge>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {pendingOrders.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-check-circle fa-3x mb-3"></i>
                  <p>No pending orders</p>
                </div>
              ) : (
                pendingOrders.map(order => (
                  <div key={order.id} className="border-bottom pb-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">Order #{order.id}</h6>
                        <small className="text-muted">{getOrderAge(order.created_at || order.createdAt)}</small>
                      </div>
                      <Badge bg={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="mb-2">
                      <strong>{formatCurrency(order.total_amount || order.totalAmount)}</strong>
                      <span className="text-muted ms-2">• {order.phone}</span>
                    </div>
                    <div className="d-flex gap-2">
                      <Button 
                        size="sm" 
                        variant="success"
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      >
                        <i className="fas fa-check me-1"></i>
                        Confirm
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      >
                        <i className="fas fa-times me-1"></i>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Kitchen Orders */}
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-utensils text-primary me-2"></i>
                Kitchen Orders ({preparingOrders.length + readyOrders.length})
              </h5>
              <Badge bg="primary">{preparingOrders.length + readyOrders.length}</Badge>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {[...preparingOrders, ...readyOrders].length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-utensils fa-3x mb-3"></i>
                  <p>No orders in kitchen</p>
                </div>
              ) : (
                [...preparingOrders, ...readyOrders].map(order => (
                  <div key={order.id} className="border-bottom pb-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">Order #{order.id}</h6>
                        <small className="text-muted">{getOrderAge(order.created_at || order.createdAt)}</small>
                      </div>
                      <Badge bg={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="mb-2">
                      <strong>{formatCurrency(order.total_amount || order.totalAmount)}</strong>
                    </div>
                    <div className="mb-2">
                      {order.items && order.items.map((item, index) => (
                        <small key={index} className="d-block text-muted">
                          {item.quantity}x {item.name}
                        </small>
                      ))}
                    </div>
                    <div className="d-flex gap-2">
                      {order.status === 'preparing' && (
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                        >
                          <i className="fas fa-check me-1"></i>
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button 
                          size="sm" 
                          variant="warning"
                          onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                        >
                          <i className="fas fa-truck me-1"></i>
                          Out for Delivery
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delivery Status */}
      <Row>
        <Col lg={8} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-truck text-warning me-2"></i>
                Active Deliveries ({outForDeliveryOrders.length})
              </h5>
            </Card.Header>
            <Card.Body>
              {outForDeliveryOrders.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-truck fa-3x mb-3"></i>
                  <p>No active deliveries</p>
                </div>
              ) : (
                <Row>
                  {outForDeliveryOrders.map(order => (
                    <Col md={6} key={order.id} className="mb-3">
                      <Card className="border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6>Order #{order.id}</h6>
                            <Badge bg="warning">Out for Delivery</Badge>
                          </div>
                          <p className="mb-2">
                            <strong>{formatCurrency(order.total_amount || order.totalAmount)}</strong>
                          </p>
                          <p className="small text-muted mb-2">
                            {order.delivery_address?.address || 'Address not available'}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              {getOrderAge(order.created_at || order.createdAt)}
                            </small>
                            <Button 
                              size="sm" 
                              variant="success"
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                            >
                              Mark Delivered
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-chart-bar text-info me-2"></i>
                Quick Stats
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Daily Target Progress</small>
                                  <small>{analytics?.todayOrders || 0}/25 orders</small>
              </div>
              <ProgressBar 
                now={((analytics?.todayOrders || 0) / 25) * 100}
                variant={(analytics?.todayOrders || 0) >= 25 ? 'success' : 'primary'}
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Revenue Target</small>
                  <small>{formatCurrency(analytics?.todayRevenue || 0)}/9,750 KSh</small>
                </div>
                <ProgressBar 
                  now={((analytics?.todayRevenue || 0) / 9750) * 100} 
                  variant={(analytics?.todayRevenue || 0) >= 9750 ? 'success' : 'warning'}
                />
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span>Active Riders:</span>
                <Badge bg="success">{(riders || []).filter(r => r.status === 'available').length}</Badge>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Completed Today:</span>
                <Badge bg="info">{analytics?.completedOrders || 0}</Badge>
              </div>

              <div className="d-flex justify-content-between">
                <span>Avg Order Value:</span>
                <Badge bg="secondary">{formatCurrency(analytics?.averageOrderValue || 390)}</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;