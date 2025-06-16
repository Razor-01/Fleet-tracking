import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mapboxService } from '../../../services/mapboxService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('MapboxService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('geocodes address successfully', async () => {
    const mockGeocodingResponse = {
      features: [
        {
          center: [-74.0060, 40.7128],
          place_name: 'New York, NY, USA'
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGeocodingResponse)
    });

    const result = await mapboxService.geocodeAddress('New York, NY');

    expect(result).toEqual({
      lat: 40.7128,
      lng: -74.0060,
      formattedAddress: 'New York, NY, USA'
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/geocoding/v5/mapbox.places/'),
      undefined
    );
  });

  test('uses cached geocoding results', async () => {
    const mockGeocodingResponse = {
      features: [
        {
          center: [-74.0060, 40.7128],
          place_name: 'New York, NY, USA'
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGeocodingResponse)
    });

    // First call should hit the API
    await mapboxService.geocodeAddress('New York, NY');
    
    // Second call should use cache
    const result = await mapboxService.geocodeAddress('New York, NY');

    expect(result).toEqual({
      lat: 40.7128,
      lng: -74.0060,
      formattedAddress: 'New York, NY, USA'
    });

    // Should only have made one API call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('handles geocoding API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(mapboxService.geocodeAddress('Invalid Address')).rejects.toThrow(
      'Geocoding failed: 404 Not Found'
    );
  });

  test('handles geocoding with no results', async () => {
    const mockGeocodingResponse = {
      features: []
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGeocodingResponse)
    });

    await expect(mapboxService.geocodeAddress('Nonexistent Place')).rejects.toThrow(
      'Address not found'
    );
  });

  test('calculates distance successfully', async () => {
    const mockDirectionsResponse = {
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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDirectionsResponse)
    });

    const result = await mapboxService.calculateDistance(40.7128, -74.0060, 40.7138, -74.0050);

    expect(result).toMatchObject({
      distance: 1609.34,
      duration: 300,
      distanceMiles: '1.0',
      distanceKm: '1.6',
      durationHours: 0,
      durationMinutes: 5
    });

    expect(result.eta).toMatch(/\d{1,2}\/\d{1,2}, \d{1,2}:\d{2} (AM|PM)/);
  });

  test('uses cached distance results', async () => {
    const mockDirectionsResponse = {
      routes: [
        {
          distance: 1609.34,
          duration: 300
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDirectionsResponse)
    });

    // First call should hit the API
    await mapboxService.calculateDistance(40.7128, -74.0060, 40.7138, -74.0050);
    
    // Second call with same coordinates should use cache
    const result = await mapboxService.calculateDistance(40.7128, -74.0060, 40.7138, -74.0050);

    expect(result.distanceMiles).toBe('1.0');
    
    // Should only have made one API call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('handles distance calculation API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity'
    });

    await expect(
      mapboxService.calculateDistance(40.7128, -74.0060, 40.7138, -74.0050)
    ).rejects.toThrow('Distance calculation failed: 422 Unprocessable Entity');
  });

  test('handles distance calculation with no routes', async () => {
    const mockDirectionsResponse = {
      routes: []
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDirectionsResponse)
    });

    await expect(
      mapboxService.calculateDistance(40.7128, -74.0060, 40.7138, -74.0050)
    ).rejects.toThrow('No route found');
  });

  test('calculates ETA in Eastern Time correctly', async () => {
    // Mock a specific time for consistent testing
    const mockDate = new Date('2024-01-15T15:30:00Z');
    vi.setSystemTime(mockDate);

    const mockDirectionsResponse = {
      routes: [
        {
          distance: 1609.34,
          duration: 3600 // 1 hour
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDirectionsResponse)
    });

    const result = await mapboxService.calculateDistance(40.7128, -74.0060, 40.7138, -74.0050);

    // ETA should be 1 hour from mock time in Eastern Time
    expect(result.eta).toMatch(/1\/15, \d{1,2}:\d{2} (AM|PM)/);
  });

  test('formats current Eastern Time correctly', () => {
    const mockDate = new Date('2024-01-15T20:30:45Z');
    vi.setSystemTime(mockDate);

    const easternTime = mapboxService.getCurrentEasternTime();

    expect(easternTime).toMatch(/1\/15\/2024, \d{1,2}:\d{2}:\d{2} (AM|PM)/);
  });

  test('formats timestamp in Eastern Time correctly', () => {
    const timestamp = '2024-01-15T20:30:00Z';
    const easternTime = mapboxService.formatEasternTime(timestamp);

    expect(easternTime).toMatch(/1\/15, \d{1,2}:\d{2} (AM|PM)/);
  });

  test('tests API connection successfully', async () => {
    const mockGeocodingResponse = {
      features: [
        {
          center: [-122.0856, 37.4220],
          place_name: '1600 Amphitheatre Parkway, Mountain View, CA, USA'
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGeocodingResponse)
    });

    const result = await mapboxService.testConnection();

    expect(result).toBe(true);
  });

  test('handles connection test failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await mapboxService.testConnection();

    expect(result).toBe(false);
  });

  test('clears caches correctly', () => {
    // This test verifies the cache clearing functionality
    mapboxService.clearCache();
    
    // After clearing cache, the cache stats should show zero entries
    const stats = mapboxService.getCacheStats();
    expect(stats.geocodeEntries).toBe(0);
    expect(stats.distanceEntries).toBe(0);
  });

  test('provides accurate cache statistics', async () => {
    const mockGeocodingResponse = {
      features: [{ center: [-74.0060, 40.7128], place_name: 'Test Location' }]
    };

    const mockDirectionsResponse = {
      routes: [{ distance: 1000, duration: 300 }]
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeocodingResponse) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockDirectionsResponse) });

    // Make some API calls to populate cache
    await mapboxService.geocodeAddress('Test Location');
    await mapboxService.calculateDistance(40.7128, -74.0060, 40.7138, -74.0050);

    const stats = mapboxService.getCacheStats();
    expect(stats.geocodeEntries).toBe(1);
    expect(stats.distanceEntries).toBe(1);
  });
});