import React from 'react';
import { Vehicle } from '../../types';
import { DeliveryAppointment } from '../../services/deliveryAppointmentsService';
import { lateTrackingService, FilterCategories } from '../../services/lateTrackingService';
import { AlertTriangle, Clock, CheckCircle, Calendar } from 'lucide-react';

interface LateTrackingFilterProps {
  vehicles: Vehicle[];
  appointments: Record<string, DeliveryAppointment[]>;
  distances: Record<string, any>;
  onFilterChange: (filter: keyof FilterCategories) => void;
  activeFilter: keyof FilterCategories;
  className?: string;
}

export const LateTrackingFilter: React.FC<LateTrackingFilterProps> = ({
  vehicles,
  appointments,
  distances,
  onFilterChange,
  activeFilter,
  className = ''
}) => {
  const categories = lateTrackingService.getFilterCategories(vehicles, appointments, distances);

  const filterOptions = [
    { 
      key: 'all' as const, 
      label: 'All Trucks', 
      count: categories.all.length, 
      color: '#6c757d',
      icon: <Calendar className="w-4 h-4" />
    },
    { 
      key: 'late' as const, 
      label: 'Late', 
      count: categories.late.length, 
      color: '#dc3545',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    { 
      key: 'at_risk' as const, 
      label: 'At Risk', 
      count: categories.at_risk.length, 
      color: '#fd7e14',
      icon: <Clock className="w-4 h-4" />
    },
    { 
      key: 'on_time' as const, 
      label: 'On Time', 
      count: categories.on_time.length, 
      color: '#28a745',
      icon: <CheckCircle className="w-4 h-4" />
    },
    { 
      key: 'no_appointments' as const, 
      label: 'No Appointments', 
      count: categories.no_appointments.length, 
      color: '#6c757d',
      icon: <Calendar className="w-4 h-4" />
    }
  ];

  return (
    <div className={`late-tracking-filter bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filter by Delivery Status</h3>
        <div className="text-sm text-gray-500">
          {vehicles.length} total vehicles
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {filterOptions.map(option => (
          <button
            key={option.key}
            className={`filter-btn relative p-4 border-2 rounded-lg transition-all duration-200 hover:shadow-md ${
              activeFilter === option.key 
                ? 'shadow-md transform -translate-y-1' 
                : 'hover:transform hover:-translate-y-0.5'
            }`}
            onClick={() => onFilterChange(option.key)}
            style={{ 
              borderColor: option.color,
              backgroundColor: activeFilter === option.key ? option.color : 'transparent',
              color: activeFilter === option.key ? 'white' : option.color
            }}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                {option.icon}
                <span className="font-medium text-sm">{option.label}</span>
              </div>
              <div className="text-lg font-bold">
                {option.count}
              </div>
            </div>
            
            {/* Badge for urgent items */}
            {(option.key === 'late' || option.key === 'at_risk') && option.count > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                !
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-red-600">{categories.late.length}</div>
            <div className="text-xs text-gray-600">Late</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">{categories.at_risk.length}</div>
            <div className="text-xs text-gray-600">At Risk</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{categories.on_time.length}</div>
            <div className="text-xs text-gray-600">On Time</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-600">{categories.no_appointments.length}</div>
            <div className="text-xs text-gray-600">No Schedule</div>
          </div>
        </div>
      </div>
    </div>
  );
};