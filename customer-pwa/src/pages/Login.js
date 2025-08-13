import React, { useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isSignedIn) {
      navigate(from, { replace: true });
    }
  }, [isSignedIn, navigate, from]);

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <div className="text-center mb-4">
            <h1 className="h2 mb-3">
              <i className="fas fa-utensils text-primary me-2"></i>
              Welcome to Choprice
            </h1>
            <p className="text-muted">
              Sign in to your account to start ordering delicious rice dishes
            </p>
          </div>

          <Card className="shadow-custom">
            <Card.Body className="p-4">
              <SignIn 
                routing="path" 
                path="/login"
                signUpUrl="/signup"
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-primary border-primary hover:bg-primary-dark',
                    card: 'shadow-none border-0',
                    headerTitle: 'text-center mb-4',
                    headerSubtitle: 'text-muted text-center mb-4'
                  },
                  layout: {
                    socialButtonsPlacement: 'bottom'
                  }
                }}
              />
            </Card.Body>
          </Card>

          {/* Features */}
          <div className="mt-5">
            <h5 className="text-center mb-4">Why sign up?</h5>
            <Row>
              <Col md={4} className="text-center mb-3">
                <div className="mb-2">
                  <i className="fas fa-history text-primary" style={{fontSize: '2rem'}}></i>
                </div>
                <h6>Order History</h6>
                <small className="text-muted">
                  Track all your orders and reorder favorites easily
                </small>
              </Col>
              
              <Col md={4} className="text-center mb-3">
                <div className="mb-2">
                  <i className="fas fa-map-marker-alt text-primary" style={{fontSize: '2rem'}}></i>
                </div>
                <h6>Saved Addresses</h6>
                <small className="text-muted">
                  Save delivery addresses for faster checkout
                </small>
              </Col>
              
              <Col md={4} className="text-center mb-3">
                <div className="mb-2">
                  <i className="fas fa-bell text-primary" style={{fontSize: '2rem'}}></i>
                </div>
                <h6>Order Updates</h6>
                <small className="text-muted">
                  Get real-time notifications about your order status
                </small>
              </Col>
            </Row>
          </div>

          {/* Guest Option */}
          <Card className="mt-4 border-0 bg-light">
            <Card.Body className="text-center">
              <h6 className="mb-2">
                <i className="fas fa-user-clock text-muted me-2"></i>
                Want to browse first?
              </h6>
              <p className="small text-muted mb-3">
                You can view our menu without signing in, but you'll need an account to place orders.
              </p>
              <a href="/menu" className="btn btn-outline-primary btn-sm">
                <i className="fas fa-utensils me-2"></i>
                View Menu
              </a>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;