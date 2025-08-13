import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, ListGroup } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { useUser } from '@clerk/clerk-react';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaCreditCard, FaUserPlus } from 'react-icons/fa';
import { GiRiceCooker } from 'react-icons/gi';
import GuestCheckout from '../components/GuestCheckout';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Cart = () => {
  const { cartItems, selectedAddOns, removeFromCart, updateQuantity, updateAddOn, clearCart, getCartTotal, getCartItemsCount } = useCart();
  const { isSignedIn, user } = useUser();
  const [showGuestCheckout, setShowGuestCheckout] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  const handleQuantityChange = (itemId, change) => {
    const currentItem = cartItems.find(item => item.id === itemId);
    if (currentItem) {
      const newQuantity = Math.max(0, currentItem.quantity + change);
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleAddOnQuantityChange = (addOnId, change) => {
    const currentAddOn = selectedAddOns[addOnId];
    if (currentAddOn) {
      const newQuantity = Math.max(0, currentAddOn.quantity + change);
      updateAddOn(addOnId, newQuantity, currentAddOn);
    }
  };

  const handleAuthenticatedCheckout = async () => {
    if (!isSignedIn || !user) {
      toast.error('Please sign in to place an order');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        items: cartItems,
        addOns: Object.values(selectedAddOns).filter(addOn => addOn && addOn.quantity > 0),
        delivery_address: {
          area: 'Kilimani', // This would come from user's saved address
          address: 'Sample Address', // This would come from user's saved address
        },
        phone: user.primaryPhoneNumber?.phoneNumber || '+254712345678',
        total_amount: getCartTotal()
      };

      const response = await axios.post(`${API_BASE_URL}/api/orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        }
      });

      if (response.data.success) {
        toast.success('Order placed successfully!');
        clearCart();
        // Redirect to orders page or show success message
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleGuestOrder = async (guestInfo) => {
    setIsPlacingOrder(true);
    try {
      const orderData = {
        items: cartItems,
        addOns: Object.values(selectedAddOns).filter(addOn => addOn && addOn.quantity > 0),
        delivery_address: {
          area: guestInfo.area,
          address: guestInfo.address,
          landmark: guestInfo.landmark
        },
        phone: guestInfo.phone,
        total_amount: getCartTotal(),
        guest_info: {
          name: guestInfo.name,
          email: guestInfo.email,
          phone: guestInfo.phone,
          specialInstructions: guestInfo.specialInstructions
        }
      };

      const response = await axios.post(`${API_BASE_URL}/api/orders`, orderData);

      if (response.data.success) {
        toast.success('Order placed successfully! Check your email for confirmation.');
        clearCart();
        setShowGuestCheckout(false);
        // Show success message or redirect
      }
    } catch (error) {
      console.error('Error placing guest order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const cartTotal = getCartTotal();
  const itemsCount = getCartItemsCount();
  const addOnsArray = Object.values(selectedAddOns).filter(addOn => addOn && addOn.quantity > 0);

  if (itemsCount === 0) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} className="text-center">
            <div className="empty-cart-state py-5">
              <FaShoppingCart className="empty-cart-icon mb-4" style={{ fontSize: '4rem', color: '#6c757d' }} />
              <h3 className="mb-3">Your cart is empty</h3>
              <p className="text-muted mb-4">
                Looks like you haven't added any delicious rice dishes to your cart yet.
              </p>
              <Button variant="primary" size="lg" href="/menu">
                <GiRiceCooker className="me-2" />
                Browse Menu
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <h2 className="mb-4">
            <FaShoppingCart className="me-2" />
            Your Cart ({itemsCount} items)
          </h2>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          {/* Cart Items */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <GiRiceCooker className="me-2" />
                Rice Dishes
              </h5>
            </Card.Header>
            <ListGroup variant="flush">
              {cartItems.map(item => (
                <ListGroup.Item key={item.id}>
                  <Row className="align-items-center">
                    <Col md={6}>
                      <h6 className="mb-1">{item.name}</h6>
                      <small className="text-muted">{item.description}</small>
                    </Col>
                    <Col md={2}>
                      <Badge bg="secondary">{item.price} KSh</Badge>
                    </Col>
                    <Col md={3}>
                      <div className="d-flex align-items-center">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          <FaMinus />
                        </Button>
                        <span className="mx-3 fw-bold">{item.quantity}</span>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          <FaPlus />
                        </Button>
                      </div>
                    </Col>
                    <Col md={1}>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <FaTrash />
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>

          {/* Add-ons */}
          {addOnsArray.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Add-ons & Extras</h5>
              </Card.Header>
              <ListGroup variant="flush">
                {addOnsArray.map(addOn => (
                  <ListGroup.Item key={addOn.id}>
                    <Row className="align-items-center">
                      <Col md={6}>
                        <h6 className="mb-1">{addOn.name}</h6>
                        <small className="text-muted">{addOn.description}</small>
                      </Col>
                      <Col md={2}>
                        <Badge bg="info">{addOn.price} KSh</Badge>
                      </Col>
                      <Col md={3}>
                        <div className="d-flex align-items-center">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleAddOnQuantityChange(addOn.id, -1)}
                          >
                            <FaMinus />
                          </Button>
                          <span className="mx-3 fw-bold">{addOn.quantity}</span>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleAddOnQuantityChange(addOn.id, 1)}
                          >
                            <FaPlus />
                          </Button>
                        </div>
                      </Col>
                      <Col md={1}>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => updateAddOn(addOn.id, 0, addOn)}
                        >
                          <FaTrash />
                        </Button>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          )}
        </Col>

        <Col lg={4}>
          {/* Order Summary */}
          <Card className="sticky-top">
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{cartTotal.toLocaleString()} KSh</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Delivery:</span>
                <span className="text-success">
                  {cartTotal >= 390 ? 'FREE' : '50 KSh'}
                </span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total:</strong>
                <strong>{(cartTotal >= 390 ? cartTotal : cartTotal + 50).toLocaleString()} KSh</strong>
              </div>

              {cartTotal < 390 && (
                <Alert variant="warning" className="small">
                  Add {(390 - cartTotal).toLocaleString()} KSh more for free delivery!
                </Alert>
              )}

              <div className="d-grid gap-2">
                {isSignedIn ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleAuthenticatedCheckout}
                    disabled={isPlacingOrder}
                  >
                    <FaCreditCard className="me-2" />
                    {isPlacingOrder ? 'Placing Order...' : 'Checkout'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      size="lg"
                      href="/login"
                    >
                      <FaCreditCard className="me-2" />
                      Sign In & Checkout
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="lg"
                      onClick={() => setShowGuestCheckout(true)}
                    >
                      <FaUserPlus className="me-2" />
                      Guest Checkout
                    </Button>
                  </>
                )}
              </div>

              <div className="mt-3 text-center">
                <small className="text-muted">
                  Secure payment via M-Pesa
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Guest Checkout Modal */}
      <GuestCheckout
        show={showGuestCheckout}
        onHide={() => setShowGuestCheckout(false)}
        onGuestOrder={handleGuestOrder}
        cartTotal={cartTotal >= 390 ? cartTotal : cartTotal + 50}
        isLoading={isPlacingOrder}
      />
    </Container>
  );
};

export default Cart;