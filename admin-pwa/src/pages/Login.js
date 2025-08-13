import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { SignIn, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { isSignedIn } = useUser();

  // Redirect to dashboard if already signed in
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container className="min-vh-100 d-flex align-items-center">
      <Row className="w-100 justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h1 className="h3 text-primary fw-bold">🍚 Choprice Admin</h1>
                <p className="text-muted">Kitchen Management Portal</p>
              </div>
              
              <div className="d-flex justify-content-center">
                <SignIn 
                  routing="path" 
                  path="/login"
                  redirectUrl="/dashboard"
                  signUpUrl="/register"
                  appearance={{
                    elements: {
                      formButtonPrimary: 'btn btn-primary',
                      card: 'border-0 shadow-none',
                      headerTitle: 'd-none',
                      headerSubtitle: 'd-none'
                    }
                  }}
                />
              </div>
              
              <div className="text-center mt-4">
                <small className="text-muted">
                  Access restricted to authorized kitchen staff only
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;