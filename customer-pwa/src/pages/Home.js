import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';

const Home = () => {
  const features = [
    {
      icon: 'fas fa-utensils',
      title: 'Premium Rice Dishes',
      description: '11 carefully crafted rice dishes from local favorites to international delights'
    },
    {
      icon: 'fas fa-shipping-fast',
      title: 'Free Delivery',
      description: 'Free delivery to your office in Nairobi\'s premium areas within 30-45 minutes'
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Easy Ordering',
      description: 'Order through our PWA - works like an app, no download required'
    },
    {
      icon: 'fas fa-money-bill-wave',
      title: 'M-Pesa Payments',
      description: 'Secure payments via M-Pesa STK Push - just 390 KSh per plate'
    }
  ];

  const deliveryAreas = [
    'Kilimani', 'Kileleshwa', 'Lavington', 'Hurlingham', 
    'Upper Hill', 'Westlands', 'Parklands'
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="hero-title fade-in">
                Premium Rice Delivered Fresh
              </h1>
              <p className="hero-subtitle fade-in">
                Experience the finest selection of rice dishes delivered to your office. 
                From traditional Pilau to exotic Biryani - all at 390 KSh with free delivery.
              </p>
              <div className="fade-in">
                <Button 
                  as={Link} 
                  to="/menu" 
                  size="lg" 
                  className="hero-cta me-3"
                >
                  <i className="fas fa-utensils me-2"></i>
                  View Menu
                </Button>
                <Button 
                  as={Link} 
                  to="/menu" 
                  variant="outline-light" 
                  size="lg"
                >
                  Order Now
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">Why Choose Choprice?</h2>
              <p className="section-subtitle text-muted">
                We're revolutionizing office lunch delivery in Nairobi
              </p>
            </Col>
          </Row>
          
          <Row>
            {features.map((feature, index) => (
              <Col md={6} lg={3} key={index} className="mb-4">
                <div className="text-center fade-in">
                  <div className="feature-icon">
                    <i className={feature.icon}></i>
                  </div>
                  <h5 className="feature-title">{feature.title}</h5>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Popular Dishes Preview */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">Popular Dishes</h2>
              <p className="section-subtitle text-muted">
                Our most loved rice dishes
              </p>
            </Col>
          </Row>
          
          <Row>
            <Col md={4} className="mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-star text-warning" style={{fontSize: '3rem'}}></i>
                  </div>
                  <h5 className="card-title">Pilau</h5>
                  <p className="card-text">
                    Fragrant spiced rice with aromatic herbs - our signature local favorite
                  </p>
                  <div className="price-tag">390 KSh</div>
                </div>
              </div>
            </Col>
            
            <Col md={4} className="mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-globe-asia text-info" style={{fontSize: '3rem'}}></i>
                  </div>
                  <h5 className="card-title">Biryani Rice</h5>
                  <p className="card-text">
                    Traditional Indian-style layered rice with authentic spices
                  </p>
                  <div className="price-tag">390 KSh</div>
                </div>
              </div>
            </Col>
            
            <Col md={4} className="mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="fas fa-drumstick-bite text-success" style={{fontSize: '3rem'}}></i>
                  </div>
                  <h5 className="card-title">Rice and Chicken</h5>
                  <p className="card-text">
                    Tender chicken served with perfectly seasoned rice
                  </p>
                  <div className="price-tag">390 KSh</div>
                </div>
              </div>
            </Col>
          </Row>
          
          <Row className="text-center">
            <Col>
              <Button as={Link} to="/menu" size="lg" className="mt-3">
                <i className="fas fa-eye me-2"></i>
                View Full Menu
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Delivery Areas */}
      <section className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">Delivery Areas</h2>
              <p className="section-subtitle text-muted">
                We deliver to premium office areas in Nairobi
              </p>
            </Col>
          </Row>
          
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="text-center">
                {deliveryAreas.map((area, index) => (
                  <span key={index} className="badge bg-light text-dark me-2 mb-2 p-2">
                    <i className="fas fa-map-marker-alt text-primary me-1"></i>
                    {area}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-muted">
                  <i className="fas fa-clock me-2 text-primary"></i>
                  Delivery Time: 30-45 minutes
                </p>
                <p className="text-muted">
                  <i className="fas fa-shipping-fast me-2 text-primary"></i>
                  Free delivery on orders above 390 KSh
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-primary text-white">
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className="mb-3">Ready to Order?</h2>
              <p className="mb-4 fs-5">
                Join hundreds of satisfied customers enjoying premium rice dishes daily
              </p>
              <Button 
                as={Link} 
                to="/menu" 
                variant="light" 
                size="lg"
                className="me-3"
              >
                <i className="fas fa-utensils me-2"></i>
                Order Now
              </Button>
              <Button 
                href="https://wa.me/254700000000" 
                variant="outline-light" 
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-whatsapp me-2"></i>
                WhatsApp Us
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;