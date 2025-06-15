import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Vehicle, VehicleStatus } from '../types';
import { DeliveryAppointment } from '../services/deliveryAppointmentsService';

// Custom render function with providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data factories
export const createMockVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: 'vehicle-123',
  truckNumber: 'Truck 001',
  currentLocation: {
    lat: 40.7128,
    lon: -74.0060,
    address: 'New York, NY'
  },
  speed: 45.5,
  lastUpdate: new Date('2024-01-15T10:30:00Z'),
  status: VehicleStatus.MOVING,
  ...overrides
});

export const createMockAppointment = (overrides: Partial<DeliveryAppointment> = {}): DeliveryAppointment => ({
  id: 'appointment-123',
  location: 'Walmart Distribution Center',
  datetime: '2024-01-15T14:00:00Z',
  notes: 'Loading dock 5',
  status: 'pending',
  ...overrides
});

export const createMockVehicles = (count: number = 3): Vehicle[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockVehicle({
      id: `vehicle-${index + 1}`,
      truckNumber: `Truck ${String(index + 1).padStart(3, '0')}`,
      status: index % 2 === 0 ? VehicleStatus.MOVING : VehicleStatus.IDLE
    })
  );
};

// Mock API responses
export const mockMotiveApiResponse = {
  vehicles: [
    {
      id: 'vehicle-123',
      name: 'Truck 001',
      current_location: {
        lat: 40.7128,
        lon: -74.0060,
        address: 'New York, NY',
        located_at: '2024-01-15T10:30:00Z'
      },
      speed: 45.5,
      status: 'moving'
    }
  ]
};

export const mockMapboxGeocodingResponse = {
  features: [
    {
      center: [-74.0060, 40.7128],
      place_name: 'New York, NY, USA'
    }
  ]
};

export const mockMapboxDirectionsResponse = {
  routes: [
    {
      distance: 1609.34, // 1 mile in meters
      duration: 300, // 5 minutes in seconds
      geometry: {
        coordinates: [[-74.0060, 40.7128], [-74.0050, 40.7138]]
      }
    }
  ]
};

// Test utilities
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const mockFetch = (response: any, ok: boolean = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response))
  });
};

export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    get storage() {
      return { ...storage };
    }
  };
};

// Date utilities for testing
export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  vi.spyOn(global, 'Date').mockImplementation(() => mockDate);
  return mockDate;
};

export const restoreDate = () => {
  vi.restoreAllMocks();
};

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

// Error boundary for testing error states
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Test Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Something went wrong.</div>;
    }

    return this.props.children;
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };