import { Vehicle, VehicleStatus } from '../types';

interface MotiveVehicleResponse {
  vehicles?: any[];
  vehicle_locations?: any[];
  data?: any[];
}

interface MotiveLocationData {
  lat?: number;
  lng?: number;
  lon?: number;
  longitude?: number;
  latitude?: number;
  located_at?: string;
  recorded_at?: string;
  timestamp?: string;
  address?: string;
  formatted_address?: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
  coordinates?: {
    lat?: number;
    lng?: number;
    lon?: number;
    latitude?: number;
    longitude?: number;
  };
}

interface MotiveVehicleData {
  id: string;
  name?: string;
  number?: string;
  license_plate?: string;
  vehicle_number?: string;
  current_location?: MotiveLocationData;
  last_known_location?: MotiveLocationData;
  location?: MotiveLocationData;
  status?: string;
  driver?: {
    id: string;
    name: string;
  };
  vehicle?: any;
  // Direct location properties (for some API responses)
  lat?: number;
  lng?: number;
  lon?: number;
  longitude?: number;
  latitude?: number;
  speed?: number;
  updated_at?: string;
}

class CoordinateDebugger {
  static debugVehicleCoordinates(vehicle: any, index: number) {
    console.group(`🗺️ COORDINATE DEBUG - Vehicle ${index + 1}`);
    
    const locationSources = [
      { name: 'current_location', data: vehicle.current_location },
      { name: 'last_known_location', data: vehicle.last_known_location },
      { name: 'location', data: vehicle.location },
      { name: 'direct_properties', data: this.extractDirectCoordinates(vehicle) }
    ];
    
    locationSources.forEach(source => {
      if (source.data) {
        console.log(`📍 ${source.name}:`, {
          allKeys: Object.keys(source.data),
          lat: source.data.lat,
          latitude: source.data.latitude,
          lng: source.data.lng,
          lon: source.data.lon,
          longitude: source.data.longitude,
          coordinates: source.data.coordinates,
          fullData: source.data
        });
      }
    });
    
    console.groupEnd();
  }
  
  static extractDirectCoordinates(vehicle: any) {
    const directCoords: any = {};
    if (vehicle.lat !== undefined) directCoords.lat = vehicle.lat;
    if (vehicle.latitude !== undefined) directCoords.latitude = vehicle.latitude;
    if (vehicle.lng !== undefined) directCoords.lng = vehicle.lng;
    if (vehicle.lon !== undefined) directCoords.lon = vehicle.lon;
    if (vehicle.longitude !== undefined) directCoords.longitude = vehicle.longitude;
    
    return Object.keys(directCoords).length > 0 ? directCoords : null;
  }
  
  static logCoordinateExtractionResult(vehicle: any, lat: number, lon: number, source: string) {
    const isValid = this.isValidCoordinate(lat, lon);
    console.log(`🎯 Coordinate Extraction Result:`, {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name || vehicle.number,
      extractedLat: lat,
      extractedLon: lon,
      source: source,
      isValid: isValid,
      issue: !isValid ? this.diagnoseCoordinateIssue(lat, lon) : 'None'
    });
  }
  
  static isValidCoordinate(lat: number, lon: number): boolean {
    return lat !== 0 && lon !== 0 && 
           lat >= -90 && lat <= 90 && 
           lon >= -180 && lon <= 180;
  }
  
  static diagnoseCoordinateIssue(lat: number, lon: number): string {
    if (lat === 0 && lon === 0) return 'Both coordinates are zero';
    if (lat === 0) return 'Latitude is zero';
    if (lon === 0) return 'Longitude is zero';
    if (lat < -90 || lat > 90) return 'Latitude out of range';
    if (lon < -180 || lon > 180) return 'Longitude out of range';
    return 'Unknown issue';
  }
}

