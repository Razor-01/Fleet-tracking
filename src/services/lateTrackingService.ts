import { Vehicle } from '../types';
import { mapboxService } from './mapboxService';
import { DeliveryAppointment } from './deliveryAppointmentsService';

interface LateTrackingAnalysis {
  status: 'late' | 'at_risk' | 'on_time' | 'no_data';
  message: string;
  minutesLate?: number;
  minutesShort?: number;
  minutesAhead?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface FilterCategories {
  all: Vehicle[];
  late: Vehicle[];
  at_risk: Vehicle[];
  on_time: Vehicle[];
  no_appointments: Vehicle[];
}

class LateTrackingService {
  // Analyze if truck is late or at risk
  analyzeTruckStatus(
    vehicle: Vehicle,
    appointments: DeliveryAppointment[],
    currentDistance?: any
  ): LateTrackingAnalysis {
    const nextAppointment = this.getNextAppointment(appointments);
    
    if (!nextAppointment || !currentDistance) {
      return { 
        status: 'no_data', 
        message: 'No appointment or distance data',
        severity: 'low'
      };
    }

    const appointmentTime = new Date(nextAppointment.datetime);
    const currentTime = new Date();
    
    // Convert to Eastern Time for calculations
    const easternAppointmentTime = new Date(appointmentTime.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const easternCurrentTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    const timeUntilAppointment = (easternAppointmentTime.getTime() - easternCurrentTime.getTime()) / (1000 * 60); // minutes
    const estimatedTravelTime = currentDistance.duration ? (currentDistance.duration / 60) : 0; // convert to minutes
    
    // Add buffer time (30 minutes for loading/unloading, traffic, etc.)
    const bufferTime = 30;
    const totalRequiredTime = estimatedTravelTime + bufferTime;
    
    if (timeUntilAppointment < 0) {
      return {
        status: 'late',
        message: 'Already past appointment time',
        minutesLate: Math.abs(timeUntilAppointment),
        severity: 'critical'
      };
    } else if (totalRequiredTime > timeUntilAppointment) {
      const shortfall = totalRequiredTime - timeUntilAppointment;
      return {
        status: 'at_risk',
        message: `At risk of being ${Math.round(shortfall)} minutes late`,
        minutesShort: shortfall,
        severity: shortfall > 60 ? 'high' : 'medium'
      };
    } else {
      const cushion = timeUntilAppointment - totalRequiredTime;
      return {
        status: 'on_time',
        message: `${Math.round(cushion)} minutes ahead of schedule`,
        minutesAhead: cushion,
        severity: 'low'
      };
    }
  }

  getNextAppointment(appointments: DeliveryAppointment[]): DeliveryAppointment | null {
    const pending = appointments.filter(apt => apt.status === 'pending');
    if (pending.length === 0) return null;
    
    pending.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    return pending[0];
  }

  // Get filter categories
  getFilterCategories(
    vehicles: Vehicle[],
    appointments: Record<string, DeliveryAppointment[]>,
    distances: Record<string, any>
  ): FilterCategories {
    const categories: FilterCategories = {
      all: [],
      late: [],
      at_risk: [],
      on_time: [],
      no_appointments: []
    };

    vehicles.forEach(vehicle => {
      const vehicleAppointments = appointments[vehicle.id] || [];
      const distance = distances[vehicle.id];
      const analysis = this.analyzeTruckStatus(vehicle, vehicleAppointments, distance);
      
      categories.all.push(vehicle);
      
      if (vehicleAppointments.length === 0) {
        categories.no_appointments.push(vehicle);
      } else {
        switch (analysis.status) {
          case 'late':
            categories.late.push(vehicle);
            break;
          case 'at_risk':
            categories.at_risk.push(vehicle);
            break;
          case 'on_time':
            categories.on_time.push(vehicle);
            break;
          default:
            categories.no_appointments.push(vehicle);
        }
      }
    });

    return categories;
  }

  // Format appointment time in Eastern Time
  formatAppointmentTime(datetime: string): string {
    const date = new Date(datetime);
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Get status color for UI
  getStatusColor(status: LateTrackingAnalysis['status']): string {
    switch (status) {
      case 'late': return '#dc3545';
      case 'at_risk': return '#fd7e14';
      case 'on_time': return '#28a745';
      default: return '#6c757d';
    }
  }

  // Get status icon for UI
  getStatusIcon(status: LateTrackingAnalysis['status']): string {
    switch (status) {
      case 'late': return '🔴';
      case 'at_risk': return '🟡';
      case 'on_time': return '🟢';
      default: return '⚪';
    }
  }
}

export const lateTrackingService = new LateTrackingService();
export type { LateTrackingAnalysis, FilterCategories };