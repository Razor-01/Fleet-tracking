export interface Vehicle {
  id: string;
  truckNumber: string;
  currentLocation: {
    lat: number;
    lon: number;
    address?: string;
  };
  speed: number;
  lastUpdate: Date;
  status: VehicleStatus;
  deliveryAddress?: string;
  distanceToDelivery?: number;
  estimatedArrival?: Date;
}

export enum VehicleStatus {
  MOVING = 'moving',
  IDLE = 'idle', 
  STATIONARY = 'stationary',
  STALE = 'stale'
}

export interface DeliveryDestination {
  id: string;
  address: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  truckNumber: string;
  createdAt: Date;
}

export interface APIConfig {
  id: string;
  provider: MapProvider;
  apiKey: string;
  isActive: boolean;
  isValid?: boolean;
  lastTested?: Date;
}

export enum MapProvider {
  HERE = 'here',
  MAPBOX = 'mapbox',
  GOOGLE = 'google'
}

export interface MotiveConfig {
  apiKey: string;
  isActive: boolean;
  isValid?: boolean;
  lastTested?: Date;
}

export interface SystemSettings {
  refreshInterval: number; // minutes
  operationHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  distanceUnit: 'miles' | 'kilometers';
  speedThresholds: {
    idle: number;
    moving: number;
  };
}

export interface TrackingLog {
  id: string;
  truckNumber: string;
  distance: number;
  timestamp: Date;
  destinationId: string;
  location: {
    lat: number;
    lon: number;
  };
}