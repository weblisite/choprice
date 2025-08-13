import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Row, Col, Alert } from 'react-bootstrap';
import { FaPlus, FaMinus, FaUtensils, FaCoffee, FaGift } from 'react-icons/fa';
import { GiMeat, GiRiceCooker } from 'react-icons/gi';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';

const AddOns = ({ selectedAddOns, onAddOnChange, className = "" }) => {
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchAddOns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAddOns = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/addons`);
      if (response.data.success) {
        setAddOns(response.data.data);
      } else {
        setError('Failed to load add-ons');
      }
    } catch (err) {
      console.error('Error fetching add-ons:', err);
      setError('Failed to load add-ons. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'sides':
        return <FaUtensils className="me-2" />;
      case 'beverages':
        return <FaCoffee className="me-2" />;
      case 'extras':
        return <GiMeat className="me-2" />;
      default:
        return <FaGift className="me-2" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'sides':
        return 'success';
      case 'beverages':
        return 'info';
      case 'extras':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const handleQuantityChange = (addOn, change) => {
    const currentQuantity = selectedAddOns[addOn.id] || 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    
    onAddOnChange(addOn.id, newQuantity, addOn);
  };

  const groupedAddOns = addOns.reduce((groups, addOn) => {
    const category = addOn.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className={className}>
        <h5 className="mb-3">
          <GiRiceCooker className="me-2" />
          Add-ons & Extras
        </h5>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="mb-3">
            <Card.Body>
              <Skeleton height={20} className="mb-2" />
              <Skeleton count={2} />
              <Skeleton height={40} className="mt-2" />
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="danger">
          <strong>Unable to load add-ons</strong><br />
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <h5 className="mb-3">
        <GiRiceCooker className="me-2" />
        Add-ons & Extras
      </h5>
      <p className="text-muted mb-4">
        Enhance your meal with our delicious sides, refreshing beverages, and extra portions.
      </p>

      {Object.entries(groupedAddOns).map(([category, categoryAddOns]) => (
        <div key={category} className="mb-4">
          <h6 className="mb-3">
            <Badge bg={getCategoryColor(category)} className="me-2">
              {getCategoryIcon(category)}
              {category}
            </Badge>
          </h6>

          <Row>
            {categoryAddOns.map(addOn => (
              <Col md={6} key={addOn.id} className="mb-3">
                <Card className="h-100 add-on-card">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="card-title mb-1">{addOn.name}</h6>
                        <small className="text-muted">{addOn.description}</small>
                      </div>
                      <Badge bg="primary" className="price-badge">
                        {addOn.price} KSh
                      </Badge>
                    </div>

                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <div className="quantity-controls">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleQuantityChange(addOn, -1)}
                          disabled={!selectedAddOns[addOn.id]}
                          className="me-2"
                        >
                          <FaMinus />
                        </Button>
                        <span className="quantity-display mx-2">
                          {selectedAddOns[addOn.id] || 0}
                        </span>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleQuantityChange(addOn, 1)}
                          className="ms-2"
                        >
                          <FaPlus />
                        </Button>
                      </div>

                      {selectedAddOns[addOn.id] > 0 && (
                        <Badge bg="success" className="total-badge">
                          {(selectedAddOns[addOn.id] * addOn.price).toLocaleString()} KSh
                        </Badge>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      {Object.keys(groupedAddOns).length === 0 && (
        <Alert variant="info">
          <FaGift className="me-2" />
          No add-ons are currently available. Check back later for delicious extras!
        </Alert>
      )}
    </div>
  );
};

export default AddOns;