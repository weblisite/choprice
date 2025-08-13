import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { FaUtensils, FaTag, FaShippingFast, FaShoppingCart, FaSpinner } from 'react-icons/fa';
import { GiRiceCooker } from 'react-icons/gi';
import classNames from 'classnames';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/enhancements.css';
import AddOns from '../components/AddOns';
import axios from 'axios';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addingToCart, setAddingToCart] = useState(null);
  const { addToCart, selectedAddOns, updateAddOn } = useCart();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    // Initialize AOS animations
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100
    });
    
    fetchMenuItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/menu`);
      if (response.data.success) {
        setMenuItems(response.data.data);
      } else {
        setError('Failed to load menu items');
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError('Failed to load menu. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item) => {
    try {
      setAddingToCart(item.id);
      addToCart(item);
      
      // Show success feedback
      setTimeout(() => {
        setAddingToCart(null);
      }, 500);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setAddingToCart(null);
    }
  };

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  
  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <Container className="py-5">
        <Row>
          <Col>
            <div className="text-center">
              <div className="loading-spinner mb-3"></div>
              <p>Loading delicious menu...</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Row>
          <Col>
            <Alert variant="danger" className="alert-custom">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
            <div className="text-center">
              <Button onClick={fetchMenuItems} variant="primary">
                <i className="fas fa-redo me-2"></i>
                Try Again
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Header */}
      <Row className="mb-5">
        <Col>
          <div className="text-center">
            <h1 className="display-4 mb-3">Our Menu</h1>
            <p className="lead text-muted">
              Discover our selection of premium rice dishes, each crafted with care and delivered fresh
            </p>
            <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap" data-aos="fade-up" data-aos-delay="200">
              <Badge bg="primary" className="p-2">
                <GiRiceCooker className="me-1" />
                12 Rice Dishes
              </Badge>
              <Badge bg="success" className="p-2">
                <FaTag className="me-1" />
                390 KSh Each
              </Badge>
              <Badge bg="info" className="p-2">
                <FaShippingFast className="me-1" />
                Free Delivery
              </Badge>
            </div>
          </div>
        </Col>
      </Row>

      {/* Category Filter */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-center flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-capitalize"
              >
                {category === 'all' ? 'All Dishes' : category}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      {/* Menu Items */}
      <Row>
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <Col md={6} lg={4} key={index} className="mb-4">
              <Card className="h-100">
                <Skeleton height={200} />
                <Card.Body>
                  <Skeleton height={24} className="mb-2" />
                  <Skeleton count={2} />
                  <Skeleton height={40} className="mt-3" />
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : filteredItems.length === 0 ? (
          <Col>
            <div className="empty-state" data-aos="fade-up">
              <div className="empty-state-icon">
                <FaUtensils />
              </div>
              <h3 className="empty-state-title">No dishes found</h3>
              <p className="empty-state-description">
                Try selecting a different category
              </p>
            </div>
          </Col>
        ) : (
          filteredItems.map((item, index) => (
            <Col md={6} lg={4} key={item.id} className="mb-4">
              <Card 
                className={classNames("h-100 menu-item shadow-sm", {
                  "border-warning": item.featured
                })}
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {item.image_url && (
                  <Card.Img 
                    variant="top" 
                    src={item.image_url} 
                    className="menu-item-image"
                    alt={item.name}
                  />
                )}
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="h5">{item.name}</Card.Title>
                    <div className="price-tag">
                      {item.price} KSh
                    </div>
                  </div>
                  
                  {item.category && (
                    <div className="mb-2">
                      <span className="category-badge">
                        {item.category}
                      </span>
                    </div>
                  )}
                  
                  <Card.Text className="flex-grow-1 text-muted">
                    {item.description || 'Delicious rice dish prepared with the finest ingredients'}
                  </Card.Text>
                  
                  <div className="mt-auto">
                    <Button
                      variant="primary"
                      className={classNames("w-100", {
                        "btn-success": addingToCart === item.id
                      })}
                      onClick={() => handleAddToCart(item)}
                      disabled={addingToCart === item.id || !item.is_available}
                    >
                      {addingToCart === item.id ? (
                        <>
                          <FaSpinner className="me-2 fa-spin" />
                          Adding...
                        </>
                      ) : !item.is_available ? (
                        <>
                          <i className="fas fa-times me-2"></i>
                          Out of Stock
                        </>
                      ) : (
                        <>
                          <FaShoppingCart className="me-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Add-ons Section */}
      {/* Add-ons Section */}
      <Row className="mt-5">
        <Col>
          <AddOns 
            selectedAddOns={selectedAddOns}
            onAddOnChange={updateAddOn}
            className="add-ons-section"
          />
        </Col>
      </Row>

      {/* Info Section */}
      <Row className="mt-5">
        <Col>
          <Alert variant="info" className="alert-custom text-center">
            <h5 className="mb-3">
              <i className="fas fa-info-circle me-2"></i>
              Delivery Information
            </h5>
            <Row>
              <Col md={4}>
                <i className="fas fa-clock text-primary me-2"></i>
                <strong>Delivery Time:</strong> 30-45 minutes
              </Col>
              <Col md={4}>
                <i className="fas fa-shipping-fast text-primary me-2"></i>
                <strong>Free Delivery:</strong> Orders above 390 KSh
              </Col>
              <Col md={4}>
                <i className="fas fa-map-marker-alt text-primary me-2"></i>
                <strong>Areas:</strong> Premium Nairobi locations
              </Col>
            </Row>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};

export default Menu;