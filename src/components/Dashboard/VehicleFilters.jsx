import React, { useCallback } from 'react';
import { Calendar, Activity, MapPin, FileText, AlertCircle, Clock, CheckCircle, X, Search } from 'lucide-react';

// Filter definitions
const statusFilters = [
  { key: 'all_status', label: 'All Status', icon: <Calendar className="w-4 h-4" /> },
  { key: 'moving', label: 'Moving', icon: <Activity className="w-4 h-4" />, color: '#28a745' },
  { key: 'idle', label: 'Idle', icon: <Clock className="w-4 h-4" />, color: '#ffc107' },
  { key: 'stationary', label: 'Stationary', icon: <AlertCircle className="w-4 h-4" />, color: '#dc3545' },
  { key: 'stale', label: 'Stale Data', icon: <X className="w-4 h-4" />, color: '#6c757d' }
];

const locationFilters = [
  { key: 'all_locations', label: 'All Vehicles', icon: <MapPin className="w-4 h-4" /> },
  { key: 'with_location', label: 'With Location', icon: <CheckCircle className="w-4 h-4" />, color: '#28a745' },
  { key: 'no_location', label: 'No Location', icon: <X className="w-4 h-4" />, color: '#dc3545' },
  { key: 'partial_coords', label: 'Partial Coords', icon: <AlertCircle className="w-4 h-4" />, color: '#fd7e14' }
];

const deliveryFilters = [
  { key: 'all_deliveries', label: 'All Deliveries', icon: <Calendar className="w-4 h-4" /> },
  { key: 'late', label: 'Late', icon: <AlertCircle className="w-4 h-4" />, color: '#dc3545' },
  { key: 'at_risk', label: 'At Risk', icon: <Clock className="w-4 h-4" />, color: '#fd7e14' },
  { key: 'on_time', label: 'On Time', icon: <CheckCircle className="w-4 h-4" />, color: '#28a745' },
  { key: 'no_appointments', label: 'No Appointments', icon: <X className="w-4 h-4" />, color: '#6c757d' }
];

const loadFilters = [
  { key: 'all_loads', label: 'All Loads', icon: <FileText className="w-4 h-4" /> },
  { key: 'with_load_numbers', label: 'With Load #', icon: <CheckCircle className="w-4 h-4" />, color: '#28a745' },
  { key: 'no_load_numbers', label: 'No Load #', icon: <X className="w-4 h-4" />, color: '#dc3545' }
];

// Filter Button Component
const FilterButton = ({ filter, count, active, onClick }) => {
  return (
    <button
      className={`filter-btn ${active ? 'active' : ''} inline-flex items-center rounded-full border font-medium px-2.5 py-1.5 text-xs`}
      onClick={onClick}
      style={{
        borderColor: filter.color || '#6c757d',
        backgroundColor: active ? (filter.color || '#007bff') : 'transparent',
        color: active ? 'white' : (filter.color || '#6c757d')
      }}
    >
      <span className="filter-icon mr-1">{filter.icon}</span>
      <span className="filter-label">{filter.label}</span>
      <span className="filter-count ml-1">({count})</span>
    </button>
  );
};

// Search Filter Component
const SearchFilter = ({ onSearchChange, searchTerm }) => {
  return (
    <div className="search-filter relative">
      <input
        type="text"
        placeholder="Search by vehicle number, load #, or location..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <span className="search-icon absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
        <Search className="w-4 h-4" />
      </span>
    </div>
  );
};

