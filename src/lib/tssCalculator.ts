/**
 * TSS (Training Stress Score) Calculator
 * 
 * Provides multiple methods for calculating TSS based on available data:
 * 1. Power-based (most accurate)
 * 2. Heart rate-based (HRSS)
 * 3. RPE-based (manual entry fallback)
 * 
 * Also includes CTL/ATL/TSB calculation using exponential moving averages.
 */

import type { TssInput, TssMethod, FitnessMetrics, DailyMetrics } from '@/types/metrics';

/**
 * Calculate TSS from workout data
 * Automatically selects best available method
 */
export function calculateTSS(input: TssInput): number {
  const { duration_s, method } = input;
  
  if (method === 'power' && input.normalizedPower && input.ftp) {
    return calculatePowerBasedTSS(duration_s, input.normalizedPower, input.ftp);
  }
  
  if (method === 'heart_rate' && input.avgHeartRate && input.lthr) {
    return calculateHeartRateBasedTSS(duration_s, input.avgHeartRate, input.lthr);
  }
  
  if (method === 'rpe' && input.rpe) {
    return calculateRPEBasedTSS(duration_s, input.rpe);
  }
  
  throw new Error('Insufficient data for TSS calculation');
}

/**
 * Power-based TSS calculation (most accurate)
 * 
 * Formula: TSS = (duration_s × NP × IF) / (FTP × 3600) × 100
 * Where IF (Intensity Factor) = NP / FTP
 * 
 * Simplified: TSS = (duration_s × NP²) / (FTP² × 36)
 * 
 * @param duration_s Duration in seconds
 * @param normalizedPower Normalized Power (NP) in watts
 * @param ftp Functional Threshold Power in watts
 * @returns TSS value
 */
export function calculatePowerBasedTSS(
  duration_s: number,
  normalizedPower: number,
  ftp: number
): number {
  if (ftp <= 0) {
    throw new Error('FTP must be greater than 0');
  }
  
  const intensityFactor = normalizedPower / ftp;
  const tss = (duration_s * normalizedPower * intensityFactor) / (ftp * 3600) * 100;
  
  return Math.round(tss);
}

/**
 * Heart rate-based TSS (HRSS)
 * 
 * Formula: HRSS = duration_hours × (avgHR / LTHR)² × 100
 * 
 * Less accurate than power-based but useful when power meter unavailable.
 * 
 * @param duration_s Duration in seconds
 * @param avgHeartRate Average heart rate in bpm
 * @param lthr Lactate Threshold Heart Rate in bpm
 * @returns HRSS value
 */
export function calculateHeartRateBasedTSS(
  duration_s: number,
  avgHeartRate: number,
  lthr: number
): number {
  if (lthr <= 0) {
    throw new Error('LTHR must be greater than 0');
  }
  
  const duration_hours = duration_s / 3600;
  const hrRatio = avgHeartRate / lthr;
  const hrss = duration_hours * Math.pow(hrRatio, 2) * 100;
  
  return Math.round(hrss);
}

/**
 * RPE-based TSS estimate (manual entry fallback)
 * 
 * Uses Rate of Perceived Exertion (1-10 scale) to estimate intensity.
 * 
 * RPE to Intensity Factor mapping:
 * - RPE 1-2: IF ~0.50 (recovery)
 * - RPE 3-4: IF ~0.65 (easy)
 * - RPE 5-6: IF ~0.75 (moderate)
 * - RPE 7-8: IF ~0.85 (hard)
 * - RPE 9-10: IF ~0.95 (very hard)
 * 
 * @param duration_s Duration in seconds
 * @param rpe Rate of Perceived Exertion (1-10)
 * @returns Estimated TSS
 */
export function calculateRPEBasedTSS(
  duration_s: number,
  rpe: number
): number {
  if (rpe < 1 || rpe > 10) {
    throw new Error('RPE must be between 1 and 10');
  }
  
  // Map RPE to Intensity Factor
  let intensityFactor: number;
  if (rpe <= 2) {
    intensityFactor = 0.50;
  } else if (rpe <= 4) {
    intensityFactor = 0.65;
  } else if (rpe <= 6) {
    intensityFactor = 0.75;
  } else if (rpe <= 8) {
    intensityFactor = 0.85;
  } else {
    intensityFactor = 0.95;
  }
  
  const duration_hours = duration_s / 3600;
  const tss = duration_hours * 100 * intensityFactor;
  
  return Math.round(tss);
}

/**
 * Calculate CTL/ATL/TSB from daily TSS history
 * 
 * CTL (Chronic Training Load): 42-day exponential moving average of TSS (fitness)
 * ATL (Acute Training Load): 7-day exponential moving average of TSS (fatigue)
 * TSB (Training Stress Balance): CTL - ATL (form)
 * 
 * EMA Formula: EMA_new = EMA_old + α × (TSS_today - EMA_old)
 * Where α = 2 / (N + 1)
 * - CTL: α = 2/43 ≈ 0.0465 (slow change)
 * - ATL: α = 2/8 = 0.25 (fast change)
 * 
 * @param dailyTSS Array of daily TSS values (oldest first)
 * @param initialCTL Starting CTL (default: 0)
 * @param initialATL Starting ATL (default: 0)
 * @returns Current fitness metrics
 */
