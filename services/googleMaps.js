const axios = require('axios');

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
    
    // Nairobi delivery areas coordinates
    this.deliveryAreas = [
      { name: 'Kilimani', bounds: { lat: -1.2921, lng: 36.7872, radius: 3000 } },
      { name: 'Kileleshwa', bounds: { lat: -1.2685, lng: 36.7692, radius: 2500 } },
      { name: 'Lavington', bounds: { lat: -1.2744, lng: 36.7656, radius: 2000 } },
      { name: 'Hurlingham', bounds: { lat: -1.2962, lng: 36.7756, radius: 1500 } },
      { name: 'Upper Hill', bounds: { lat: -1.2885, lng: 36.8219, radius: 2000 } },
      { name: 'Westlands', bounds: { lat: -1.2676, lng: 36.8108, radius: 3000 } },
      { name: 'Parklands', bounds: { lat: -1.2631, lng: 36.8581, radius: 2500 } }
    ];
  }

  // Validate address using Google Places API
  async validateAddress(address) {
    try {
      const response = await axios.get(`${this.baseUrl}/place/textsearch/json`, {
        params: {
          query: `${address}, Nairobi, Kenya`,
          key: this.apiKey,
          region: 'ke',
          language: 'en'
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const place = response.data.results[0];
        return {
          success: true,
          address: place.formatted_address,
          location: place.geometry.location,
          placeId: place.place_id,
          isInDeliveryArea: this.isInDeliveryArea(place.geometry.location)
        };
      } else {
        return {
          success: false,
          error: 'Address not found'
        };
      }
    } catch (error) {
      console.error('Address validation error:', error);
      return {
        success: false,
        error: 'Failed to validate address'
      };
    }
  }

  // Check if location is within delivery areas
  isInDeliveryArea(location) {
    for (const area of this.deliveryAreas) {
      const distance = this.calculateDistance(
        location.lat, 
        location.lng, 
        area.bounds.lat, 
        area.bounds.lng
      );
      
      if (distance <= area.bounds.radius) {
        return {
          inArea: true,
          areaName: area.name,
          distance: Math.round(distance)
        };
      }
    }
    
    return {
      inArea: false,
      nearestArea: this.findNearestArea(location),
      message: 'Sorry, we don\'t deliver to this area yet'
    };
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Find nearest delivery area
  findNearestArea(location) {
    let nearest = null;
    let minDistance = Infinity;

    for (const area of this.deliveryAreas) {
      const distance = this.calculateDistance(
        location.lat, 
        location.lng, 
        area.bounds.lat, 
        area.bounds.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = {
          name: area.name,
          distance: Math.round(distance)
        };
      }
    }

    return nearest;
  }

  // Get address suggestions (autocomplete)
  async getAddressSuggestions(input) {
    try {
      const response = await axios.get(`${this.baseUrl}/place/autocomplete/json`, {
        params: {
          input: input,
          key: this.apiKey,
          location: '-1.2921,36.8219', // Nairobi center
          radius: 20000, // 20km radius
          region: 'ke',
          components: 'country:ke',
          types: 'address'
        }
      });

      if (response.data.status === 'OK') {
        return {
          success: true,
          suggestions: response.data.predictions.map(prediction => ({
            placeId: prediction.place_id,
            description: prediction.description,
            mainText: prediction.structured_formatting.main_text,
            secondaryText: prediction.structured_formatting.secondary_text
          }))
        };
      } else {
        return {
          success: false,
          suggestions: []
        };
      }
    } catch (error) {
      console.error('Address suggestions error:', error);
      return {
        success: false,
        suggestions: []
      };
    }
  }

  // Get place details by place ID
  async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: 'formatted_address,geometry,name,types'
        }
      });

      if (response.data.status === 'OK') {
        const place = response.data.result;
        return {
          success: true,
          address: place.formatted_address,
          location: place.geometry.location,
          name: place.name,
          types: place.types,
          isInDeliveryArea: this.isInDeliveryArea(place.geometry.location)
        };
      } else {
        return {
          success: false,
          error: 'Place not found'
        };
      }
    } catch (error) {
      console.error('Place details error:', error);
      return {
        success: false,
        error: 'Failed to get place details'
      };
    }
  }

  // Calculate delivery route and time
  async calculateDeliveryRoute(origin, destination) {
    try {
      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          key: this.apiKey,
          mode: 'driving',
          traffic_model: 'best_guess',
          departure_time: 'now'
        }
      });

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        return {
          success: true,
          distance: leg.distance,
          duration: leg.duration,
          durationInTraffic: leg.duration_in_traffic || leg.duration,
          polyline: route.overview_polyline.points,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance,
            duration: step.duration
          }))
        };
      } else {
        return {
          success: false,
          error: 'Route not found'
        };
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      return {
        success: false,
        error: 'Failed to calculate route'
      };
    }
  }

  // Estimate delivery time based on distance and traffic
  estimateDeliveryTime(distance, currentTraffic = 'normal') {
    const baseTime = 20; // 20 minutes base preparation time
    const speedKmh = currentTraffic === 'heavy' ? 15 : 
                     currentTraffic === 'moderate' ? 25 : 35;
    
    const travelTime = (distance / 1000) / speedKmh * 60; // Convert to minutes
    const totalTime = baseTime + travelTime;
    
    return {
      estimatedMinutes: Math.round(totalTime),
      preparationTime: baseTime,
      travelTime: Math.round(travelTime),
      trafficCondition: currentTraffic
    };
  }

  // Get current traffic conditions
  async getTrafficConditions(origin, destination) {
    const route = await this.calculateDeliveryRoute(origin, destination);
    
    if (route.success) {
      const normalDuration = route.duration.value;
      const trafficDuration = route.durationInTraffic.value;
      const delay = trafficDuration - normalDuration;
      
      let condition = 'light';
      if (delay > 600) condition = 'heavy'; // 10+ minutes delay
      else if (delay > 300) condition = 'moderate'; // 5+ minutes delay
      
      return {
        condition,
        delay: Math.round(delay / 60), // in minutes
        normalTime: Math.round(normalDuration / 60),
        currentTime: Math.round(trafficDuration / 60)
      };
    }
    
    return { condition: 'normal', delay: 0 };
  }
}

module.exports = new GoogleMapsService();