import { useState, useEffect, useCallback } from 'react';
import { DestinationData } from '../components/Dashboard/EditableDestination';

interface StoredDestination extends DestinationData {
  updatedAt: string;
}

export const useDestinations = () => {
  const [destinations, setDestinations] = useState<Record<string, StoredDestination>>({});
  const storageKey = 'fleet_destinations';

  // Load destinations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDestinations(parsed);
        console.log('📍 Loaded destinations from storage:', Object.keys(parsed).length, 'destinations');
      }
    } catch (error) {
      console.error('❌ Error loading destinations from storage:', error);
    }
  }, []);

  // Save destinations to localStorage whenever they change
  const saveDestinations = useCallback((newDestinations: Record<string, StoredDestination>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newDestinations));
      console.log('💾 Saved destinations to storage:', Object.keys(newDestinations).length, 'destinations');
    } catch (error) {
      console.error('❌ Error saving destinations to storage:', error);
    }
  }, []);

  const setDestination = useCallback((vehicleId: string, destinationData: DestinationData | null) => {
    setDestinations(prev => {
      const newDestinations = { ...prev };
      
      if (destinationData) {
        newDestinations[vehicleId] = {
          ...destinationData,
          updatedAt: new Date().toISOString()
        };
        console.log(`📍 Set destination for vehicle ${vehicleId}:`, destinationData.formattedAddress);
      } else {
        delete newDestinations[vehicleId];
        console.log(`🗑️ Removed destination for vehicle ${vehicleId}`);
      }
      
      saveDestinations(newDestinations);
      return newDestinations;
    });
  }, [saveDestinations]);

  const getDestination = useCallback((vehicleId: string): StoredDestination | null => {
    return destinations[vehicleId] || null;
  }, [destinations]);

  const clearAllDestinations = useCallback(() => {
    setDestinations({});
    localStorage.removeItem(storageKey);
    console.log('🗑️ Cleared all destinations');
  }, []);

  const getDestinationStats = useCallback(() => {
    const count = Object.keys(destinations).length;
    const recentCount = Object.values(destinations).filter(dest => {
      const updatedAt = new Date(dest.updatedAt);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return updatedAt > dayAgo;
    }).length;

    return { total: count, recent: recentCount };
  }, [destinations]);

  return {
    destinations,
    setDestination,
    getDestination,
    clearAllDestinations,
    getDestinationStats
  };
};