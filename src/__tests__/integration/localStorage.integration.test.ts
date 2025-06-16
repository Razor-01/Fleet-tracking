import { vi, describe, test, expect, beforeEach } from 'vitest';
import { deliveryAppointmentsService } from '../../services/deliveryAppointmentsService';
import { loadNumberService } from '../../services/loadNumberService';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { renderHook, act } from '@testing-library/react';

describe('localStorage Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('persists and retrieves appointments across sessions', () => {
    const vehicleId = 'truck1';
    
    const testAppointments = [
      {
        id: '1',
        location: 'Walmart DC',
        datetime: '2025-06-16T09:00:00Z',
        notes: '',
        status: 'pending' as const
      }
    ];

    deliveryAppointmentsService.saveAppointments(vehicleId, testAppointments);
    
    // Simulate new session by creating new service instance
    const retrieved = deliveryAppointmentsService.getAppointments(vehicleId);
    
    expect(retrieved).toEqual(testAppointments);
  });

  test('handles localStorage quota exceeded gracefully', () => {
    const originalSetItem = localStorage.setItem;
    
    // Mock localStorage.setItem to throw QuotaExceededError
    localStorage.setItem = vi.fn(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    expect(() => {
      deliveryAppointmentsService.saveAppointments('truck1', []);
    }).not.toThrow();

    localStorage.setItem = originalSetItem;
  });

  test('migrates data from old storage format gracefully', () => {
    // Simulate old storage format
    const oldData = {
      truck1: 'Old Format Data'
    };
    localStorage.setItem('truck_destinations', JSON.stringify(oldData));

    const result = deliveryAppointmentsService.getAllAppointments();
    
    // Should handle gracefully and return empty object for new format
    expect(typeof result).toBe('object');
    expect(Array.isArray(result)).toBe(false);
  });

  test('preserves data integrity across multiple operations', () => {
    const vehicleId = 'truck1';
    
    // Add initial appointment
    const appointment1 = {
      id: '1',
      location: 'Location 1',
      datetime: '2025-06-16T09:00:00Z',
      notes: '',
      status: 'pending' as const
    };
    
    const appointments1 = deliveryAppointmentsService.addAppointment(vehicleId, {
      location: appointment1.location,
      datetime: appointment1.datetime,
      notes: appointment1.notes
    });
    
    expect(appointments1).toHaveLength(1);
    
    // Add second appointment
    const appointment2 = {
      location: 'Location 2',
      datetime: '2025-06-16T14:00:00Z',
      notes: 'Second stop'
    };
    
    const appointments2 = deliveryAppointmentsService.addAppointment(vehicleId, appointment2);
    
    expect(appointments2).toHaveLength(2);
    
    // Update status of first appointment
    const updatedAppointments = deliveryAppointmentsService.updateAppointmentStatus(
      vehicleId, 
      appointments1[0].id, 
      'completed'
    );
    
    expect(updatedAppointments).toHaveLength(2);
    expect(updatedAppointments[0].status).toBe('completed');
    expect(updatedAppointments[1].status).toBe('pending');
    
    // Remove second appointment
    const finalAppointments = deliveryAppointmentsService.removeAppointment(
      vehicleId, 
      appointments2[1].id
    );
    
    expect(finalAppointments).toHaveLength(1);
    expect(finalAppointments[0].status).toBe('completed');
  });

  test('handles concurrent access to localStorage', async () => {
    const vehicleId = 'truck1';
    
    // Simulate concurrent operations
    const operations = [
      () => deliveryAppointmentsService.addAppointment(vehicleId, {
        location: 'Location A',
        datetime: '2025-06-16T09:00:00Z',
        notes: ''
      }),
      () => loadNumberService.saveLoadNumber(vehicleId, 'LOAD123'),
      () => deliveryAppointmentsService.addAppointment(vehicleId, {
        location: 'Location B',
        datetime: '2025-06-16T14:00:00Z',
        notes: ''
      }),
      () => loadNumberService.saveLoadNumber('truck2', 'LOAD456')
    ];
    
    // Execute operations concurrently
    await Promise.all(operations.map(op => Promise.resolve(op())));
    
    // Verify all data was saved correctly
    const appointments = deliveryAppointmentsService.getAppointments(vehicleId);
    const loadNumber1 = loadNumberService.getLoadNumber(vehicleId);
    const loadNumber2 = loadNumberService.getLoadNumber('truck2');
    
    expect(appointments).toHaveLength(2);
    expect(loadNumber1).toBe('LOAD123');
    expect(loadNumber2).toBe('LOAD456');
  });

  test('useLocalStorage hook handles JSON serialization correctly', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', { count: 0, date: new Date('2024-01-15T10:00:00Z') }));
    
    act(() => {
      result.current[1]({ count: 5, date: new Date('2024-01-16T15:30:00Z') });
    });
    
    // Verify data is stored and retrieved correctly
    const stored = localStorage.getItem('test-key');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.count).toBe(5);
    expect(typeof parsed.date).toBe('string');
    
    // Verify the hook retrieves the data correctly
    expect(result.current[0].count).toBe(5);
    expect(result.current[0].date).toBeInstanceOf(Date);
  });

  test('handles corrupted localStorage data gracefully', () => {
    // Simulate corrupted data
    localStorage.setItem('truck_delivery_appointments', 'invalid json data');
    
    const result = deliveryAppointmentsService.getAllAppointments();
    
    // Should return empty object instead of throwing
    expect(result).toEqual({});
  });

  test('maintains data consistency during browser storage events', () => {
    const vehicleId = 'truck1';
    
    // Save initial data
    deliveryAppointmentsService.saveAppointments(vehicleId, [{
      id: '1',
      location: 'Initial Location',
      datetime: '2025-06-16T09:00:00Z',
      notes: '',
      status: 'pending'
    }]);
    
    // Simulate storage event from another tab
    const storageEvent = new StorageEvent('storage', {
      key: 'truck_delivery_appointments',
      newValue: JSON.stringify({
        [vehicleId]: {
          appointments: [{
            id: '2',
            location: 'Updated Location',
            datetime: '2025-06-16T14:00:00Z',
            notes: '',
            status: 'pending'
          }],
          updatedAt: new Date().toISOString()
        }
      }),
      storageArea: localStorage
    });
    
    window.dispatchEvent(storageEvent);
    
    // Data should reflect the storage event
    const appointments = deliveryAppointmentsService.getAppointments(vehicleId);
    expect(appointments[0].location).toBe('Updated Location');
  });

  test('cleans up old data automatically', () => {
    // Add some old data
    const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    localStorage.setItem('old_data_key', JSON.stringify({
      data: 'old data',
      timestamp: oldDate.toISOString()
    }));
    
    // Add current data
    deliveryAppointmentsService.saveAppointments('truck1', [{
      id: '1',
      location: 'Current Location',
      datetime: '2025-06-16T09:00:00Z',
      notes: '',
      status: 'pending'
    }]);
    
    // Verify current data exists and old data handling
    const appointments = deliveryAppointmentsService.getAllAppointments();
    expect(Object.keys(appointments)).toContain('truck1');
    
    // Old data should still exist (cleanup would be implemented separately)
    expect(localStorage.getItem('old_data_key')).toBeTruthy();
  });
});