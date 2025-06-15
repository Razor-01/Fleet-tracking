import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Layout/Header';
import { StatsCards } from './components/Dashboard/StatsCards';
import { VehicleTable } from './components/Dashboard/VehicleTable';
import { ApiConfigPanel } from './components/Settings/ApiConfigPanel';
import { SystemSettings } from './components/Settings/SystemSettings';
import { DeliveryAddressForm } from './components/DeliveryManager/DeliveryAddressForm';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDestinations } from './hooks/useDestinations';
import { useDistanceCalculation } from './hooks/useDistanceCalculation';
import { motiveApi } from './services/motiveApi';
import { mappingApi } from './services/mappingApi';
import { DestinationData } from './components/Dashboard/EditableDestination';
import { 
  Vehicle, 
  APIConfig, 
  MotiveConfig, 
  SystemSettings as SystemSettingsType,
  DeliveryDestination,
  MapProvider
} from './types';
import { Settings, Truck, MapPin, X, AlertCircle } from 'lucide-react';

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
  const [motiveConfig, setMotiveConfig] = useLocalStorage<MotiveConfig>('motiveConfig', DEFAULT_MOTIVE_CONFIG);
  const [mapConfigs, setMapConfigs] = useLocalStorage<APIConfig[]>('mapConfigs', []);
  const [systemSettings, setSystemSettings] = useLocalStorage<SystemSettingsType>('systemSettings', DEFAULT_SYSTEM_SETTINGS);
  const [deliveryDestinations, setDeliveryDestinations] = useLocalStorage<DeliveryDestination[]>('deliveryDestinations', []);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'deliveries'>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'api' | 'system'>('api');
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');

  // Use destination management hook
  const { destinations, setDestination, getDestination, getDestinationStats } = useDestinations();

  // Use distance calculation hook
  const { getDistance, isCalculating, hasDestination } = useDistanceCalculation(vehicles, destinations);

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
      
      // Update vehicles without distance calculation (handled by useDistanceCalculation hook)
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

  const handleDestinationAdd = async (destination: Omit<DeliveryDestination, 'id' | 'createdAt'>) => {
    try {
      // Geocode the address
      const geocodeResult = await mappingApi.geocodeAddress(destination.address);
      
      if (geocodeResult) {
        const newDestination: DeliveryDestination = {
          id: Date.now().toString(),
          address: destination.address,
          coordinates: {
            lat: geocodeResult.lat,
            lon: geocodeResult.lon
          },
          truckNumber: destination.truckNumber,
          createdAt: new Date()
        };
        
        setDeliveryDestinations(prev => [...prev, newDestination]);
      } else {
        alert('Failed to geocode address. Please check the address and try again.');
      }
    } catch (error) {
      console.error('Failed to add destination:', error);
      alert('Failed to add destination. Please try again.');
    }
  };

  const handleDestinationRemove = (id: string) => {
    setDeliveryDestinations(prev => prev.filter(d => d.id !== id));
  };

  const handleDestinationChange = (vehicleId: string, destinationData: DestinationData | null) => {
    setDestination(vehicleId, destinationData);
  };

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
        
      case 'deliveries':
        return (
          <DeliveryAddressForm
            destinations={deliveryDestinations}
            onDestinationAdd={handleDestinationAdd}
            onDestinationRemove={handleDestinationRemove}
          />
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
                        className="inline-flex items-center px-3 py-1 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 bg-white hover:bg-yellow-50 disabled:opacity-50"
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

            {/* Destination Statistics */}
            {vehicles.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MapPin className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">
                      {getDestinationStats().total} destinations configured • 
                      Mapbox distance calculation enabled
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <StatsCards vehicles={vehicles} />
            <VehicleTable 
              vehicles={vehicles} 
              isRefreshing={isRefreshing}
              destinations={destinations}
              onDestinationChange={handleDestinationChange}
              getDistance={getDistance}
              isCalculatingDistance={isCalculating}
              hasDestination={hasDestination}
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
        {/* Navigation Tabs */}
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
                onClick={() => setActiveTab('deliveries')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'deliveries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Deliveries</span>
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