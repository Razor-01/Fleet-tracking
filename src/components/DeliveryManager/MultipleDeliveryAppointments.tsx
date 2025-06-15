import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, Edit3, Trash2, Check, X } from 'lucide-react';
import { DeliveryAppointment, deliveryAppointmentsService } from '../../services/deliveryAppointmentsService';
import { lateTrackingService } from '../../services/lateTrackingService';

interface MultipleDeliveryAppointmentsProps {
  vehicleId: string;
  vehicleName: string;
  onAppointmentsChange: (vehicleId: string, appointments: DeliveryAppointment[]) => void;
  className?: string;
}

export const MultipleDeliveryAppointments: React.FC<MultipleDeliveryAppointmentsProps> = ({
  vehicleId,
  vehicleName,
  onAppointmentsChange,
  className = ''
}) => {
  const [appointments, setAppointments] = useState<DeliveryAppointment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    location: '',
    datetime: '',
    notes: ''
  });

  useEffect(() => {
    const savedAppointments = deliveryAppointmentsService.getAppointments(vehicleId);
    setAppointments(savedAppointments);
  }, [vehicleId]);

  const handleAddAppointment = async () => {
    if (!newAppointment.location || !newAppointment.datetime) {
      alert('Please fill in location and date/time');
      return;
    }

    try {
      const updatedAppointments = deliveryAppointmentsService.addAppointment(vehicleId, newAppointment);
      setAppointments(updatedAppointments);
      onAppointmentsChange(vehicleId, updatedAppointments);
      
      // Reset form
      setNewAppointment({ location: '', datetime: '', notes: '' });
      setShowAddForm(false);
      
      console.log(`📅 Added appointment for ${vehicleName}:`, newAppointment);
    } catch (error) {
      console.error('❌ Error adding appointment:', error);
      alert('Failed to add appointment');
    }
  };

  const handleRemoveAppointment = (appointmentId: string) => {
    const updatedAppointments = deliveryAppointmentsService.removeAppointment(vehicleId, appointmentId);
    setAppointments(updatedAppointments);
    onAppointmentsChange(vehicleId, updatedAppointments);
  };

  const handleStatusChange = (appointmentId: string, newStatus: DeliveryAppointment['status']) => {
    const updatedAppointments = deliveryAppointmentsService.updateAppointmentStatus(vehicleId, appointmentId, newStatus);
    setAppointments(updatedAppointments);
    onAppointmentsChange(vehicleId, updatedAppointments);
  };

  const getStatusColor = (status: DeliveryAppointment['status']): string => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'missed': return '#dc3545';
      case 'pending': return '#007bff';
      default: return '#6c757d';
    }
  };

  const getNextAppointment = (): DeliveryAppointment | null => {
    const pending = appointments.filter(apt => apt.status === 'pending');
    if (pending.length === 0) return null;
    
    pending.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    return pending[0];
  };

  const nextAppointment = getNextAppointment();

  // Generate default datetime (2 hours from now)
  const getDefaultDateTime = (): string => {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return twoHoursLater.toISOString().slice(0, 16); // Format for datetime-local input
  };

  if (appointments.length === 0 && !showAddForm) {
    return (
      <div className={`delivery-appointments ${className}`}>
        <div 
          className="no-appointments cursor-pointer p-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onClick={() => setShowAddForm(true)}
          title="Click to add delivery appointment"
        >
          <Calendar className="w-5 h-5 mx-auto mb-1 text-gray-400" />
          <span className="text-sm text-gray-500">Add appointments</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`delivery-appointments relative ${className}`}>
      {!showAddForm && appointments.length > 0 && (
        <div className="appointments-summary">
          {/* Show next appointment prominently */}
          {nextAppointment && (
            <div className="next-appointment bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  {lateTrackingService.formatAppointmentTime(nextAppointment.datetime)}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm mt-1">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700">{nextAppointment.location}</span>
              </div>
              {nextAppointment.notes && (
                <div className="text-xs text-blue-600 mt-1">
                  {nextAppointment.notes}
                </div>
              )}
            </div>
          )}
          
          {/* Show appointment count and manage button */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">
              {appointments.length} appointment{appointments.length > 1 ? 's' : ''}
            </span>
            <button 
              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              onClick={() => setShowAddForm(true)}
              title="Manage appointments"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Manage Form */}
      {showAddForm && (
        <div className="appointments-form absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Manage Appointments</h4>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add New Appointment */}
            <div className="add-appointment mb-4 p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Add New Appointment</h5>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Delivery location"
                  value={newAppointment.location}
                  onChange={(e) => setNewAppointment({...newAppointment, location: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="datetime-local"
                  value={newAppointment.datetime || getDefaultDateTime()}
                  onChange={(e) => setNewAppointment({...newAppointment, datetime: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex space-x-2">
                  <button 
                    onClick={handleAddAppointment} 
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Add Appointment
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Appointments Management */}
            {appointments.length > 0 && (
              <div className="existing-appointments">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Current Appointments</h5>
                <div className="space-y-2">
                  {appointments.map(appointment => (
                    <div key={appointment.id} className="appointment-item p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{appointment.location}</div>
                          <div className="text-sm text-gray-600">
                            {lateTrackingService.formatAppointmentTime(appointment.datetime)}
                          </div>
                          {appointment.notes && (
                            <div className="text-xs text-gray-500 mt-1">{appointment.notes}</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <select 
                            value={appointment.status}
                            onChange={(e) => handleStatusChange(appointment.id, e.target.value as DeliveryAppointment['status'])}
                            className="text-xs px-2 py-1 border border-gray-300 rounded"
                            style={{ color: getStatusColor(appointment.status) }}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="missed">Missed</option>
                          </select>
                          <button 
                            onClick={() => handleRemoveAppointment(appointment.id)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Remove appointment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};