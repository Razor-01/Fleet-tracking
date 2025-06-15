import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Check, X, Loader2, Trash2 } from 'lucide-react';
import { mapboxService } from '../../services/mapboxService';

interface EditableDestinationProps {
  vehicleId: string;
  vehicleName: string;
  initialDestination?: string;
  onDestinationChange: (vehicleId: string, destination: DestinationData | null) => void;
  className?: string;
}

export interface DestinationData {
  address: string;
  coordinates: { lat: number; lng: number };
  formattedAddress: string;
}

export const EditableDestination: React.FC<EditableDestinationProps> = ({
  vehicleId,
  vehicleName,
  initialDestination,
  onDestinationChange,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [destination, setDestination] = useState(initialDestination || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedDestination = destination.trim();
    
    if (!trimmedDestination) {
      // Remove destination if empty
      onDestinationChange(vehicleId, null);
      setIsEditing(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log(`🎯 Setting destination for ${vehicleName}: ${trimmedDestination}`);
      
      // Geocode the address
      const geocoded = await mapboxService.geocodeAddress(trimmedDestination);
      
      const destinationData: DestinationData = {
        address: trimmedDestination,
        coordinates: { lat: geocoded.lat, lng: geocoded.lng },
        formattedAddress: geocoded.formattedAddress
      };

      // Notify parent component
      onDestinationChange(vehicleId, destinationData);

      // Update display with formatted address
      setDestination(geocoded.formattedAddress);
      setIsEditing(false);
      
      console.log(`✅ Destination set for ${vehicleName}:`, destinationData);
    } catch (err) {
      setError('Invalid address. Please try again.');
      console.error('❌ Geocoding error for', vehicleName, ':', err);
      // Keep editing mode open on error
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDestination(initialDestination || '');
    setIsEditing(false);
    setError('');
  };

  const handleRemove = () => {
    setDestination('');
    onDestinationChange(vehicleId, null);
    setIsEditing(false);
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`destination-editor ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter destination address..."
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            {loading && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleSave}
              disabled={loading}
              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded disabled:opacity-50"
              title="Save destination"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded disabled:opacity-50"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
            {initialDestination && (
              <button
                onClick={handleRemove}
                disabled={loading}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
                title="Remove destination"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-1 text-xs text-red-600">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="mt-1 text-xs text-blue-600">
            🔍 Geocoding address...
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`destination-display cursor-pointer group ${className}`}
      onClick={() => setIsEditing(true)}
      title="Click to edit destination"
    >
      <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors">
        <MapPin className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
        <span className={`text-sm ${destination ? 'text-gray-900' : 'text-gray-500'}`}>
          {destination || 'Set destination'}
        </span>
      </div>
    </div>
  );
};