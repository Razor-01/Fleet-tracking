import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
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

describe('Dispatcher UAT Scenarios', () => {
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
    
    // Setup vehicles for dispatcher scenarios
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue([
      {
        id: 'v1',
        truckNumber: 'T001',
        status: VehicleStatus.MOVING,
        speed: 45,
        currentLocation: { lat: 40.7128, lon: -74.0060, address: 'Starting Point' },
        lastUpdate: new Date()
      },
      {
        id: 'v2',
        truckNumber: 'T002',
        status: VehicleStatus.IDLE,
        speed: 0,
        currentLocation: { lat: 40.7589, lon: -73.9851, address: 'Depot' },
        lastUpdate: new Date()
      }
    ]);
    
    // Setup mapping service responses
    mockMapboxService.geocodeAddress.mockImplementation((address) => {
      const locations: Record<string, any> = {
        'Stop 1: Walmart DC': { lat: 40.7128, lng: -74.0060, formattedAddress: 'Walmart DC, NY' },
        'Stop 2: Target Store': { lat: 40.7589, lng: -73.9851, formattedAddress: 'Target Store, NY' },
        'Urgent Delivery': { lat: 40.6892, lng: -74.0445, formattedAddress: 'Urgent Location, NY' }
      };
      return Promise.resolve(locations[address] || { lat: 40.7128, lng: -74.0060, formattedAddress: address });
    });
    
    mockMapboxService.calculateDistance.mockResolvedValue({
      distance: 1609.34,
      duration: 1800,
      distanceMiles: '1.0',
      distanceKm: '1.6',
      durationHours: 0,
      durationMinutes: 30,
      eta: new Date(Date.now() + 30 * 60 * 1000).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    });
  });

  test('DISP-001: Dispatcher route planning and optimization', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('T001')).toBeInTheDocument();
    });

    // ✅ DISP-001: Add multiple stops for single truck
    const truck001Row = screen.getByText('T001').closest('tr');
    const appointmentCell = within(truck001Row!).getByText('Add appointment');
    
    await user.click(appointmentCell);
    
    // Add first stop
    await user.type(screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St'), 'Stop 1: Walmart DC');
    await user.clear(screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM'));
    await user.type(screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM'), '06/16/2025 9:00 AM');
    await user.click(screen.getByText('Add Appointment'));

    // Wait for first appointment to be added
    await waitFor(() => {
      expect(screen.getByText(/Stop 1: Walmart DC/)).toBeInTheDocument();
    });

    // Add second stop
    const addMoreButton = screen.getByTitle('Add more appointments');
    await user.click(addMoreButton);
    
    await user.type(screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St'), 'Stop 2: Target Store');
    await user.clear(screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM'));
    await user.type(screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM'), '06/16/2025 2:00 PM');
    await user.click(screen.getByText('Add Appointment'));

    // ✅ DISP-002: See route progression
    await waitFor(() => {
      expect(screen.getByText(/2 apt/)).toBeInTheDocument();
      expect(screen.getByText(/9:00 AM/)).toBeInTheDocument(); // Next appointment
    });

    // ✅ DISP-003: Calculate total route time
    await user.click(screen.getByText('Calculate Now'));
    
    await waitFor(() => {
      expect(screen.getByText(/0h 30m/)).toBeInTheDocument(); // Route duration
      expect(screen.getByText(/1.0 mi/)).toBeInTheDocument(); // Distance
    });
  });

  test('DISP-004: Dispatcher last-minute schedule changes', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('T001')).toBeInTheDocument();
    });

    // ✅ DISP-004: Quickly add urgent appointment
    const appointmentCell = screen.getAllByText('Add appointment')[0];
    await user.click(appointmentCell);
    
    await user.type(screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St'), 'Urgent Delivery');
    await user.clear(screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM'));
    await user.type(screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM'), 'Tomorrow 8AM');
    await user.click(screen.getByText('Add Appointment'));

    // ✅ DISP-005: Immediate recalculation of risk
    await waitFor(() => {
      expect(screen.getByText(/Urgent Delivery/)).toBeInTheDocument();
    });

    // System should automatically show the appointment
    await user.click(screen.getByText('Calculate Now'));
    
    await waitFor(() => {
      expect(screen.getByText(/1.0 mi/)).toBeInTheDocument();
    });
  });

  test('DISP-006: Dispatcher load assignment and tracking', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('T001')).toBeInTheDocument();
    });

    // ✅ DISP-006: Assign load numbers to vehicles
    const loadNumberCells = screen.getAllByText('Add load #');
    
    // Assign load to first truck
    await user.click(loadNumberCells[0]);
    const loadInput1 = screen.getByPlaceholderText('Enter load number...');
    await user.type(loadInput1, 'DISP001');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByText('DISP001')).toBeInTheDocument();
    });

    // Assign load to second truck
    await user.click(loadNumberCells[1]);
    const loadInput2 = screen.getByPlaceholderText('Enter load number...');
    await user.type(loadInput2, 'DISP002');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByText('DISP002')).toBeInTheDocument();
    });

    // ✅ DISP-007: Track load assignments
    expect(screen.getByText('2 with load numbers')).toBeInTheDocument();
  });

  test('DISP-008: Dispatcher real-time coordination', async () => {
    const user = userEvent.setup();
    
    // Setup vehicles with different statuses for coordination
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue([
      {
        id: 'v1',
        truckNumber: 'T001',
        status: VehicleStatus.MOVING,
        speed: 55,
        currentLocation: { lat: 40.7128, lon: -74.0060, address: 'En route' },
        lastUpdate: new Date()
      },
      {
        id: 'v2',
        truckNumber: 'T002',
        status: VehicleStatus.IDLE,
        speed: 0,
        currentLocation: { lat: 40.7589, lon: -73.9851, address: 'Available at depot' },
        lastUpdate: new Date()
      },
      {
        id: 'v3',
        truckNumber: 'T003',
        status: VehicleStatus.STATIONARY,
        speed: 0,
        currentLocation: { lat: 40.6892, lon: -74.0445, address: 'Loading dock' },
        lastUpdate: new Date()
      }
    ]);
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('T001')).toBeInTheDocument();
      expect(screen.getByText('T002')).toBeInTheDocument();
      expect(screen.getByText('T003')).toBeInTheDocument();
    });

    // ✅ DISP-008: Identify available vehicles
    expect(screen.getByText('Moving')).toBeInTheDocument(); // T001 is moving
    expect(screen.getByText('Idle')).toBeInTheDocument(); // T002 is available
    expect(screen.getByText('Stationary')).toBeInTheDocument(); // T003 is loading

    // ✅ DISP-009: Real-time status monitoring
    expect(screen.getByText('55.0 mph')).toBeInTheDocument(); // T001 speed
    expect(screen.getByText('0.0 mph')).toBeInTheDocument(); // T002 and T003 speeds

    // ✅ DISP-010: Location-based assignment
    expect(screen.getByText('En route')).toBeInTheDocument();
    expect(screen.getByText('Available at depot')).toBeInTheDocument();
    expect(screen.getByText('Loading dock')).toBeInTheDocument();
  });

  test('DISP-011: Dispatcher exception handling workflow', async () => {
    const user = userEvent.setup();
    
    // Setup scenario with late delivery
    localStorage.setItem('truck_delivery_appointments', JSON.stringify({
      'v1': {
        appointments: [{
          id: '1',
          location: 'Late Delivery Location',
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
    });

    // ✅ DISP-011: Identify late deliveries
    await user.click(screen.getByText('Calculate Now'));
    
    await waitFor(() => {
      expect(screen.getByText(/Late Delivery Location/)).toBeInTheDocument();
    });

    // ✅ DISP-012: Filter to see problem deliveries
    await user.click(screen.getByText('Late'));
    
    await waitFor(() => {
      // Should show only late vehicles
      expect(screen.getByText('T001')).toBeInTheDocument();
    });

    // ✅ DISP-013: Take corrective action
    // Update appointment status to handle the exception
    const appointmentCell = screen.getByText(/Late Delivery Location/).closest('div');
    const manageButton = within(appointmentCell!).getByTitle('Add more appointments');
    await user.click(manageButton);
    
    // Should show appointment management interface
    await waitFor(() => {
      expect(screen.getByText('Current Appointments:')).toBeInTheDocument();
    });
  });

  test('DISP-014: Dispatcher performance optimization', async () => {
    const user = userEvent.setup();
    
    // Setup fleet with efficiency metrics
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue([
      { id: 'v1', truckNumber: 'T001', status: VehicleStatus.MOVING, speed: 65, currentLocation: { lat: 40.7128, lon: -74.0060, address: 'Highway' }, lastUpdate: new Date() },
      { id: 'v2', truckNumber: 'T002', status: VehicleStatus.MOVING, speed: 45, currentLocation: { lat: 40.7589, lon: -73.9851, address: 'City' }, lastUpdate: new Date() },
      { id: 'v3', truckNumber: 'T003', status: VehicleStatus.IDLE, speed: 2, currentLocation: { lat: 40.6892, lon: -74.0445, address: 'Rest stop' }, lastUpdate: new Date() },
      { id: 'v4', truckNumber: 'T004', status: VehicleStatus.STATIONARY, speed: 0, currentLocation: { lat: 40.7505, lon: -73.9934, address: 'Depot' }, lastUpdate: new Date() }
    ]);
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument(); // Total vehicles
    });

    // ✅ DISP-014: Fleet utilization analysis
    expect(screen.getByText('2')).toBeInTheDocument(); // Moving vehicles
    expect(screen.getByText('2')).toBeInTheDocument(); // Idle/Stationary vehicles

    // ✅ DISP-015: Speed optimization monitoring
    expect(screen.getByText('65.0 mph')).toBeInTheDocument(); // Fastest vehicle
    expect(screen.getByText('45.0 mph')).toBeInTheDocument(); // City speed
    expect(screen.getByText('2.0 mph')).toBeInTheDocument(); // Idle vehicle

    // ✅ DISP-016: Identify optimization opportunities
    const idleVehicles = screen.getAllByText('Idle');
    const stationaryVehicles = screen.getAllByText('Stationary');
    
    expect(idleVehicles.length + stationaryVehicles.length).toBe(2); // Underutilized vehicles
  });
});