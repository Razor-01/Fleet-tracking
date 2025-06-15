import { useState, useEffect, useCallback } from 'react';
import { Vehicle } from '../types';
import { mapboxService } from '../services/mapboxService';
import { DestinationData } from '../components/Dashboard/EditableDestination';

interface DistanceResult {
  distanceMiles: string;
  distanceKm: string;
  durationHours: number;
  durationMinutes: number;
  eta: string;
  error?: string;
}

export const useDistanceCalculation = (
  vehicles: Vehicle[],
  destinations: Record<string, DestinationData & { updatedAt: string }>
) => {
  const [distances, setDistances] = useState<Record<string, DistanceResult>>({});
  const [calculatingDistances, setCalculatingDistances] = useState<Set<string>>(new Set());

  const calculateDistance = useCallback(async (
    vehicleId: string,
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<DistanceResult | null> => {
    try {
      const result = await mapboxService.calculateDistance(fromLat, fromLng, toLat, toLng);
      return {
        distanceMiles: result.distanceMiles,
        distanceKm: result.distanceKm,
        durationHours: result.durationHours,
        durationMinutes: result.durationMinutes,
        eta: result.eta
      };
    } catch (error) {
      console.error(`❌ Distance calculation failed for vehicle ${vehicleId}:`, error);
      return {
        distanceMiles: '0.0',
        distanceKm: '0.0',
        durationHours: 0,
        durationMinutes: 0,
        eta: 'N/A',
        error: 'Calculation failed'
      };
    }
  }, []);

  const calculateAllDistances = useCallback(async () => {
    const newDistances: Record<string, DistanceResult> = { ...distances };
    const vehiclesToCalculate: Array<{ vehicle: Vehicle; destination: DestinationData }> = [];

    // Identify vehicles that need distance calculation
    for (const vehicle of vehicles) {
      const destination = destinations[vehicle.id];
      
      if (destination && 
          vehicle.currentLocation.lat !== 0 && 
          vehicle.currentLocation.lon !== 0 &&
          !calculatingDistances.has(vehicle.id)) {
        
        // Check if we need to recalculate (vehicle moved significantly or destination changed)
        const existingDistance = distances[vehicle.id];
        const shouldRecalculate = !existingDistance || 
          Math.abs(vehicle.currentLocation.lat - (vehicle as any).lastCalculatedLat || 0) > 0.001 ||
          Math.abs(vehicle.currentLocation.lon - (vehicle as any).lastCalculatedLon || 0) > 0.001;

        if (shouldRecalculate) {
          vehiclesToCalculate.push({ vehicle, destination });
        }
      }
    }

    if (vehiclesToCalculate.length === 0) {
      return;
    }

    console.log(`🛣️ Calculating distances for ${vehiclesToCalculate.length} vehicles`);

    // Update calculating state
    setCalculatingDistances(prev => {
      const newSet = new Set(prev);
      vehiclesToCalculate.forEach(({ vehicle }) => newSet.add(vehicle.id));
      return newSet;
    });

    // Calculate distances with rate limiting
    for (let i = 0; i < vehiclesToCalculate.length; i++) {
      const { vehicle, destination } = vehiclesToCalculate[i];
      
      try {
        // Add delay between requests to respect rate limits
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const distanceResult = await calculateDistance(
          vehicle.id,
          vehicle.currentLocation.lat,
          vehicle.currentLocation.lon,
          destination.coordinates.lat,
          destination.coordinates.lng
        );

        if (distanceResult) {
          newDistances[vehicle.id] = distanceResult;
          
          // Store last calculated position to avoid unnecessary recalculations
          (vehicle as any).lastCalculatedLat = vehicle.currentLocation.lat;
          (vehicle as any).lastCalculatedLon = vehicle.currentLocation.lon;
        }
      } catch (error) {
        console.error(`❌ Distance calculation failed for ${vehicle.truckNumber}:`, error);
        newDistances[vehicle.id] = {
          distanceMiles: '0.0',
          distanceKm: '0.0',
          durationHours: 0,
          durationMinutes: 0,
          eta: 'N/A',
          error: 'Calculation failed'
        };
      }
    }

    setDistances(newDistances);

    // Clear calculating state
    setCalculatingDistances(prev => {
      const newSet = new Set(prev);
      vehiclesToCalculate.forEach(({ vehicle }) => newSet.delete(vehicle.id));
      return newSet;
    });

    console.log(`✅ Distance calculations complete for ${vehiclesToCalculate.length} vehicles`);
  }, [vehicles, destinations, distances, calculatingDistances, calculateDistance]);

  // Trigger distance calculations when vehicles or destinations change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateAllDistances();
    }, 1000); // Debounce to avoid too frequent calculations

    return () => clearTimeout(timeoutId);
  }, [calculateAllDistances]);

  const getDistance = useCallback((vehicleId: string): DistanceResult | undefined => {
    return distances[vehicleId];
  }, [distances]);

  const isCalculating = useCallback((vehicleId: string): boolean => {
    return calculatingDistances.has(vehicleId);
  }, [calculatingDistances]);

  const hasDestination = useCallback((vehicleId: string): boolean => {
    return !!destinations[vehicleId];
  }, [destinations]);

  return {
    getDistance,
    isCalculating,
    hasDestination,
    calculateAllDistances
  };
};