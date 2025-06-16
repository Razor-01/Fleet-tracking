import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { VehicleTable } from '../../../components/Dashboard/VehicleTable';
import { createMockVehicles } from '../../../utils/testUtils';
import { VehicleStatus } from '../../../types';

describe('VehicleTable Component Unit Tests', () => {
  const mockProps = {
    vehicles: createMockVehicles(3),
    isRefreshing: false,
    loadNumbers: {},
    onLoadNumberChange: vi.fn(),
    getDistance: vi.fn(),
    isCalculatingDistance: false,
    hasAppointment: vi.fn(),
    appointments: {},
    onAppointmentsChange: vi.fn(),
    getNextAppointment: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders vehicle table with correct headers', () => {
    render(<VehicleTable {...mockProps} />);
    
    expect(screen.getByText('Vehicle')).toBeInTheDocument();
    expect(screen.getByText('Load Number')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Current Location')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('Delivery Appointments')).toBeInTheDocument();
    expect(screen.getByText('Distance & ETA')).toBeInTheDocument();
    expect(screen.getByText('Delivery Status')).toBeInTheDocument();
    expect(screen.getByText('Last Update')).toBeInTheDocument();
  });

  test('displays vehicle information correctly', () => {
    render(<VehicleTable {...mockProps} />);
    
    expect(screen.getByText('Truck 001')).toBeInTheDocument();
    expect(screen.getByText('Truck 002')).toBeInTheDocument();
    expect(screen.getByText('Truck 003')).toBeInTheDocument();
  });

  test('shows loading state when refreshing', () => {
    render(<VehicleTable {...mockProps} isRefreshing={true} vehicles={[]} />);
    
    expect(screen.getByText('Loading vehicles...')).toBeInTheDocument();
    expect(screen.getByText('Fetching data from Motive API')).toBeInTheDocument();
  });

  test('shows empty state when no vehicles', () => {
    render(<VehicleTable {...mockProps} vehicles={[]} />);
    
    expect(screen.getByText('No vehicles found')).toBeInTheDocument();
    expect(screen.getByText('No vehicles match the current filter criteria.')).toBeInTheDocument();
  });

  test('displays vehicle status badges correctly', () => {
    const vehiclesWithDifferentStatuses = [
      { ...createMockVehicles(1)[0], status: VehicleStatus.MOVING },
      { ...createMockVehicles(1)[0], id: 'vehicle-2', truckNumber: 'Truck 002', status: VehicleStatus.IDLE },
      { ...createMockVehicles(1)[0], id: 'vehicle-3', truckNumber: 'Truck 003', status: VehicleStatus.STATIONARY }
    ];
    
    render(<VehicleTable {...mockProps} vehicles={vehiclesWithDifferentStatuses} />);
    
    expect(screen.getByText('Moving')).toBeInTheDocument();
    expect(screen.getByText('Idle')).toBeInTheDocument();
    expect(screen.getByText('Stationary')).toBeInTheDocument();
  });

  test('handles vehicle click events', async () => {
    const user = userEvent.setup();
    const onVehicleClick = vi.fn();
    
    render(<VehicleTable {...mockProps} onVehicleClick={onVehicleClick} />);
    
    const vehicleRow = screen.getByText('Truck 001').closest('tr');
    await user.click(vehicleRow!);
    
    expect(onVehicleClick).toHaveBeenCalledWith(mockProps.vehicles[0]);
  });

  test('displays coordinate debugging information', () => {
    const vehicleWithInvalidCoords = {
      ...createMockVehicles(1)[0],
      currentLocation: { lat: 0, lon: 0, address: 'Location unavailable' }
    };
    
    render(<VehicleTable {...mockProps} vehicles={[vehicleWithInvalidCoords]} />);
    
    expect(screen.getByText('1 no location')).toBeInTheDocument();
    expect(screen.getByText('No location data')).toBeInTheDocument();
  });

  test('shows debug button and handles click', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    
    render(<VehicleTable {...mockProps} />);
    
    const debugButton = screen.getByTitle('Debug coordinates in console');
    await user.click(debugButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('🗺️ COORDINATE DEBUG - Current Vehicle Data');
    
    consoleSpy.mockRestore();
  });

  test('displays location status indicators correctly', () => {
    const vehiclesWithDifferentLocationStatuses = [
      { ...createMockVehicles(1)[0], currentLocation: { lat: 40.7128, lon: -74.0060, address: 'New York, NY' } },
      { ...createMockVehicles(1)[0], id: 'vehicle-2', truckNumber: 'Truck 002', currentLocation: { lat: 40.7128, lon: 0, address: 'Missing longitude' } },
      { ...createMockVehicles(1)[0], id: 'vehicle-3', truckNumber: 'Truck 003', currentLocation: { lat: 0, lon: 0, address: 'No location' } }
    ];
    
    render(<VehicleTable {...mockProps} vehicles={vehiclesWithDifferentLocationStatuses} />);
    
    expect(screen.getByText('1 valid locations')).toBeInTheDocument();
    expect(screen.getByText('1 partial coordinates')).toBeInTheDocument();
    expect(screen.getByText('1 no location')).toBeInTheDocument();
  });

  test('formats speed display correctly', () => {
    const vehicleWithSpeed = {
      ...createMockVehicles(1)[0],
      speed: 45.7
    };
    
    render(<VehicleTable {...mockProps} vehicles={[vehicleWithSpeed]} />);
    
    expect(screen.getByText('45.7 mph')).toBeInTheDocument();
  });

  test('displays load number statistics', () => {
    const loadNumbers = { 'vehicle-1': 'LOAD123', 'vehicle-2': 'LOAD456' };
    
    render(<VehicleTable {...mockProps} loadNumbers={loadNumbers} />);
    
    expect(screen.getByText('2 with load numbers')).toBeInTheDocument();
  });

  test('displays appointment statistics', () => {
    const appointments = {
      'vehicle-1': [{ id: '1', location: 'Location 1', datetime: '2024-01-15T14:00:00Z', notes: '', status: 'pending' as const }],
      'vehicle-2': [{ id: '2', location: 'Location 2', datetime: '2024-01-15T16:00:00Z', notes: '', status: 'pending' as const }]
    };
    
    render(<VehicleTable {...mockProps} appointments={appointments} />);
    
    expect(screen.getByText('2 with appointments')).toBeInTheDocument();
  });
});