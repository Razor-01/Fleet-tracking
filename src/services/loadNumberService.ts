interface LoadNumberData {
  loadNumber: string;
  updatedAt: string;
}

class LoadNumberStorageService {
  private storageKey = 'truck_load_numbers';

  // Save load number for a vehicle
  saveLoadNumber(vehicleId: string, loadNumber: string): void {
    const loadNumbers = this.getAllLoadNumbers();
    loadNumbers[vehicleId] = {
      loadNumber: loadNumber.trim(),
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(loadNumbers));
    console.log(`📋 Saved load number for vehicle ${vehicleId}: ${loadNumber}`);
  }

  // Get load number for a vehicle
  getLoadNumber(vehicleId: string): string {
    const loadNumbers = this.getAllLoadNumbers();
    return loadNumbers[vehicleId]?.loadNumber || '';
  }

  // Get all load numbers
  getAllLoadNumbers(): Record<string, LoadNumberData> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ Error reading load numbers:', error);
      return {};
    }
  }

  // Remove load number for a vehicle
  removeLoadNumber(vehicleId: string): void {
    const loadNumbers = this.getAllLoadNumbers();
    delete loadNumbers[vehicleId];
    localStorage.setItem(this.storageKey, JSON.stringify(loadNumbers));
    console.log(`🗑️ Removed load number for vehicle ${vehicleId}`);
  }

  // Clear all load numbers
  clearAllLoadNumbers(): void {
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ Cleared all load numbers');
  }

  // Get load number statistics
  getLoadNumberStats(): { total: number; recent: number } {
    const loadNumbers = this.getAllLoadNumbers();
    const total = Object.keys(loadNumbers).length;
    
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = Object.values(loadNumbers).filter(data => {
      const updatedAt = new Date(data.updatedAt);
      return updatedAt > dayAgo;
    }).length;

    return { total, recent };
  }
}

export const loadNumberService = new LoadNumberStorageService();