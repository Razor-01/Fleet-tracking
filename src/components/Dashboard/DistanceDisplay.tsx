import React from 'react';
import { Route, Clock, Navigation, Loader2, AlertTriangle } from 'lucide-react';

interface DistanceDisplayProps {
  distance?: {
    distanceMiles: string;
    distanceKm: string;
    durationHours: number;
    durationMinutes: number;
    eta: string;
    error?: string;
  };
  isCalculating?: boolean;
  hasDestination?: boolean;
  className?: string;
}

export const DistanceDisplay: React.FC<DistanceDisplayProps> = ({
  distance,
  isCalculating = false,
  hasDestination = false,
  className = ''
}) => {
  if (!hasDestination) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        <div className="text-sm">-</div>
        <div className="text-xs">No destination</div>
      </div>
    );
  }

  if (isCalculating) {
    return (
      <div className={`text-center text-blue-600 ${className}`}>
        <div className="flex items-center justify-center space-x-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Calculating...</span>
        </div>
      </div>
    );
  }

  if (!distance) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        <div className="text-sm">-</div>
        <div className="text-xs">No data</div>
      </div>
    );
  }

  if (distance.error) {
    return (
      <div className={`text-center text-red-600 ${className}`}>
        <div className="flex items-center justify-center space-x-1">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Error</span>
        </div>
        <div className="text-xs">Calculation failed</div>
      </div>
    );
  }

  const formatDuration = () => {
    if (distance.durationHours > 0) {
      return `${distance.durationHours}h ${distance.durationMinutes}m`;
    } else {
      return `${distance.durationMinutes}m`;
    }
  };

  return (
    <div className={`text-center ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center justify-center space-x-1">
          <Route className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-600">
            {distance.distanceMiles} mi
          </span>
        </div>
        
        <div className="flex items-center justify-center space-x-1">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-600">
            {formatDuration()}
          </span>
        </div>
        
        <div className="flex items-center justify-center space-x-1">
          <Navigation className="w-3 h-3 text-green-500" />
          <span className="text-xs text-green-600">
            ETA {distance.eta}
          </span>
        </div>
      </div>
    </div>
  );
};