import { MapProvider, APIConfig } from '../types';

interface GeocodingResult {
  lat: number;
  lon: number;
  address: string;
}

interface DistanceResult {
  distance: number; // in miles
  duration: number; // in seconds
}

class MappingAPIService {
  private activeConfig: APIConfig | null = null;
  private geocodeCache = new Map<string, GeocodingResult>();

  setActiveConfig(config: APIConfig) {
    this.activeConfig = config;
  }

  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    // Check cache first
    if (this.geocodeCache.has(address)) {
      return this.geocodeCache.get(address)!;
    }

    if (!this.activeConfig) {
      throw new Error('No active mapping API configuration');
    }

    try {
      let result: GeocodingResult | null = null;

      switch (this.activeConfig.provider) {
        case MapProvider.HERE:
          result = await this.geocodeWithHere(address);
          break;
        case MapProvider.MAPBOX:
          result = await this.geocodeWithMapbox(address);
          break;
        case MapProvider.GOOGLE:
          result = await this.geocodeWithGoogle(address);
          break;
      }

      if (result) {
        this.geocodeCache.set(address, result);
      }

      return result;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async calculateDistance(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number }
  ): Promise<DistanceResult | null> {
    if (!this.activeConfig) {
      throw new Error('No active mapping API configuration');
    }

    try {
      switch (this.activeConfig.provider) {
        case MapProvider.HERE:
          return await this.calculateDistanceWithHere(from, to);
        case MapProvider.MAPBOX:
          return await this.calculateDistanceWithMapbox(from, to);
        case MapProvider.GOOGLE:
          return await this.calculateDistanceWithGoogle(from, to);
        default:
          return null;
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      return null;
    }
  }

  private async geocodeWithHere(address: string): Promise<GeocodingResult | null> {
    const response = await fetch(
      `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(address)}&apikey=${this.activeConfig!.apiKey}`
    );
    
    const data = await response.json();
    const result = data.items?.[0];
    
    if (result) {
      return {
        lat: result.position.lat,
        lon: result.position.lng,
        address: result.address.label,
      };
    }
    
    return null;
  }

  private async geocodeWithMapbox(address: string): Promise<GeocodingResult | null> {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${this.activeConfig!.apiKey}`
    );
    
    const data = await response.json();
    const result = data.features?.[0];
    
    if (result) {
      return {
        lat: result.center[1],
        lon: result.center[0],
        address: result.place_name,
      };
    }
    
    return null;
  }

  private async geocodeWithGoogle(address: string): Promise<GeocodingResult | null> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.activeConfig!.apiKey}`
    );
    
    const data = await response.json();
    const result = data.results?.[0];
    
    if (result) {
      return {
        lat: result.geometry.location.lat,
        lon: result.geometry.location.lng,
        address: result.formatted_address,
      };
    }
    
    return null;
  }

  private async calculateDistanceWithHere(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number }
  ): Promise<DistanceResult | null> {
    const response = await fetch(
      `https://router.hereapi.com/v8/routes?transportMode=truck&origin=${from.lat},${from.lon}&destination=${to.lat},${to.lon}&return=summary&apikey=${this.activeConfig!.apiKey}`
    );
    
    const data = await response.json();
    const route = data.routes?.[0];
    
    if (route) {
      return {
        distance: route.sections[0].summary.length * 0.000621371, // convert meters to miles
        duration: route.sections[0].summary.duration,
      };
    }
    
    return null;
  }

  private async calculateDistanceWithMapbox(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number }
  ): Promise<DistanceResult | null> {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lon},${from.lat};${to.lon},${to.lat}?access_token=${this.activeConfig!.apiKey}`
    );
    
    const data = await response.json();
    const route = data.routes?.[0];
    
    if (route) {
      return {
        distance: route.distance * 0.000621371, // convert meters to miles
        duration: route.duration,
      };
    }
    
    return null;
  }

  private async calculateDistanceWithGoogle(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number }
  ): Promise<DistanceResult | null> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${from.lat},${from.lon}&destinations=${to.lat},${to.lon}&units=imperial&key=${this.activeConfig!.apiKey}`
    );
    
    const data = await response.json();
    const element = data.rows?.[0]?.elements?.[0];
    
    if (element && element.status === 'OK') {
      return {
        distance: element.distance.value * 0.000621371, // convert meters to miles
        duration: element.duration.value,
      };
    }
    
    return null;
  }

  async testApiConnection(): Promise<boolean> {
    if (!this.activeConfig) return false;
    
    try {
      const testResult = await this.geocodeAddress('1600 Amphitheatre Parkway, Mountain View, CA');
      return testResult !== null;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

export const mappingApi = new MappingAPIService();