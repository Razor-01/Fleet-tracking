import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Layout/Header';
import { StatsCards } from './components/Dashboard/StatsCards';
import { VehicleTable } from './components/Dashboard/VehicleTable';
import { DistanceControls } from './components/Dashboard/DistanceControls';
import { ApiConfigPanel } from './components/Settings/ApiConfigPanel';
import { SystemSettings } from './components/Settings/SystemSettings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLoadNumbers } from './hooks/useLoadNumbers';
import { useDeliveryAppointments } from './hooks/useDeliveryAppointments';
import { useControlledDistanceCalculation } from './hooks/useControlledDistanceCalculation';
import { motiveApi } from './services/motiveApi';
import { mappingApi } from './services/mappingApi';
import { mapboxService } from './services/mapboxService';
import { lateTrackingService, FilterCategories } from './services/lateTrackingService';
import { DeliveryAppointment } from './services/deliveryAppointmentsService';
import { notesService } from './services/notesService';
import { 
  Vehicle, 
  APIConfig, 
  MotiveConfig, 
  SystemSettings as SystemSettingsType,
  MapProvider
} from './types';
import { Settings, Truck, X, AlertCircle, FileText, Calendar } from 'lucide-react';
import OptimizedVehicleFilters from './components/Dashboard/OptimizedVehicleFilters';

const DEFAULT_SYSTEM_SETTINGS: SystemSettingsType = {
  refreshInterval: 5,
  operationHours: {
    start: '23:00',
    end: '08:00',
    timezone: 'America/New_York'
  },
  distanceUnit: 'miles',
  speedThresholds: {
    idle: 1.0,
    moving: 5.0
  }
};

const DEFAULT_MOTIVE_CONFIG: MotiveConfig = {
  apiKey: '',
  isActive: false
};

