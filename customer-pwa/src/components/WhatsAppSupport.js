import React, { useState } from 'react';
import { Button, Modal, Form, Alert } from 'react-bootstrap';
import { FaWhatsapp, FaPhone, FaComments } from 'react-icons/fa';

const WhatsAppSupport = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Choprice WhatsApp Business number (replace with actual number)
  const WHATSAPP_NUMBER = '254712345678'; // Replace with actual business WhatsApp number

  const supportTopics = [
    {
      id: 'order_status',
      title: 'Order Status',
      message: 'Hi! I need help with my order status. Order ID: ',
      icon: '📦'
    },
    {
      id: 'delivery_issue',
      title: 'Delivery Issue',
      message: 'Hi! I\'m having an issue with my delivery. Details: ',
      icon: '🚚'
    },
    {
      id: 'payment_problem',
      title: 'Payment Problem',
      message: 'Hi! I\'m experiencing a payment issue. Please help with: ',
      icon: '💳'
    },
    {
      id: 'menu_inquiry',
      title: 'Menu Inquiry',
      message: 'Hi! I have a question about your menu items: ',
      icon: '🍚'
    },
    {
      id: 'feedback',
      title: 'Feedback/Complaint',
      message: 'Hi! I would like to share feedback about my experience: ',
      icon: '💬'
    },
    {
      id: 'general',
      title: 'General Support',
      message: 'Hi! I need assistance with: ',
      icon: '❓'
    }
  ];

  const openWhatsApp = (message) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleQuickMessage = (topic) => {
    const message = `${topic.message}`;
    openWhatsApp(message);
  };

  const handleCustomMessage = () => {
    if (!customMessage.trim()) return;
    
    const topic = supportTopics.find(t => t.id === selectedTopic);
    const message = topic 
      ? `${topic.message}${customMessage}`
      : `Hi! ${customMessage}`;
    
    openWhatsApp(message);
    setShowModal(false);
    setCustomMessage('');
    setSelectedTopic('');
  };

  const handleDirectCall = () => {
    // For demo purposes - replace with actual phone number
    window.open(`tel:+${WHATSAPP_NUMBER}`, '_self');
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <div className="whatsapp-float">
        <Button
          variant="success"
          className="whatsapp-btn rounded-circle shadow-lg"
          onClick={() => setShowModal(true)}
          title="Chat with us on WhatsApp"
        >
          <FaWhatsapp size={24} />
        </Button>
      </div>

      {/* Support Options Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaWhatsapp className="text-success me-2" />
            Contact Support
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          <Alert variant="info" className="mb-4">
            <strong>We're here to help!</strong><br />
            Choose a topic below or send us a custom message on WhatsApp.
          </Alert>

          <div className="mb-4">
            <h6 className="mb-3">Quick Support Topics:</h6>
            <div className="d-grid gap-2">
              {supportTopics.map(topic => (
                <Button
                  key={topic.id}
                  variant="outline-success"
                  className="text-start d-flex align-items-center"
                  onClick={() => handleQuickMessage(topic)}
                >
                  <span className="me-3" style={{ fontSize: '1.2rem' }}>
                    {topic.icon}
                  </span>
                  <div>
                    <div className="fw-bold">{topic.title}</div>
                    <small className="text-muted">
                      Quick message for {topic.title.toLowerCase()}
                    </small>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <hr />

          <div className="mb-4">
            <h6 className="mb-3">Custom Message:</h6>
            <Form.Group className="mb-3">
              <Form.Label>Select Topic (Optional)</Form.Label>
              <Form.Select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                <option value="">General Inquiry</option>
                {supportTopics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.icon} {topic.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Your Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Type your message here..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
              />
            </Form.Group>

            <Button
              variant="success"
              onClick={handleCustomMessage}
              disabled={!customMessage.trim()}
              className="w-100"
            >
              <FaWhatsapp className="me-2" />
              Send WhatsApp Message
            </Button>
          </div>

          <hr />

          <div className="text-center">
            <p className="mb-2">
              <strong>Business Hours:</strong> Mon-Sun 8:00 AM - 10:00 PM
            </p>
            <Button
              variant="outline-primary"
              onClick={handleDirectCall}
              className="me-2"
            >
              <FaPhone className="me-2" />
              Call Us
            </Button>
            <Button
              variant="outline-info"
              onClick={() => openWhatsApp('Hi! I need assistance with Choprice.')}
            >
              <FaComments className="me-2" />
              Start Chat
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Custom CSS for WhatsApp float button */}
      <style>{`
        .whatsapp-float {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }
        
        .whatsapp-btn {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #25d366 !important;
          border-color: #25d366 !important;
          animation: pulse 2s infinite;
        }
        
        .whatsapp-btn:hover {
          background-color: #128c7e !important;
          border-color: #128c7e !important;
          transform: scale(1.1);
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(37, 211, 102, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
          }
        }
        
        @media (max-width: 768px) {
          .whatsapp-float {
            bottom: 80px; /* Account for mobile navigation */
          }
        }
      `}</style>
    </>
  );
};

export default WhatsAppSupport;