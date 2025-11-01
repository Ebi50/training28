/**
 * Unit tests for TSS Calculator
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTSS,
  calculatePowerBasedTSS,
  calculateHeartRateBasedTSS,
  calculateRPEBasedTSS,
  calculateFitnessMetrics,
  calculateRampRate,
  calculateIntensityFactor,
  estimateNormalizedPower,
  calculatePlannedTSS,
  interpretTSB,
} from '@/lib/tssCalculator';

describe('calculatePowerBasedTSS', () => {
  it('should calculate TSS correctly for 1-hour threshold effort', () => {
    // 1 hour at FTP = 100 TSS (by definition)
    const tss = calculatePowerBasedTSS(3600, 250, 250);
    expect(tss).toBe(100);
  });

  it('should calculate TSS for easy endurance ride', () => {
    // 2 hours at 65% FTP (0.65 IF)
    const tss = calculatePowerBasedTSS(7200, 163, 250);
    // TSS = 2 × (0.65)² × 100 = 84.5
    expect(tss).toBe(85);
  });

  it('should calculate TSS for hard VO2max workout', () => {
    // 1 hour at 110% FTP (1.10 IF)
    const tss = calculatePowerBasedTSS(3600, 275, 250);
    // TSS = 1 × (1.10)² × 100 = 121
    expect(tss).toBe(121);
  });

  it('should throw error for zero FTP', () => {
    expect(() => calculatePowerBasedTSS(3600, 250, 0)).toThrow();
  });

  it('should handle very short workouts', () => {
    // 10 minutes at FTP
    const tss = calculatePowerBasedTSS(600, 250, 250);
    // TSS = (10/60) × 1² × 100 ≈ 17
    expect(tss).toBe(17);
  });
});

describe('calculateHeartRateBasedTSS', () => {
  it('should calculate HRSS correctly for threshold effort', () => {
    // 1 hour at LTHR = 100 HRSS (by definition)
    const hrss = calculateHeartRateBasedTSS(3600, 165, 165);
    expect(hrss).toBe(100);
  });

  it('should calculate HRSS for easy endurance ride', () => {
    // 2 hours at 70% of LTHR
    const hrss = calculateHeartRateBasedTSS(7200, 116, 165);
    // HRSS = 2 × (116/165)² × 100 ≈ 99
    expect(hrss).toBe(99);
  });

  it('should throw error for zero LTHR', () => {
    expect(() => calculateHeartRateBasedTSS(3600, 165, 0)).toThrow();
  });
});

describe('calculateRPEBasedTSS', () => {
  it('should estimate TSS for RPE 5 (moderate)', () => {
    // 1 hour at moderate effort (IF ~0.75)
    const tss = calculateRPEBasedTSS(3600, 5);
    // TSS = 1 × 100 × 0.75 = 75
    expect(tss).toBe(75);
  });

  it('should estimate TSS for RPE 9 (very hard)', () => {
    // 1 hour at very hard effort (IF ~0.95)
    const tss = calculateRPEBasedTSS(3600, 9);
    // TSS = 1 × 100 × 0.95 = 95
    expect(tss).toBe(95);
  });

  it('should estimate TSS for RPE 2 (recovery)', () => {
    // 1 hour at recovery effort (IF ~0.50)
    const tss = calculateRPEBasedTSS(3600, 2);
    // TSS = 1 × 100 × 0.50 = 50
    expect(tss).toBe(50);
  });

  it('should throw error for invalid RPE', () => {
    expect(() => calculateRPEBasedTSS(3600, 0)).toThrow();
    expect(() => calculateRPEBasedTSS(3600, 11)).toThrow();
  });
});

describe('calculateTSS (unified method)', () => {
  it('should use power-based method when available', () => {
    const tss = calculateTSS({
      duration_s: 3600,
      method: 'power',
      normalizedPower: 250,
      ftp: 250,
    });
    expect(tss).toBe(100);
  });

  it('should use heart rate method when specified', () => {
    const tss = calculateTSS({
      duration_s: 3600,
      method: 'heart_rate',
      avgHeartRate: 165,
      lthr: 165,
    });
    expect(tss).toBe(100);
  });

  it('should use RPE method when specified', () => {
    const tss = calculateTSS({
      duration_s: 3600,
      method: 'rpe',
      rpe: 5,
    });
    expect(tss).toBe(75);
  });

  it('should throw error when insufficient data', () => {
    expect(() => calculateTSS({
      duration_s: 3600,
      method: 'power',
    })).toThrow();
  });
});

describe('calculateFitnessMetrics', () => {
  it('should start at zero with no history', () => {
    const metrics = calculateFitnessMetrics([]);
    expect(metrics.ctl).toBe(0);
    expect(metrics.atl).toBe(0);
    expect(metrics.tsb).toBe(0);
  });

  it('should calculate CTL/ATL/TSB after single workout', () => {
    const metrics = calculateFitnessMetrics([100]);
    
    // After 1 day with 100 TSS:
    // CTL = 0 + 0.0465 × (100 - 0) ≈ 4.7
    // ATL = 0 + 0.25 × (100 - 0) = 25
    // TSB = 4.7 - 25 = -20.3
    
    expect(metrics.ctl).toBeCloseTo(4.7, 1);
    expect(metrics.atl).toBe(25);
    expect(metrics.tsb).toBeCloseTo(-20.3, 1);
  });

  it('should handle consistent training load', () => {
    // 7 days of 100 TSS each
    const dailyTSS = Array(7).fill(100);
    const metrics = calculateFitnessMetrics(dailyTSS);
    
    // After 7 days, ATL should be close to 100 (7-day average)
    expect(metrics.atl).toBeGreaterThan(80);
    expect(metrics.atl).toBeLessThan(100);
    
    // CTL should be lower (42-day average)
    expect(metrics.ctl).toBeGreaterThan(0);
    expect(metrics.ctl).toBeLessThan(metrics.atl);
    
    // TSB should be negative (building fitness)
    expect(metrics.tsb).toBeLessThan(0);
  });

  it('should handle taper (declining TSS)', () => {
    // Build phase: 7 days at 100 TSS
    const buildPhase = Array(7).fill(100);
    // Taper: 7 days at 40 TSS
    const taperPhase = Array(7).fill(40);
    
    const metrics = calculateFitnessMetrics([...buildPhase, ...taperPhase]);
    
    // ATL should drop faster than CTL during taper
    // TSB should increase (become less negative or positive)
    expect(metrics.tsb).toBeGreaterThan(-20);
  });

  it('should use initial values correctly', () => {
    const metrics = calculateFitnessMetrics([100], 80, 70);
    
    // Should build on initial values
    expect(metrics.ctl).toBeGreaterThan(80);
    expect(metrics.atl).toBeGreaterThan(70);
  });
});

describe('calculateRampRate', () => {
  it('should calculate weekly TSS increase', () => {
    const weeklyTSS = [400, 440]; // 10% increase
    const rampRate = calculateRampRate(weeklyTSS);
    expect(rampRate).toBe(0.1);
  });

  it('should calculate weekly TSS decrease', () => {
    const weeklyTSS = [500, 400]; // 20% decrease
    const rampRate = calculateRampRate(weeklyTSS);
    expect(rampRate).toBe(-0.2);
  });

  it('should return 0 for insufficient data', () => {
    const rampRate = calculateRampRate([400]);
    expect(rampRate).toBe(0);
  });

  it('should handle zero previous week', () => {
    const weeklyTSS = [0, 400];
    const rampRate = calculateRampRate(weeklyTSS);
    expect(rampRate).toBe(0);
  });
});

describe('calculateIntensityFactor', () => {
  it('should calculate IF correctly', () => {
    const if1 = calculateIntensityFactor(250, 250);
    expect(if1).toBe(1.0);
    
    const if2 = calculateIntensityFactor(163, 250);
    expect(if2).toBe(0.65);
    
    const if3 = calculateIntensityFactor(275, 250);
    expect(if3).toBe(1.1);
  });

  it('should throw error for zero FTP', () => {
    expect(() => calculateIntensityFactor(250, 0)).toThrow();
  });
});

describe('estimateNormalizedPower', () => {
  it('should add 5% to average power', () => {
    const np = estimateNormalizedPower(200);
    expect(np).toBe(210); // 200 × 1.05
  });
});

describe('calculatePlannedTSS', () => {
  it('should calculate TSS for simple steady workout', () => {
    const segments = [
      { duration_s: 600, intensity_ftp: 0.60 },   // 10min warmup
      { duration_s: 3000, intensity_ftp: 0.75 },  // 50min steady
    ];
    
    const tss = calculatePlannedTSS(segments, 250);
    
    // Warmup: ~6 TSS
    // Steady: ~47 TSS
    // Total: ~53 TSS
    expect(tss).toBeGreaterThan(50);
    expect(tss).toBeLessThan(60);
  });

  it('should calculate TSS for interval workout', () => {
    const segments = [
      { duration_s: 600, intensity_ftp: 0.60 },   // Warmup
      { duration_s: 600, intensity_ftp: 1.05 },   // First interval
      { duration_s: 300, intensity_ftp: 0.55 },   // Rest
      { duration_s: 600, intensity_ftp: 1.05 },   // Second interval
      { duration_s: 600, intensity_ftp: 0.50 },   // Cooldown
    ];
    
    const tss = calculatePlannedTSS(segments, 250);
    
    // Total ~49 TSS (relatively short workout with mixed intensities)
    expect(tss).toBeGreaterThan(45);
    expect(tss).toBeLessThan(55);
  });
});

describe('interpretTSB', () => {
  it('should interpret very fresh state', () => {
    const result = interpretTSB(20);
    expect(result.status).toBe('fresh');
    expect(result.color).toBe('green');
  });

  it('should interpret optimal training range', () => {
    const result = interpretTSB(-5);
    expect(result.status).toBe('optimal');
    expect(result.color).toBe('blue');
  });

  it('should interpret tired state', () => {
    const result = interpretTSB(-15);
    expect(result.status).toBe('tired');
    expect(result.color).toBe('yellow');
  });

  it('should interpret fatigued state', () => {
    const result = interpretTSB(-30);
    expect(result.status).toBe('fatigued');
    expect(result.color).toBe('red');
  });
});