function App() {
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [motiveConfig, setMotiveConfig] = useLocalStorage<MotiveConfig>('motiveConfig', DEFAULT_MOTIVE_CONFIG);
  const [mapConfigs, setMapConfigs] = useLocalStorage<APIConfig[]>('mapConfigs', []);
  const [systemSettings, setSystemSettings] = useLocalStorage<SystemSettingsType>('systemSettings', DEFAULT_SYSTEM_SETTINGS);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'api' | 'system'>('api');
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  
  // Filter state
  const [activeFilters, setActiveFilters] = useLocalStorage('fleet_tracker_filters', {
    status: 'all_status',
    location: 'all_locations',
    delivery: 'all_deliveries',
    load: 'all_loads'
  });
  const [searchTerm, setSearchTerm] = useLocalStorage('fleet_tracker_search', '');
  const [notes, setNotes] = useLocalStorage<Record<string, string>>('vehicle_notes', {});

  // Use load number management hook
  const { loadNumbers, setLoadNumber, getLoadNumber, getLoadNumberStats } = useLoadNumbers();

  // Use delivery appointments hook
  const { appointments, setVehicleAppointments, getVehicleAppointments, getNextAppointment, getAppointmentStats } = useDeliveryAppointments();

  // Use controlled distance calculation hook
  const { getDistance, isCalculating, hasAppointment, calculateAllDistances, getCalculationInfo } = useControlledDistanceCalculation(vehicles, appointments);

  // Initialize services
  useEffect(() => {
    if (motiveConfig.apiKey) {
      motiveApi.setApiKey(motiveConfig.apiKey);
      console.log('Motive API key set:', motiveConfig.apiKey);
    }
    
    const activeMapConfig = mapConfigs.find(config => config.isActive);
    if (activeMapConfig) {
      mappingApi.setActiveConfig(activeMapConfig);
    }
  }, [motiveConfig, mapConfigs]);

  // Auto-refresh vehicles with proper dependency management
  useEffect(() => {
    if (!motiveConfig.apiKey || !motiveConfig.isActive) {
      console.log('Auto-refresh disabled: API key not configured or not active');
      return;
    }

    console.log(`Setting up auto-refresh with ${systemSettings.refreshInterval} minute interval`);
    
    const interval = setInterval(() => {
      if (connectionStatus === 'connected' && !isRefreshing) {
        console.log('Auto-refreshing vehicles...');
        refreshVehicles();
      } else {
        console.log('Skipping auto-refresh:', { connectionStatus, isRefreshing });
      }
    }, systemSettings.refreshInterval * 60 * 1000);

    return () => {
      console.log('Clearing auto-refresh interval');
      clearInterval(interval);
    };
  }, [systemSettings.refreshInterval, motiveConfig.apiKey, motiveConfig.isActive, connectionStatus, isRefreshing]);

  // Initial connection test and load - only run when API key changes
  useEffect(() => {
    if (motiveConfig.apiKey && motiveConfig.isActive && connectionStatus === 'disconnected') {
      console.log('Running initial connection test...');
      testAndRefresh();
    }
  }, [motiveConfig.apiKey, motiveConfig.isActive]);

  // Apply filtering when vehicles, appointments, or filter changes
  useEffect(() => {
    applyFilters();
  }, [vehicles, appointments, activeFilters, searchTerm, loadNumbers]);

  const applyFilters = useCallback(() => {
    let filtered = [...vehicles];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.truckNumber.toLowerCase().includes(searchLower) ||
        vehicle.id.toLowerCase().includes(searchLower) ||
        (loadNumbers[vehicle.id] && loadNumbers[vehicle.id].toLowerCase().includes(searchLower)) ||
        (vehicle.currentLocation.address && vehicle.currentLocation.address.toLowerCase().includes(searchLower)) ||
        (appointments[vehicle.id] && appointments[vehicle.id].some(apt => 
          apt.location.toLowerCase().includes(searchLower)
        )) ||
        (notes[vehicle.id] && notes[vehicle.id].toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (activeFilters.status !== 'all_status') {
      filtered = filtered.filter(vehicle => {
        switch (activeFilters.status) {
          case 'moving':
            return vehicle.status === 'moving';
          case 'idle':
            return vehicle.status === 'idle';
          case 'stationary':
            return vehicle.status === 'stationary';
          case 'stale':
            return vehicle.status === 'stale';
          default:
            return true;
        }
      });
    }

    // Apply location filter
    if (activeFilters.location !== 'all_locations') {
      filtered = filtered.filter(vehicle => {
        switch (activeFilters.location) {
          case 'with_location':
            return vehicle.currentLocation.lat !== 0 && vehicle.currentLocation.lon !== 0;
          case 'no_location':
            return vehicle.currentLocation.lat === 0 && vehicle.currentLocation.lon === 0;
          case 'partial_coords':
            return (vehicle.currentLocation.lat !== 0 && vehicle.currentLocation.lon === 0) || 
                   (vehicle.currentLocation.lat === 0 && vehicle.currentLocation.lon !== 0);
          default:
            return true;
        }
      });
    }

    // Apply delivery status filter  
    if (activeFilters.delivery !== 'all_deliveries') {
      filtered = filtered.filter(vehicle => {
        const vehicleAppointments = appointments[vehicle.id] || [];
        const deliveryStatus = lateTrackingService.analyzeTruckStatus(
          vehicle, 
          vehicleAppointments, 
          getDistance(vehicle.id)
        );
        
        switch (activeFilters.delivery) {
          case 'late':
            return deliveryStatus.status === 'late';
          case 'at_risk':
            return deliveryStatus.status === 'at_risk';
          case 'on_time':
            return deliveryStatus.status === 'on_time';
          case 'no_appointments':
            return !appointments[vehicle.id] || appointments[vehicle.id].length === 0;
          default:
            return true;
        }
      });
    }

    // Apply load filter
    if (activeFilters.load !== 'all_loads') {
      filtered = filtered.filter(vehicle => {
        switch (activeFilters.load) {
          case 'with_load_numbers':
            return !!loadNumbers[vehicle.id];
          case 'no_load_numbers':
            return !loadNumbers[vehicle.id];
          default:
            return true;
        }
      });
    }

    setFilteredVehicles(filtered);
  }, [vehicles, appointments, activeFilters, searchTerm, loadNumbers, getDistance, notes]);

  const testAndRefresh = async () => {
    if (!motiveConfig.apiKey || isRefreshing) {
      console.log('Skipping test and refresh:', { hasApiKey: !!motiveConfig.apiKey, isRefreshing });
      return;
    }
    
    setConnectionStatus('testing');
    try {
      console.log('Testing Motive API connection...');
      const isConnected = await motiveApi.testConnection();
      if (isConnected) {
        setConnectionStatus('connected');
        console.log('Connection successful, fetching initial vehicle data...');
        await refreshVehicles();
      } else {
        setConnectionStatus('disconnected');
        setError('Failed to connect to Motive API. Please check your API key and try again.');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
      setError(error instanceof Error ? error.message : 'Connection test failed');
    }
  };

  const refreshVehicles = useCallback(async () => {
    if (!motiveConfig.apiKey || isRefreshing) {
      console.log('Skipping refresh:', { hasApiKey: !!motiveConfig.apiKey, isRefreshing });
      return;
    }
    
    console.log('Starting vehicle refresh...');
    setIsRefreshing(true);
    setError(null);
    
    try {
      console.log('Fetching vehicles from Motive API with key:', motiveConfig.apiKey);
      const fetchedVehicles = await motiveApi.getVehiclesWithLocations();
      console.log(`Successfully fetched ${fetchedVehicles.length} vehicles:`, fetchedVehicles);
      
      setVehicles(fetchedVehicles);
      setLastUpdated(new Date());
      setConnectionStatus('connected');
      console.log('Vehicles updated successfully in state');
    } catch (error) {
      console.error('Failed to refresh vehicles:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch vehicles');
      setConnectionStatus('disconnected');
    } finally {
      setIsRefreshing(false);
    }
  }, [motiveConfig.apiKey, isRefreshing]);

  const handleTestConnection = async (type: 'motive' | 'mapping', config: any): Promise<boolean> => {
    try {
      if (type === 'motive') {
        motiveApi.setApiKey(config.apiKey);
        if (config.fleetId) {
          motiveApi.setFleetId(config.fleetId);
        }
        const isValid = await motiveApi.testConnection();
        console.log('Motive API test result:', isValid);
        
        // Update connection status
        setConnectionStatus(isValid ? 'connected' : 'disconnected');
        
        return isValid;
      } else {
        mappingApi.setActiveConfig(config);
        return await mappingApi.testApiConnection();
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      if (type === 'motive') {
        setConnectionStatus('disconnected');
      }
      return false;
    }
  };

  const handleLoadNumberChange = (vehicleId: string, loadNumber: string) => {
    setLoadNumber(vehicleId, loadNumber);
  };

  const handleAppointmentsChange = (vehicleId: string, newAppointments: DeliveryAppointment[]) => {
    setVehicleAppointments(vehicleId, newAppointments);
  };

  const handleFilterChange = (filterType: string, filterValue: string) => {
    if (filterType === 'clear') {
      setActiveFilters({
        status: 'all_status',
        location: 'all_locations',
        delivery: 'all_deliveries',
        load: 'all_loads'
      });
      setSearchTerm('');
    } else {
      setActiveFilters(prev => ({
        ...prev,
        [filterType]: filterValue
      }));
    }
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleNoteChange = (vehicleId: string, note: string) => {
    const updatedNotes = { ...notes };
    if (note.trim()) {
      updatedNotes[vehicleId] = note;
    } else {
      delete updatedNotes[vehicleId];
    }
    setNotes(updatedNotes);
  };

  // Get statistics for display
  const loadNumberStats = getLoadNumberStats();
  const appointmentStats = getAppointmentStats();
  const loadNumberCount = vehicles.filter(v => loadNumbers[v.id]).length;
  const appointmentCount = Object.keys(appointments).length;

  // Get distance calculation info
  const calculationInfo = getCalculationInfo();

  const renderContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setSettingsTab('api')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    settingsTab === 'api'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  API Configuration
                </button>
                <button
                  onClick={() => setSettingsTab('system')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    settingsTab === 'system'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  System Settings
                </button>
              </nav>
            </div>
            
            {settingsTab === 'api' ? (
              <ApiConfigPanel
                motiveConfig={motiveConfig}
                mapConfigs={mapConfigs}
                onMotiveConfigUpdate={setMotiveConfig}
                onMapConfigUpdate={setMapConfigs}
                onTestConnection={handleTestConnection}
              />
            ) : (
              <SystemSettings
                settings={systemSettings}
                onSettingsUpdate={setSystemSettings}
              />
            )}
          </div>
        );
        
      default:
        return (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">
                      Error fetching vehicles: {error}
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={() => setError(null)}
                      className="inline-flex text-red-400 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Status */}
            {connectionStatus !== 'connected' && motiveConfig.apiKey && (
              <div className={`border rounded-lg p-4 ${
                connectionStatus === 'testing' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {connectionStatus === 'testing' ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${
                      connectionStatus === 'testing' ? 'text-blue-800' : 'text-yellow-800'
                    }`}>
                      {connectionStatus === 'testing' 
                        ? 'Testing connection to Motive API...'
                        : 'Not connected to Motive API. Check your settings and try refreshing.'
                      }
                    </p>
                  </div>
                  {connectionStatus === 'disconnected' && (
                    <div className="ml-auto pl-3">
                      <button
                        onClick={testAndRefresh}
                        disabled={isRefreshing}
                        className="inline-flex items-center px-3 py-1 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 bg-white hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Retry Connection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* API Configuration Notice */}
            {!motiveConfig.apiKey && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Settings className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      Configure your Motive API key in Settings to start tracking vehicles.
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
                    >
                      Configure Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Filters */}
            {vehicles.length > 0 && (
              <OptimizedVehicleFilters
                vehicles={vehicles}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                loadNumbers={loadNumbers}
                appointments={appointments}
                getDeliveryStatus={(vehicleId) => {
                  const vehicleAppointments = appointments[vehicleId] || [];
                  return lateTrackingService.analyzeTruckStatus(
                    vehicles.find(v => v.id === vehicleId) as Vehicle,
                    vehicleAppointments,
                    getDistance(vehicleId)
                  );
                }}
                notes={notes}
              />
            )}

            {/* Distance Calculation Controls */}
            {vehicles.length > 0 && (
              <DistanceControls
                onCalculateDistances={calculateAllDistances}
                isCalculating={isCalculating}
                lastCalculationTime={calculationInfo.lastCalculationTime}
                nextCalculationTime={calculationInfo.nextCalculationTime}
                apiCallsUsed={calculationInfo.apiCallsUsed}
                cacheHitRate={calculationInfo.cacheHitRate}
                usageWarning={calculationInfo.usageWarning}
              />
            )}

            {/* Feature Statistics */}
            {vehicles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-emerald-800">
                        {loadNumberCount} load numbers assigned • 
                        Manual tracking enabled
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-purple-800">
                        {appointmentCount} vehicles with appointments • 
                        Late tracking enabled
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        All times displayed in Eastern Time (EST/EDT)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <StatsCards 
              vehicles={filteredVehicles} 
              destinationCount={0}
              loadNumberCount={filteredVehicles.filter(v => loadNumbers[v.id]).length}
              appointmentCount={filteredVehicles.filter(v => appointments[v.id] && appointments[v.id].length > 0).length}
              lateCount={lateTrackingService.getFilterCategories(filteredVehicles, appointments, getDistance).late.length}
              atRiskCount={lateTrackingService.getFilterCategories(filteredVehicles, appointments, getDistance).at_risk.length}
            />
            <VehicleTable 
              vehicles={filteredVehicles} 
              isRefreshing={isRefreshing}
              loadNumbers={loadNumbers}
              onLoadNumberChange={handleLoadNumberChange}
              getDistance={getDistance}
              isCalculatingDistance={isCalculating}
              hasAppointment={hasAppointment}
              appointments={appointments}
              onAppointmentsChange={handleAppointmentsChange}
              getNextAppointment={getNextAppointment}
              notes={notes}
              onNoteChange={handleNoteChange}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onRefresh={refreshVehicles}
        onSettingsClick={() => setActiveTab('settings')}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        connectionStatus={connectionStatus}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs - Only Dashboard and Settings */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        {renderContent()}
      </main>
    </div>
  );
}

export default App;