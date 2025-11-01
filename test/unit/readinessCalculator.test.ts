/**
 * Unit Tests: Readiness Calculator
 * Tests morning check and readiness calculations
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateReadinessScore,
  interpretReadiness,
  recommendWorkoutType,
  shouldForceRecovery,
} from '../../src/lib/readinessCalculator';
import { MorningCheck, DailyMetrics } from '../../src/types';

describe('Readiness Calculator', () => {
  describe('Readiness Score Calculation', () => {
    it('should calculate high readiness for good metrics', () => {
      const check: MorningCheck = {
        userId: 'test-user',
        date: '2025-11-01',
        sleepQuality: 4,
        sleepHours: 8,
        stressLevel: 1,
        musclesSoreness: 1,
        motivation: 5,
        restingHr: 50,
        hrvScore: 80,
      };

      const score = calculateReadinessScore(check);

      expect(score).toBeGreaterThanOrEqual(70);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate low readiness for poor metrics', () => {
      const check: MorningCheck = {
        userId: 'test-user',
        date: '2025-11-01',
        sleepQuality: 2,
        sleepHours: 5,
        stressLevel: 4,
        musclesSoreness: 4,
        motivation: 2,
        restingHr: 65,
        hrvScore: 40,
      };

      const score = calculateReadinessScore(check);

      expect(score).toBeLessThan(65);
    });

    it('should handle optional metrics gracefully', () => {
      const check: MorningCheck = {
        userId: 'test-user',
        date: '2025-11-01',
        sleepQuality: 4,
        sleepHours: 8,
        stressLevel: 2,
        musclesSoreness: 2,
        motivation: 4,
      };

      const score = calculateReadinessScore(check);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Readiness Interpretation', () => {
    it('should interpret high score as good readiness', () => {
      const result = interpretReadiness(90);

      expect(result.color).toBe('green');
      expect(result.message).toContain('Excellent');
    });

    it('should interpret low score as poor readiness', () => {
      const result = interpretReadiness(40);

      expect(result.color).toBe('red');
      expect(result.message).toContain('recovery');
    });

    it('should interpret medium score appropriately', () => {
      const result = interpretReadiness(65);

      expect(result.color).toBe('yellow');
    });
  });

  describe('Workout Recommendations', () => {
    it('should recommend high intensity for high readiness', () => {
      const check: MorningCheck = {
        userId: 'test-user',
        date: '2025-11-01',
        sleepQuality: 5,
        sleepHours: 8,
        stressLevel: 1,
        musclesSoreness: 1,
        motivation: 5,
      };

      const recommendation = recommendWorkoutType(check);

      expect(recommendation.canDoHIT).toBe(true);
    });

    it('should recommend recovery for low readiness', () => {
      const check: MorningCheck = {
        userId: 'test-user',
        date: '2025-11-01',
        sleepQuality: 2,
        sleepHours: 5,
        stressLevel: 4,
        musclesSoreness: 4,
        motivation: 2,
      };

      const recommendation = recommendWorkoutType(check);

      expect(recommendation.canDoHIT).toBe(false);
      expect(recommendation.suggestedType).toBe('Recovery');
    });
  });

  describe('Force Recovery Logic', () => {
    it('should force recovery when readiness is consistently low', () => {
      const check: MorningCheck = {
        userId: 'test-user',
        date: '2025-11-05',
        sleepQuality: 2,
        sleepHours: 5,
        stressLevel: 4,
        musclesSoreness: 4,
        motivation: 2,
      };

      const metrics: DailyMetrics[] = [
        {
          date: '2025-11-01',
          ctl: 60,
          atl: 70,
          tsb: -10,
          tss: 100,
          indoor: false,
        },
        {
          date: '2025-11-02',
          ctl: 61,
          atl: 72,
          tsb: -11,
          tss: 120,
          indoor: false,
        },
        {
          date: '2025-11-03',
          ctl: 62,
          atl: 75,
          tsb: -13,
          tss: 130,
          indoor: false,
        },
      ];

      const result = shouldForceRecovery(check, metrics);

      expect(result.shouldForceRecovery).toBe(true);
      expect(result.reason).toBeDefined();
    });
  });
});
