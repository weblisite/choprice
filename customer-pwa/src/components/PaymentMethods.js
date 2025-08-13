import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PaymentMethods = ({ orderAmount, onPaymentMethodSelect, onPaymentInitiate }) => {
  const [availableMethods, setAvailableMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  const [paymentData, setPaymentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    loadAvailablePaymentMethods();
  }, [orderAmount]);

  const loadAvailablePaymentMethods = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/payment/methods`, {
        params: { amount: orderAmount }
      });

      if (response.data.success) {
        setAvailableMethods(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedMethod(response.data.data[0].id);
          onPaymentMethodSelect(response.data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      // Fallback to default methods
      setAvailableMethods([
        {
          id: 'mpesa',
          name: 'M-Pesa',
          description: 'Pay with M-Pesa STK Push',
          icon: '/images/mpesa-logo.png',
          processingTime: 'Instant',
          fees: 'No additional fees'
        }
      ]);
      setSelectedMethod('mpesa');
    }
  };

  const handleMethodChange = (methodId) => {
    setSelectedMethod(methodId);
    const method = availableMethods.find(m => m.id === methodId);
    onPaymentMethodSelect(method);
    setPaymentData({});
  };

  const handlePaymentDataChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePaymentData = () => {
    switch (selectedMethod) {
      case 'mpesa':
        if (!paymentData.phoneNumber) {
          toast.error('Please enter your M-Pesa phone number');
          return false;
        }
        if (!/^(254|0)[0-9]{9}$/.test(paymentData.phoneNumber.replace(/\s/g, ''))) {
          toast.error('Please enter a valid Kenyan phone number');
          return false;
        }
        return true;

      case 'stripe':
        if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
          toast.error('Please fill in all card details');
          return false;
        }
        return true;

      case 'bank_transfer':
        if (!paymentData.customerName) {
          toast.error('Please enter your full name for bank transfer');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const initiatePayment = async () => {
    if (!validatePaymentData()) return;

    setProcessingPayment(true);
    try {
      const paymentPayload = {
        method: selectedMethod,
        amount: orderAmount,
        data: paymentData
      };

      await onPaymentInitiate(paymentPayload);
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'mpesa':
        return (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>M-Pesa Phone Number</Form.Label>
              <Form.Control
                type="tel"
                placeholder="0700000000 or 254700000000"
                value={paymentData.phoneNumber || ''}
                onChange={(e) => handlePaymentDataChange('phoneNumber', e.target.value)}
              />
              <Form.Text className="text-muted">
                You will receive an STK Push prompt on your phone
              </Form.Text>
            </Form.Group>
          </div>
        );

      case 'stripe':
        return (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>Card Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber || ''}
                onChange={(e) => handlePaymentDataChange('cardNumber', e.target.value)}
              />
            </Form.Group>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="MM/YY"
                    value={paymentData.expiryDate || ''}
                    onChange={(e) => handlePaymentDataChange('expiryDate', e.target.value)}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>CVV</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="123"
                    value={paymentData.cvv || ''}
                    onChange={(e) => handlePaymentDataChange('cvv', e.target.value)}
                  />
                </Form.Group>
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Cardholder Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="John Doe"
                value={paymentData.cardholderName || ''}
                onChange={(e) => handlePaymentDataChange('cardholderName', e.target.value)}
              />
            </Form.Group>
          </div>
        );

      case 'flutterwave':
        return (
          <div>
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              You will be redirected to Flutterwave to complete your payment using your preferred method.
            </Alert>
          </div>
        );

      case 'bank_transfer':
        return (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>Full Name (as per bank account)</Form.Label>
              <Form.Control
                type="text"
                placeholder="John Doe"
                value={paymentData.customerName || ''}
                onChange={(e) => handlePaymentDataChange('customerName', e.target.value)}
              />
            </Form.Group>
            <Alert variant="warning">
              <strong>Bank Transfer Instructions:</strong>
              <ol className="mb-0 mt-2">
                <li>Transfer the exact amount to the provided bank details</li>
                <li>Use the reference number in your transaction description</li>
                <li>Send proof of payment via WhatsApp</li>
                <li>Order will be confirmed once payment is verified</li>
              </ol>
            </Alert>
          </div>
        );

      case 'paypal':
        return (
          <div>
            <Alert variant="info">
              <i className="fab fa-paypal me-2"></i>
              You will be redirected to PayPal to complete your payment securely.
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="john@example.com"
                value={paymentData.email || ''}
                onChange={(e) => handlePaymentDataChange('email', e.target.value)}
              />
            </Form.Group>
          </div>
        );

      default:
        return null;
    }
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString()} KSh`;
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" className="mb-3" />
          <p>Loading payment methods...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          <i className="fas fa-credit-card me-2"></i>
          Payment Method
        </h5>
      </Card.Header>
      <Card.Body>
        {/* Payment Method Selection */}
        <div className="mb-4">
          {availableMethods.map(method => (
            <div key={method.id} className="mb-3">
              <div
                className={`border rounded p-3 cursor-pointer ${
                  selectedMethod === method.id ? 'border-primary bg-light' : 'border-secondary'
                }`}
                onClick={() => handleMethodChange(method.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center">
                  <Form.Check
                    type="radio"
                    id={method.id}
                    name="paymentMethod"
                    checked={selectedMethod === method.id}
                    onChange={() => handleMethodChange(method.id)}
                    className="me-3"
                  />
                  
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-1">
                      <strong className="me-2">{method.name}</strong>
                      <Badge bg="success" className="me-2">{method.processingTime}</Badge>
                      {method.fees && (
                        <small className="text-muted">{method.fees}</small>
                      )}
                    </div>
                    <p className="mb-0 text-muted small">{method.description}</p>
                  </div>
                  
                  {method.icon && (
                    <img
                      src={method.icon}
                      alt={method.name}
                      style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Form */}
        {selectedMethod && (
          <div className="mb-4">
            <h6 className="mb-3">Payment Details</h6>
            {renderPaymentForm()}
          </div>
        )}

        {/* Payment Summary */}
        <div className="border-top pt-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>Order Total:</span>
            <strong className="fs-5">{formatCurrency(orderAmount)}</strong>
          </div>
          
          <Button
            variant="success"
            size="lg"
            className="w-100"
            onClick={initiatePayment}
            disabled={processingPayment || !selectedMethod}
          >
            {processingPayment ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing Payment...
              </>
            ) : (
              <>
                <i className="fas fa-lock me-2"></i>
                Pay {formatCurrency(orderAmount)}
              </>
            )}
          </Button>
          
          <div className="text-center mt-3">
            <small className="text-muted">
              <i className="fas fa-shield-alt me-1"></i>
              Your payment is secured with 256-bit SSL encryption
            </small>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PaymentMethods;