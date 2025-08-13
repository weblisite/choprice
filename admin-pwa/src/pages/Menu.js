import React, { useContext, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Alert } from 'react-bootstrap';
import { AdminContext } from '../context/AdminContext';

const Menu = () => {
  const { menuItems, updateMenuItem } = useContext(AdminContext);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    available: true,
    image_url: ''
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      image_url: item.image_url || ''
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      await updateMenuItem(editingItem.id, formData);
      setShowEditModal(false);
      setEditingItem(null);
      setAlertMessage('Menu item updated successfully!');
      setTimeout(() => setAlertMessage(''), 3000);
    } catch (error) {
      setAlertMessage(`Error updating menu item: ${error.message}`);
      setTimeout(() => setAlertMessage(''), 3000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <Container fluid>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Menu Management</h2>
            <Button variant="primary">Add New Item</Button>
          </div>

          {alertMessage && (
            <Alert variant="success" dismissible onClose={() => setAlertMessage('')}>
              {alertMessage}
            </Alert>
          )}

          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-5">
              <h4 className="text-primary mb-3">{category}</h4>
              <Row>
                {items.map(item => (
                  <Col md={6} lg={4} key={item.id} className="mb-4">
                    <Card className="h-100">
                      {item.image_url && (
                        <Card.Img 
                          variant="top" 
                          src={item.image_url} 
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                      )}
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <Card.Title className="h5">{item.name}</Card.Title>
                          <span className={`badge ${item.available ? 'bg-success' : 'bg-danger'}`}>
                            {item.available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <Card.Text className="text-muted small">
                          {item.description}
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="text-primary mb-0">KSH {item.price}</h5>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}

          {menuItems.length === 0 && (
            <Card className="text-center p-4">
              <h5>No menu items found</h5>
              <p className="text-muted">Add your first menu item to get started.</p>
            </Card>
          )}
        </Col>
      </Row>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Menu Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (KSH)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Category</option>
                    <option value="Complete Meals">Complete Meals</option>
                    <option value="Rice Dishes">Rice Dishes</option>
                    <option value="Sides">Sides</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Image URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="available"
                label="Available for order"
                checked={formData.available}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Menu;