class APIDebugger {
  static logAPIResponse(endpoint: string, response: any, vehicles: any[]) {
    console.group(`🔍 MOTIVE API DEBUG - ${endpoint}`);
    console.log('📡 Raw Response Structure:', {
      topLevelKeys: Object.keys(response),
      vehicleCount: vehicles.length,
      responseType: Array.isArray(response) ? 'Array' : 'Object'
    });
    
    if (vehicles.length > 0) {
      console.log('🚛 Sample Vehicle Structure:', {
        firstVehicle: vehicles[0],
        vehicleKeys: Object.keys(vehicles[0]),
        hasCurrentLocation: !!vehicles[0].current_location,
        hasLastKnownLocation: !!vehicles[0].last_known_location,
        hasDirectCoords: !!(vehicles[0].lat || vehicles[0].latitude)
      });
      
      // Debug coordinates for first few vehicles
      vehicles.slice(0, 5).forEach((vehicle, index) => {
        CoordinateDebugger.debugVehicleCoordinates(vehicle, index);
      });
    }
    
    console.groupEnd();
  }
  
  static logProcessingResult(vehicles: Vehicle[]) {
    console.group('🎯 PROCESSING RESULTS');
    console.log(`✅ Successfully processed ${vehicles.length} vehicles`);
    
    const locationStats = {
      withValidLocation: vehicles.filter(v => CoordinateDebugger.isValidCoordinate(v.currentLocation.lat, v.currentLocation.lon)).length,
      withoutLocation: vehicles.filter(v => v.currentLocation.lat === 0 && v.currentLocation.lon === 0).length,
      withLatOnly: vehicles.filter(v => v.currentLocation.lat !== 0 && v.currentLocation.lon === 0).length,
      withLonOnly: vehicles.filter(v => v.currentLocation.lat === 0 && v.currentLocation.lon !== 0).length,
      withAddress: vehicles.filter(v => v.currentLocation.address && v.currentLocation.address !== 'Location unavailable').length
    };
    
    console.log('📊 Location Statistics:', locationStats);
    
    if (locationStats.withLatOnly > 0) {
      console.warn(`⚠️ ${locationStats.withLatOnly} vehicles have latitude but missing longitude!`);
    }
    
    if (locationStats.withLonOnly > 0) {
      console.warn(`⚠️ ${locationStats.withLonOnly} vehicles have longitude but missing latitude!`);
    }
    
    // Log sample processed vehicles
    vehicles.slice(0, 3).forEach((vehicle, index) => {
      const isValid = CoordinateDebugger.isValidCoordinate(vehicle.currentLocation.lat, vehicle.currentLocation.lon);
      console.log(`🚛 Processed Vehicle ${index + 1}:`, {
        id: vehicle.id,
        truckNumber: vehicle.truckNumber,
        coordinates: `${vehicle.currentLocation.lat}, ${vehicle.currentLocation.lon}`,
        address: vehicle.currentLocation.address,
        speed: vehicle.speed,
        status: vehicle.status,
        hasValidLocation: isValid,
        coordinateIssue: !isValid ? CoordinateDebugger.diagnoseCoordinateIssue(vehicle.currentLocation.lat, vehicle.currentLocation.lon) : 'None'
      });
    });
    
    console.groupEnd();
  }
}

class LocationDataProcessor {
  static processMotiveLocationData(apiResponse: any, endpoint: string = 'unknown'): Vehicle[] {
    console.log(`🔄 Processing Motive API response from ${endpoint}`);
    
    // Handle different possible response structures
    let vehicles: any[] = [];
    
    if (apiResponse.vehicles) {
      vehicles = apiResponse.vehicles;
    } else if (apiResponse.vehicle_locations) {
      vehicles = apiResponse.vehicle_locations;
    } else if (apiResponse.data) {
      vehicles = apiResponse.data;
    } else if (Array.isArray(apiResponse)) {
      vehicles = apiResponse;
    } else {
      console.warn('⚠️ Unknown response structure:', apiResponse);
      return [];
    }

    // Debug the API response
    APIDebugger.logAPIResponse(endpoint, apiResponse, vehicles);

    const processedVehicles = vehicles.map((vehicle, index) => {
      try {
        // Handle nested vehicle structure (some APIs return { vehicle: {...} })
        const vehicleData = vehicle.vehicle || vehicle;
        
        const location = this.extractLocationData(vehicleData);
        const processedLocation = this.processLocationObject(location, vehicleData, index);
        
        const transformedVehicle: Vehicle = {
          id: vehicleData.id || vehicleData.vehicle_id || `vehicle_${index}`,
          truckNumber: vehicleData.name || vehicleData.number || vehicleData.vehicle_number || 
                      vehicleData.license_plate || `Vehicle ${vehicleData.id || index}`,
          currentLocation: processedLocation,
          speed: this.extractSpeed(vehicleData, location),
          lastUpdate: this.parseTimestamp(this.extractTimestamp(vehicleData, location)),
          status: this.determineStatus(vehicleData, location)
        };

        return transformedVehicle;
      } catch (error) {
        console.error(`❌ Error processing vehicle ${index}:`, error, vehicle);
        return null;
      }
    }).filter((vehicle): vehicle is Vehicle => vehicle !== null);

    APIDebugger.logProcessingResult(processedVehicles);
    return processedVehicles;
  }

