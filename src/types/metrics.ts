// Training metrics and performance tracking types

/**
 * Daily fitness metrics (CTL/ATL/TSB)
 */
export interface DailyMetrics {
  date: string;                   // YYYY-MM-DD
  ctl: number;                    // Chronic Training Load (Fitness)
  atl: number;                    // Acute Training Load (Fatigue)
  tsb: number;                    // Training Stress Balance (Form)
  tss: number;                    // Training Stress Score for the day
  
  // Optional biometric data
  hrv?: number;                   // Heart Rate Variability (ms)
  sleepScore?: number;            // Sleep quality score (0-100)
  rpe?: number;                   // Rate of Perceived Exertion (1-10)
  fatigue?: number;               // Subjective fatigue (1-10)
  
  // Metadata
  indoor: boolean;
  tags?: string[];
  notes?: string;
  
  // Morning Check (subjective metrics)
  morningCheck?: MorningCheck;
}

/**
 * Morning check-in for subjective readiness
 */
export interface MorningCheck {
  date: string;                   // YYYY-MM-DD
  sleepQuality: number;           // 1-5 (1=poor, 5=excellent)
  fatigue: number;                // 1-5 (1=fresh, 5=exhausted)
  motivation: number;             // 1-5 (1=none, 5=high)
  soreness: number;               // 1-5 (1=none, 5=very sore)
  stress: number;                 // 1-5 (1=low, 5=high)
  readinessScore?: number;        // 0-1 (calculated from above)
  notes?: string;
  submittedAt: Date;
}

/**
 * Completed activity (from Strava or manual entry)
 */
export interface Activity {
  id: string;
  stravaId?: string;
  startTime: Date;
  duration: number;               // seconds
  type: 'ride' | 'run' | 'swim' | 'strength' | 'other';
  tss: number;
  
  // Biometric data
  avgHeartRate?: number;          // bpm
  maxHeartRate?: number;          // bpm
  avgPower?: number;              // watts
  maxPower?: number;              // watts
  normalizedPower?: number;       // watts (NP)
  
  // Route data
  distance?: number;              // meters
  elevation?: number;             // meters
  indoor: boolean;
  
  // Device capabilities
  deviceFlags: {
    powerMeter: boolean;
    heartRateMonitor: boolean;
    cadenceSensor: boolean;
  };
  
  // Source and completion
  source: 'strava' | 'manual' | 'garmin' | 'wahoo' | 'zwift' | 'other';
  completed: boolean;
  compliance?: 'completed' | 'partial' | 'missed' | 'modified';
}

/**
 * TSS calculation method
 */
export type TssMethod = 'power' | 'heart_rate' | 'rpe';

/**
 * TSS calculation input
 */
export interface TssInput {
  duration_s: number;
  method: TssMethod;
  
  // Power-based (most accurate)
  normalizedPower?: number;
  ftp?: number;
  
  // Heart rate-based (fallback)
  avgHeartRate?: number;
  lthr?: number;
  
  // RPE-based (manual entry)
  rpe?: number;                   // 1-10 scale
}

/**
 * CTL/ATL/TSB calculation result
 */
export interface FitnessMetrics {
  ctl: number;                    // Chronic Training Load (42-day EMA)
  atl: number;                    // Acute Training Load (7-day EMA)
  tsb: number;                    // Training Stress Balance (CTL - ATL)
  rampRate?: number;              // Weekly TSS increase rate
}

/**
 * Readiness score calculation (Phase 2)
 */
export interface ReadinessScore {
  score: number;                  // 0-1 (0=not ready, 1=fully ready)
  factors: {
    hrv_z: number;                // HRV z-score
    rhr_z: number;                // Resting HR z-score
    sleepDuration_z: number;      // Sleep duration z-score
    sleepQuality_z: number;       // Sleep quality z-score
    soreness_z: number;           // Muscle soreness z-score
    stress_z: number;             // Stress z-score
  };
  weights: {
    hrv: number;
    rhr: number;
    sleepDuration: number;
    sleepQuality: number;
    soreness: number;
    stress: number;
  };
  recommendation: 'full' | 'reduced' | 'recovery' | 'rest';
  timestamp: Date;
}

/**
 * Historical metrics for analysis (Phase 2)
 */
export interface MetricsHistory {
  userId: string;
  startDate: string;              // YYYY-MM-DD
  endDate: string;                // YYYY-MM-DD
  dailyMetrics: DailyMetrics[];
  summary: {
    avgCTL: number;
    maxCTL: number;
    avgTSB: number;
    totalTSS: number;
    totalDuration: number;        // minutes
    totalActivities: number;
  };
}
