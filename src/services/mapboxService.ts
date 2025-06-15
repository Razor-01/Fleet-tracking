interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface DistanceResult {
  distance: number; // meters
  duration: number; // seconds
  distanceMiles: string;
  distanceKm: string;
  durationHours: number;
  durationMinutes: number;
  eta: string;
}

class MapboxService {
  private accessToken: string;
  private baseUrl: string;
  private geocodeCache: Map<string, GeocodingResult>;
  private distanceCache: Map<string, DistanceResult>;

  constructor() {
    this.accessToken = 'sk.eyJ1IjoicmF5LTE3ODkiLCJhIjoiY205YjQ3MjRsMGFicTJqczV0czB0MnJncCJ9.5W9k0BNE7HxFa-7O_ICKmA';
    this.baseUrl = 'https://api.mapbox.com';
    this.geocodeCache = new Map();
    this.distanceCache = new Map();
  }

  // Geocode address to get coordinates
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    // Check cache first
    const cacheKey = address.toLowerCase().trim();
    if (this.geocodeCache.has(cacheKey)) {
      console.log('📍 Using cached geocoding result for:', address);
      return this.geocodeCache.get(cacheKey)!;
    }

    try {
      console.log('🔍 Geocoding address:', address);
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.baseUrl}/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${this.accessToken}&limit=1`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const result: GeocodingResult = {
          lat: lat,
          lng: lng,
          formattedAddress: data.features[0].place_name
        };
        
        // Cache the result
        this.geocodeCache.set(cacheKey, result);
        console.log('✅ Geocoding successful:', result);
        return result;
      } else {
        throw new Error('Address not found');
      }
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      throw error;
    }
  }

  // Calculate driving distance and duration between two points
  async calculateDistance(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<DistanceResult> {
    // Create cache key for this route
    const cacheKey = `${fromLat.toFixed(6)},${fromLng.toFixed(6)}-${toLat.toFixed(6)},${toLng.toFixed(6)}`;
    
    if (this.distanceCache.has(cacheKey)) {
      console.log('🗺️ Using cached distance result');
      return this.distanceCache.get(cacheKey)!;
    }

    try {
      console.log(`🛣️ Calculating distance from ${fromLat},${fromLng} to ${toLat},${toLng}`);
      const url = `${this.baseUrl}/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?access_token=${this.accessToken}&geometries=geojson&overview=simplified`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Distance calculation failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const result: DistanceResult = {
          distance: route.distance, // meters
          duration: route.duration, // seconds
          distanceMiles: (route.distance * 0.000621371).toFixed(1), // convert to miles
          distanceKm: (route.distance / 1000).toFixed(1), // convert to km
          durationHours: Math.floor(route.duration / 3600),
          durationMinutes: Math.floor((route.duration % 3600) / 60),
          eta: this.calculateETA(route.duration)
        };
        
        // Cache the result
        this.distanceCache.set(cacheKey, result);
        console.log('✅ Distance calculation successful:', result);
        return result;
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      console.error('❌ Distance calculation error:', error);
      throw error;
    }
  }

  // Calculate ETA in Eastern Time (EST/EDT)
  private calculateETA(durationSeconds: number): string {
    const now = new Date();
    const etaTime = new Date(now.getTime() + durationSeconds * 1000);
    
    // Format in Eastern Time (EST/EDT)
    return etaTime.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Get current time in Eastern Time
  getCurrentEasternTime(): string {
    const now = new Date();
    return now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // Format timestamp in Eastern Time
  formatEasternTime(timestamp: string | Date): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing Mapbox API connection...');
      const testResult = await this.geocodeAddress('1600 Amphitheatre Parkway, Mountain View, CA');
      console.log('✅ Mapbox API connection successful');
      return true;
    } catch (error) {
      console.error('❌ Mapbox API connection test failed:', error);
      return false;
    }
  }

  // Clear caches
  clearCache(): void {
    this.geocodeCache.clear();
    this.distanceCache.clear();
    console.log('🗑️ Mapbox caches cleared');
  }

  // Get cache statistics
  getCacheStats(): { geocodeEntries: number; distanceEntries: number } {
    return {
      geocodeEntries: this.geocodeCache.size,
      distanceEntries: this.distanceCache.size
    };
  }
}

export const mapboxService = new MapboxService();