  static extractLocationData(vehicle: any): MotiveLocationData | null {
    // Try different possible location data structures in order of preference
    const locationSources = [
      vehicle.current_location,
      vehicle.last_known_location,
      vehicle.location,
      // Create location object from direct properties
      (vehicle.lat !== undefined || vehicle.latitude !== undefined) ? {
        lat: vehicle.lat || vehicle.latitude,
        lng: vehicle.lng,
        lon: vehicle.lon,
        longitude: vehicle.longitude,
        located_at: vehicle.timestamp || vehicle.updated_at || vehicle.recorded_at,
        speed: vehicle.speed,
        address: vehicle.address
      } : null
    ];

    for (const source of locationSources) {
      if (source && (source.lat !== undefined || source.latitude !== undefined)) {
        console.log('📍 Using location source:', source);
        return source;
      }
    }

    console.warn('⚠️ No location data found for vehicle:', vehicle);
    return null;
  }

  static processLocationObject(
    locationData: MotiveLocationData | null, 
    vehicleData: any, 
    index: number
  ): { lat: number; lon: number; address: string } {
    
    if (!locationData) {
      return {
        lat: 0,
        lon: 0,
        address: 'Location unavailable'
      };
    }

    // Enhanced coordinate extraction with comprehensive property checking
    let lat = this.parseCoordinate(locationData.lat || locationData.latitude);
    let lon = this.parseCoordinate(
      locationData.lon ||           // Try 'lon' first (most common in Motive)
      locationData.lng ||           // Then 'lng' 
      locationData.longitude        // Finally 'longitude'
    );
    
    // Try nested coordinates object if main coordinates are missing
    if ((lat === 0 || lon === 0) && locationData.coordinates) {
      if (lat === 0) {
        lat = this.parseCoordinate(locationData.coordinates.lat || locationData.coordinates.latitude);
      }
      if (lon === 0) {
        lon = this.parseCoordinate(
          locationData.coordinates.lon || 
          locationData.coordinates.lng || 
          locationData.coordinates.longitude
        );
      }
    }

    // Log the coordinate extraction process
    CoordinateDebugger.logCoordinateExtractionResult(
      vehicleData, 
      lat, 
      lon, 
      this.identifyCoordinateSource(locationData, lat, lon)
    );

    const address = locationData.address || locationData.formatted_address || 
                   (lat !== 0 || lon !== 0 ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : 'Address unavailable');

    return { lat, lon, address };
  }

  static identifyCoordinateSource(locationData: MotiveLocationData, extractedLat: number, extractedLon: number): string {
    // Identify which properties were used for coordinates
    const sources = [];
    
    if (extractedLat === (locationData.lat || 0)) sources.push('lat');
    if (extractedLat === (locationData.latitude || 0)) sources.push('latitude');
    
    if (extractedLon === (locationData.lon || 0)) sources.push('lon');
    if (extractedLon === (locationData.lng || 0)) sources.push('lng');
    if (extractedLon === (locationData.longitude || 0)) sources.push('longitude');
    
    // Check nested coordinates
    if (locationData.coordinates) {
      if (extractedLat === (locationData.coordinates.lat || 0)) sources.push('coordinates.lat');
      if (extractedLat === (locationData.coordinates.latitude || 0)) sources.push('coordinates.latitude');
      if (extractedLon === (locationData.coordinates.lon || 0)) sources.push('coordinates.lon');
      if (extractedLon === (locationData.coordinates.lng || 0)) sources.push('coordinates.lng');
      if (extractedLon === (locationData.coordinates.longitude || 0)) sources.push('coordinates.longitude');
    }
    
    return sources.join(', ') || 'unknown';
  }

