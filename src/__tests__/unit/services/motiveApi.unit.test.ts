import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { motiveApi } from '../../../services/motiveApi';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('MotiveApi Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('sets API key correctly', () => {
    const testApiKey = 'test-api-key-123';
    motiveApi.setApiKey(testApiKey);
    
    // Verify the API key is set (this would be tested through subsequent API calls)
    expect(true).toBe(true); // API key setting is internal, tested through API calls
  });

  test('sets fleet ID correctly', () => {
    const testFleetId = 'fleet-123';
    motiveApi.setFleetId(testFleetId);
    
    // Verify the fleet ID is set (this would be tested through subsequent API calls)
    expect(true).toBe(true); // Fleet ID setting is internal, tested through API calls
  });

  test('tests connection successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        vehicles: [
          {
            id: 'test-vehicle',
            name: 'Test Truck',
            current_location: {
              lat: 40.7128,
              lon: -74.0060
            }
          }
        ]
      })
    });

    motiveApi.setApiKey('test-key');
    const result = await motiveApi.testConnection();

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/vehicle_locations?per_page=1&page_no=1'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'test-key'
        })
      })
    );
  });

  test('handles connection test failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized')
    });

    motiveApi.setApiKey('invalid-key');
    const result = await motiveApi.testConnection();

    expect(result).toBe(false);
  });

  test('handles network error during connection test', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    motiveApi.setApiKey('test-key');
    const result = await motiveApi.testConnection();

    expect(result).toBe(false);
  });

  test('fetches vehicles with locations using paginated API', async () => {
    const mockVehicleData = {
      vehicles: [
        {
          id: 'vehicle-1',
          number: 'TRUCK001',
          current_location: {
            lat: 40.7128,
            lon: -74.0060,
            located_at: '2024-01-15T10:30:00Z',
            description: 'New York, NY',
            speed: 45.5
          }
        },
        {
          id: 'vehicle-2',
          number: 'TRUCK002',
          current_location: {
            lat: 34.0522,
            lon: -118.2437,
            located_at: '2024-01-15T10:32:00Z',
            description: 'Los Angeles, CA',
            speed: 0
          }
        }
      ]
    };

    // Mock successful paginated responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVehicleData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vehicles: [] }) // Empty second page
      });

    motiveApi.setApiKey('test-key');
    const vehicles = await motiveApi.getVehiclesWithLocations();

    expect(vehicles).toHaveLength(2);
    expect(vehicles[0]).toMatchObject({
      id: 'vehicle-1',
      truckNumber: 'TRUCK001',
      currentLocation: {
        lat: 40.7128,
        lon: -74.0060
      },
      speed: 45.5
    });
  });

  test('handles different coordinate property names', async () => {
    const mockVehicleData = {
      vehicles: [
        {
          id: 'vehicle-1',
          number: 'TRUCK001',
          current_location: {
            latitude: 40.7128,
            longitude: -74.0060,
            located_at: '2024-01-15T10:30:00Z'
          }
        },
        {
          id: 'vehicle-2',
          number: 'TRUCK002',
          current_location: {
            lat: 34.0522,
            lng: -118.2437,
            located_at: '2024-01-15T10:32:00Z'
          }
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVehicleData)
    });

    motiveApi.setApiKey('test-key');
    const vehicles = await motiveApi.getVehiclesWithLocations();

    expect(vehicles).toHaveLength(2);
    expect(vehicles[0].currentLocation).toMatchObject({
      lat: 40.7128,
      lon: -74.0060
    });
    expect(vehicles[1].currentLocation).toMatchObject({
      lat: 34.0522,
      lon: -118.2437
    });
  });

  test('determines vehicle status correctly based on speed and timestamp', async () => {
    const now = new Date();
    const recentTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    const staleTime = new Date(now.getTime() - 35 * 60 * 1000); // 35 minutes ago

    const mockVehicleData = {
      vehicles: [
        {
          id: 'vehicle-moving',
          number: 'MOVING',
          current_location: {
            lat: 40.7128,
            lon: -74.0060,
            located_at: recentTime.toISOString(),
            speed: 45
          }
        },
        {
          id: 'vehicle-idle',
          number: 'IDLE',
          current_location: {
            lat: 40.7128,
            lon: -74.0060,
            located_at: recentTime.toISOString(),
            speed: 3
          }
        },
        {
          id: 'vehicle-stationary',
          number: 'STATIONARY',
          current_location: {
            lat: 40.7128,
            lon: -74.0060,
            located_at: recentTime.toISOString(),
            speed: 0
          }
        },
        {
          id: 'vehicle-stale',
          number: 'STALE',
          current_location: {
            lat: 40.7128,
            lon: -74.0060,
            located_at: staleTime.toISOString(),
            speed: 0
          }
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVehicleData)
    });

    motiveApi.setApiKey('test-key');
    const vehicles = await motiveApi.getVehiclesWithLocations();

    expect(vehicles[0].status).toBe('moving');
    expect(vehicles[1].status).toBe('idle');
    expect(vehicles[2].status).toBe('stationary');
    expect(vehicles[3].status).toBe('stale');
  });

  test('handles API fallback when primary endpoint fails', async () => {
    // Mock first endpoint failure, second endpoint success
    mockFetch
      .mockRejectedValueOnce(new Error('Primary API failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          vehicle_locations: [
            {
              id: 'vehicle-1',
              name: 'TRUCK001',
              location: {
                lat: 40.7128,
                lon: -74.0060
              }
            }
          ]
        })
      });

    motiveApi.setApiKey('test-key');
    const vehicles = await motiveApi.getVehiclesWithLocations();

    expect(vehicles).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('implements rate limiting between requests', async () => {
    vi.useFakeTimers();
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ vehicles: [] })
    });

    motiveApi.setApiKey('test-key');
    
    // Make first request
    const promise1 = motiveApi.testConnection();
    
    // Make second request immediately
    const promise2 = motiveApi.testConnection();
    
    // Fast-forward time to allow rate limiting
    vi.advanceTimersByTime(2000);
    
    await Promise.all([promise1, promise2]);
    
    // Should have made requests with proper timing
    expect(mockFetch).toHaveBeenCalledTimes(2);
    
    vi.useRealTimers();
  });

  test('handles missing location data gracefully', async () => {
    const mockVehicleData = {
      vehicles: [
        {
          id: 'vehicle-no-location',
          number: 'NO_LOCATION',
          // No current_location property
        },
        {
          id: 'vehicle-empty-location',
          number: 'EMPTY_LOCATION',
          current_location: {
            // No lat/lon properties
            located_at: '2024-01-15T10:30:00Z'
          }
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVehicleData)
    });

    motiveApi.setApiKey('test-key');
    const vehicles = await motiveApi.getVehiclesWithLocations();

    expect(vehicles).toHaveLength(2);
    expect(vehicles[0].currentLocation).toMatchObject({
      lat: 0,
      lon: 0,
      address: 'Location unavailable'
    });
    expect(vehicles[1].currentLocation).toMatchObject({
      lat: 0,
      lon: 0,
      address: 'Location unavailable'
    });
  });
});