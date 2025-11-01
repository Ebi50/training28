/**
 * Unit Tests: Fitness Metrics
 * Tests EMA calculations, TSS, CTL/ATL/TSB
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTSS,
  calculateFitnessMetrics,
  forecastFitnessMetrics,
  getCombinedFitnessMetrics,
  interpretTSB,
} from '../../src/lib/fitnessMetrics';

describe('Fitness Metrics', () => {
  describe('TSS Calculation', () => {
    it('should calculate TSS from power data correctly', () => {
      const tss = calculateTSS({
        movingTimeSeconds: 3600, // 1 hour
        averagePower: 200,
        ftp: 250,
      });

      // IF = 200/250 = 0.8
      // TSS = (3600 * 200 * 0.8) / (250 * 3600) * 100 = 64
      expect(tss).toBeCloseTo(64, 1);
    });

    it('should calculate HRSS from heart rate data correctly', () => {
      const tss = calculateTSS({
        movingTimeSeconds: 3600,
        averageHeartRate: 144,
        lthr: 160,
      });

      // HR ratio = 144/160 = 0.9
      // HRSS ≈ 81
      expect(tss).toBeGreaterThan(75);
      expect(tss).toBeLessThan(90);
    });

    it('should return 0 TSS for invalid inputs', () => {
      const tss = calculateTSS({
        movingTimeSeconds: 0,
      });

      expect(tss).toBe(0);
    });
  });

  describe('CTL/ATL/TSB Calculation', () => {
    it('should calculate fitness metrics from activity history', () => {
      const activities = [
        { date: '2025-10-01', tss: 100 },
        { date: '2025-10-02', tss: 80 },
        { date: '2025-10-03', tss: 120 },
        { date: '2025-10-04', tss: 0 },
        { date: '2025-10-05', tss: 90 },
      ];

      const metrics = calculateFitnessMetrics(activities);

      expect(metrics).toHaveLength(5);
      expect(metrics[0]).toHaveProperty('ctl');
      expect(metrics[0]).toHaveProperty('atl');
      expect(metrics[0]).toHaveProperty('tsb');
      
      // CTL should increase over time with consistent training
      expect(metrics[4].ctl).toBeGreaterThan(metrics[0].ctl);
    });

    it('should maintain EMA time constants (42d for CTL, 7d for ATL)', () => {
      const activities = Array.from({ length: 60 }, (_, i) => ({
        date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
        tss: 100,
      }));

      const metrics = calculateFitnessMetrics(activities);

      // After 42 days of constant 100 TSS, CTL should approach 100
      const day42 = metrics[41];
      expect(day42.ctl).toBeGreaterThan(90);
      expect(day42.ctl).toBeLessThan(100);

      // ATL should stabilize much faster (7 days)
      const day14 = metrics[13];
      expect(day14.atl).toBeGreaterThan(95);
    });

    it('should calculate TSB as CTL - ATL', () => {
      const activities = [
        { date: '2025-10-01', tss: 100 },
      ];

      const metrics = calculateFitnessMetrics(activities);
      const latest = metrics[metrics.length - 1];

      expect(latest.tsb).toBeCloseTo(latest.ctl - latest.atl, 2);
    });
  });

  describe('Fitness Forecast', () => {
    it('should forecast future fitness metrics based on planned activities', () => {
      const forecast = forecastFitnessMetrics({
        currentCTL: 50,
        currentATL: 45,
        plannedActivities: [
          { date: '2025-11-01', tss: 100 },
          { date: '2025-11-02', tss: 80 },
          { date: '2025-11-03', tss: 120 },
        ],
      });

      expect(forecast).toHaveLength(3);
      expect(forecast[0].ctl).toBeGreaterThan(50); // CTL increases
      expect(forecast[2].ctl).toBeGreaterThan(forecast[0].ctl); // Continues to increase
    });

    it('should decrease fitness metrics with rest days', () => {
      const forecast = forecastFitnessMetrics({
        currentCTL: 60,
        currentATL: 55,
        plannedActivities: [
          { date: '2025-11-01', tss: 0 },
          { date: '2025-11-02', tss: 0 },
          { date: '2025-11-03', tss: 0 },
        ],
      });

      expect(forecast[2].ctl).toBeLessThan(60);
      expect(forecast[2].atl).toBeLessThan(55);
    });
  });

  describe('Combined Metrics', () => {
    it('should combine past and future metrics correctly', async () => {
      const pastActivities = [
        { date: '2025-10-25', tss: 100 },
        { date: '2025-10-26', tss: 80 },
      ];

      const plannedActivities = [
        { date: '2025-10-27', tss: 90 },
        { date: '2025-10-28', tss: 100 },
      ];

      const combined = getCombinedFitnessMetrics(pastActivities, plannedActivities);

      expect(combined.past).toHaveLength(2);
      expect(combined.forecast).toHaveLength(2);
      
      // Forecast should start from last past values
      const lastPast = combined.past[combined.past.length - 1];
      const firstForecast = combined.forecast[0];
      
      expect(firstForecast.ctl).toBeGreaterThanOrEqual(lastPast.ctl);
    });
  });

  describe('TSB Interpretation', () => {
    it('should interpret positive TSB as fresh/rested', () => {
      const result = interpretTSB(10);
      expect(result.status).toBe('fresh');
      expect(result.recommendation).toContain('optimal');
    });

    it('should interpret negative TSB as fatigued', () => {
      const result = interpretTSB(-15);
      expect(result.status).toBe('fatigued');
      expect(result.recommendation).toContain('recovery');
    });

    it('should interpret balanced TSB', () => {
      const result = interpretTSB(-3);
      expect(result.status).toBe('optimal');
    });
  });
});
