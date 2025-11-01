/**
 * Unit Tests: Plan Generator
 * Tests training plan generation logic
 */

import { describe, it, expect } from 'vitest';
import { TrainingPlanGenerator, calculateTrainingLoad } from '../../src/lib/planGenerator';
import { PlanningParameters, DailyMetrics } from '../../src/types';

describe('Plan Generator', () => {
  describe('Training Load Calculation', () => {
    it('should calculate CTL, ATL, TSB from TSS history', () => {
      const tssHistory = Array.from({ length: 14 }, (_, i) => ({
        date: new Date(2025, 10, i + 1).toISOString().split('T')[0],
        tss: 80,
      }));

      const loadMetrics = calculateTrainingLoad(tssHistory);

      expect(loadMetrics).toHaveLength(14);
      expect(loadMetrics[0]).toHaveProperty('ctl');
      expect(loadMetrics[0]).toHaveProperty('atl');
      expect(loadMetrics[0]).toHaveProperty('tsb');
    });

    it('should handle empty TSS history', () => {
      const loadMetrics = calculateTrainingLoad([]);
      expect(loadMetrics).toEqual([]);
    });
  });

  describe('Weekly Plan Generation', () => {
    it('should generate a complete weekly plan', async () => {
      const generator = new TrainingPlanGenerator();
      
      const params: PlanningParameters = {
        weeklyHours: 8,
        litRatio: 0.85,
        maxHitDays: 2,
        rampRate: 0.1,
        tsbTarget: 0,
        indoorAllowed: true,
        availableTimeSlots: [],
        upcomingGoals: [],
      };

      const previousMetrics: DailyMetrics[] = [
        {
          date: '2025-11-01',
          ctl: 50,
          atl: 45,
          tsb: 5,
          tss: 80,
          indoor: false,
        },
      ];

      const mockUserProfile = {
        ftp: 250,
        lthr: 165,
        weight: 75,
        birthDate: '1990-01-01',
        preferences: {
          indoorAllowed: true,
          availableDevices: [],
          preferredTrainingTimes: [],
        },
      };

      const plan = await generator.generateWeeklyPlan(
        'test-user',
        new Date(2025, 10, 2),
        params,
        previousMetrics,
        mockUserProfile,
        [],
        undefined
      );

      expect(plan).toBeDefined();
      expect(plan.sessions).toBeInstanceOf(Array);
      expect(plan.totalHours).toBeGreaterThan(0);
      expect(plan.totalTss).toBeGreaterThan(0);
    });

    it('should respect LIT ratio parameter', async () => {
      const generator = new TrainingPlanGenerator();
      
      const params: PlanningParameters = {
        weeklyHours: 10,
        litRatio: 0.90, // 90% LIT
        maxHitDays: 1,
        rampRate: 0.1,
        tsbTarget: 0,
        indoorAllowed: true,
        availableTimeSlots: [],
        upcomingGoals: [],
      };

      const mockUserProfile = {
        ftp: 250,
        lthr: 165,
        weight: 75,
        birthDate: '1990-01-01',
        preferences: {
          indoorAllowed: true,
          availableDevices: [],
          preferredTrainingTimes: [],
        },
      };

      const plan = await generator.generateWeeklyPlan(
        'test-user',
        new Date(2025, 10, 2),
        params,
        [],
        mockUserProfile,
        [],
        undefined
      );

      expect(plan.litRatio).toBeGreaterThanOrEqual(0.85);
      expect(plan.hitSessions).toBeLessThanOrEqual(2);
    });
  });
});
