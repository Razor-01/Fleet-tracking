interface DistanceCalculationStats {
  totalCalculations: number;
  apiCallsUsed: number;
  lastCalculationTime: number | null;
  cacheHits: number;
  cacheMisses: number;
}

class DistanceCalculationManager {
  private lastCalculationTime: number | null = null;
  private calculationInterval: NodeJS.Timeout | null = null;
  private readonly AUTO_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly STORAGE_KEY = 'distance_calculation_stats';
  private stats: DistanceCalculationStats;

  constructor() {
    // Load stats from localStorage
    this.stats = this.loadStats();
    console.log('🎯 Distance Calculation Manager initialized');
  }

  private loadStats(): DistanceCalculationStats {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading distance calculation stats:', error);
    }
    
    return {
      totalCalculations: 0,
      apiCallsUsed: 0,
      lastCalculationTime: null,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  private saveStats(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Error saving distance calculation stats:', error);
    }
  }

  // Start automatic distance calculation every 30 minutes
  startAutoCalculation(calculateDistancesCallback: () => Promise<void>): void {
    // Clear any existing interval
    this.stopAutoCalculation();
    
    // Set up new interval
    this.calculationInterval = setInterval(async () => {
      console.log('⏰ Auto-calculating distances (30-minute interval)');
      await calculateDistancesCallback();
    }, this.AUTO_REFRESH_INTERVAL);
    
    console.log('🔄 Auto distance calculation started (every 30 minutes)');
  }

  // Stop automatic calculation
  stopAutoCalculation(): void {
    if (this.calculationInterval) {
      clearInterval(this.calculationInterval);
      this.calculationInterval = null;
      console.log('⏹️ Auto distance calculation stopped');
    }
  }

  // Check if it's time for auto calculation
  shouldAutoCalculate(): boolean {
    if (!this.lastCalculationTime) return true;
    
    const timeSinceLastCalculation = Date.now() - this.lastCalculationTime;
    return timeSinceLastCalculation >= this.AUTO_REFRESH_INTERVAL;
  }

  // Update last calculation time and stats
  updateCalculationStats(apiCallsUsed: number, cacheHits: number = 0): void {
    this.lastCalculationTime = Date.now();
    this.stats.lastCalculationTime = this.lastCalculationTime;
    this.stats.totalCalculations++;
    this.stats.apiCallsUsed += apiCallsUsed;
    this.stats.cacheHits += cacheHits;
    this.stats.cacheMisses += apiCallsUsed; // API calls represent cache misses
    
    this.saveStats();
    
    console.log(`📊 Distance calculation stats updated:`, {
      totalCalculations: this.stats.totalCalculations,
      apiCallsUsed: this.stats.apiCallsUsed,
      cacheHitRate: this.getCacheHitRate()
    });
  }

  // Get time since last calculation
  getTimeSinceLastCalculation(): string {
    if (!this.lastCalculationTime) return 'Never';
    
    const minutes = Math.floor((Date.now() - this.lastCalculationTime) / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m ago`;
  }

  // Get next auto calculation time
  getNextCalculationTime(): string {
    if (!this.lastCalculationTime) return 'Soon';
    
    const nextTime = this.lastCalculationTime + this.AUTO_REFRESH_INTERVAL;
    const minutesUntilNext = Math.floor((nextTime - Date.now()) / (1000 * 60));
    
    if (minutesUntilNext <= 0) return 'Now';
    if (minutesUntilNext < 60) return `${minutesUntilNext}m`;
    
    const hours = Math.floor(minutesUntilNext / 60);
    const minutes = minutesUntilNext % 60;
    return `${hours}h ${minutes}m`;
  }

  // Get cache hit rate as percentage
  getCacheHitRate(): string {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    if (total === 0) return '0%';
    
    const rate = (this.stats.cacheHits / total) * 100;
    return `${Math.round(rate)}%`;
  }

  // Get API usage stats
  getUsageStats(): DistanceCalculationStats {
    return { ...this.stats };
  }

  // Reset stats (for testing or new month)
  resetStats(): void {
    this.stats = {
      totalCalculations: 0,
      apiCallsUsed: 0,
      lastCalculationTime: this.lastCalculationTime,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.saveStats();
    console.log('🔄 Distance calculation stats reset');
  }

  // Check if we're approaching API limits (warn at 80% of free tier)
  isApproachingLimit(): boolean {
    const FREE_TIER_LIMIT = 100000; // Mapbox free tier limit per month
    const WARNING_THRESHOLD = 0.8; // Warn at 80%
    
    return this.stats.apiCallsUsed > (FREE_TIER_LIMIT * WARNING_THRESHOLD);
  }

  // Get usage warning message
  getUsageWarning(): string | null {
    if (this.isApproachingLimit()) {
      const FREE_TIER_LIMIT = 100000;
      const percentage = Math.round((this.stats.apiCallsUsed / FREE_TIER_LIMIT) * 100);
      return `⚠️ API usage at ${percentage}% of free tier limit`;
    }
    return null;
  }
}

export const distanceCalculationManager = new DistanceCalculationManager();
export type { DistanceCalculationStats };