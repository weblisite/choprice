import React, { useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { SignUp, useAuth } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Signup = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isSignedIn) {
      navigate(from, { replace: true });
    }
  }, [isSignedIn, navigate, from]);

  return (
    <Container className="min-vh-100 d-flex align-items-center">
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h1 className="h3 text-primary fw-bold">
                  🍚 Join Choprice Admin
                </h1>
                <p className="text-muted">
                  Kitchen Management Portal Registration
                </p>
              </div>

              <SignUp 
                routing="path" 
                path="/register"
                signInUrl="/login"
                redirectUrl="/dashboard"
                appearance={{
                  elements: {
                    formButtonPrimary: 'btn btn-primary w-100',
                    card: 'border-0 shadow-none',
                    headerTitle: 'd-none',
                    headerSubtitle: 'd-none'
                  },
                  layout: {
                    socialButtonsPlacement: 'bottom'
                  }
                }}
              />
              
              <div className="text-center mt-4">
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <div className="text-center p-3 bg-light rounded">
                      <i className="fas fa-chart-line fa-2x text-primary mb-2"></i>
                      <h6>Analytics</h6>
                      <small className="text-muted">Business insights</small>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="text-center p-3 bg-light rounded">
                      <i className="fas fa-utensils fa-2x text-success mb-2"></i>
                      <h6>Menu Control</h6>
                      <small className="text-muted">Manage rice dishes</small>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="text-center p-3 bg-light rounded">
                      <i className="fas fa-clipboard-list fa-2x text-info mb-2"></i>
                      <h6>Order Management</h6>
                      <small className="text-muted">Track all orders</small>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-top">
                  <small className="text-muted">
                    <i className="fas fa-shield-alt me-2"></i>
                    By signing up, you agree to our admin terms and conditions.
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Signup;