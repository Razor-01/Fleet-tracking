import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import App from '../../../App';
import { motiveApi } from '../../../services/motiveApi';
import { mapboxService } from '../../../services/mapboxService';
import { createMockVehicle, createMockVehicles } from '../../../utils/testUtils';

// Mock services
vi.mock('../../../services/motiveApi');
vi.mock('../../../services/mapboxService');

const mockMotiveApi = vi.mocked(motiveApi);
const mockMapboxService = vi.mocked(mapboxService);

describe('App Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Setup default mocks
    mockMotiveApi.testConnection.mockResolvedValue(true);
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue([]);
    mockMapboxService.testConnection.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders main application components', () => {
    render(<App />);
    
    expect(screen.getByText('Fleet Tracker')).toBeInTheDocument();
    expect(screen.getByText('Real-time vehicle monitoring (Eastern Time)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  test('displays API configuration notice when no API key', () => {
    render(<App />);
    
    expect(screen.getByText(/configure your motive api key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /configure now/i })).toBeInTheDocument();
  });

  test('switches between dashboard and settings tabs', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Click settings tab
    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByText('API Configuration')).toBeInTheDocument();
    
    // Click dashboard tab
    await user.click(screen.getByRole('button', { name: /dashboard/i }));
    expect(screen.getByText(/configure your motive api key/i)).toBeInTheDocument();
  });

  test('displays vehicle data after successful API call', async () => {
    const mockVehicles = createMockVehicles(3);
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(mockVehicles);
    
    // Set up API key in localStorage
    localStorage.setItem('motiveConfig', JSON.stringify({
      apiKey: 'test-key',
      isActive: true,
      isValid: true
    }));
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Truck 001')).toBeInTheDocument();
      expect(screen.getByText('Truck 002')).toBeInTheDocument();
      expect(screen.getByText('Truck 003')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    mockMotiveApi.getVehiclesWithLocations.mockRejectedValue(new Error('API Error'));
    
    localStorage.setItem('motiveConfig', JSON.stringify({
      apiKey: 'test-key',
      isActive: true,
      isValid: true
    }));
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/error fetching vehicles/i)).toBeInTheDocument();
    });
  });

  test('displays connection status correctly', async () => {
    mockMotiveApi.testConnection.mockResolvedValue(true);
    
    localStorage.setItem('motiveConfig', JSON.stringify({
      apiKey: 'test-key',
      isActive: true
    }));
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  test('auto-refreshes vehicle data at configured interval', async () => {
    vi.useFakeTimers();
    
    const mockVehicles = createMockVehicles(2);
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(mockVehicles);
    
    localStorage.setItem('motiveConfig', JSON.stringify({
      apiKey: 'test-key',
      isActive: true,
      isValid: true
    }));
    
    localStorage.setItem('systemSettings', JSON.stringify({
      refreshInterval: 5,
      operationHours: { start: '23:00', end: '08:00', timezone: 'America/New_York' },
      distanceUnit: 'miles',
      speedThresholds: { idle: 1.0, moving: 5.0 }
    }));
    
    render(<App />);
    
    // Fast-forward 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000);
    
    await waitFor(() => {
      expect(mockMotiveApi.getVehiclesWithLocations).toHaveBeenCalledTimes(2);
    });
    
    vi.useRealTimers();
  });

  test('filters vehicles by delivery status', async () => {
    const user = userEvent.setup();
    const mockVehicles = createMockVehicles(5);
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(mockVehicles);
    
    localStorage.setItem('motiveConfig', JSON.stringify({
      apiKey: 'test-key',
      isActive: true,
      isValid: true
    }));
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Truck 001')).toBeInTheDocument();
    });
    
    // Click "No Appointments" filter
    const noAppointmentsFilter = screen.getByText('No Appointments');
    await user.click(noAppointmentsFilter);
    
    // Should still show all vehicles since none have appointments
    expect(screen.getByText('Truck 001')).toBeInTheDocument();
    expect(screen.getByText('Truck 005')).toBeInTheDocument();
  });

  test('displays feature statistics correctly', async () => {
    const mockVehicles = createMockVehicles(3);
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(mockVehicles);
    
    localStorage.setItem('motiveConfig', JSON.stringify({
      apiKey: 'test-key',
      isActive: true,
      isValid: true
    }));
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/0 load numbers assigned/)).toBeInTheDocument();
      expect(screen.getByText(/0 vehicles with appointments/)).toBeInTheDocument();
      expect(screen.getByText(/All times displayed in Eastern Time/)).toBeInTheDocument();
    });
  });
});