// Main Vehicle Filters Component
const VehicleFilters = ({ 
  vehicles, 
  activeFilters, 
  onFilterChange, 
  searchTerm, 
  onSearchChange,
  loadNumbers,
  appointments,
  getDeliveryStatus,
  isStaleData
}) => {
  const getFilterCounts = useCallback(() => {
    return {
      // Status counts
      moving: vehicles.filter(v => v.status === 'moving').length,
      idle: vehicles.filter(v => v.status === 'idle').length,
      stationary: vehicles.filter(v => v.status === 'stationary').length,
      stale: vehicles.filter(v => v.status === 'stale').length,
      
      // Location counts
      with_location: vehicles.filter(v => v.currentLocation.lat !== 0 && v.currentLocation.lon !== 0).length,
      no_location: vehicles.filter(v => v.currentLocation.lat === 0 && v.currentLocation.lon === 0).length,
      partial_coords: vehicles.filter(v => 
        (v.currentLocation.lat !== 0 && v.currentLocation.lon === 0) || 
        (v.currentLocation.lat === 0 && v.currentLocation.lon !== 0)
      ).length,
      
      // Load counts
      with_load_numbers: vehicles.filter(v => loadNumbers[v.id]).length,
      no_load_numbers: vehicles.filter(v => !loadNumbers[v.id]).length,
      
      // Delivery counts
      late: vehicles.filter(v => {
        const status = getDeliveryStatus(v.id);
        return status.status === 'late';
      }).length,
      at_risk: vehicles.filter(v => {
        const status = getDeliveryStatus(v.id);
        return status.status === 'at_risk';
      }).length,
      on_time: vehicles.filter(v => {
        const status = getDeliveryStatus(v.id);
        return status.status === 'on_time';
      }).length,
      no_appointments: vehicles.filter(v => 
        !appointments[v.id] || appointments[v.id].length === 0
      ).length
    };
  }, [vehicles, loadNumbers, appointments, getDeliveryStatus]);

  const counts = getFilterCounts();

  return (
    <div className="vehicle-filters bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <div className="filter-section mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Search</h3>
        <SearchFilter 
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
      </div>

      <div className="filter-section mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Vehicle Status</h3>
        <div className="filter-buttons flex flex-wrap gap-2">
          {statusFilters.map(filter => (
            <FilterButton
              key={filter.key}
              filter={filter}
              count={filter.key === 'all_status' ? vehicles.length : counts[filter.key] || 0}
              active={activeFilters.status === filter.key}
              onClick={() => onFilterChange('status', filter.key)}
            />
          ))}
        </div>
      </div>

      <div className="filter-section mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Location Data</h3>
        <div className="filter-buttons flex flex-wrap gap-2">
          {locationFilters.map(filter => (
            <FilterButton
              key={filter.key}
              filter={filter}
              count={filter.key === 'all_locations' ? vehicles.length : counts[filter.key] || 0}
              active={activeFilters.location === filter.key}
              onClick={() => onFilterChange('location', filter.key)}
            />
          ))}
        </div>
      </div>

      <div className="filter-section mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Delivery Status</h3>
        <div className="filter-buttons flex flex-wrap gap-2">
          {deliveryFilters.map(filter => (
            <FilterButton
              key={filter.key}
              filter={filter}
              count={filter.key === 'all_deliveries' ? vehicles.length : counts[filter.key] || 0}
              active={activeFilters.delivery === filter.key}
              onClick={() => onFilterChange('delivery', filter.key)}
            />
          ))}
        </div>
      </div>

      <div className="filter-section mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Load Management</h3>
        <div className="filter-buttons flex flex-wrap gap-2">
          {loadFilters.map(filter => (
            <FilterButton
              key={filter.key}
              filter={filter}
              count={filter.key === 'all_loads' ? vehicles.length : counts[filter.key] || 0}
              active={activeFilters.load === filter.key}
              onClick={() => onFilterChange('load', filter.key)}
            />
          ))}
        </div>
      </div>

      <div className="filter-actions flex justify-between items-center pt-4 border-t border-gray-200">
        <button 
          onClick={() => onFilterChange('clear', 'all')}
          className="clear-filters-btn bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Clear All Filters
        </button>
        <div className="active-filters-summary text-sm text-gray-600 font-medium">
          Showing filtered vehicles
        </div>
      </div>
    </div>
  );
};

export default VehicleFilters;