  static parseCoordinate(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  static extractSpeed(vehicle: any, location: MotiveLocationData | null): number {
    const speed = location?.speed || vehicle.speed || 0;
    return typeof speed === 'number' ? speed : parseFloat(speed?.toString() || '0') || 0;
  }

  static extractTimestamp(vehicle: any, location: MotiveLocationData | null): string {
    return location?.located_at || location?.recorded_at || location?.timestamp || 
           vehicle.updated_at || vehicle.timestamp || new Date().toISOString();
  }

  static determineStatus(vehicle: any, location: MotiveLocationData | null): VehicleStatus {
    // Try to use explicit status first
    if (vehicle.status) {
      const statusMap: Record<string, VehicleStatus> = {
        'moving': VehicleStatus.MOVING,
        'idle': VehicleStatus.IDLE,
        'idling': VehicleStatus.IDLE,
        'stationary': VehicleStatus.STATIONARY,
        'parked': VehicleStatus.STATIONARY,
        'stopped': VehicleStatus.STATIONARY,
        'offline': VehicleStatus.STALE,
        'online': VehicleStatus.MOVING
      };
      
      const mappedStatus = statusMap[vehicle.status.toLowerCase()];
      if (mappedStatus) return mappedStatus;
    }
    
    // Determine status from speed and timestamp
    const speed = this.extractSpeed(vehicle, location);
    const lastUpdate = this.parseTimestamp(this.extractTimestamp(vehicle, location));
    const minutesSinceUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate > 30) return VehicleStatus.STALE;
    if (speed > 5) return VehicleStatus.MOVING;
    if (speed > 0) return VehicleStatus.IDLE;
    return VehicleStatus.STATIONARY;
  }

  static parseTimestamp(timestamp: string): Date {
    try {
      const parsed = new Date(timestamp);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    } catch {
      return new Date();
    }
  }
}

