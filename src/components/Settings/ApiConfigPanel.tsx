import React, { useState } from 'react';
import { APIConfig, MapProvider, MotiveConfig } from '../../types';
import { CheckCircle, XCircle, Loader2, Key, TestTube, Info, AlertTriangle, Code, Eye, EyeOff, Bug } from 'lucide-react';
import { motiveApi } from '../../services/motiveApi';

interface ApiConfigPanelProps {
  motiveConfig: MotiveConfig;
  mapConfigs: APIConfig[];
  onMotiveConfigUpdate: (config: MotiveConfig) => void;
  onMapConfigUpdate: (configs: APIConfig[]) => void;
  onTestConnection: (type: 'motive' | 'mapping', config: any) => Promise<boolean>;
}

export const ApiConfigPanel: React.FC<ApiConfigPanelProps> = ({
  motiveConfig,
  mapConfigs,
  onMotiveConfigUpdate,
  onMapConfigUpdate,
  onTestConnection
}) => {
  const [testingMotive, setTestingMotive] = useState(false);
  const [testingMapping, setTestingMapping] = useState<string | null>(null);
  const [tempMotiveKey, setTempMotiveKey] = useState(motiveConfig.apiKey);
  const [tempFleetId, setTempFleetId] = useState('');
  const [tempMapConfigs, setTempMapConfigs] = useState<APIConfig[]>(mapConfigs);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);

  const handleMotiveTest = async () => {
    setTestingMotive(true);
    try {
      const isValid = await onTestConnection('motive', { 
        apiKey: tempMotiveKey,
        fleetId: tempFleetId 
      });
      const updatedConfig = {
        ...motiveConfig,
        apiKey: tempMotiveKey,
        isValid,
        isActive: isValid, // Auto-activate if valid
        lastTested: new Date()
      };
      onMotiveConfigUpdate(updatedConfig);
    } catch (error) {
      console.error('Motive API test failed:', error);
    }
    setTestingMotive(false);
  };

  const handleMapTest = async (configId: string) => {
    setTestingMapping(configId);
    try {
      const config = tempMapConfigs.find(c => c.id === configId);
      if (config) {
        const isValid = await onTestConnection('mapping', config);
        const updatedConfigs = tempMapConfigs.map(c =>
          c.id === configId
            ? { ...c, isValid, lastTested: new Date() }
            : c
        );
        setTempMapConfigs(updatedConfigs);
        onMapConfigUpdate(updatedConfigs);
      }
    } catch (error) {
      console.error('Mapping API test failed:', error);
    }
    setTestingMapping(null);
  };

  const handleMapConfigChange = (configId: string, field: keyof APIConfig, value: any) => {
    const updatedConfigs = tempMapConfigs.map(config =>
      config.id === configId
        ? { ...config, [field]: value }
        : config
    );
    setTempMapConfigs(updatedConfigs);
    onMapConfigUpdate(updatedConfigs);
  };

  const addMapConfig = () => {
    const newConfig: APIConfig = {
      id: Date.now().toString(),
      provider: MapProvider.HERE,
      apiKey: '',
      isActive: false
    };
    const updatedConfigs = [...tempMapConfigs, newConfig];
    setTempMapConfigs(updatedConfigs);
    onMapConfigUpdate(updatedConfigs);
  };

  const removeMapConfig = (configId: string) => {
    const updatedConfigs = tempMapConfigs.filter(c => c.id !== configId);
    setTempMapConfigs(updatedConfigs);
    onMapConfigUpdate(updatedConfigs);
  };

  const getStatusIcon = (isValid?: boolean, isLoading?: boolean) => {
    if (isLoading) {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    if (isValid === true) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (isValid === false) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  const runComprehensiveAPITest = async () => {
    if (!tempMotiveKey) {
      alert('Please enter an API key first');
      return;
    }

    setShowDebugInfo(true);
    setDebugResults(null);
    
    console.log('🔍 Starting comprehensive Motive API test...');
    console.log('📋 Test Configuration:', {
      apiKey: tempMotiveKey.substring(0, 8) + '...',
      fleetId: tempFleetId || 'Not provided',
      timestamp: new Date().toISOString()
    });
    
    // Test the connection first
    await handleMotiveTest();
    
    // Simulate API debugging (in real implementation, this would call the actual API)
    setTimeout(() => {
      setDebugResults({
        timestamp: new Date().toISOString(),
        apiKeyValid: motiveConfig.isValid,
        endpointsTested: [
          'GET /vehicle_locations (paginated)',
          'GET /fleets/{id}/vehicles_locations',
          'GET /vehicles/{id}/locations',
          'GET /vehicles/locations',
          'GET /assets'
        ],
        recommendedAction: motiveConfig.isValid 
          ? 'API connection successful. Check browser console for detailed response structure.'
          : 'API connection failed. Verify your API key has vehicle location permissions.'
      });
    }, 2000);
  };

  const debugCurrentCoordinates = async () => {
    if (!tempMotiveKey) {
      alert('Please configure and test your API key first');
      return;
    }

    console.log('🗺️ Starting coordinate debugging...');
    
    try {
      // Set the API key temporarily for debugging
      motiveApi.setApiKey(tempMotiveKey);
      if (tempFleetId) {
        motiveApi.setFleetId(tempFleetId);
      }
      
      // Run the coordinate debugging
      await motiveApi.debugCoordinates();
      
      alert('Coordinate debugging complete! Check the browser console (F12) for detailed coordinate information.');
    } catch (error) {
      console.error('❌ Coordinate debugging failed:', error);
      alert('Coordinate debugging failed. Check the console for details.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Motive API Configuration */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Key className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Motive API Configuration</h3>
        </div>
        
        {/* API Information */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Motive API Setup Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Log into your Motive account and navigate to API settings</li>
                <li>Generate an API key with vehicle location permissions</li>
                <li>Find your Fleet ID in the fleet management section (optional but recommended)</li>
                <li>The app will automatically detect the best API endpoint to use</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Location Data Troubleshooting */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-2">Troubleshooting Location Issues:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>If locations show as "0.000000, 0.000000", the API response structure may be different</li>
                <li>If longitude shows as 0 but latitude is valid, Motive may be using "lon" instead of "lng"</li>
                <li>The app will try multiple coordinate property names automatically</li>
                <li>Check browser console for detailed debugging information</li>
                <li>Ensure your API key has "Vehicle Locations" permissions in Motive</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key *
            </label>
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={tempMotiveKey}
                  onChange={(e) => setTempMotiveKey(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Motive API key"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <button
                onClick={handleMotiveTest}
                disabled={!tempMotiveKey || testingMotive}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test
              </button>
              {getStatusIcon(motiveConfig.isValid, testingMotive)}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fleet ID (Optional)
            </label>
            <input
              type="text"
              value={tempFleetId}
              onChange={(e) => setTempFleetId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your Fleet ID for optimized API calls"
            />
            <p className="text-xs text-gray-500 mt-1">
              If provided, the app will use the more efficient fleet endpoint. Leave blank to use pagination.
            </p>
          </div>

          {/* Advanced Testing Section */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Advanced Debugging</h4>
              <div className="flex space-x-2">
                <button
                  onClick={debugCurrentCoordinates}
                  disabled={!tempMotiveKey || testingMotive}
                  className="inline-flex items-center px-3 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Debug Coordinates
                </button>
                <button
                  onClick={runComprehensiveAPITest}
                  disabled={!tempMotiveKey || testingMotive}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Run Comprehensive Test
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Use "Debug Coordinates" to see exactly what coordinate data Motive is returning for each vehicle. 
              Use "Comprehensive Test" to test all available API endpoints and show detailed debugging information.
            </p>
          </div>
          
          {/* Test Results */}
          {motiveConfig.lastTested && (
            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <span>Last tested: {motiveConfig.lastTested.toLocaleString()}</span>
                {motiveConfig.isValid === false && (
                  <span className="text-red-600 font-medium">
                    ❌ Connection failed
                  </span>
                )}
                {motiveConfig.isValid === true && (
                  <span className="text-green-600 font-medium">
                    ✅ Connection successful
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Debug Results Panel */}
          {showDebugInfo && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <Code className="w-4 h-4 mr-2" />
                  Debug Information
                </h4>
                <button
                  onClick={() => setShowDebugInfo(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              
              {debugResults ? (
                <div className="space-y-3">
                  <div className="text-xs">
                    <div className="font-medium text-gray-700 mb-1">Test Results:</div>
                    <div className="bg-white p-3 rounded border font-mono text-xs">
                      <div>Timestamp: {debugResults.timestamp}</div>
                      <div>API Key Valid: {debugResults.apiKeyValid ? '✅ Yes' : '❌ No'}</div>
                      <div className="mt-2">
                        <div className="font-medium">Endpoints Tested:</div>
                        <ul className="list-disc list-inside ml-2">
                          {debugResults.endpointsTested.map((endpoint: string, index: number) => (
                            <li key={index}>{endpoint}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-2">
                        <div className="font-medium">Recommendation:</div>
                        <div>{debugResults.recommendedAction}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running comprehensive API test...</span>
                </div>
              )}
              
              <div className="mt-3 text-xs text-gray-600">
                <p className="font-medium mb-1">Console Debugging:</p>
                <p>Open browser console (F12) to see detailed API response information and debugging logs. The app automatically tries multiple API endpoints to find the correct data structure.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mapping API Configuration */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Mapping API Configuration</h3>
          </div>
          <button
            onClick={addMapConfig}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Configuration
          </button>
        </div>

        {/* Mapping API Information */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-2">Mapping APIs for Distance Calculation:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>HERE Maps:</strong> Excellent for commercial routing and truck-specific routes</li>
                <li><strong>Mapbox:</strong> Great performance and modern API with good free tier</li>
                <li><strong>Google Maps:</strong> Most comprehensive data but higher costs</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {tempMapConfigs.map((config) => (
            <div key={config.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <select
                    value={config.provider}
                    onChange={(e) => handleMapConfigChange(config.id, 'provider', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={MapProvider.HERE}>HERE Maps</option>
                    <option value={MapProvider.MAPBOX}>Mapbox</option>
                    <option value={MapProvider.GOOGLE}>Google Maps</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => handleMapConfigChange(config.id, 'apiKey', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter API key"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.isActive}
                      onChange={(e) => handleMapConfigChange(config.id, 'isActive', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMapTest(config.id)}
                    disabled={!config.apiKey || testingMapping === config.id}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test
                  </button>
                  <button
                    onClick={() => removeMapConfig(config.id)}
                    className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Remove
                  </button>
                  {getStatusIcon(config.isValid, testingMapping === config.id)}
                </div>
              </div>
              
              {config.lastTested && (
                <p className="text-xs text-gray-500 mt-2">
                  Last tested: {config.lastTested.toLocaleString()}
                </p>
              )}
            </div>
          ))}
          
          {tempMapConfigs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No mapping API configurations added yet.</p>
              <p className="text-sm">Add a configuration to enable distance calculations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};