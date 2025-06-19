import React, { useCallback } from 'react';
import { Calendar, Activity, MapPin, FileText, AlertCircle, Clock, CheckCircle, X, Search } from 'lucide-react';
import { Vehicle } from '../../types';
import { lateTrackingService } from '../../services/lateTrackingService';

interface FilterItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}

interface FilterPillProps {
  filter: FilterItem;
  count: number;
  active: boolean;
  onClick: () => void;
}

interface OptimizedVehicleFiltersProps {
  vehicles: Vehicle[];
  activeFilters: any;
  onFilterChange: (filterType: string, filterValue: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  loadNumbers: Record<string, string>;
  appointments: Record<string, any[]>;
  getDeliveryStatus: (vehicleId: string) => any;
  notes: Record<string, string>;
}

// Filter Pill Component
const FilterPill: React.FC<FilterPillProps> = ({ filter, count, active, onClick }) => {
  return (
    <button
      className={`filter-pill ${active ? 'active' : ''} px-3 py-1 border rounded-full text-xs font-medium transition-all duration-200`}
      onClick={onClick}
      style={{
        backgroundColor: active ? filter.color || '#007bff' : 'transparent',
        borderColor: filter.color || '#6c757d',
        color: active ? 'white' : (filter.color || '#6c757d')
      }}
    >
      <span className="mr-1">{filter.icon}</span>
      {filter.label} ({count})
    </button>
  );
};

const OptimizedVehicleFilters: React.FC<OptimizedVehicleFiltersProps> = ({ 
  vehicles, 
  activeFilters, 
  onFilterChange, 
  searchTerm, 
  onSearchChange,
  loadNumbers,
  appointments,
  getDeliveryStatus,
  notes
}) => {
  const getFilterCounts = useCallback(() => {
    // Vehicle status counts
    const movingCount = vehicles.filter(v => v.status === 'moving').length;
    const idleCount = vehicles.filter(v => v.status === 'idle').length;
    const stationaryCount = vehicles.filter(v => v.status === 'stationary').length;
    const staleCount = vehicles.filter(v => v.status === 'stale').length;
    
    // Location counts
    const withLocationCount = vehicles.filter(v => v.currentLocation.lat !== 0 && v.currentLocation.lon !== 0).length;
    const noLocationCount = vehicles.filter(v => v.currentLocation.lat === 0 && v.currentLocation.lon === 0).length;
    const partialCoordsCount = vehicles.filter(v => 
      (v.currentLocation.lat !== 0 && v.currentLocation.lon === 0) || 
      (v.currentLocation.lat === 0 && v.currentLocation.lon !== 0)
    ).length;
    
    // Load counts
    const withLoadCount = vehicles.filter(v => loadNumbers[v.id]).length;
    const noLoadCount = vehicles.filter(v => !loadNumbers[v.id]).length;
    
    // Delivery counts
    const lateCount = vehicles.filter(v => {
      const status = getDeliveryStatus(v.id);
      return status.status === 'late';
    }).length;
    
    const atRiskCount = vehicles.filter(v => {
      const status = getDeliveryStatus(v.id);
      return status.status === 'at_risk';
    }).length;
    
    const onTimeCount = vehicles.filter(v => {
      const status = getDeliveryStatus(v.id);
      return status.status === 'on_time';
    }).length;
    
    const noAppointmentsCount = vehicles.filter(v => 
      !appointments[v.id] || appointments[v.id].length === 0
    ).length;

    // With notes count
    const withNotesCount = vehicles.filter(v => notes[v.id]).length;

    return {
      // Vehicle status
      all_vehicles: vehicles.length,
      active_with_location: withLocationCount,
      moving: movingCount,
      idle: idleCount,
      stationary: stationaryCount,
      stale: staleCount,
      
      // Location
      with_location: withLocationCount,
      no_location: noLocationCount,
      partial_coords: partialCoordsCount,
      
      // Delivery
      with_appointments: vehicles.length - noAppointmentsCount,
      late: lateCount,
      at_risk: atRiskCount,
      on_time: onTimeCount,
      no_appointments: noAppointmentsCount,
      late_risk: lateCount + atRiskCount,
      
      // Load
      with_load_numbers: withLoadCount,
      no_load_numbers: noLoadCount,
      
      // Notes
      with_notes: withNotesCount,
      no_notes: vehicles.length - withNotesCount
    };
  }, [vehicles, loadNumbers, appointments, getDeliveryStatus, notes]);

  const counts = getFilterCounts();

  // Optimized filter groups
  const vehicleStatusFilters = [
    { key: 'all_status', label: 'All Vehicles', icon: <Calendar className="w-3 h-3" />, color: '#007bff' },
    { key: 'moving', label: 'Moving', icon: <Activity className="w-3 h-3" />, color: '#28a745' },
    { key: 'idle', label: 'Idle', icon: <Clock className="w-3 h-3" />, color: '#ffc107' },
    { key: 'stationary', label: 'Stationary', icon: <AlertCircle className="w-3 h-3" />, color: '#dc3545' },
    { key: 'with_location', label: 'With Location', icon: <MapPin className="w-3 h-3" />, color: '#28a745' },
    { key: 'no_location', label: 'No Location', icon: <X className="w-3 h-3" />, color: '#dc3545' }
  ];

  const deliveryFilters = [
    { key: 'all_deliveries', label: 'All Deliveries', icon: <Calendar className="w-3 h-3" />, color: '#007bff' },
    { key: 'with_appointments', label: 'With Appointments', icon: <Calendar className="w-3 h-3" />, color: '#8e44ad' },
    { key: 'late_risk', label: 'Late/At Risk', icon: <AlertCircle className="w-3 h-3" />, color: '#dc3545' },
    { key: 'on_time', label: 'On Time', icon: <CheckCircle className="w-3 h-3" />, color: '#28a745' },
    { key: 'no_appointments', label: 'No Appointments', icon: <X className="w-3 h-3" />, color: '#6c757d' }
  ];

  const loadFilters = [
    { key: 'all_loads', label: 'All Loads', icon: <FileText className="w-3 h-3" />, color: '#007bff' },
    { key: 'with_load_numbers', label: 'With Load #', icon: <CheckCircle className="w-3 h-3" />, color: '#28a745' },
    { key: 'no_load_numbers', label: 'No Load #', icon: <X className="w-3 h-3" />, color: '#dc3545' }
  ];

  return (
    <div className="optimized-filters bg-white shadow-sm rounded-lg p-4 border border-gray-200 mb-4">
      {/* Search at the top */}
      <div className="search-section mb-4">
        <div className="search-bar relative max-w-md">
          <input
            type="text"
            placeholder="Search vehicles, load #, locations, or notes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            className="search-clear absolute right-2 top-1/2 transform -translate-y-1/2 bg-none border-none cursor-pointer p-1 text-gray-500"
            onClick={() => onSearchChange('')}
          >
            {searchTerm ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Horizontal filter sections */}
      <div className="filter-sections flex flex-col gap-3">
        <div className="filter-group flex items-center gap-3 flex-wrap">
          <label className="text-xs font-semibold text-gray-700 min-w-[100px]">Vehicle Status:</label>
          <div className="filter-pills flex gap-1.5 flex-wrap">
            {vehicleStatusFilters.map(filter => (
              <FilterPill
                key={filter.key}
                filter={filter}
                count={filter.key === 'all_status' ? vehicles.length : 
                       filter.key === 'with_location' ? counts.with_location :
                       filter.key === 'no_location' ? counts.no_location :
                       counts[filter.key] || 0}
                active={activeFilters.status === filter.key || 
                        (filter.key === 'with_location' && activeFilters.location === 'with_location') ||
                        (filter.key === 'no_location' && activeFilters.location === 'no_location')}
                onClick={() => {
                  if (filter.key === 'with_location' || filter.key === 'no_location') {
                    onFilterChange('location', filter.key);
                  } else {
                    onFilterChange('status', filter.key);
                  }
                }}
              />
            ))}
          </div>
        </div>

        <div className="filter-group flex items-center gap-3 flex-wrap">
          <label className="text-xs font-semibold text-gray-700 min-w-[100px]">Delivery Status:</label>
          <div className="filter-pills flex gap-1.5 flex-wrap">
            {deliveryFilters.map(filter => (
              <FilterPill
                key={filter.key}
                filter={filter}
                count={filter.key === 'all_deliveries' ? vehicles.length : 
                       filter.key === 'with_appointments' ? counts.with_appointments :
                       filter.key === 'late_risk' ? counts.late + counts.at_risk :
                       filter.key === 'on_time' ? counts.on_time :
                       counts.no_appointments}
                active={activeFilters.delivery === filter.key ||
                        (filter.key === 'late_risk' && 
                         (activeFilters.delivery === 'late' || activeFilters.delivery === 'at_risk'))}
                onClick={() => {
                  if (filter.key === 'late_risk') {
                    onFilterChange('delivery', 'late');
                  } else {
                    onFilterChange('delivery', filter.key);
                  }
                }}
              />
            ))}
          </div>
        </div>

        <div className="filter-group flex items-center gap-3 flex-wrap">
          <label className="text-xs font-semibold text-gray-700 min-w-[100px]">Load Status:</label>
          <div className="filter-pills flex gap-1.5 flex-wrap">
            {loadFilters.map(filter => (
              <FilterPill
                key={filter.key}
                filter={filter}
                count={filter.key === 'all_loads' ? vehicles.length : counts[filter.key] || 0}
                active={activeFilters.load === filter.key}
                onClick={() => onFilterChange('load', filter.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="filter-actions flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
        <button 
          onClick={() => onFilterChange('clear', 'all')}
          className="clear-btn bg-gray-600 text-white border-none py-1.5 px-3 rounded text-xs cursor-pointer hover:bg-gray-700"
        >
          Clear All Filters
        </button>
        <span className="results-count text-xs text-gray-600 font-medium">
          Showing {vehicles.length} vehicles
        </span>
      </div>
    </div>
  );
};

export default OptimizedVehicleFilters;