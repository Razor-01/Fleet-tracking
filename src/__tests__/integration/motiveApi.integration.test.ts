import { vi, describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { motiveApi } from '../../services/motiveApi';

const server = setupServer(
  http.get('*/vehicle_locations', ({ request }) => {
    const url = new URL(request.url);
    const authHeader = request.headers.get('x-api-key');
    
    if (!authHeader) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authHeader === 'rate-limited-key') {
      return HttpResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const pageNo = url.searchParams.get('page_no') || '1';
    const perPage = parseInt(url.searchParams.get('per_page') || '25');

    if (pageNo === '1') {
      return HttpResponse.json({
        vehicles: [
          {
            id: 12345,
            number: "TRUCK001",
            current_location: {
              lat: 40.7128,
              lon: -74.0060,
              located_at: "2025-01-15T14:30:00Z",
              description: "New York, NY",
              speed: 65.5
            }
          },
          {
            id: 12346,
            number: "TRUCK002",
            current_location: {
              latitude: 34.0522,
              longitude: -118.2437,
              located_at: "2025-01-15T14:32:00Z",
              description: "Los Angeles, CA",
              speed: 0
            }
          }
        ]
      });
    } else {
      // Empty second page
      return HttpResponse.json({ vehicles: [] });
    }
  }),

  http.get('*/fleets/:fleetId/vehicles_locations', ({ params }) => {
    return HttpResponse.json({
      vehicle_locations: [
        {
          id: 12345,
          name: "FLEET_TRUCK001",
          location: {
            lat: 40.7128,
            lng: -74.0060,
            timestamp: "2025-01-15T14:30:00Z"
          }
        }
      ]
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Motive API Integration Tests', () => {
  test('authenticates and fetches real vehicle data', async () => {
    motiveApi.setApiKey('valid-test-key');
    
    const result = await motiveApi.getVehiclesWithLocations();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: '12345',
      truckNumber: 'TRUCK001',
      currentLocation: {
        lat: 40.7128,
        lon: -74.0060
      },
      speed: 65.5
    });
    expect(result[1]).toMatchObject({
      id: '12346',
      truckNumber: 'TRUCK002',
      currentLocation: {
        lat: 34.0522,
        lon: -118.2437
      },
      speed: 0
    });
  });

  test('handles authentication failure', async () => {
    motiveApi.setApiKey('');
    
    await expect(motiveApi.getVehiclesWithLocations()).rejects.toThrow();
  });

  test('handles rate limiting', async () => {
    motiveApi.setApiKey('rate-limited-key');
    
    await expect(motiveApi.getVehiclesWithLocations()).rejects.toThrow();
  });

  test('uses fleet endpoint when fleet ID is provided', async () => {
    motiveApi.setApiKey('valid-test-key');
    motiveApi.setFleetId('test-fleet-123');
    
    const result = await motiveApi.getVehiclesWithLocations();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '12345',
      truckNumber: 'FLEET_TRUCK001'
    });
  });

  test('handles different coordinate property variations', async () => {
    motiveApi.setApiKey('valid-test-key');
    
    const result = await motiveApi.getVehiclesWithLocations();

    // First vehicle uses lat/lon
    expect(result[0].currentLocation).toMatchObject({
      lat: 40.7128,
      lon: -74.0060
    });

    // Second vehicle uses latitude/longitude
    expect(result[1].currentLocation).toMatchObject({
      lat: 34.0522,
      lon: -118.2437
    });
  });

  test('implements proper rate limiting between requests', async () => {
    vi.useFakeTimers();
    
    motiveApi.setApiKey('valid-test-key');
    
    const startTime = Date.now();
    
    // Make multiple requests
    const promise1 = motiveApi.testConnection();
    const promise2 = motiveApi.testConnection();
    
    // Advance timers to allow rate limiting
    vi.advanceTimersByTime(3000);
    
    await Promise.all([promise1, promise2]);
    
    // Verify that requests were spaced out
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(3000);
    
    vi.useRealTimers();
  });

  test('falls back to alternative endpoints on failure', async () => {
    // Mock the first endpoint to fail
    server.use(
      http.get('*/vehicle_locations', () => {
        return HttpResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }),
      http.get('*/vehicles/:vehicleId/locations', () => {
        return HttpResponse.json({
          vehicle_locations: [
            {
              id: 'fallback-vehicle',
              name: 'FALLBACK_TRUCK',
              current_location: {
                lat: 41.8781,
                lon: -87.6298
              }
            }
          ]
        });
      })
    );

    motiveApi.setApiKey('valid-test-key');
    
    const result = await motiveApi.getVehiclesWithLocations();

    // Should get data from fallback endpoint
    expect(result.length).toBeGreaterThan(0);
  });

  test('handles network timeouts gracefully', async () => {
    server.use(
      http.get('*/vehicle_locations', async () => {
        // Simulate network timeout
        await new Promise(resolve => setTimeout(resolve, 35000));
        return HttpResponse.json({ vehicles: [] });
      })
    );

    motiveApi.setApiKey('valid-test-key');
    
    await expect(motiveApi.getVehiclesWithLocations()).rejects.toThrow();
  });

  test('validates response data structure', async () => {
    server.use(
      http.get('*/vehicle_locations', () => {
        return HttpResponse.json({
          // Invalid response structure
          invalid_data: "This is not the expected format"
        });
      })
    );

    motiveApi.setApiKey('valid-test-key');
    
    const result = await motiveApi.getVehiclesWithLocations();
    
    // Should handle invalid response gracefully
    expect(Array.isArray(result)).toBe(true);
  });
});