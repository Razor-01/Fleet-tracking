import React from 'react';
import { Truck, Settings, RefreshCw, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { mapboxService } from '../../services/mapboxService';

interface HeaderProps {
  onRefresh?: () => void;
  onSettingsClick?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
  connectionStatus?: 'connected' | 'disconnected' | 'testing';
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onSettingsClick,
  isRefreshing = false,
  lastUpdated,
  connectionStatus = 'disconnected'
}) => {
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'testing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'testing':
        return 'Connecting...';
      default:
        return 'Disconnected';
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'testing':
        return 'text-blue-600';
      default:
        return 'text-red-600';
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return mapboxService.formatEasternTime(lastUpdated);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Fleet Tracker</h1>
              <p className="text-sm text-gray-500">Real-time vehicle monitoring (Eastern Time)</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {getConnectionIcon()}
              <span className={`text-sm font-medium ${getConnectionColor()}`}>
                {getConnectionText()}
              </span>
            </div>

            {lastUpdated && (
              <div className="text-sm text-gray-500">
                Last updated: {formatLastUpdated()}
              </div>
            )}
            
            <button
              onClick={onRefresh}
              disabled={isRefreshing || connectionStatus === 'testing'}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={onSettingsClick}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};