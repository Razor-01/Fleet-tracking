# 🔌 API Integration Documentation

This document provides comprehensive information about integrating with external APIs used in the Fleet Tracking System.

## 📋 Table of Contents

- [Motive API Integration](#motive-api-integration)
- [Mapbox API Integration](#mapbox-api-integration)
- [HERE Maps API](#here-maps-api)
- [Google Maps API](#google-maps-api)
- [Rate Limiting & Usage](#rate-limiting--usage)
- [Error Handling](#error-handling)
- [Testing & Debugging](#testing--debugging)

## 🚛 Motive API Integration

### Overview

The Motive API provides real-time vehicle location data, fleet information, and vehicle status updates.

### Authentication

```typescript
// API Key Authentication
headers: {
  'accept': 'application/json',
  'x-api-key': 'your_motive_api_key',
  'Content-Type': 'application/json'
}
```

### Endpoints Used

#### 1. Vehicle Locations (Paginated)
```
GET /v1/vehicle_locations?per_page=25&page_no=1
```

**Response Structure:**
```json
{
  "vehicles": [
    {
      "id": "vehicle_123",
      "name": "Truck 001",
      "current_location": {
        "lat": 40.7128,
        "lon": -74.0060,
        "address": "New York, NY",
        "located_at": "2024-01-15T10:30:00Z"
      },
      "speed": 45.5,
      "status": "moving"
    }
  ]
}
```

#### 2. Fleet Vehicles Locations
```
GET /v1/fleets/{fleet_id}/vehicles_locations
```

#### 3. Individual Vehicle Locations
```
GET /v1/vehicles/{vehicle_id}/locations?limit=1
```

### Data Processing

The system handles multiple coordinate property variations:

```typescript
// Coordinate extraction logic
const extractCoordinates = (locationData: any) => {
  // Try different property names
  const lat = locationData.lat || locationData.latitude;
  const lon = locationData.lon || locationData.lng || locationData.longitude;
  
  // Handle nested coordinates
  if (!lat || !lon) {
    const coords = locationData.coordinates;
    if (coords) {
      return {
        lat: coords.lat || coords.latitude,
        lon: coords.lon || coords.lng || coords.longitude
      };
    }
  }
  
  return { lat, lon };
};
```

### Common Issues & Solutions

#### Missing Coordinates
```typescript
// Debug coordinate extraction
const debugCoordinates = (vehicle: any) => {
  console.log('Vehicle coordinate sources:', {
    current_location: vehicle.current_location,
    last_known_location: vehicle.last_known_location,
    direct_properties: {
      lat: vehicle.lat,
      lon: vehicle.lon,
      longitude: vehicle.longitude
    }
  });
};
```

#### API Response Variations
The Motive API may return data in different structures:
- `vehicles` array
- `vehicle_locations` array
- `data` array
- Direct array response

### Rate Limiting
- **Default**: 1000 requests per hour
- **Burst**: 100 requests per minute
- **Implementation**: 2-second minimum delay between requests

## 🗺️ Mapbox API Integration

### Overview

Mapbox provides geocoding and distance calculation services with excellent performance and caching.

### Authentication

```typescript
const accessToken = 'sk.your_mapbox_secret_key';
```

### Endpoints Used

#### 1. Geocoding
```
GET /geocoding/v5/mapbox.places/{address}.json?access_token={token}&limit=1
```

**Example Request:**
```typescript
const geocodeAddress = async (address: string) => {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${accessToken}&limit=1`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].center;
    return {
      lat,
      lng,
      formattedAddress: data.features[0].place_name
    };
  }
  
  throw new Error('Address not found');
};
```

#### 2. Distance Calculation
```
GET /directions/v5/mapbox/driving/{start_lng},{start_lat};{end_lng},{end_lat}?access_token={token}
```

**Example Request:**
```typescript
const calculateDistance = async (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?access_token=${accessToken}&geometries=geojson&overview=simplified`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    return {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      distanceMiles: (route.distance * 0.000621371).toFixed(1),
      durationHours: Math.floor(route.duration / 3600),
      durationMinutes: Math.floor((route.duration % 3600) / 60)
    };
  }
  
  throw new Error('No route found');
};
```

### Caching Strategy

```typescript
interface CacheEntry {
  result: any;
  timestamp: number;
  vehiclePosition: { lat: number; lon: number };
}

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours
const POSITION_THRESHOLD = 0.001; // ~111 meters

const isCacheValid = (entry: CacheEntry, currentLat: number, currentLon: number): boolean => {
  const isRecent = (Date.now() - entry.timestamp) < CACHE_DURATION;
  const positionUnchanged = 
    Math.abs(entry.vehiclePosition.lat - currentLat) < POSITION_THRESHOLD &&
    Math.abs(entry.vehiclePosition.lon - currentLon) < POSITION_THRESHOLD;
  
  return isRecent && positionUnchanged;
};
```

### Usage Limits
- **Free Tier**: 100,000 requests per month
- **Geocoding**: 100,000 requests per month
- **Directions**: 100,000 requests per month

## 🌍 HERE Maps API

### Overview

HERE Maps provides commercial-grade routing with truck-specific features.

### Authentication

```typescript
const apiKey = 'your_here_api_key';
```

### Endpoints

#### Geocoding
```
GET /geocode/v1/geocode?q={address}&apikey={key}
```

#### Routing
```
GET /router/v8/routes?transportMode=truck&origin={lat},{lng}&destination={lat},{lng}&apikey={key}
```

### Implementation Example

```typescript
const hereGeocode = async (address: string) => {
  const response = await fetch(
    `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(address)}&apikey=${apiKey}`
  );
  
  const data = await response.json();
  const result = data.items?.[0];
  
  if (result) {
    return {
      lat: result.position.lat,
      lon: result.position.lng,
      address: result.address.label
    };
  }
  
  return null;
};
```

## 🌐 Google Maps API

### Overview

Google Maps provides comprehensive mapping data with global coverage.

### Authentication

```typescript
const apiKey = 'your_google_maps_api_key';
```

### Endpoints

#### Geocoding
```
GET /maps/api/geocode/json?address={address}&key={key}
```

#### Distance Matrix
```
GET /maps/api/distancematrix/json?origins={origin}&destinations={destination}&key={key}
```

## ⚡ Rate Limiting & Usage

### Implementation Strategy

```typescript
class RateLimiter {
  private lastRequestTime = 0;
  private readonly minInterval = 250; // 250ms between requests
  
  async makeRequest(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    return fetch(url);
  }
}
```

### Usage Monitoring

```typescript
interface UsageStats {
  totalRequests: number;
  requestsToday: number;
  cacheHitRate: number;
  lastResetDate: string;
}

class UsageTracker {
  private stats: UsageStats;
  
  trackRequest(fromCache: boolean = false): void {
    this.stats.totalRequests++;
    
    if (!fromCache) {
      this.stats.requestsToday++;
    }
    
    this.updateCacheHitRate(fromCache);
    this.saveStats();
  }
  
  isApproachingLimit(limit: number): boolean {
    return this.stats.requestsToday > (limit * 0.8); // 80% threshold
  }
}
```

## 🚨 Error Handling

### API Error Types

```typescript
enum APIErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  NOT_FOUND = 'not_found',
  NETWORK = 'network',
  INVALID_DATA = 'invalid_data'
}

class APIError extends Error {
  constructor(
    public type: APIErrorType,
    public statusCode: number,
    message: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}
```

### Error Handling Strategy

```typescript
const handleAPIError = (error: any, context: string): APIError => {
  if (error.status === 401) {
    return new APIError(
      APIErrorType.AUTHENTICATION,
      401,
      'Invalid API credentials',
      false
    );
  }
  
  if (error.status === 429) {
    return new APIError(
      APIErrorType.RATE_LIMIT,
      429,
      'Rate limit exceeded',
      true
    );
  }
  
  if (error.status >= 500) {
    return new APIError(
      APIErrorType.NETWORK,
      error.status,
      'Server error',
      true
    );
  }
  
  return new APIError(
    APIErrorType.INVALID_DATA,
    error.status || 0,
    `API error in ${context}: ${error.message}`,
    false
  );
};
```

### Retry Logic

```typescript
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
};
```

## 🧪 Testing & Debugging

### API Connection Testing

```typescript
const testAPIConnection = async (apiType: 'motive' | 'mapbox' | 'here' | 'google') => {
  const testCases = {
    motive: () => motiveApi.testConnection(),
    mapbox: () => mapboxService.geocodeAddress('1600 Amphitheatre Parkway, Mountain View, CA'),
    here: () => hereApi.geocodeAddress('Times Square, New York'),
    google: () => googleApi.geocodeAddress('Golden Gate Bridge, San Francisco')
  };
  
  try {
    const result = await testCases[apiType]();
    console.log(`✅ ${apiType} API connection successful:`, result);
    return true;
  } catch (error) {
    console.error(`❌ ${apiType} API connection failed:`, error);
    return false;
  }
};
```

### Debug Logging

```typescript
const debugAPICall = (endpoint: string, params: any, response: any) => {
  console.group(`🔍 API Debug: ${endpoint}`);
  console.log('Parameters:', params);
  console.log('Response Status:', response.status);
  console.log('Response Data:', response.data);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
};
```

### Performance Monitoring

```typescript
const monitorAPIPerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    console.log(`⚡ ${operationName} completed in ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};
```

## 📊 Best Practices

### 1. Caching Strategy
- Cache geocoding results for 24 hours
- Cache distance calculations for 2 hours with position validation
- Use localStorage for client-side caching
- Implement cache invalidation based on data freshness

### 2. Error Recovery
- Implement exponential backoff for retries
- Graceful degradation when APIs are unavailable
- User-friendly error messages
- Fallback to cached data when possible

### 3. Performance Optimization
- Batch API requests when possible
- Use appropriate request timeouts
- Monitor and log API usage
- Implement request deduplication

### 4. Security
- Never expose API keys in client-side code
- Use environment variables for configuration
- Implement proper CORS settings
- Validate all API responses

---

For more information, see the main [README.md](../README.md) or contact the development team.