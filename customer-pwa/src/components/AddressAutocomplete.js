import React, { useState, useEffect, useRef } from 'react';
import { Form, ListGroup, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  onAddressSelect, 
  placeholder = "Enter your delivery address...",
  required = false 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  // Fetch address suggestions
  const fetchSuggestions = async (input) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/maps/address-suggestions`, {
        params: { input }
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  // Validate selected address
  const validateAddress = async (address) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/maps/validate-address`, {
        params: { address }
      });

      setValidationResult(response.data);
      
      if (response.data.success && onAddressSelect) {
        onAddressSelect(response.data);
      }

      return response.data;
    } catch (err) {
      console.error('Error validating address:', err);
      setError('Failed to validate address');
      return { success: false, error: 'Validation failed' };
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setError(null);
    setValidationResult(null);

    // Clear previous timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Debounce suggestions fetch
    suggestionTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionClick = async (suggestion) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    // Get place details and validate
    try {
      const response = await axios.get(`${API_BASE_URL}/api/maps/place-details`, {
        params: { placeId: suggestion.placeId }
      });

      if (response.data.success) {
        setValidationResult(response.data);
        if (onAddressSelect) {
          onAddressSelect(response.data);
        }
      }
    } catch (err) {
      console.error('Error getting place details:', err);
      setError('Failed to get address details');
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);

    // Validate current address if it's not empty
    if (value && value.trim() && !validationResult) {
      validateAddress(value);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="address-autocomplete position-relative">
      <Form.Control
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        className={`${validationResult?.success === false ? 'is-invalid' : ''} ${
          validationResult?.success === true ? 'is-valid' : ''
        }`}
      />

      {loading && (
        <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
          <Spinner animation="border" size="sm" />
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ListGroup className="position-absolute w-100 shadow-lg" style={{ zIndex: 1000, top: '100%' }}>
          {suggestions.map((suggestion, index) => (
            <ListGroup.Item
              key={suggestion.placeId}
              action
              onClick={() => handleSuggestionClick(suggestion)}
              className="d-flex align-items-center"
            >
              <div>
                <div className="fw-medium">{suggestion.mainText}</div>
                <small className="text-muted">{suggestion.secondaryText}</small>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="mt-2">
          {validationResult.success ? (
            validationResult.isInDeliveryArea?.inArea ? (
              <Alert variant="success" className="py-2 mb-2">
                <i className="fas fa-check-circle me-2"></i>
                Great! We deliver to {validationResult.isInDeliveryArea.areaName}
                <div className="small mt-1">
                  <i className="fas fa-clock me-1"></i>
                  Estimated delivery: 30-45 minutes
                </div>
              </Alert>
            ) : (
              <Alert variant="warning" className="py-2 mb-2">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Sorry, we don't deliver to this area yet.
                {validationResult.isInDeliveryArea?.nearestArea && (
                  <div className="small mt-1">
                    Nearest delivery area: {validationResult.isInDeliveryArea.nearestArea.name} 
                    ({Math.round(validationResult.isInDeliveryArea.nearestArea.distance / 1000)}km away)
                  </div>
                )}
              </Alert>
            )
          ) : (
            <Alert variant="danger" className="py-2 mb-2">
              <i className="fas fa-times-circle me-2"></i>
              {validationResult.error || 'Address not found'}
            </Alert>
          )}
        </div>
      )}

      {error && (
        <Alert variant="danger" className="py-2 mb-2">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Delivery Areas Info */}
      <Form.Text className="text-muted">
        <i className="fas fa-info-circle me-1"></i>
        We deliver to: Kilimani, Westlands, Upper Hill, Lavington, Kileleshwa, Hurlingham, Parklands
      </Form.Text>
    </div>
  );
};

export default AddressAutocomplete;