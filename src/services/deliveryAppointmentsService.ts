interface DeliveryAppointment {
  id: string;
  location: string;
  datetime: string;
  notes: string;
  status: 'pending' | 'completed' | 'missed';
}

interface StoredAppointments {
  appointments: DeliveryAppointment[];
  updatedAt: string;
}

class DeliveryAppointmentsService {
  private storageKey = 'truck_delivery_appointments';

  // Save appointments for a vehicle
  saveAppointments(vehicleId: string, appointments: DeliveryAppointment[]): void {
    const allAppointments = this.getAllAppointments();
    allAppointments[vehicleId] = {
      appointments: appointments,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(allAppointments));
    console.log(`📅 Saved ${appointments.length} appointments for vehicle ${vehicleId}`);
  }

  // Get appointments for a vehicle
  getAppointments(vehicleId: string): DeliveryAppointment[] {
    const allAppointments = this.getAllAppointments();
    return allAppointments[vehicleId]?.appointments || [];
  }

  // Get all appointments
  getAllAppointments(): Record<string, StoredAppointments> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ Error reading appointments:', error);
      return {};
    }
  }

  // Add single appointment
  addAppointment(vehicleId: string, appointment: Omit<DeliveryAppointment, 'id' | 'status'>): DeliveryAppointment[] {
    const existing = this.getAppointments(vehicleId);
    const newAppointment: DeliveryAppointment = {
      id: Date.now().toString(),
      location: appointment.location,
      datetime: appointment.datetime,
      notes: appointment.notes || '',
      status: 'pending'
    };
    
    const newAppointments = [...existing, newAppointment];
    this.saveAppointments(vehicleId, newAppointments);
    
    console.log(`📅 Added appointment for vehicle ${vehicleId}:`, newAppointment);
    return newAppointments;
  }

  // Update appointment status
  updateAppointmentStatus(vehicleId: string, appointmentId: string, status: DeliveryAppointment['status']): DeliveryAppointment[] {
    const appointments = this.getAppointments(vehicleId);
    const updated = appointments.map(apt => 
      apt.id === appointmentId ? { ...apt, status } : apt
    );
    
    this.saveAppointments(vehicleId, updated);
    console.log(`📅 Updated appointment ${appointmentId} status to ${status}`);
    return updated;
  }

  // Remove appointment
  removeAppointment(vehicleId: string, appointmentId: string): DeliveryAppointment[] {
    const appointments = this.getAppointments(vehicleId);
    const filtered = appointments.filter(apt => apt.id !== appointmentId);
    
    this.saveAppointments(vehicleId, filtered);
    console.log(`🗑️ Removed appointment ${appointmentId} for vehicle ${vehicleId}`);
    return filtered;
  }

  // Get next upcoming appointment
  getNextAppointment(vehicleId: string): DeliveryAppointment | null {
    const appointments = this.getAppointments(vehicleId);
    const pending = appointments.filter(apt => apt.status === 'pending');
    
    if (pending.length === 0) return null;
    
    // Sort by datetime and return the earliest
    pending.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    return pending[0];
  }

  // Clear all appointments for a vehicle
  clearAppointments(vehicleId: string): void {
    const allAppointments = this.getAllAppointments();
    delete allAppointments[vehicleId];
    localStorage.setItem(this.storageKey, JSON.stringify(allAppointments));
    console.log(`🗑️ Cleared all appointments for vehicle ${vehicleId}`);
  }

  // Get appointment statistics
  getAppointmentStats(): { total: number; pending: number; completed: number; missed: number } {
    const allAppointments = this.getAllAppointments();
    let total = 0;
    let pending = 0;
    let completed = 0;
    let missed = 0;

    Object.values(allAppointments).forEach(stored => {
      stored.appointments.forEach(apt => {
        total++;
        switch (apt.status) {
          case 'pending': pending++; break;
          case 'completed': completed++; break;
          case 'missed': missed++; break;
        }
      });
    });

    return { total, pending, completed, missed };
  }
}

export const deliveryAppointmentsService = new DeliveryAppointmentsService();
export type { DeliveryAppointment };