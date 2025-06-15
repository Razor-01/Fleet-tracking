import React from 'react';
import { MapPin, Clock, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

interface DistanceControlsProps {
  onCalculateDistances: () => Promise<void>;
  isCalculating: boolean;
  lastCalculationTime: string;
  nextCalculationTime: string;
  apiCallsUsed: number;
  cacheHitRate: string;
  usageWarning?: string | null;
  className?: string;
}

export const DistanceControls: React.FC<DistanceControlsProps> = ({
  onCalculateDistances,
  isCalculating,
  lastCalculationTime,
  nextCalculationTime,
  apiCallsUsed,
  cacheHitRate,
  usageWarning,
  className = ''
}) => {
  return (
    <div className={`distance-controls ${className}`}>
      {/* Usage Warning */}
      {usageWarning && (
        <div className="usage-warning bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-800">{usageWarning}</span>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className="controls-header bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Distance Calculation</span>
          </h3>
          
          <button 
            onClick={onCalculateDistances}
            disabled={isCalculating}
            className={`calculate-distances-btn inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              isCalculating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
            title="Manually calculate distances now"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Calculating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Calculate Now
              </>
            )}
          </button>
        </div>

        {/* Status Information */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="status-item">
            <div className="flex items-center space-x-1 text-gray-500 mb-1">
              <Clock className="w-3 h-3" />
              <span className="text-xs">Last Updated</span>
            </div>
            <div className="font-medium text-gray-900">{lastCalculationTime}</div>
          </div>

          <div className="status-item">
            <div className="flex items-center space-x-1 text-gray-500 mb-1">
              <Clock className="w-3 h-3" />
              <span className="text-xs">Next Auto</span>
            </div>
            <div className="font-medium text-blue-600">{nextCalculationTime}</div>
          </div>

          <div className="status-item">
            <div className="flex items-center space-x-1 text-gray-500 mb-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">API Calls</span>
            </div>
            <div className="font-medium text-gray-900">{apiCallsUsed.toLocaleString()}</div>
          </div>

          <div className="status-item">
            <div className="flex items-center space-x-1 text-gray-500 mb-1">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">Cache Hit Rate</span>
            </div>
            <div className="font-medium text-green-600">{cacheHitRate}</div>
          </div>
        </div>

        {/* Auto-calculation Info */}
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-800">
              Auto-calculation every 30 minutes to conserve API usage
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};