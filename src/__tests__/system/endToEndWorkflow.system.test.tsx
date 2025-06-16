import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import App from '../../App';
import { motiveApi } from '../../services/motiveApi';
import { mapboxService } from '../../services/mapboxService';
import { createMockVehicles } from '../../utils/testUtils';

// Mock services
vi.mock('../../services/motiveApi');
vi.mock('../../services/mapboxService');

const mockMotiveApi = vi.mocked(motiveApi);
const mockMapboxService = vi.mocked(mapboxService);

describe('End-to-End Fleet Tracking Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Setup default successful mocks
    mockMotiveApi.testConnection.mockResolvedValue(true);
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(createMockVehicles(3));
    mockMapboxService.testConnection.mockResolvedValue(true);
    mockMapboxService.geocodeAddress.mockResolvedValue({
      lat: 40.7128,
      lng: -74.0060,
      formattedAddress: 'New York, NY, USA'
    });
    mockMapboxService.calculateDistance.mockResolvedValue({
      distance: 1609.34,
      duration: 1800,
      distanceMiles: '1.0',
      distanceKm: '1.6',
      durationHours: 0,
      durationMinutes: 30,
      eta: '1/15, 3:00 PM'
    });
    
    // Setup API configuration in localStorage
    localStorage.setItem('motiveConfig', JSON.stringify({
      apiKey: 'test-motive-key',
      isActive: true,
      isValid: true
    }));
    
    localStorage.setItem('mapConfigs', JSON.stringify([{
      id: '1',
      provider: 'mapbox',
      apiKey: 'test-mapbox-key',
      isActive: true,
      isValid: true
    }]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('complete delivery appointment workflow', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    // Wait for vehicles to load
    await waitFor(() => {
      expect(screen.getByText('Truck 001')).toBeInTheDocument();
    }, { timeout: 5000 });

    // 1. Add load number
    const loadNumberCells = screen.getAllByText('Add load #');
    await user.click(loadNumberCells[0]);
    
    const loadInput = screen.getByPlaceholderText('Enter load number...');
    await user.type(loadInput, 'LOAD12345');
    
    // Save by pressing Enter
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByText('LOAD12345')).toBeInTheDocument();
    });

    // 2. Add delivery appointment
    const appointmentCells = screen.getAllByText('Add appointment');
    await user.click(appointmentCells[0]);
    
    const locationInput = screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St');
    const dateTimeInput = screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM');
    
    await user.type(locationInput, 'Walmart Distribution Center');
    await user.clear(dateTimeInput);
    await user.type(dateTimeInput, '06/16/2025 2:00 PM');
    
    await user.click(screen.getByText('Add Appointment'));

    // 3. Verify appointment is saved and displayed
    await waitFor(() => {
      expect(screen.getByText(/Walmart Distribution Center/)).toBeInTheDocument();
    });

    // 4. Calculate distances
    const calculateButton = screen.getByText('Calculate Now');
    await user.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/1.0 mi/)).toBeInTheDocument();
    });

    // 5. Filter by delivery status
    const allFilter = screen.getByText('All Trucks');
    await user.click(allFilter);
    
    // Should show all vehicles
    await waitFor(() => {
      expect(screen.getByText('Truck 001')).toBeInTheDocument();
      expect(screen.getByText('Truck 002')).toBeInTheDocument();
      expect(screen.getByText('Truck 003')).toBeInTheDocument();
    });

    // 6. Verify data persists after component re-render
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('LOAD12345')).toBeInTheDocument();
      expect(screen.getByText(/Walmart Distribution Center/)).toBeInTheDocument();
    });
  });

  test('handles multiple appointments per truck workflow', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Truck 001')).toBeInTheDocument();
    });

    // Add first appointment
    const appointmentCells = screen.getAllByText('Add appointment');
    await user.click(appointmentCells[0]);
    
    let locationInput = screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St');
    let dateTimeInput = screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM');
    
    await user.type(locationInput, 'First Stop');
    await user.clear(dateTimeInput);
    await user.type(dateTimeInput, '06/16/2025 9:00 AM');
    await user.click(screen.getByText('Add Appointment'));

    // Wait for first appointment to be added
    await waitFor(() => {
      expect(screen.getByText(/First Stop/)).toBeInTheDocument();
    });

    // Add second appointment
    const addMoreButton = screen.getByTitle('Add more appointments');
    await user.click(addMoreButton);
    
    locationInput = screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St');
    dateTimeInput = screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM');
    
    await user.type(locationInput, 'Second Stop');
    await user.clear(dateTimeInput);
    await user.type(dateTimeInput, '06/16/2025 2:00 PM');
    await user.click(screen.getByText('Add Appointment'));

    // Verify both appointments are shown
    await waitFor(() => {
      expect(screen.getByText(/2 apt/)).toBeInTheDocument();
    });

    // Next appointment should be the earlier one (9:00 AM)
    expect(screen.getByText(/9:00 AM/)).toBeInTheDocument();
  });

  test('settings configuration workflow', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    // Navigate to settings
    await user.click(screen.getByRole('button', { name: /settings/i }));
    
    expect(screen.getByText('API Configuration')).toBeInTheDocument();
    
    // Test API configuration
    const apiKeyInput = screen.getByPlaceholderText('Enter your Motive API key');
    await user.clear(apiKeyInput);
    await user.type(apiKeyInput, 'new-test-key');
    
    const testButton = screen.getByText('Test');
    await user.click(testButton);
    
    await waitFor(() => {
      expect(mockMotiveApi.testConnection).toHaveBeenCalled();
    });
    
    // Navigate to system settings
    await user.click(screen.getByText('System Settings'));
    
    expect(screen.getByText('General Settings')).toBeInTheDocument();
    
    // Update refresh interval
    const refreshInput = screen.getByDisplayValue('5');
    await user.clear(refreshInput);
    await user.type(refreshInput, '10');
    
    // Navigate back to dashboard
    await user.click(screen.getByRole('button', { name: /dashboard/i }));
    
    // Should be back on dashboard
    await waitFor(() => {
      expect(screen.getByText('Fleet Status')).toBeInTheDocument();
    });
  });

  test('error handling and recovery workflow', async () => {
    const user = userEvent.setup();
    
    // Setup API to fail initially
    mockMotiveApi.getVehiclesWithLocations.mockRejectedValueOnce(new Error('API Error'));
    
    render(<App />);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error fetching vehicles/i)).toBeInTheDocument();
    });
    
    // Setup API to succeed on retry
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValueOnce(createMockVehicles(2));
    
    // Click refresh to retry
    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);
    
    // Should now show vehicles
    await waitFor(() => {
      expect(screen.getByText('Truck 001')).toBeInTheDocument();
      expect(screen.queryByText(/error fetching vehicles/i)).not.toBeInTheDocument();
    });
  });

  test('real-time updates simulation workflow', async () => {
    vi.useFakeTimers();
    
    const user = userEvent.setup();
    
    // Setup system settings for faster refresh
    localStorage.setItem('systemSettings', JSON.stringify({
      refreshInterval: 1, // 1 minute for testing
      operationHours: { start: '00:00', end: '23:59', timezone: 'America/New_York' },
      distanceUnit: 'miles',
      speedThresholds: { idle: 1.0, moving: 5.0 }
    }));
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Truck 001')).toBeInTheDocument();
    });
    
    // Setup updated vehicle data for next refresh
    const updatedVehicles = createMockVehicles(3);
    updatedVehicles[0].speed = 55.5; // Changed speed
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValueOnce(updatedVehicles);
    
    // Fast-forward 1 minute to trigger auto-refresh
    vi.advanceTimersByTime(60 * 1000);
    
    await waitFor(() => {
      expect(screen.getByText('55.5 mph')).toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  test('performance with large fleet workflow', async () => {
    const user = userEvent.setup();
    
    // Setup large fleet
    const largeFleet = createMockVehicles(50);
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(largeFleet);
    
    const startTime = performance.now();
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Truck 001')).toBeInTheDocument();
      expect(screen.getByText('Truck 050')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    const renderTime = performance.now() - startTime;
    
    // Should render large fleet within reasonable time
    expect(renderTime).toBeLessThan(5000); // 5 seconds
    
    // Test filtering performance
    const filterStartTime = performance.now();
    
    await user.click(screen.getByText('No Appointments'));
    
    await waitFor(() => {
      // All vehicles should still be visible since none have appointments
      expect(screen.getByText('Truck 001')).toBeInTheDocument();
    });
    
    const filterTime = performance.now() - filterStartTime;
    expect(filterTime).toBeLessThan(1000); // 1 second
  });

  test('data persistence across browser sessions workflow', async () => {
    const user = userEvent.setup();
    
    // First session
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Truck 001')).toBeInTheDocument();
    });
    
    // Add data
    const loadNumberCells = screen.getAllByText('Add load #');
    await user.click(loadNumberCells[0]);
    
    const loadInput = screen.getByPlaceholderText('Enter load number...');
    await user.type(loadInput, 'SESSION_TEST_LOAD');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByText('SESSION_TEST_LOAD')).toBeInTheDocument();
    });
    
    // Simulate browser refresh by re-rendering
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('SESSION_TEST_LOAD')).toBeInTheDocument();
    });
    
    // Data should persist
    expect(localStorage.getItem('truck_load_numbers')).toContain('SESSION_TEST_LOAD');
  });
});