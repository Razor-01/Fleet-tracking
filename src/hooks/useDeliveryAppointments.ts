import { useState, useEffect, useCallback } from 'react';
import { DeliveryAppointment, deliveryAppointmentsService } from '../services/deliveryAppointmentsService';

export const useDeliveryAppointments = () => {
  const [appointments, setAppointments] = useState<Record<string, DeliveryAppointment[]>>({});

  // Load appointments from localStorage on mount
  useEffect(() => {
    try {
      const stored = deliveryAppointmentsService.getAllAppointments();
      const appointmentsMap: Record<string, DeliveryAppointment[]> = {};
      
      Object.keys(stored).forEach(vehicleId => {
        appointmentsMap[vehicleId] = stored[vehicleId].appointments;
      });
      
      setAppointments(appointmentsMap);
      console.log('📅 Loaded appointments from storage:', Object.keys(appointmentsMap).length, 'vehicles with appointments');
    } catch (error) {
      console.error('❌ Error loading appointments from storage:', error);
    }
  }, []);

  const setVehicleAppointments = useCallback((vehicleId: string, newAppointments: DeliveryAppointment[]) => {
    setAppointments(prev => ({
      ...prev,
      [vehicleId]: newAppointments
    }));
    console.log(`📅 Updated appointments for vehicle ${vehicleId}:`, newAppointments.length, 'appointments');
  }, []);

  const getVehicleAppointments = useCallback((vehicleId: string): DeliveryAppointment[] => {
    return appointments[vehicleId] || [];
  }, [appointments]);

  const getNextAppointment = useCallback((vehicleId: string): DeliveryAppointment | null => {
    return deliveryAppointmentsService.getNextAppointment(vehicleId);
  }, []);

  const clearAllAppointments = useCallback(() => {
    setAppointments({});
    Object.keys(appointments).forEach(vehicleId => {
      deliveryAppointmentsService.clearAppointments(vehicleId);
    });
    console.log('🗑️ Cleared all appointments');
  }, [appointments]);

  const getAppointmentStats = useCallback(() => {
    return deliveryAppointmentsService.getAppointmentStats();
  }, []);

  return {
    appointments,
    setVehicleAppointments,
    getVehicleAppointments,
    getNextAppointment,
    clearAllAppointments,
    getAppointmentStats
  };
};