import { useState, useEffect, useCallback } from 'react';
import { loadNumberService } from '../services/loadNumberService';

export const useLoadNumbers = () => {
  const [loadNumbers, setLoadNumbers] = useState<Record<string, string>>({});

  // Load load numbers from localStorage on mount
  useEffect(() => {
    try {
      const stored = loadNumberService.getAllLoadNumbers();
      const loadNumbersMap: Record<string, string> = {};
      
      Object.keys(stored).forEach(vehicleId => {
        loadNumbersMap[vehicleId] = stored[vehicleId].loadNumber;
      });
      
      setLoadNumbers(loadNumbersMap);
      console.log('📋 Loaded load numbers from storage:', Object.keys(loadNumbersMap).length, 'load numbers');
    } catch (error) {
      console.error('❌ Error loading load numbers from storage:', error);
    }
  }, []);

  const setLoadNumber = useCallback((vehicleId: string, loadNumber: string) => {
    setLoadNumbers(prev => {
      const newLoadNumbers = { ...prev };
      
      if (loadNumber.trim()) {
        newLoadNumbers[vehicleId] = loadNumber.trim();
        loadNumberService.saveLoadNumber(vehicleId, loadNumber.trim());
        console.log(`📋 Set load number for vehicle ${vehicleId}:`, loadNumber.trim());
      } else {
        delete newLoadNumbers[vehicleId];
        loadNumberService.removeLoadNumber(vehicleId);
        console.log(`🗑️ Removed load number for vehicle ${vehicleId}`);
      }
      
      return newLoadNumbers;
    });
  }, []);

  const getLoadNumber = useCallback((vehicleId: string): string => {
    return loadNumbers[vehicleId] || '';
  }, [loadNumbers]);

  const clearAllLoadNumbers = useCallback(() => {
    setLoadNumbers({});
    loadNumberService.clearAllLoadNumbers();
    console.log('🗑️ Cleared all load numbers');
  }, []);

  const getLoadNumberStats = useCallback(() => {
    return loadNumberService.getLoadNumberStats();
  }, []);

  return {
    loadNumbers,
    setLoadNumber,
    getLoadNumber,
    clearAllLoadNumbers,
    getLoadNumberStats
  };
};