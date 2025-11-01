import { describe, it, expect } from 'vitest';
import {
  calculatePhase,
  getWeeklyTssTarget,
  getProgressiveTss,
  isRecoveryWeek,
  getRecoveryWeekTss,
} from '../../src/lib/phaseCalculator';

describe('Phase Calculator', () => {
  const today = new Date('2024-01-01');

  describe('calculatePhase', () => {
    it('should return MAINTENANCE when no event date', () => {
      const result = calculatePhase(null, today);
      expect(result.phase).toBe('MAINTENANCE');
      expect(result.weeksToEvent).toBe(0);
      expect(result.categoryDistribution.LIT).toBe(0.60);
    });

    it('should return MAINTENANCE when event is in the past', () => {
      const pastEvent = new Date('2023-12-01');
      const result = calculatePhase(pastEvent, today);
      expect(result.phase).toBe('MAINTENANCE');
      expect(result.weeksToEvent).toBe(0);
    });

    it('should return BASE when event is 16+ weeks away', () => {
      const eventDate = new Date('2024-05-01'); // ~17 weeks
      const result = calculatePhase(eventDate, today);
      expect(result.phase).toBe('BASE');
      expect(result.weeksToEvent).toBeGreaterThanOrEqual(16);
      expect(result.categoryDistribution.LIT).toBe(0.80);
    });

    it('should return BUILD when event is 8-16 weeks away', () => {
      const eventDate = new Date('2024-03-01'); // ~9 weeks
      const result = calculatePhase(eventDate, today);
      expect(result.phase).toBe('BUILD');
      expect(result.weeksToEvent).toBeGreaterThanOrEqual(8);
      expect(result.weeksToEvent).toBeLessThan(16);
      expect(result.categoryDistribution.LIT).toBe(0.50);
      expect(result.categoryDistribution.TEMPO).toBe(0.15);
    });

    it('should return PEAK when event is 3-8 weeks away', () => {
      const eventDate = new Date('2024-01-29'); // ~4 weeks
      const result = calculatePhase(eventDate, today);
      expect(result.phase).toBe('PEAK');
      expect(result.weeksToEvent).toBeGreaterThanOrEqual(3);
      expect(result.weeksToEvent).toBeLessThan(8);
      expect(result.categoryDistribution.FTP).toBe(0.20);
      expect(result.categoryDistribution.VO2MAX).toBe(0.15);
    });

    it('should return TAPER when event is 0-3 weeks away', () => {
      const eventDate = new Date('2024-01-15'); // ~2 weeks
      const result = calculatePhase(eventDate, today);
      expect(result.phase).toBe('TAPER');
      expect(result.weeksToEvent).toBeGreaterThan(0);
      expect(result.weeksToEvent).toBeLessThan(3);
    });

    it('should have valid category distribution percentages', () => {
      const eventDate = new Date('2024-03-01');
      const result = calculatePhase(eventDate, today);
      
      const dist = result.categoryDistribution;
      const total = dist.LIT + dist.TEMPO + dist.FTP + dist.VO2MAX + 
                   dist.ANAEROBIC + dist.NEUROMUSCULAR + dist.SKILL + dist.RECOVERY;
      
      expect(total).toBeCloseTo(1.0, 2);
    });
  });

  describe('getWeeklyTssTarget', () => {
    it('should return BASE phase TSS target', () => {
      const result = getWeeklyTssTarget('BASE', 400);
      expect(result.min).toBe(360);
      expect(result.target).toBe(400);
      expect(result.max).toBe(440);
    });

    it('should return BUILD phase TSS target (higher load)', () => {
      const result = getWeeklyTssTarget('BUILD', 400);
      expect(result.min).toBe(380);
      expect(result.target).toBe(440);
      expect(result.max).toBe(480);
    });

    it('should return TAPER phase TSS target (reduced)', () => {
      const result = getWeeklyTssTarget('TAPER', 400);
      expect(result.min).toBe(160);
      expect(result.target).toBe(200);
      expect(result.max).toBe(240);
    });

    it('should return MAINTENANCE phase TSS target', () => {
      const result = getWeeklyTssTarget('MAINTENANCE', 400);
      expect(result.min).toBe(280);
      expect(result.target).toBe(320);
      expect(result.max).toBe(360);
    });
  });

  describe('getProgressiveTss', () => {
    it('should return start TSS for week 1', () => {
      const result = getProgressiveTss(1, 8, 300, 500);
      expect(result).toBe(325); // 300 + (200 * 1/8)
    });

    it('should return mid-point TSS for week 4 of 8', () => {
      const result = getProgressiveTss(4, 8, 300, 500);
      expect(result).toBe(400); // 300 + (200 * 4/8)
    });

    it('should return target TSS for final week', () => {
      const result = getProgressiveTss(8, 8, 300, 500);
      expect(result).toBe(500);
    });

    it('should handle edge cases', () => {
      expect(getProgressiveTss(0, 8, 300, 500)).toBe(300);
      expect(getProgressiveTss(10, 8, 300, 500)).toBe(300);
    });
  });

  describe('isRecoveryWeek', () => {
    it('should identify recovery weeks with default frequency', () => {
      expect(isRecoveryWeek(4)).toBe(true);
      expect(isRecoveryWeek(8)).toBe(true);
      expect(isRecoveryWeek(12)).toBe(true);
    });

    it('should identify non-recovery weeks', () => {
      expect(isRecoveryWeek(1)).toBe(false);
      expect(isRecoveryWeek(2)).toBe(false);
      expect(isRecoveryWeek(3)).toBe(false);
      expect(isRecoveryWeek(5)).toBe(false);
    });

    it('should support custom frequency', () => {
      expect(isRecoveryWeek(3, 3)).toBe(true);
      expect(isRecoveryWeek(6, 3)).toBe(true);
      expect(isRecoveryWeek(4, 3)).toBe(false);
    });
  });

  describe('getRecoveryWeekTss', () => {
    it('should reduce TSS by default 40%', () => {
      const result = getRecoveryWeekTss(400);
      expect(result).toBe(240); // 400 * 0.6
    });

    it('should support custom reduction percentage', () => {
      const result = getRecoveryWeekTss(400, 0.5);
      expect(result).toBe(200); // 400 * 0.5
    });

    it('should handle small TSS values', () => {
      const result = getRecoveryWeekTss(100);
      expect(result).toBe(60);
    });
  });

  describe('Integration: Full training cycle', () => {
    it('should calculate correct phases for 20-week training plan', () => {
      const eventDate = new Date('2024-05-20'); // ~20 weeks from Jan 1

      // Week 1 (20 weeks out) - BASE
      const week1 = calculatePhase(eventDate, today);
      expect(week1.phase).toBe('BASE');

      // Week 12 (8 weeks out) - BUILD
      const week12Date = new Date('2024-03-18');
      const week12 = calculatePhase(eventDate, week12Date);
      expect(week12.phase).toBe('BUILD');

      // Week 17 (3 weeks out) - PEAK
      const week17Date = new Date('2024-04-29');
      const week17 = calculatePhase(eventDate, week17Date);
      expect(week17.phase).toBe('PEAK');

      // Week 19 (1 week out) - TAPER
      const week19Date = new Date('2024-05-13');
      const week19 = calculatePhase(eventDate, week19Date);
      expect(week19.phase).toBe('TAPER');
    });

    it('should have decreasing LIT percentage as event approaches', () => {
      const eventDate = new Date('2024-05-20');
      
      const base = calculatePhase(eventDate, new Date('2024-01-01'));
      const build = calculatePhase(eventDate, new Date('2024-03-18'));
      const peak = calculatePhase(eventDate, new Date('2024-04-29'));
      
      expect(base.categoryDistribution.LIT).toBeGreaterThan(build.categoryDistribution.LIT);
      expect(build.categoryDistribution.LIT).toBeGreaterThan(peak.categoryDistribution.LIT);
    });

    it('should have increasing intensity as event approaches', () => {
      const eventDate = new Date('2024-05-20');
      
      const base = calculatePhase(eventDate, new Date('2024-01-01'));
      const peak = calculatePhase(eventDate, new Date('2024-04-29'));
      
      const baseIntensity = base.categoryDistribution.FTP + base.categoryDistribution.VO2MAX;
      const peakIntensity = peak.categoryDistribution.FTP + peak.categoryDistribution.VO2MAX;
      
      expect(peakIntensity).toBeGreaterThan(baseIntensity);
    });
  });
});
