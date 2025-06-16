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

describe('Operations Team UAT Scenarios', () => {
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

  test('OPS-001: Operations performance monitoring and reporting', async () => {
    // Setup fleet with performance data
    const performanceFleet = [
      { id: 'v1', truckNumber: 'T001', status: VehicleStatus.MOVING, speed: 55, currentLocation: { lat: 40.7128, lon: -74.0060, address: 'Active delivery' }, lastUpdate: new Date() },
      { id: 'v2', truckNumber: 'T002', status: VehicleStatus.MOVING, speed: 45, currentLocation: { lat: 40.7589, lon: -73.9851, address: 'En route' }, lastUpdate: new Date() },
      { id: 'v3', truckNumber: 'T003', status: VehicleStatus.MOVING, speed: 60, currentLocation: { lat: 40.6892, lon: -74.0445, address: 'Highway' }, lastUpdate: new Date() },
      { id: 'v4', truckNumber: 'T004', status: VehicleStatus.IDLE, speed: 3, currentLocation: { lat: 40.7505, lon: -73.9934, address: 'Loading' }, lastUpdate: new Date() },
      { id: 'v5', truckNumber: 'T005', status: VehicleStatus.IDLE, speed: 1, currentLocation: { lat: 40.7282, lon: -73.7949, address: 'Waiting' }, lastUpdate: new Date() },
      { id: 'v6', truckNumber: 'T006', status: VehicleStatus.STATIONARY, speed: 0, currentLocation: { lat: 40.7614, lon: -73.9776, address: 'Depot' }, lastUpdate: new Date() }
    ];
    
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(performanceFleet);
    
    // Setup appointments for delivery tracking
    localStorage.setItem('truck_delivery_appointments', JSON.stringify({
      'v1': {
        appointments: [{
          id: '1',
          location: 'Customer A',
          datetime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          notes: '',
          status: 'pending'
        }],
        updatedAt: new Date().toISOString()
      },
      'v2': {
        appointments: [{
          id: '2',
          location: 'Customer B',
          datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          notes: '',
          status: 'pending'
        }],
        updatedAt: new Date().toISOString()
      },
      'v3': {
        appointments: [{
          id: '3',
          location: 'Customer C',
          datetime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Late
          notes: '',
          status: 'pending'
        }],
        updatedAt: new Date().toISOString()
      }
    }));
    
    render(<App />);
    
    // ✅ OPS-001: Fleet utilization metrics
    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument(); // Total vehicles
    });
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Moving vehicles
    expect(screen.getByText('3')).toBeInTheDocument(); // Idle/Stationary vehicles
    
    // ✅ OPS-002: On-time delivery tracking
    expect(screen.getByText('3 with appointments')).toBeInTheDocument();
    
    // ✅ OPS-003: Performance indicators
    expect(screen.getByText('60.0 mph')).toBeInTheDocument(); // Highest speed
    expect(screen.getByText('0.0 mph')).toBeInTheDocument(); // Stationary
  });

  test('OPS-004: Operations system reliability and data quality', async () => {
    // Setup mixed data quality scenario
    const mixedQualityFleet = [
      { id: 'v1', truckNumber: 'T001', status: VehicleStatus.MOVING, speed: 45, currentLocation: { lat: 40.7128, lon: -74.0060, address: 'Valid location' }, lastUpdate: new Date() },
      { id: 'v2', truckNumber: 'T002', status: VehicleStatus.MOVING, speed: 55, currentLocation: { lat: 40.7589, lon: -73.9851, address: 'Valid location' }, lastUpdate: new Date() },
      { id: 'v3', truckNumber: 'T003', status: VehicleStatus.IDLE, speed: 0, currentLocation: { lat: 40.6892, lon: 0, address: 'Missing longitude' }, lastUpdate: new Date() }, // Partial coordinates
      { id: 'v4', truckNumber: 'T004', status: VehicleStatus.STATIONARY, speed: 0, currentLocation: { lat: 0, lon: 0, address: 'No location data' }, lastUpdate: new Date() } // No coordinates
    ];
    
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(mixedQualityFleet);
    
    render(<App />);
    
    // ✅ OPS-004: Data freshness monitoring
    await waitFor(() => {
      expect(screen.getByText('2 valid locations')).toBeInTheDocument();
      expect(screen.getByText('1 partial coordinates')).toBeInTheDocument();
      expect(screen.getByText('1 no location')).toBeInTheDocument();
    });
    
    // ✅ OPS-005: System connectivity status
    expect(screen.getByText('Connected')).toBeInTheDocument();
    
    // ✅ OPS-006: Last update timestamp
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  test('OPS-007: Operations API usage monitoring', async () => {
    const user = userEvent.setup();
    
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue([
      { id: 'v1', truckNumber: 'T001', status: VehicleStatus.MOVING, speed: 45, currentLocation: { lat: 40.7128, lon: -74.0060, address: 'Location' }, lastUpdate: new Date() }
    ]);
    
    // Setup appointments to trigger distance calculations
    localStorage.setItem('truck_delivery_appointments', JSON.stringify({
      'v1': {
        appointments: [{
          id: '1',
          location: 'Test Location',
          datetime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          notes: '',
          status: 'pending'
        }],
        updatedAt: new Date().toISOString()
      }
    }));
    
    mockMapboxService.geocodeAddress.mockResolvedValue({
      lat: 40.7589,
      lng: -73.9851,
      formattedAddress: 'Test Location, NY'
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
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('T001')).toBeInTheDocument();
    });
    
    // ✅ OPS-007: API usage monitoring
    expect(screen.getByText(/Next auto:/)).toBeInTheDocument();
    expect(screen.getByText(/Never/)).toBeInTheDocument(); // Last calculation time
    
    // Trigger distance calculation
    await user.click(screen.getByText('Calculate Now'));
    
    await waitFor(() => {
      expect(screen.getByText(/Just now/)).toBeInTheDocument(); // Updated last calculation time
    });
  });

  test('OPS-008: Operations compliance and audit trail', async () => {
    const user = userEvent.setup();
    
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue([
      { id: 'v1', truckNumber: 'T001', status: VehicleStatus.MOVING, speed: 45, currentLocation: { lat: 40.7128, lon: -74.0060, address: 'Audit Location' }, lastUpdate: new Date() }
    ]);
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('T001')).toBeInTheDocument();
    });
    
    // ✅ OPS-008: Appointment history tracking
    const appointmentCell = screen.getByText('Add appointment');
    await user.click(appointmentCell);
    
    await user.type(screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St'), 'Audit Test Location');
    await user.clear(screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM'));
    await user.type(screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM'), '06/16/2025 10:00 AM');
    await user.click(screen.getByText('Add Appointment'));
    
    await waitFor(() => {
      expect(screen.getByText(/Audit Test Location/)).toBeInTheDocument();
    });
    
    // ✅ OPS-009: Data persistence verification
    // Simulate page refresh by re-rendering
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Audit Test Location/)).toBeInTheDocument();
    });
    
    // ✅ OPS-010: Eastern Time compliance
    expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
  });

  test('OPS-011: Operations capacity planning and resource allocation', async () => {
    // Setup large fleet for capacity analysis
    const capacityFleet = Array.from({ length: 20 }, (_, i) => ({
      id: `v${i + 1}`,
      truckNumber: `T${String(i + 1).padStart(3, '0')}`,
      status: i < 12 ? VehicleStatus.MOVING : i < 16 ? VehicleStatus.IDLE : VehicleStatus.STATIONARY,
      speed: i < 12 ? 45 + (i * 2) : i < 16 ? 2 : 0,
      currentLocation: { 
        lat: 40.7128 + (i * 0.01), 
        lon: -74.0060 + (i * 0.01), 
        address: `Location ${i + 1}` 
      },
      lastUpdate: new Date()
    }));
    
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(capacityFleet);
    
    render(<App />);
    
    // ✅ OPS-011: Fleet capacity overview
    await waitFor(() => {
      expect(screen.getByText('20')).toBeInTheDocument(); // Total vehicles
    });
    
    expect(screen.getByText('12')).toBeInTheDocument(); // Moving vehicles
    expect(screen.getByText('8')).toBeInTheDocument(); // Idle/Stationary vehicles
    
    // ✅ OPS-012: Resource utilization metrics
    expect(screen.getByText('T001')).toBeInTheDocument();
    expect(screen.getByText('T020')).toBeInTheDocument();
    
    // ✅ OPS-013: Performance distribution
    const speedElements = screen.getAllByText(/mph/);
    expect(speedElements.length).toBeGreaterThan(15); // Should show speeds for most vehicles
  });

  test('OPS-014: Operations exception management and escalation', async () => {
    const user = userEvent.setup();
    
    // Setup scenario with multiple exception types
    const exceptionFleet = [
      { id: 'v1', truckNumber: 'T001', status: VehicleStatus.MOVING, speed: 45, currentLocation: { lat: 40.7128, lon: -74.0060, address: 'Normal operation' }, lastUpdate: new Date() },
      { id: 'v2', truckNumber: 'T002', status: VehicleStatus.STALE, speed: 0, currentLocation: { lat: 40.7589, lon: -73.9851, address: 'Communication lost' }, lastUpdate: new Date(Date.now() - 45 * 60 * 1000) }, // 45 minutes ago
      { id: 'v3', truckNumber: 'T003', status: VehicleStatus.MOVING, speed: 25, currentLocation: { lat: 0, lon: 0, address: 'GPS malfunction' }, lastUpdate: new Date() } // Invalid coordinates
    ];
    
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue(exceptionFleet);
    
    // Setup late delivery
    localStorage.setItem('truck_delivery_appointments', JSON.stringify({
      'v1': {
        appointments: [{
          id: '1',
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
      expect(screen.getByText('T003')).toBeInTheDocument();
    });
    
    // ✅ OPS-014: Exception identification
    expect(screen.getByText('Stale')).toBeInTheDocument(); // Communication issue
    expect(screen.getByText('1 no location')).toBeInTheDocument(); // GPS issue
    
    // ✅ OPS-015: Late delivery tracking
    await user.click(screen.getByText('Calculate Now'));
    
    await waitFor(() => {
      expect(screen.getByText(/Late Delivery/)).toBeInTheDocument();
    });
    
    // ✅ OPS-016: Exception filtering and prioritization
    await user.click(screen.getByText('Late'));
    
    await waitFor(() => {
      // Should filter to show only late deliveries
      expect(screen.getByText('T001')).toBeInTheDocument();
    });
  });

  test('OPS-017: Operations data integrity and backup verification', async () => {
    const user = userEvent.setup();
    
    mockMotiveApi.getVehiclesWithLocations.mockResolvedValue([
      { id: 'v1', truckNumber: 'T001', status: VehicleStatus.MOVING, speed: 45, currentLocation: { lat: 40.7128, lon: -74.0060, address: 'Test Location' }, lastUpdate: new Date() }
    ]);
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('T001')).toBeInTheDocument();
    });
    
    // ✅ OPS-017: Create test data for backup verification
    // Add load number
    const loadNumberCell = screen.getByText('Add load #');
    await user.click(loadNumberCell);
    await user.type(screen.getByPlaceholderText('Enter load number...'), 'BACKUP_TEST_001');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByText('BACKUP_TEST_001')).toBeInTheDocument();
    });
    
    // Add appointment
    const appointmentCell = screen.getByText('Add appointment');
    await user.click(appointmentCell);
    await user.type(screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St'), 'Backup Test Location');
    await user.clear(screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM'));
    await user.type(screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM'), '06/16/2025 3:00 PM');
    await user.click(screen.getByText('Add Appointment'));
    
    await waitFor(() => {
      expect(screen.getByText(/Backup Test Location/)).toBeInTheDocument();
    });
    
    // ✅ OPS-018: Verify data persistence in localStorage
    const loadNumbers = localStorage.getItem('truck_load_numbers');
    const appointments = localStorage.getItem('truck_delivery_appointments');
    
    expect(loadNumbers).toContain('BACKUP_TEST_001');
    expect(appointments).toContain('Backup Test Location');
    
    // ✅ OPS-019: Verify data integrity after refresh
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('BACKUP_TEST_001')).toBeInTheDocument();
      expect(screen.getByText(/Backup Test Location/)).toBeInTheDocument();
    });
  });
});