import { useState, useEffect, useCallback } from 'react';
import { Vehicle } from '../types';
import { mapboxService } from '../services/mapboxService';
import { DeliveryAppointment, deliveryAppointmentsService } from '../services/deliveryAppointmentsService';
import { distanceCalculationManager } from '../services/distanceCalculationManager';

interface DistanceResult {
  distanceMiles: string;
  distanceKm: string;
  durationHours: number;
  durationMinutes: number;
  eta: string;
  calculatedAt: string;
  appointmentLocation: string;
  error?: string;
}

interface DistanceCache {
  [key: string]: {
    result: DistanceResult;
    timestamp: number;
    vehiclePosition: { lat: number; lon: number };
  };
}

export const useControlledDistanceCalculation = (
  vehicles: Vehicle[],
  appointments: Record<string, DeliveryAppointment[]>
) => {
  const [distances, setDistances] = useState<Record<string, DistanceResult>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [distanceCache, setDistanceCache] = useState<DistanceCache>({});

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('distance_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        setDistanceCache(parsed);
        
        // Extract current distances from cache
        const currentDistances: Record<string, DistanceResult> = {};
        Object.keys(parsed).forEach(vehicleId => {
          currentDistances[vehicleId] = parsed[vehicleId].result;
        });
        setDistances(currentDistances);
        
        console.log('📦 Loaded distance cache:', Object.keys(parsed).length, 'entries');
      }
    } catch (error) {
      console.error('Error loading distance cache:', error);
    }
  }, []);

  // Save cache to localStorage
  const saveCache = useCallback((cache: DistanceCache) => {
    try {
      localStorage.setItem('distance_cache', JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving distance cache:', error);
    }
  }, []);

  // Generate cache key for vehicle-appointment combination
  const getCacheKey = useCallback((vehicleId: string, appointmentLocation: string, vehicleLat: number, vehicleLon: number): string => {
    // Include rounded coordinates to allow for small GPS variations
    const roundedLat = Math.round(vehicleLat * 1000) / 1000; // 3 decimal places (~111m accuracy)
    const roundedLon = Math.round(vehicleLon * 1000) / 1000;
    return `${vehicleId}_${appointmentLocation}_${roundedLat}_${roundedLon}`;
  }, []);

  // Check if cached result is still valid (within 2 hours and position hasn't changed significantly)
  const isCacheValid = useCallback((cacheEntry: DistanceCache[string], currentLat: number, currentLon: number): boolean => {
    const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours
    const POSITION_THRESHOLD = 0.001; // ~111 meters
    
    const isRecent = (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
    const positionUnchanged = 
      Math.abs(cacheEntry.vehiclePosition.lat - currentLat) < POSITION_THRESHOLD &&
      Math.abs(cacheEntry.vehiclePosition.lon - currentLon) < POSITION_THRESHOLD;
    
    return isRecent && positionUnchanged;
  }, []);

  // Calculate distance for a single vehicle
  const calculateSingleDistance = useCallback(async (
    vehicleId: string,
    fromLat: number,
    fromLon: number,
    appointmentLocation: string
  ): Promise<{ result: DistanceResult | null; fromCache: boolean }> => {
    const cacheKey = getCacheKey(vehicleId, appointmentLocation, fromLat, fromLon);
    
    // Check cache first
    if (distanceCache[cacheKey] && isCacheValid(distanceCache[cacheKey], fromLat, fromLon)) {
      console.log(`💾 Using cached distance for vehicle ${vehicleId}`);
      return { result: distanceCache[cacheKey].result, fromCache: true };
    }

    try {
      console.log(`🔍 Calculating new distance for vehicle ${vehicleId} to ${appointmentLocation}`);
      
      // First geocode the appointment location (with its own cache)
      const geocoded = await mapboxService.geocodeAddress(appointmentLocation);
      
      // Then calculate distance
      const mapboxResult = await mapboxService.calculateDistance(fromLat, fromLon, geocoded.lat, geocoded.lng);
      
      const result: DistanceResult = {
        distanceMiles: mapboxResult.distanceMiles,
        distanceKm: mapboxResult.distanceKm,
        durationHours: mapboxResult.durationHours,
        durationMinutes: mapboxResult.durationMinutes,
        eta: mapboxResult.eta,
        calculatedAt: new Date().toISOString(),
        appointmentLocation
      };

      // Cache the result
      const newCacheEntry = {
        result,
        timestamp: Date.now(),
        vehiclePosition: { lat: fromLat, lon: fromLon }
      };

      setDistanceCache(prev => {
        const updated = { ...prev, [cacheKey]: newCacheEntry };
        saveCache(updated);
        return updated;
      });

      return { result, fromCache: false };
    } catch (error) {
      console.error(`❌ Distance calculation failed for vehicle ${vehicleId}:`, error);
      const errorResult: DistanceResult = {
        distanceMiles: '0.0',
        distanceKm: '0.0',
        durationHours: 0,
        durationMinutes: 0,
        eta: 'N/A',
        calculatedAt: new Date().toISOString(),
        appointmentLocation,
        error: 'Calculation failed'
      };
      return { result: errorResult, fromCache: false };
    }
  }, [distanceCache, getCacheKey, isCacheValid, saveCache]);

  // Calculate distances for all vehicles with appointments
  const calculateAllDistances = useCallback(async (): Promise<void> => {
    if (isCalculating) {
      console.log('⏸️ Distance calculation already in progress, skipping');
      return;
    }

    setIsCalculating(true);
    console.log('🚀 Starting controlled distance calculations...');
    
    const newDistances: Record<string, DistanceResult> = {};
    let apiCallsUsed = 0;
    let cacheHits = 0;
    const vehiclesToCalculate: Array<{ vehicle: Vehicle; appointmentLocation: string }> = [];

    // Identify vehicles that need distance calculation
    for (const vehicle of vehicles) {
      const nextAppointment = deliveryAppointmentsService.getNextAppointment(vehicle.id);
      
      if (nextAppointment && 
          vehicle.currentLocation.lat !== 0 && 
          vehicle.currentLocation.lon !== 0) {
        vehiclesToCalculate.push({ vehicle, appointmentLocation: nextAppointment.location });
      }
    }

    console.log(`📋 Found ${vehiclesToCalculate.length} vehicles with appointments to calculate`);

    try {
      // Calculate distances with rate limiting
      for (let i = 0; i < vehiclesToCalculate.length; i++) {
        const { vehicle, appointmentLocation } = vehiclesToCalculate[i];
        
        try {
          // Add delay between requests to respect rate limits (except for first request)
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay
          }

          const { result, fromCache } = await calculateSingleDistance(
            vehicle.id,
            vehicle.currentLocation.lat,
            vehicle.currentLocation.lon,
            appointmentLocation
          );

          if (result) {
            newDistances[vehicle.id] = result;
            
            if (fromCache) {
              cacheHits++;
            } else {
              apiCallsUsed += 2; // Geocoding + distance calculation
            }
          }
        } catch (error) {
          console.error(`❌ Distance calculation failed for ${vehicle.truckNumber}:`, error);
        }
      }

      // Update distances state
      setDistances(newDistances);
      
      // Update calculation stats
      distanceCalculationManager.updateCalculationStats(apiCallsUsed, cacheHits);
      
      console.log(`✅ Distance calculations complete:`, {
        vehiclesCalculated: vehiclesToCalculate.length,
        apiCallsUsed,
        cacheHits,
        cacheHitRate: vehiclesToCalculate.length > 0 ? `${Math.round((cacheHits / vehiclesToCalculate.length) * 100)}%` : '0%'
      });
      
    } catch (error) {
      console.error('❌ Distance calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [vehicles, isCalculating, calculateSingleDistance]);

  // Setup auto calculation
  useEffect(() => {
    // Start auto calculation
    distanceCalculationManager.startAutoCalculation(calculateAllDistances);
    
    // Cleanup on unmount
    return () => {
      distanceCalculationManager.stopAutoCalculation();
    };
  }, [calculateAllDistances]);

  // Get distance for a specific vehicle
  const getDistance = useCallback((vehicleId: string): DistanceResult | undefined => {
    return distances[vehicleId];
  }, [distances]);

  // Check if a vehicle has an appointment
  const hasAppointment = useCallback((vehicleId: string): boolean => {
    const nextAppointment = deliveryAppointmentsService.getNextAppointment(vehicleId);
    return !!nextAppointment;
  }, []);

  // Get calculation status info
  const getCalculationInfo = useCallback(() => {
    const stats = distanceCalculationManager.getUsageStats();
    return {
      lastCalculationTime: distanceCalculationManager.getTimeSinceLastCalculation(),
      nextCalculationTime: distanceCalculationManager.getNextCalculationTime(),
      apiCallsUsed: stats.apiCallsUsed,
      cacheHitRate: distanceCalculationManager.getCacheHitRate(),
      usageWarning: distanceCalculationManager.getUsageWarning()
    };
  }, []);

  return {
    getDistance,
    isCalculating,
    hasAppointment,
    calculateAllDistances,
    getCalculationInfo
  };
};