class RobustMotiveService {
  private apiKey: string = '';
  private baseUrl: string = '/api/motive';
  private fleetId: string = '';
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 2000; // 2 seconds minimum between requests
  private requestCount: number = 0;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    console.log('🔑 Motive API key configured');
  }

  setFleetId(fleetId: string) {
    this.fleetId = fleetId;
    console.log('🚛 Motive Fleet ID configured:', fleetId);
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('⚠️ No API key configured for connection test');
      return false;
    }
    
    try {
      console.log('🔍 Testing Motive API connection...');
      const response = await this.makeRateLimitedRequest(
        `${this.baseUrl}/vehicle_locations?per_page=1&page_no=1`
      );
      
      console.log('📡 Motive API test response status:', response.status);
      
      if (response.ok) {
        const testData = await response.json();
        console.log('✅ Motive API connection successful');
        console.log('📋 Sample response structure:', {
          keys: Object.keys(testData),
          hasVehicles: !!testData.vehicles,
          hasVehicleLocations: !!testData.vehicle_locations,
          hasData: !!testData.data
        });
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Motive API connection failed:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Motive API connection test failed:', error);
      return false;
    }
  }

  async getCurrentLocationsWithFallback(): Promise<Vehicle[]> {
    console.log('🚀 Starting comprehensive location fetch...');
    
    const methods = [
      { 
        name: 'Paginated Vehicle Locations (Primary)', 
        method: () => this.tryPaginatedVehicleLocations(),
        priority: 1
      },
      { 
        name: 'Fleet Vehicles Locations', 
        method: () => this.tryFleetVehiclesLocations(),
        priority: 2,
        requiresFleetId: true
      },
      { 
        name: 'Individual Vehicle Locations', 
        method: () => this.tryIndividualVehicleLocations(),
        priority: 3
      },
      { 
        name: 'Real-time Locations', 
        method: () => this.tryRealTimeLocations(),
        priority: 4
      },
      { 
        name: 'Assets Endpoint', 
        method: () => this.tryAssetsEndpoint(),
        priority: 5
      }
    ];

    // Sort by priority and filter based on requirements
    const availableMethods = methods
      .filter(method => !method.requiresFleetId || this.fleetId)
      .sort((a, b) => a.priority - b.priority);

    for (const method of availableMethods) {
      try {
        console.log(`🔄 Attempting: ${method.name}...`);
        const result = await method.method();
        
        if (result && result.length > 0) {
          const validLocations = result.filter(v => CoordinateDebugger.isValidCoordinate(v.currentLocation.lat, v.currentLocation.lon));
          const partialLocations = result.filter(v => (v.currentLocation.lat !== 0 && v.currentLocation.lon === 0) || (v.currentLocation.lat === 0 && v.currentLocation.lon !== 0));
          
          console.log(`✅ Success with ${method.name}: ${result.length} total, ${validLocations.length} with valid locations, ${partialLocations.length} with partial coordinates`);
          
          // If we got vehicles but no valid locations, continue trying other methods
          if (validLocations.length === 0 && result.length > 0) {
            console.log(`⚠️ ${method.name} returned vehicles but no valid locations, trying next method...`);
            continue;
          }
          
          return result;
        } else {
          console.log(`⚠️ ${method.name} returned no data`);
        }
      } catch (error) {
        console.log(`❌ ${method.name} failed:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    throw new Error('All location fetching methods failed. Check API key and permissions.');
  }

  async tryPaginatedVehicleLocations(): Promise<Vehicle[]> {
    console.log("📄 Fetching vehicle locations with pagination");
    
    let page = 1;
    const perPage = 25;
    let allVehicles: any[] = [];
    let consecutiveEmptyPages = 0;

    while (consecutiveEmptyPages < 2 && page <= 50) { // Safety limits
      try {
        console.log(`📄 Fetching page ${page}...`);
        const response = await this.makeRateLimitedRequest(
          `${this.baseUrl}/vehicle_locations?per_page=${perPage}&page_no=${page}`
        );
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid API credentials. Check your Motive API key.');
          } else if (response.status === 403) {
            throw new Error('Access forbidden. Verify your fleet permissions.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`📄 Page ${page} response structure:`, {
          keys: Object.keys(data),
          vehicleCount: (data.vehicles || data.vehicle_locations || data.data || []).length
        });
        
        const vehicles = data.vehicles || data.vehicle_locations || data.data || [];
        
        if (vehicles.length === 0) {
          consecutiveEmptyPages++;
          console.log(`📄 Empty page ${page}, consecutive empty: ${consecutiveEmptyPages}`);
        } else {
          consecutiveEmptyPages = 0;
          console.log(`📄 Page ${page}: ${vehicles.length} vehicles`);
          allVehicles = allVehicles.concat(vehicles);
        }
        
        page++;
      } catch (error) {
        console.log(`❌ Error fetching page ${page}:`, error);
        if (error instanceof Error && (error.message.includes('credentials') || error.message.includes('forbidden'))) {
          throw error; // Re-throw authentication errors
        }
        break;
      }
    }
    
    console.log(`📄 Pagination complete: ${allVehicles.length} total vehicles`);
    return LocationDataProcessor.processMotiveLocationData({ vehicles: allVehicles }, 'Paginated API');
  }

  async tryFleetVehiclesLocations(): Promise<Vehicle[]> {
    if (!this.fleetId) {
      throw new Error('No fleet ID configured');
    }

    const response = await this.makeRateLimitedRequest(
      `${this.baseUrl}/fleets/${this.fleetId}/vehicles_locations`
    );
    
    if (!response.ok) {
      throw new Error(`Fleet API failed: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return LocationDataProcessor.processMotiveLocationData(data, 'Fleet API');
  }

  async tryIndividualVehicleLocations(): Promise<Vehicle[]> {
    // First get list of vehicles
    const vehiclesResponse = await this.makeRateLimitedRequest(`${this.baseUrl}/vehicles`);
    
    if (!vehiclesResponse.ok) {
      throw new Error(`Failed to fetch vehicles list: ${vehiclesResponse.status}`);
    }
    
    const vehiclesData = await vehiclesResponse.json();
    const vehicles = vehiclesData.vehicles || vehiclesData.data || [];
    
    console.log(`🚛 Fetching individual locations for ${vehicles.length} vehicles`);
    
    // Get location for each vehicle (limit to prevent too many requests)
    const vehiclesWithLocations = await Promise.all(
      vehicles.slice(0, 20).map(async (vehicle: any, index: number) => {
        try {
          // Add small delay between requests
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          const locationResponse = await this.makeRateLimitedRequest(
            `${this.baseUrl}/vehicles/${vehicle.id}/locations?limit=1`
          );
          
          if (locationResponse.ok) {
            const locationData = await locationResponse.json();
            return {
              ...vehicle,
              current_location: locationData.vehicle_locations?.[0] || locationData.locations?.[0] || null
            };
          } else {
            return vehicle;
          }
        } catch (error) {
          console.log(`❌ Failed to get location for vehicle ${vehicle.id}:`, error);
          return vehicle;
        }
      })
    );
    
    return LocationDataProcessor.processMotiveLocationData({ vehicles: vehiclesWithLocations }, 'Individual API');
  }

  async tryRealTimeLocations(): Promise<Vehicle[]> {
    const response = await this.makeRateLimitedRequest(`${this.baseUrl}/vehicles/locations`);
    
    if (!response.ok) {
      throw new Error(`Real-time locations failed: ${response.status}`);
    }
    
    const data = await response.json();
    return LocationDataProcessor.processMotiveLocationData(data, 'Real-time API');
  }

  async tryAssetsEndpoint(): Promise<Vehicle[]> {
    const response = await this.makeRateLimitedRequest(`${this.baseUrl}/assets`);
    
    if (!response.ok) {
      throw new Error(`Assets endpoint failed: ${response.status}`);
    }
    
    const data = await response.json();
    return LocationDataProcessor.processMotiveLocationData(data, 'Assets API');
  }

  private async makeRateLimitedRequest(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏱️ Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
    
    console.log(`📡 API Request #${this.requestCount}: ${url}`);
    
    return fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  // Debug method to show coordinate data for all vehicles
  async debugCoordinates(): Promise<void> {
    try {
      const vehicles = await this.getVehiclesWithLocations();
      
      console.group('🗺️ COORDINATE SUMMARY');
      console.log(`Total vehicles: ${vehicles.length}`);
      
      const stats = {
        validCoordinates: 0,
        missingLongitude: 0,
        missingLatitude: 0,
        bothMissing: 0
      };
      
      vehicles.forEach((vehicle, index) => {
        const { lat, lon } = vehicle.currentLocation;
        const isValid = CoordinateDebugger.isValidCoordinate(lat, lon);
        
        if (isValid) {
          stats.validCoordinates++;
        } else if (lat !== 0 && lon === 0) {
          stats.missingLongitude++;
          console.warn(`⚠️ Vehicle ${vehicle.truckNumber}: Has latitude (${lat}) but missing longitude`);
        } else if (lat === 0 && lon !== 0) {
          stats.missingLatitude++;
          console.warn(`⚠️ Vehicle ${vehicle.truckNumber}: Has longitude (${lon}) but missing latitude`);
        } else {
          stats.bothMissing++;
        }
        
        console.log(`${index + 1}. ${vehicle.truckNumber}: ${lat}, ${lon} ${isValid ? '✅' : '❌'}`);
      });
      
      console.log('📊 Coordinate Statistics:', stats);
      console.groupEnd();
    } catch (error) {
      console.error('❌ Error debugging coordinates:', error);
    }
  }

  // Main entry points
  async getVehiclesWithLocations(): Promise<Vehicle[]> {
    try {
      console.log('🎯 Starting vehicle location fetch...');
      const result = await this.getCurrentLocationsWithFallback();
      console.log(`🎉 Successfully retrieved ${result.length} vehicles`);
      return result;
    } catch (error) {
      console.error('❌ Error in getVehiclesWithLocations:', error);
      throw error;
    }
  }

  async getVehicles(): Promise<Vehicle[]> {
    return this.getVehiclesWithLocations();
  }
}

export const motiveApi = new RobustMotiveService();