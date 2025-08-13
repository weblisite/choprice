import React, { useContext, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useUser } from '@clerk/clerk-react';
import { RiderContext } from '../context/RiderContext';

const Profile = () => {
  const { user } = useUser();
  const riderContext = useContext(RiderContext);
  const [isEditing, setIsEditing] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // Provide default values for missing context properties
  const riderProfile = riderContext?.riderProfile || {};
  const deliveryStats = riderContext?.deliveryStats || {
    totalDeliveries: 0,
    monthlyDeliveries: 0,
    averageRating: 0,
    totalEarnings: 0,
    onTimeRate: 0
  };
  
  const [formData, setFormData] = useState({
    phone: riderProfile?.phone || '',
    vehicle_type: riderProfile?.vehicle_type || '',
    license_plate: riderProfile?.license_plate || '',
    emergency_contact: riderProfile?.emergency_contact || '',
    emergency_phone: riderProfile?.emergency_phone || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Check if updateRiderProfile function exists
      if (riderContext?.updateRiderProfile) {
        await riderContext.updateRiderProfile(formData);
        setAlertMessage('Profile updated successfully!');
      } else {
        // For now, just simulate success since the backend integration is not complete
        console.log('Profile update data:', formData);
        setAlertMessage('Profile updated successfully! (Demo mode)');
      }
      setIsEditing(false);
      setTimeout(() => setAlertMessage(''), 3000);
    } catch (error) {
      setAlertMessage(`Error updating profile: ${error.message}`);
      setTimeout(() => setAlertMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    setFormData({
      phone: riderProfile?.phone || '',
      vehicle_type: riderProfile?.vehicle_type || '',
      license_plate: riderProfile?.license_plate || '',
      emergency_contact: riderProfile?.emergency_contact || '',
      emergency_phone: riderProfile?.emergency_phone || ''
    });
    setIsEditing(false);
  };

  return (
    <Container fluid>
      <Row>
        <Col>
          <h2 className="mb-4">Rider Profile</h2>

          {alertMessage && (
            <Alert variant="success" dismissible onClose={() => setAlertMessage('')}>
              {alertMessage}
            </Alert>
          )}

          {!isEditing && (
            <Alert variant="info" className="mb-4">
              <i className="fas fa-info-circle me-2"></i>
              <strong>Profile View Mode:</strong> Click "Edit Profile" to modify your information.
            </Alert>
          )}

          {isEditing && (
            <Alert variant="warning" className="mb-4">
              <i className="fas fa-edit me-2"></i>
              <strong>Edit Mode:</strong> You can now modify your profile information. Don't forget to save your changes!
            </Alert>
          )}

          <Row>
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Personal Information</h5>
                  {!isEditing ? (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                      className="fw-bold"
                    >
                      <i className="fas fa-edit me-2"></i>
                      Edit Profile
                    </Button>
                  ) : (
                    <div>
                      <Button variant="success" size="sm" onClick={handleSave} className="me-2">
                        Save
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={user?.emailAddresses[0]?.emailAddress || ''}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter your phone number"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Vehicle Type</Form.Label>
                        <Form.Select
                          name="vehicle_type"
                          value={formData.vehicle_type}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        >
                          <option value="">Select vehicle type</option>
                          <option value="motorcycle">Motorcycle</option>
                          <option value="bicycle">Bicycle</option>
                          <option value="car">Car</option>
                          <option value="scooter">Scooter</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>License Plate</Form.Label>
                        <Form.Control
                          type="text"
                          name="license_plate"
                          value={formData.license_plate}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter license plate number"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <hr />
                  
                  <h6>Emergency Contact</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="emergency_contact"
                          value={formData.emergency_contact}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Emergency contact name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="emergency_phone"
                          value={formData.emergency_phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Emergency contact phone"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Delivery Statistics</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Total Deliveries:</span>
                      <strong>{deliveryStats.totalDeliveries || 0}</strong>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>This Month:</span>
                      <strong>{deliveryStats.monthlyDeliveries || 0}</strong>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Average Rating:</span>
                      <strong>
                        {deliveryStats.averageRating || 0} ⭐
                      </strong>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Total Earnings:</span>
                      <strong>KSH {deliveryStats.totalEarnings || 0}</strong>
                    </div>
                  </div>
                  <div className="mb-0">
                    <div className="d-flex justify-content-between">
                      <span>On-time Rate:</span>
                      <strong>{deliveryStats.onTimeRate || 0}%</strong>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Account Status</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <span className="badge bg-success">Active</span>
                  </div>
                  <p className="small text-muted mb-2">
                    Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="small text-muted mb-0">
                    Last active: {new Date().toLocaleDateString()}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;