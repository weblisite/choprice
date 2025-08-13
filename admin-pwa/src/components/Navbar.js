import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';

const AdminNavbar = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const location = useLocation();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm">
      <Container fluid>
        <Navbar.Brand as={Link} to="/dashboard" className="fw-bold text-primary">
          🍚 Choprice Admin
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/dashboard" 
              className={location.pathname === '/dashboard' ? 'active' : ''}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/orders" 
              className={location.pathname === '/orders' ? 'active' : ''}
            >
              Orders
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/menu" 
              className={location.pathname === '/menu' ? 'active' : ''}
            >
              Menu
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/reports" 
              className={location.pathname === '/reports' ? 'active' : ''}
            >
              Reports
            </Nav.Link>
          </Nav>
          
          <Nav>
            {user ? (
              <>
                <Nav.Item className="d-flex align-items-center me-3">
                  <span className="text-muted">
                    Welcome, {user.firstName || user.emailAddresses[0].emailAddress}
                  </span>
                </Nav.Item>
                <Button variant="outline-primary" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button as={Link} to="/login" variant="primary" size="sm">
                Sign In
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AdminNavbar;