export function calculateFitnessMetrics(
  dailyTSS: number[],
  initialCTL: number = 0,
  initialATL: number = 0
): FitnessMetrics {
  let ctl = initialCTL;
  let atl = initialATL;
  
  const ctlAlpha = 2 / 43; // 42-day EMA constant
  const atlAlpha = 2 / 8;  // 7-day EMA constant
  
  for (const tss of dailyTSS) {
    // Update CTL (fitness)
    ctl = ctl + ctlAlpha * (tss - ctl);
    
    // Update ATL (fatigue)
    atl = atl + atlAlpha * (tss - atl);
  }
  
  const tsb = ctl - atl;
  
  return {
    ctl: Math.round(ctl * 10) / 10,
    atl: Math.round(atl * 10) / 10,
    tsb: Math.round(tsb * 10) / 10,
  };
}

/**
 * Calculate fitness metrics for a specific date given historical data
 * 
 * @param dailyMetrics Historical daily metrics (must be in chronological order)
 * @param targetDate Target date to calculate for (YYYY-MM-DD)
 * @returns Fitness metrics for target date
 */
export function calculateFitnessMetricsForDate(
  dailyMetrics: DailyMetrics[],
  targetDate: string
): FitnessMetrics {
  // Find metrics up to and including target date
  const relevantMetrics = dailyMetrics.filter(m => m.date <= targetDate);
  
  if (relevantMetrics.length === 0) {
    return { ctl: 0, atl: 0, tsb: 0 };
  }
  
  // Extract TSS values
  const dailyTSS = relevantMetrics.map(m => m.tss);
  
  // Calculate using most recent metrics as initial values
  const lastMetric = relevantMetrics[relevantMetrics.length - 1];
  
  return calculateFitnessMetrics(
    dailyTSS,
    0, // Start from 0 to get fresh calculation
    0
  );
}

/**
 * Calculate ramp rate (weekly TSS increase)
 * 
 * @param weeklyTSS Array of weekly TSS totals (at least 2 weeks)
 * @returns Ramp rate as percentage (e.g., 0.10 = 10% increase)
 */
export function calculateRampRate(weeklyTSS: number[]): number {
  if (weeklyTSS.length < 2) {
    return 0;
  }
  
  const currentWeek = weeklyTSS[weeklyTSS.length - 1];
  const previousWeek = weeklyTSS[weeklyTSS.length - 2];
  
  if (previousWeek === 0) {
    return 0;
  }
  
  const rampRate = (currentWeek - previousWeek) / previousWeek;
  
  return Math.round(rampRate * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Calculate Intensity Factor (IF) from power data
 * 
 * IF = NP / FTP
 * 
 * @param normalizedPower Normalized Power in watts
 * @param ftp Functional Threshold Power in watts
 * @returns Intensity Factor (0.0 to >1.0)
 */
export function calculateIntensityFactor(
  normalizedPower: number,
  ftp: number
): number {
  if (ftp <= 0) {
    throw new Error('FTP must be greater than 0');
  }
  
  return Math.round((normalizedPower / ftp) * 100) / 100;
}

/**
 * Estimate Normalized Power from average power (rough approximation)
 * 
 * NP is typically 3-5% higher than average power for steady efforts,
 * and 10-20% higher for highly variable efforts.
 * 
 * This uses a conservative 5% increase.
 * 
 * @param averagePower Average power in watts
 * @returns Estimated Normalized Power
 */
export function estimateNormalizedPower(averagePower: number): number {
  return Math.round(averagePower * 1.05);
}

/**
 * Calculate TSS for a planned workout based on structure
 * 
 * @param segments Workout segments with duration and intensity
 * @param ftp User's FTP in watts
 * @returns Estimated TSS
 */
export function calculatePlannedTSS(
  segments: Array<{
    duration_s: number;
    intensity_ftp: number; // Percentage of FTP (e.g., 0.85 = 85%)
  }>,
  ftp: number
): number {
  let totalTSS = 0;
  
  for (const segment of segments) {
    const power = ftp * segment.intensity_ftp;
    const segmentTSS = calculatePowerBasedTSS(segment.duration_s, power, ftp);
    totalTSS += segmentTSS;
  }
  
  return Math.round(totalTSS);
}

/**
 * Interpret TSB value with training recommendations
 * 
 * @param tsb Training Stress Balance
 * @returns Interpretation and recommendation
 */
export function interpretTSB(tsb: number): {
  status: 'fresh' | 'optimal' | 'tired' | 'fatigued';
  message: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
} {
  if (tsb > 15) {
    return {
      status: 'fresh',
      message: 'Very fresh - good for high-intensity workouts or races',
      color: 'green',
    };
  } else if (tsb >= -10) {
    return {
      status: 'optimal',
      message: 'Optimal training range - maintaining fitness while managing fatigue',
      color: 'blue',
    };
  } else if (tsb >= -25) {
    return {
      status: 'tired',
      message: 'Accumulating fatigue - consider easier workouts or recovery day',
      color: 'yellow',
    };
  } else {
    return {
      status: 'fatigued',
      message: 'High fatigue - recovery recommended to avoid overtraining',
      color: 'red',
    };
  }
}
