import React, { useState } from 'react';
import { DeliveryDestination } from '../../types';
import { MapPin, Plus, Trash2 } from 'lucide-react';

interface DeliveryAddressFormProps {
  destinations: DeliveryDestination[];
  onDestinationAdd: (destination: Omit<DeliveryDestination, 'id' | 'createdAt'>) => void;
  onDestinationRemove: (id: string) => void;
}

export const DeliveryAddressForm: React.FC<DeliveryAddressFormProps> = ({
  destinations,
  onDestinationAdd,
  onDestinationRemove
}) => {
  const [newDestination, setNewDestination] = useState({
    address: '',
    truckNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDestination.address && newDestination.truckNumber) {
      onDestinationAdd({
        address: newDestination.address,
        coordinates: { lat: 0, lon: 0 }, // Will be geocoded
        truckNumber: newDestination.truckNumber
      });
      setNewDestination({ address: '', truckNumber: '' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Destination Form */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Add Delivery Destination</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Truck Number
              </label>
              <input
                type="text"
                value={newDestination.truckNumber}
                onChange={(e) => setNewDestination(prev => ({ ...prev, truckNumber: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter truck number"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Address
              </label>
              <input
                type="text"
                value={newDestination.address}
                onChange={(e) => setNewDestination(prev => ({ ...prev, address: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter delivery address"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Destination
          </button>
        </form>
      </div>

      {/* Existing Destinations */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Delivery Destinations</h3>
        </div>
        
        {destinations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No delivery destinations configured</p>
        ) : (
          <div className="space-y-3">
            {destinations.map((destination) => (
              <div
                key={destination.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Truck {destination.truckNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {destination.address}
                    </div>
                    <div className="text-xs text-gray-400">
                      Added: {destination.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => onDestinationRemove(destination.id)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};