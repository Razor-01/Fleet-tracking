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
  const [location, setLocation] = useState('');
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const savedAppointments = deliveryAppointmentsService.getAppointments(vehicleId);
    setAppointments(savedAppointments);
  }, [vehicleId]);

  // Parse natural language appointment formats
  const parseAppointmentText = (text: string) => {
    const cleanText = text.trim();
    
    try {
      // Extract date and time parts
      // Patterns: "06/16/2025 7:00 AM", "06/14/2025 9AM - 2 PM", "6/15/25 10AM", "Tomorrow 9AM", "Monday 2PM"
      const dateTimeRegex = /(\d{1,2}\/\d{1,2}\/(?:\d{4}|\d{2}))\s+(.+)/;
      const match = cleanText.match(dateTimeRegex);
      
      if (match) {
        const [, datePart, timePart] = match;
        return parseExactDateTime(datePart, timePart);
      }
      
      // Handle relative dates like "Tomorrow", "Monday"
      const relativeDateRegex = /(tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(.+)/i;
      const relativeMatch = cleanText.match(relativeDateRegex);
      
      if (relativeMatch) {
        const [, dayPart, timePart] = relativeMatch;
        return parseRelativeDateTime(dayPart, timePart);
      }
      
      throw new Error('Could not parse date format');
      
    } catch (error) {
      throw new Error('Please use format like: 06/16/2025 9AM or 06/14/2025 9AM-2PM');
    }
  };

  const parseExactDateTime = (datePart: string, timePart: string) => {
    // Handle date part
    let [month, day, year] = datePart.split('/');
    
    // Handle 2-digit years
    if (year.length === 2) {
      year = '20' + year;
    }
    
    // Parse time part - handle ranges like "9AM-2PM" or single times like "7:00 AM"
    const timeRangeRegex = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i;
    const rangeMatch = timePart.match(timeRangeRegex);
    
    if (rangeMatch) {
      // Time range
      const [, startTime, endTime] = rangeMatch;
      return {
        startDateTime: convertToDateTime(month, day, year, startTime),
        endDateTime: convertToDateTime(month, day, year, endTime),
        isRange: true,
        originalText: `${datePart} ${timePart}`
      };
    } else {
      // Single time
      return {
        startDateTime: convertToDateTime(month, day, year, timePart),
        endDateTime: null,
        isRange: false,
        originalText: `${datePart} ${timePart}`
      };
    }
  };

  const parseRelativeDateTime = (dayPart: string, timePart: string) => {
    const today = new Date();
    let targetDate = new Date(today);
    
    if (dayPart.toLowerCase() === 'tomorrow') {
      targetDate.setDate(today.getDate() + 1);
    } else {
      // Handle day names
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDayIndex = dayNames.indexOf(dayPart.toLowerCase());
      
      if (targetDayIndex !== -1) {
        const currentDayIndex = today.getDay();
        let daysUntilTarget = targetDayIndex - currentDayIndex;
        
        if (daysUntilTarget <= 0) {
          daysUntilTarget += 7; // Next week
        }
        
        targetDate.setDate(today.getDate() + daysUntilTarget);
      }
    }
    
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const year = targetDate.getFullYear();
    
    return parseExactDateTime(`${month}/${day}/${year}`, timePart);
  };

  const convertToDateTime = (month: string, day: string, year: string, timeStr: string): Date => {
    // Parse time string like "9AM", "7:00 AM", "2 PM"
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i;
    const match = timeStr.trim().match(timeRegex);
    
    if (!match) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }
    
    let [, hours, minutes = '00', ampm] = match;
    let hoursNum = parseInt(hours);
    const minutesNum = parseInt(minutes);
    
    // Convert to 24-hour format
    if (ampm.toUpperCase() === 'PM' && hoursNum !== 12) {
      hoursNum += 12;
    } else if (ampm.toUpperCase() === 'AM' && hoursNum === 12) {
      hoursNum = 0;
    }
    
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hoursNum, minutesNum);
  };

  const handleAddAppointment = async () => {
    if (!inputValue.trim() || !location.trim()) {
      alert('Please enter both location and appointment time');
      return;
    }

    try {
      const parsed = parseAppointmentText(inputValue);
      
      const newAppointment = {
        location: location.trim(),
        datetime: parsed.startDateTime.toISOString(),
        notes: parsed.isRange && parsed.endDateTime ? 
          `Time range until ${parsed.endDateTime.toLocaleString('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}` : ''
      };

      const updatedAppointments = deliveryAppointmentsService.addAppointment(vehicleId, newAppointment);
      setAppointments(updatedAppointments);
      onAppointmentsChange(vehicleId, updatedAppointments);
      
      // Reset form
      setInputValue('');
      setLocation('');
      setShowAddForm(false);
      
      console.log(`📅 Added appointment for ${vehicleName}:`, newAppointment);
    } catch (error) {
      console.error('❌ Error adding appointment:', error);
      alert(error instanceof Error ? error.message : 'Failed to add appointment');
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

  const formatAppointmentDisplay = (appointment: DeliveryAppointment): string => {
    const startDate = new Date(appointment.datetime);
    return startDate.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const nextAppointment = getNextAppointment();

  // Generate default datetime (2 hours from now)
  const getDefaultDateTime = (): string => {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const month = String(twoHoursLater.getMonth() + 1).padStart(2, '0');
    const day = String(twoHoursLater.getDate()).padStart(2, '0');
    const year = twoHoursLater.getFullYear();
    const hour = twoHoursLater.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${month}/${day}/${year} ${displayHour}${ampm}`;
  };

  if (appointments.length === 0 && !showAddForm) {
    return (
      <div className={`delivery-appointments ${className}`}>
        <div 
          className="no-appointments-simple cursor-pointer p-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onClick={() => setShowAddForm(true)}
          title="Click to add delivery appointment"
        >
          <Calendar className="w-5 h-5 mx-auto mb-1 text-gray-400" />
          <span className="text-sm text-gray-500">Add appointment</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`delivery-appointments relative ${className}`}>
      {!showAddForm && appointments.length > 0 && (
        <div className="appointments-display bg-gray-50 rounded-lg p-3">
          {/* Show next appointment prominently */}
          {nextAppointment && (
            <div className="next-appointment-simple bg-white p-2 rounded border-l-4 border-blue-500 mb-2">
              <div className="apt-time text-xs font-bold text-blue-600 mb-1">
                {formatAppointmentDisplay(nextAppointment)}
              </div>
              <div className="apt-location text-xs text-gray-700">
                {nextAppointment.location}
              </div>
              {nextAppointment.notes && (
                <div className="text-xs text-gray-500 mt-1">
                  {nextAppointment.notes}
                </div>
              )}
            </div>
          )}
          
          {/* Show appointment count and manage button */}
          <div className="appointment-controls flex justify-between items-center">
            <span className="apt-count text-xs text-gray-600">
              {appointments.length} apt{appointments.length > 1 ? 's' : ''}
            </span>
            <button 
              className="add-more-btn bg-blue-500 text-white border-none rounded-full w-5 h-5 text-xs cursor-pointer flex items-center justify-center hover:bg-blue-600 transition-colors"
              onClick={() => setShowAddForm(true)}
              title="Add more appointments"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Add/Manage Form */}
      {showAddForm && (
        <div className="simple-add-form absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-80">
          <div className="form-header flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <h4 className="text-sm font-medium text-gray-700 m-0">Add Appointment</h4>
            <button
              className="close-btn bg-none border-none text-base cursor-pointer text-gray-500 p-0 w-5 h-5 flex items-center justify-center hover:text-gray-700"
              onClick={() => setShowAddForm(false)}
            >
              ✕
            </button>
          </div>

          <div className="form-content p-4">
            <div className="input-group mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Location:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Walmart DC, 123 Main St"
                className="location-input w-full p-2 border border-gray-300 rounded text-sm box-border focus:outline-none focus:border-blue-500 focus:shadow-sm"
              />
            </div>

            <div className="input-group mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Date & Time:</label>
              <input
                type="text"
                value={inputValue || getDefaultDateTime()}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM"
                className="datetime-input w-full p-2 border border-gray-300 rounded text-sm box-border focus:outline-none focus:border-blue-500 focus:shadow-sm"
              />
              <div className="format-examples mt-2 p-2 bg-gray-50 rounded text-xs">
                <div className="font-bold text-gray-600 mb-1">Examples:</div>
                <div className="text-gray-700">• 06/16/2025 7:00 AM</div>
                <div className="text-gray-700">• 06/14/2025 9AM - 2PM</div>
                <div className="text-gray-700">• Tomorrow 10AM</div>
                <div className="text-gray-700">• Monday 2PM</div>
              </div>
            </div>

            <div className="form-actions text-center">
              <button 
                onClick={handleAddAppointment}
                className="add-btn-simple bg-green-500 text-white border-none py-2 px-5 rounded cursor-pointer text-sm font-bold hover:bg-green-600 transition-colors"
              >
                Add Appointment
              </button>
            </div>
          </div>

          {/* Existing Appointments Management */}
          {appointments.length > 0 && (
            <div className="existing-appointments-simple border-t border-gray-200 p-3 bg-gray-50">
              <h5 className="text-xs text-gray-600 m-0 mb-2">Current Appointments:</h5>
              <div className="space-y-2">
                {appointments.map(appointment => (
                  <div key={appointment.id} className="apt-item flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                    <div className="apt-details flex-1">
                      <div className="apt-time-location text-xs text-gray-700">
                        {formatAppointmentDisplay(appointment)} - {appointment.location}
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
                        className="remove-apt-btn bg-none border-none cursor-pointer text-xs text-red-600 p-1 hover:bg-red-50 rounded"
                        title="Remove appointment"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};