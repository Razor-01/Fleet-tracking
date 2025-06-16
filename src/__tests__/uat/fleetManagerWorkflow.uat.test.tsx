import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import App from '../../App';
import { motiveApi } from '../../services/motiveApi';
import { mapboxService } from '../../services/mapboxService';
import { VehicleStatus } from '../../types';

// Mock services
vi.mock('../../services/motiveApi');
vi.mock('../../services/mapboxService');

const mockMotiveApi = vi.mocked(motiveApi);
const mockMapboxService = vi.mocked(mapboxService);

// Fleet Manager scenario data
const fleetManagerScenario = {
  morningReview: [
    { id: 'v1', truckNumber: 'T001', status: VehicleStatus.MOVING, speed: 45, currentLocation: { lat: 40.7128, lon: -74.0060, address: 'NYC' } },
    { id: 'v2', truckNumber: 'T002', status: VehicleStatus.MOVING, speed: 55, currentLocation: { lat: 40.7589, lon: -73.9851, address: 'NYC' } },
    { id: 'v3', truckNumber: 'T003', status: VehicleStatus.IDLE, speed: 2, currentLocation: { lat: 40.6892, lon: -74.0445, address: 'NYC' } },
    { id: 'v4', truckNumber: 'T004', status: VehicleStatus.STATIONARY, speed: 0, currentLocation: { lat: 40.7505, lon: -73.9934, address: 'NYC' } },
    { id: 'v5', truckNumber: 'T005', status: VehicleStatus.STALE, speed: 0, currentLocation: { lat: 40.7282, lon: -73.7949, address: 'NYC' } }
  ]
};

