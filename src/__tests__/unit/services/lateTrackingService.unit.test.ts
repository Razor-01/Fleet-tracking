import { vi, describe, test, expect, beforeEach } from 'vitest';
import { lateTrackingService } from '../../../services/lateTrackingService';
import { createMockVehicle } from '../../../utils/testUtils';
import { DeliveryAppointment } from '../../../services/deliveryAppointmentsService';

describe('LateTrackingService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('identifies late truck correctly', () => {
    const vehicle = createMockVehicle();
    const appointments: DeliveryAppointment[] = [{
      id: '1',
      location: 'Test Location',
      datetime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      notes: '',
      status: 'pending'
    }];
    const distance = { duration: 1800 }; // 30 minutes travel time

    const result = lateTrackingService.analyzeTruckStatus(vehicle, appointments, distance);

    expect(result.status).toBe('late');
    expect(result.severity).toBe('critical');
    expect(result.minutesLate).toBeGreaterThan(0);
    expect(result.message).toBe('Already past appointment time');
  });

  test('identifies at-risk truck correctly', () => {
    const vehicle = createMockVehicle();
    const appointments: DeliveryAppointment[] = [{
      id: '1',
      location: 'Test Location',
      datetime: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutes from now
      notes: '',
      status: 'pending'
    }];
    const distance = { duration: 3600 }; // 60 minutes travel time + 30 min buffer = 90 min total

    const result = lateTrackingService.analyzeTruckStatus(vehicle, appointments, distance);

    expect(result.status).toBe('at_risk');
    expect(result.severity).toMatch(/medium|high/);
    expect(result.minutesShort).toBeGreaterThan(0);
    expect(result.message).toContain('At risk of being');
  });

  test('identifies on-time truck correctly', () => {
    const vehicle = createMockVehicle();
    const appointments: DeliveryAppointment[] = [{
      id: '1',
      location: 'Test Location',
      datetime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      notes: '',
      status: 'pending'
    }];
    const distance = { duration: 1800 }; // 30 minutes travel time + 30 min buffer = 60 min total

    const result = lateTrackingService.analyzeTruckStatus(vehicle, appointments, distance);

    expect(result.status).toBe('on_time');
    expect(result.severity).toBe('low');
    expect(result.minutesAhead).toBeGreaterThan(0);
    expect(result.message).toContain('ahead of schedule');
  });

  test('handles missing appointment data', () => {
    const vehicle = createMockVehicle();
    const appointments: DeliveryAppointment[] = [];
    const distance = { duration: 1800 };

    const result = lateTrackingService.analyzeTruckStatus(vehicle, appointments, distance);

    expect(result.status).toBe('no_data');
    expect(result.severity).toBe('low');
    expect(result.message).toBe('No appointment or distance data');
  });

  test('handles missing distance data', () => {
    const vehicle = createMockVehicle();
    const appointments: DeliveryAppointment[] = [{
      id: '1',
      location: 'Test Location',
      datetime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      notes: '',
      status: 'pending'
    }];

    const result = lateTrackingService.analyzeTruckStatus(vehicle, appointments, undefined);

    expect(result.status).toBe('no_data');
    expect(result.message).toBe('No appointment or distance data');
  });

  test('gets next appointment correctly', () => {
    const appointments: DeliveryAppointment[] = [
      {
        id: '1',
        location: 'Second Stop',
        datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        notes: '',
        status: 'pending'
      },
      {
        id: '2',
        location: 'First Stop',
        datetime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
        notes: '',
        status: 'pending'
      },
      {
        id: '3',
        location: 'Completed Stop',
        datetime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        notes: '',
        status: 'completed'
      }
    ];

    const nextAppointment = lateTrackingService.getNextAppointment(appointments);

    expect(nextAppointment).not.toBeNull();
    expect(nextAppointment!.location).toBe('First Stop');
    expect(nextAppointment!.status).toBe('pending');
  });

  test('returns null when no pending appointments', () => {
    const appointments: DeliveryAppointment[] = [
      {
        id: '1',
        location: 'Completed Stop',
        datetime: new Date().toISOString(),
        notes: '',
        status: 'completed'
      },
      {
        id: '2',
        location: 'Missed Stop',
        datetime: new Date().toISOString(),
        notes: '',
        status: 'missed'
      }
    ];

    const nextAppointment = lateTrackingService.getNextAppointment(appointments);

    expect(nextAppointment).toBeNull();
  });

  test('calculates filter categories correctly', () => {
    const vehicles = [
      { ...createMockVehicle(), id: 'vehicle-1' },
      { ...createMockVehicle(), id: 'vehicle-2' },
      { ...createMockVehicle(), id: 'vehicle-3' },
      { ...createMockVehicle(), id: 'vehicle-4' }
    ];
    
    const appointments = {
      'vehicle-1': [{
        id: '1',
        location: 'Location 1',
        datetime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Late
        notes: '',
        status: 'pending' as const
      }],
      'vehicle-2': [{
        id: '2',
        location: 'Location 2',
        datetime: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // At risk
        notes: '',
        status: 'pending' as const
      }],
      'vehicle-3': [{
        id: '3',
        location: 'Location 3',
        datetime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // On time
        notes: '',
        status: 'pending' as const
      }],
      'vehicle-4': [] // No appointments
    };
    
    const distances = {
      'vehicle-1': { duration: 1800 },
      'vehicle-2': { duration: 3600 },
      'vehicle-3': { duration: 1800 }
    };

    const categories = lateTrackingService.getFilterCategories(vehicles, appointments, distances);

    expect(categories.all).toHaveLength(4);
    expect(categories.late).toHaveLength(1);
    expect(categories.at_risk).toHaveLength(1);
    expect(categories.on_time).toHaveLength(1);
    expect(categories.no_appointments).toHaveLength(1);
  });

  test('formats appointment time in Eastern Time', () => {
    const datetime = '2024-01-15T14:30:00Z';
    const formatted = lateTrackingService.formatAppointmentTime(datetime);

    expect(formatted).toMatch(/1\/15, \d{1,2}:\d{2} (AM|PM)/);
  });

  test('returns correct status colors', () => {
    expect(lateTrackingService.getStatusColor('late')).toBe('#dc3545');
    expect(lateTrackingService.getStatusColor('at_risk')).toBe('#fd7e14');
    expect(lateTrackingService.getStatusColor('on_time')).toBe('#28a745');
    expect(lateTrackingService.getStatusColor('no_data')).toBe('#6c757d');
  });

  test('returns correct status icons', () => {
    expect(lateTrackingService.getStatusIcon('late')).toBe('🔴');
    expect(lateTrackingService.getStatusIcon('at_risk')).toBe('🟡');
    expect(lateTrackingService.getStatusIcon('on_time')).toBe('🟢');
    expect(lateTrackingService.getStatusIcon('no_data')).toBe('⚪');
  });

  test('handles edge case: appointment exactly now', () => {
    const vehicle = createMockVehicle();
    const appointments: DeliveryAppointment[] = [{
      id: '1',
      location: 'Test Location',
      datetime: new Date().toISOString(), // Exactly now
      notes: '',
      status: 'pending'
    }];
    const distance = { duration: 1800 }; // 30 minutes travel time

    const result = lateTrackingService.analyzeTruckStatus(vehicle, appointments, distance);

    expect(result.status).toBe('late');
    expect(result.minutesLate).toBeGreaterThanOrEqual(0);
  });

  test('calculates severity levels correctly', () => {
    const vehicle = createMockVehicle();
    
    // High severity: more than 1 hour short
    const highRiskAppointments: DeliveryAppointment[] = [{
      id: '1',
      location: 'Test Location',
      datetime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      notes: '',
      status: 'pending'
    }];
    const longDistance = { duration: 5400 }; // 90 minutes travel time + 30 buffer = 120 min total

    const highRiskResult = lateTrackingService.analyzeTruckStatus(vehicle, highRiskAppointments, longDistance);
    expect(highRiskResult.severity).toBe('high');

    // Medium severity: less than 1 hour short
    const mediumRiskAppointments: DeliveryAppointment[] = [{
      id: '1',
      location: 'Test Location',
      datetime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 60 minutes from now
      notes: '',
      status: 'pending'
    }];
    const mediumDistance = { duration: 2700 }; // 45 minutes travel time + 30 buffer = 75 min total

    const mediumRiskResult = lateTrackingService.analyzeTruckStatus(vehicle, mediumRiskAppointments, mediumDistance);
    expect(mediumRiskResult.severity).toBe('medium');
  });
});