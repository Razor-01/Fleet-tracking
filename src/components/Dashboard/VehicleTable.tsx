import React from 'react';
import { Vehicle } from '../../types';
import { VehicleStatusBadge } from './VehicleStatusBadge';
import { EditableLoadNumber } from './EditableLoadNumber';
import { DistanceDisplay } from './DistanceDisplay';
import { MultipleDeliveryAppointments } from '../DeliveryManager/MultipleDeliveryAppointments';
import { DeliveryStatusDisplay } from './DeliveryStatusDisplay';
import { mapboxService } from '../../services/mapboxService';
import { lateTrackingService } from '../../services/lateTrackingService';
import { DeliveryAppointment } from '../../services/deliveryAppointmentsService';
import { Truck, MapPin, Clock, Route, RefreshCw, AlertTriangle, CheckCircle, Bug, FileText, Calendar } from 'lucide-react';

interface VehicleTableProps {
  vehicles: Vehicle[];
  onVehicleClick?: (vehicle: Vehicle) => void;
  isRefreshing?: boolean;
  loadNumbers: Record<string, string>;
  onLoadNumberChange: (vehicleId: string, loadNumber: string) => void;
  getDistance: (vehicleId: string) => any;
  isCalculatingDistance: boolean;
  hasAppointment: (vehicleId: string) => boolean;
  appointments: Record<string, DeliveryAppointment[]>;
  onAppointmentsChange: (vehicleId: string, appointments: DeliveryAppointment[]) => void;
  getNextAppointment: (vehicleId: string) => DeliveryAppointment | null;
}