describe('Fleet Manager UAT Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Setup API configuration
    localStorage.setItem('motiveConfig', JSON.stringify({
      apiKey: 'test-motive-key',
      isActive: true,
      isValid: true
    }));
    
    mockMotiveApi.testConnection.mockResolvedValue(true);
    mockMapboxService.testConnection.mockResolvedValue(true);
  });

  test('FM-001: Fleet Manager morning fleet status review', async () => {
    const user = userEvent.setup();
    
    // Setup scenario: Fleet with mixed statuses
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(
      fleetManagerScenario.morningReview.map(v => ({
        ...v,
        lastUpdate: new Date()
      }))
    );
    
    render(<App />);
    
    // ✅ FM-001: View total fleet count
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Total vehicles in stats
    });

    // ✅ FM-002: See vehicles by status
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Moving vehicles
    });

    // ✅ FM-003: Identify vehicle statuses immediately
    expect(screen.getByText('Moving')).toBeInTheDocument();
    expect(screen.getByText('Idle')).toBeInTheDocument();
    expect(screen.getByText('Stationary')).toBeInTheDocument();

    // ✅ FM-004: See all vehicles in table
    expect(screen.getByText('T001')).toBeInTheDocument();
    expect(screen.getByText('T002')).toBeInTheDocument();
    expect(screen.getByText('T003')).toBeInTheDocument();
    expect(screen.getByText('T004')).toBeInTheDocument();
    expect(screen.getByText('T005')).toBeInTheDocument();

    // ✅ FM-005: See last update times
    expect(screen.getAllByText(/ago/)).toHaveLength(5); // Each vehicle should show time ago
  });

  test('FM-006: Fleet Manager proactive delivery risk management', async () => {
    const user = userEvent.setup();
    
    // Setup vehicles with appointments
    const vehiclesWithAppointments = fleetManagerScenario.morningReview.slice(0, 3);
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(
      vehiclesWithAppointments.map(v => ({
        ...v,
        lastUpdate: new Date()
      }))
    );
    
    // Setup appointments that will be at risk
    localStorage.setItem('truck_delivery_appointments', JSON.stringify({
      'v1': {
        appointments: [{
          id: '1',
          location: 'Walmart DC',
          datetime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
          notes: '',
          status: 'pending'
        }],
        updatedAt: new Date().toISOString()
      }
    }));
    
    // Setup distance calculation
    mockMapboxService.geocodeAddress.mockResolvedValue({
      lat: 40.7128,
      lng: -74.0060,
      formattedAddress: 'Walmart DC'
    });
    
    mockMapboxService.calculateDistance.mockResolvedValue({
      distance: 3218.68, // 2 miles
      duration: 3600, // 1 hour (will be at risk)
      distanceMiles: '2.0',
      distanceKm: '3.2',
      durationHours: 1,
      durationMinutes: 0,
      eta: new Date(Date.now() + 60 * 60 * 1000).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    });
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('T001')).toBeInTheDocument();
    });
    
    // Calculate distances to trigger risk analysis
    const calculateButton = screen.getByText('Calculate Now');
    await user.click(calculateButton);
    
    // ✅ FM-006: Identify at-risk deliveries
    await waitFor(() => {
      expect(screen.getByText(/Walmart DC/)).toBeInTheDocument();
    });
    
    // ✅ FM-007: See ETA information
    await waitFor(() => {
      expect(screen.getByText(/2.0 mi/)).toBeInTheDocument();
      expect(screen.getByText(/1h 0m/)).toBeInTheDocument();
    });
  });

  test('FM-008: Fleet Manager customer service preparation', async () => {
    const user = userEvent.setup();
    
    // Setup vehicles with load numbers and appointments
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue([
      {
        id: 'v1',
        truckNumber: 'T001',
        status: VehicleStatus.MOVING,
        speed: 45,
        currentLocation: { lat: 40.7128, lon: -74.0060, address: 'En route to delivery' },
        lastUpdate: new Date()
      }
    ]);
    
    // Setup load numbers
    localStorage.setItem('truck_load_numbers', JSON.stringify({
      'v1': {
        loadNumber: 'LOAD12345',
        updatedAt: new Date().toISOString()
      }
    }));
    
    // Setup appointments with time windows
    localStorage.setItem('truck_delivery_appointments', JSON.stringify({
      'v1': {
        appointments: [{
          id: '1',
          location: 'Customer Location - 123 Main St',
          datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          notes: 'Time range until 4:00 PM',
          status: 'pending'
        }],
        updatedAt: new Date().toISOString()
      }
    }));
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('T001')).toBeInTheDocument();
    });
    
    // ✅ FM-008: Load number tracking for customer inquiries
    expect(screen.getByText('LOAD12345')).toBeInTheDocument();
    
    // ✅ FM-009: Accurate delivery information
    expect(screen.getByText(/Customer Location/)).toBeInTheDocument();
    
    // ✅ FM-010: Time window information
    expect(screen.getByText(/Time range until/)).toBeInTheDocument();
    
    // ✅ FM-011: Current vehicle status for customer updates
    expect(screen.getByText('Moving')).toBeInTheDocument();
    expect(screen.getByText('45.0 mph')).toBeInTheDocument();
  });

  test('FM-012: Fleet Manager operational efficiency monitoring', async () => {
    const user = userEvent.setup();
    
    // Setup mixed fleet for efficiency analysis
    const mixedFleet = [
      { id: 'v1', truckNumber: 'T001', status: VehicleStatus.MOVING, speed: 55, currentLocation: { lat: 40.7128, lon: -74.0060, address: 'Highway' } },
      { id: 'v2', truckNumber: 'T002', status: VehicleStatus.MOVING, speed: 45, currentLocation: { lat: 40.7589, lon: -73.9851, address: 'City' } },
      { id: 'v3', truckNumber: 'T003', status: VehicleStatus.IDLE, speed: 3, currentLocation: { lat: 40.6892, lon: -74.0445, address: 'Loading dock' } },
      { id: 'v4', truckNumber: 'T004', status: VehicleStatus.IDLE, speed: 1, currentLocation: { lat: 40.7505, lon: -73.9934, address: 'Rest area' } },
      { id: 'v5', truckNumber: 'T005', status: VehicleStatus.STATIONARY, speed: 0, currentLocation: { lat: 40.7282, lon: -73.7949, address: 'Depot' } }
    ];
    
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(
      mixedFleet.map(v => ({ ...v, lastUpdate: new Date() }))
    );
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Total vehicles
    });
    
    // ✅ FM-012: Fleet utilization metrics
    expect(screen.getByText('2')).toBeInTheDocument(); // Moving vehicles
    expect(screen.getByText('3')).toBeInTheDocument(); // Idle/Stationary vehicles
    
    // ✅ FM-013: Identify underutilized assets
    const idleVehicles = screen.getAllByText('Idle');
    expect(idleVehicles).toHaveLength(2);
    
    const stationaryVehicles = screen.getAllByText('Stationary');
    expect(stationaryVehicles).toHaveLength(1);
    
    // ✅ FM-014: Performance indicators
    expect(screen.getByText('55.0 mph')).toBeInTheDocument(); // Fastest vehicle
    expect(screen.getByText('0.0 mph')).toBeInTheDocument(); // Stationary vehicle
  });

  test('FM-015: Fleet Manager end-of-day reporting workflow', async () => {
    const user = userEvent.setup();
    
    // Setup fleet with completed and pending deliveries
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue([
      { id: 'v1', truckNumber: 'T001', status: VehicleStatus.STATIONARY, speed: 0, currentLocation: { lat: 40.7128, lon: -74.0060, address: 'Depot' }, lastUpdate: new Date() },
      { id: 'v2', truckNumber: 'T002', status: VehicleStatus.MOVING, speed: 35, currentLocation: { lat: 40.7589, lon: -73.9851, address: 'Returning' }, lastUpdate: new Date() }
    ]);
    
    // Setup appointments with mixed statuses
    localStorage.setItem('truck_delivery_appointments', JSON.stringify({
      'v1': {
        appointments: [
          {
            id: '1',
            location: 'Morning Delivery',
            datetime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            notes: '',
            status: 'completed'
          },
          {
            id: '2',
            location: 'Afternoon Delivery',
            datetime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            notes: '',
            status: 'completed'
          }
        ],
        updatedAt: new Date().toISOString()
      },
      'v2': {
        appointments: [{
          id: '3',
          location: 'Late Delivery',
          datetime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          notes: '',
          status: 'pending'
        }],
        updatedAt: new Date().toISOString()
      }
    }));
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('T001')).toBeInTheDocument();
      expect(screen.getByText('T002')).toBeInTheDocument();
    });
    
    // ✅ FM-015: End-of-day fleet status
    expect(screen.getByText('2')).toBeInTheDocument(); // Total vehicles
    
    // ✅ FM-016: Delivery completion tracking
    expect(screen.getByText(/Morning Delivery/)).toBeInTheDocument();
    expect(screen.getByText(/Late Delivery/)).toBeInTheDocument();
    
    // ✅ FM-017: Identify outstanding issues
    // Filter to see late deliveries
    await user.click(screen.getByText('Late'));
    
    await waitFor(() => {
      // Should show vehicles with late deliveries
      expect(screen.getByText('T002')).toBeInTheDocument();
    });
  });
});