import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { UserProfile } from '@clerk/clerk-react';

const Profile = () => {
  return (
    <Container className="py-5">
      <Row>
        <Col>
          <h1 className="h2 mb-4">
            <i className="fas fa-user me-2 text-primary"></i>
            My Profile
          </h1>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-custom">
            <Card.Body className="p-4">
              <UserProfile 
                appearance={{
                  elements: {
                    card: 'shadow-none border-0',
                    navbar: 'hidden',
                    navbarMobileMenuButton: 'hidden',
                    headerTitle: 'text-center mb-4',
                    headerSubtitle: 'text-muted text-center mb-4'
                  }
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;