export const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  onVehicleClick,
  isRefreshing = false,
  loadNumbers,
  onLoadNumberChange,
  getDistance,
  isCalculatingDistance,
  hasAppointment,
  appointments,
  onAppointmentsChange,
  getNextAppointment
}) => {
  const formatDistance = (distance?: number) => {
    if (distance === undefined) return 'N/A';
    return `${distance.toFixed(2)} mi`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatSpeed = (speed: number) => {
    return `${speed.toFixed(1)} mph`;
  };

  const formatLocation = (location: { lat: number; lon: number; address?: string }) => {
    // Check if we have valid coordinates
    const hasValidCoords = location.lat !== 0 || location.lon !== 0;
    
    if (location.address && location.address !== `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` && location.address !== 'Location unavailable') {
      return location.address;
    }
    
    if (hasValidCoords) {
      return `${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}`;
    }
    
    return 'Location unavailable';
  };

  const isValidLocation = (location: { lat: number; lon: number }) => {
    return location.lat !== 0 && location.lon !== 0 && 
           location.lat >= -90 && location.lat <= 90 && 
           location.lon >= -180 && location.lon <= 180;
  };

  const getLocationStatus = (location: { lat: number; lon: number }) => {
    const hasLat = location.lat !== 0;
    const hasLon = location.lon !== 0;
    
    if (hasLat && hasLon && isValidLocation(location)) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        text: 'Valid location',
        color: 'text-green-600'
      };
    } else if (hasLat && !hasLon) {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
        text: 'Missing longitude',
        color: 'text-orange-600'
      };
    } else if (!hasLat && hasLon) {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
        text: 'Missing latitude',
        color: 'text-orange-600'
      };
    } else {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
        text: 'No location data',
        color: 'text-red-600'
      };
    }
  };

  const formatCoordinateDisplay = (location: { lat: number; lon: number }) => {
    const hasLat = location.lat !== 0;
    const hasLon = location.lon !== 0;
    
    if (hasLat && hasLon) {
      return `${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}`;
    } else if (hasLat && !hasLon) {
      return `${location.lat.toFixed(6)}, ⚠️ Missing longitude`;
    } else if (!hasLat && hasLon) {
      return `⚠️ Missing latitude, ${location.lon.toFixed(6)}`;
    } else {
      return '⚠️ No coordinates available';
    }
  };

  const getDeliveryStatus = (vehicleId: string) => {
    const vehicleAppointments = appointments[vehicleId] || [];
    const distance = getDistance(vehicleId);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) return { status: 'no_data' as const, message: 'Vehicle not found', severity: 'low' as const };
    
    return lateTrackingService.analyzeTruckStatus(vehicle, vehicleAppointments, distance);
  };

  const debugCoordinates = () => {
    console.group('🗺️ COORDINATE DEBUG - Current Vehicle Data');
    vehicles.forEach((vehicle, index) => {
      const { lat, lon } = vehicle.currentLocation;
      const isValid = isValidLocation(vehicle.currentLocation);
      const status = getLocationStatus(vehicle.currentLocation);
      
      console.log(`${index + 1}. ${vehicle.truckNumber}:`, {
        coordinates: `${lat}, ${lon}`,
        isValid,
        status: status.text,
        hasLatitude: lat !== 0,
        hasLongitude: lon !== 0,
        latitudeRange: lat >= -90 && lat <= 90,
        longitudeRange: lon >= -180 && lon <= 180,
        address: vehicle.currentLocation.address,
        hasAppointment: hasAppointment(vehicle.id),
        loadNumber: loadNumbers[vehicle.id],
        distance: getDistance(vehicle.id),
        appointments: appointments[vehicle.id]?.length || 0,
        nextAppointment: getNextAppointment(vehicle.id),
        deliveryStatus: getDeliveryStatus(vehicle.id)
      });
    });
    console.groupEnd();
  };

  if (isRefreshing && vehicles.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading vehicles...</h3>
          <p className="text-gray-500">Fetching data from Motive API</p>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8">
        <div className="text-center">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-500 mb-4">
            No vehicles match the current filter criteria.
          </p>
        </div>
      </div>
    );
  }

  // Count vehicles with different location statuses
  const validLocationCount = vehicles.filter(v => isValidLocation(v.currentLocation)).length;
  const partialLocationCount = vehicles.filter(v => 
    (v.currentLocation.lat !== 0 && v.currentLocation.lon === 0) || 
    (v.currentLocation.lat === 0 && v.currentLocation.lon !== 0)
  ).length;
  const noLocationCount = vehicles.filter(v => 
    v.currentLocation.lat === 0 && v.currentLocation.lon === 0
  ).length;

  // Count vehicles with load numbers and appointments
  const loadNumberCount = vehicles.filter(v => loadNumbers[v.id]).length;
  const appointmentCount = vehicles.filter(v => appointments[v.id]?.length > 0).length;

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Fleet Status</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600">{validLocationCount} valid locations</span>
            </div>
            {partialLocationCount > 0 && (
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-orange-600">{partialLocationCount} partial coordinates</span>
              </div>
            )}
            {noLocationCount > 0 && (
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-red-600">{noLocationCount} no location</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4 text-green-500" />
              <span className="text-green-600">{loadNumberCount} with load numbers</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-purple-600">{appointmentCount} with appointments</span>
            </div>
            <div className="text-gray-500">
              {vehicles.length} total
            </div>
            <button
              onClick={debugCoordinates}
              className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
              title="Debug coordinates in console"
            >
              <Bug className="w-3 h-3 mr-1" />
              Debug
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Load Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Speed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Appointments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Distance & ETA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Update
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.map((vehicle) => {
              const locationStatus = getLocationStatus(vehicle.currentLocation);
              const hasPartialCoords = (vehicle.currentLocation.lat !== 0 && vehicle.currentLocation.lon === 0) || 
                                     (vehicle.currentLocation.lat === 0 && vehicle.currentLocation.lon !== 0);
              const deliveryStatus = getDeliveryStatus(vehicle.id);
              const nextAppointment = getNextAppointment(vehicle.id);
              
              return (
                <tr
                  key={vehicle.id}
                  onClick={() => onVehicleClick?.(vehicle)}
                  className={`hover:bg-gray-50 transition-colors ${
                    onVehicleClick ? 'cursor-pointer' : ''
                  } ${
                    !isValidLocation(vehicle.currentLocation) 
                      ? hasPartialCoords 
                        ? 'bg-orange-50' 
                        : 'bg-red-50' 
                      : ''
                  } ${
                    deliveryStatus.status === 'late' ? 'border-l-4 border-red-500' :
                    deliveryStatus.status === 'at_risk' ? 'border-l-4 border-orange-500' :
                    deliveryStatus.status === 'on_time' ? 'border-l-4 border-green-500' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.truckNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {vehicle.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <EditableLoadNumber
                      vehicleId={vehicle.id}
                      vehicleName={vehicle.truckNumber}
                      initialLoadNumber={loadNumbers[vehicle.id]}
                      onLoadNumberChange={onLoadNumberChange}
                      className="min-w-0"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <VehicleStatusBadge status={vehicle.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {locationStatus.icon}
                      </div>
                      <div className="text-sm max-w-xs">
                        <div className={`truncate ${
                          !isValidLocation(vehicle.currentLocation) 
                            ? hasPartialCoords 
                              ? 'text-orange-600 font-medium' 
                              : 'text-red-600 font-medium'
                            : 'text-gray-900'
                        }`}>
                          {formatLocation(vehicle.currentLocation)}
                        </div>
                        <div className={`text-xs mt-1 ${
                          !isValidLocation(vehicle.currentLocation) 
                            ? hasPartialCoords 
                              ? 'text-orange-500' 
                              : 'text-red-500'
                            : 'text-gray-500'
                        }`}>
                          {formatCoordinateDisplay(vehicle.currentLocation)}
                        </div>
                        {!isValidLocation(vehicle.currentLocation) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {locationStatus.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <span>{formatSpeed(vehicle.speed)}</span>
                      {vehicle.speed > 0 && (
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <MultipleDeliveryAppointments
                      vehicleId={vehicle.id}
                      vehicleName={vehicle.truckNumber}
                      onAppointmentsChange={onAppointmentsChange}
                      className="min-w-0"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <DistanceDisplay
                      distance={getDistance(vehicle.id)}
                      isCalculating={isCalculatingDistance}
                      hasDestination={hasAppointment(vehicle.id)}
                      className="min-w-0"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <DeliveryStatusDisplay
                      analysis={deliveryStatus}
                      nextAppointment={nextAppointment}
                      className="min-w-0"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-900">
                          {formatTimeAgo(vehicle.lastUpdate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {mapboxService.formatEasternTime(vehicle.lastUpdate)}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Summary Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {vehicles.length} vehicles • {validLocationCount} with valid locations
            {partialLocationCount > 0 && ` • ${partialLocationCount} with partial coordinates`}
            {loadNumberCount > 0 && ` • ${loadNumberCount} with load numbers`}
            {appointmentCount > 0 && ` • ${appointmentCount} with appointments`}
          </div>
          <div>
            Last refreshed: {mapboxService.getCurrentEasternTime()}
          </div>
        </div>
        {(partialLocationCount > 0 || noLocationCount > 0) && (
          <div className="mt-2 text-xs">
            {partialLocationCount > 0 && (
              <div className="text-orange-600">
                ⚠️ {partialLocationCount} vehicles have partial coordinate data (latitude OR longitude missing).
              </div>
            )}
            {noLocationCount > 0 && (
              <div className="text-red-600">
                ❌ {noLocationCount} vehicles have no location data. Check browser console for API debugging information.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};