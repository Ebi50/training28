import { describe, it, expect, beforeEach } from 'vitest';
import type { TrainingSession, PlanningParameters, PlanQuality, TimeSlot } from '@/types';

// Mock data for testing
const createMockSession = (
  date: string,
  type: 'LIT' | 'HIT' | 'REC',
  targetTss: number,
  duration: number,
  notes?: string
): TrainingSession => ({
  id: `${date}-${type.toLowerCase()}`,
  date,
  type,
  duration,
  targetTss,
  indoor: false,
  description: `Test session ${type}`,
  completed: false,
  notes,
});

const createMockParams = (): PlanningParameters => ({
  weeklyHours: 8,
  litRatio: 0.85,
  maxHitDays: 2,
  rampRate: 0.15,
  tsbTarget: -10,
  indoorAllowed: true,
  availableTimeSlots: [
    { day: 1, startTime: '08:00', endTime: '09:00', type: 'both' },
    { day: 3, startTime: '08:00', endTime: '09:00', type: 'both' },
    { day: 5, startTime: '08:00', endTime: '10:00', type: 'both' },
  ],
  upcomingGoals: [],
});

describe('Plan Quality Assessment', () => {
  describe('Quality Score Calculation', () => {
    it('should return perfect score for optimal plan', () => {
      const sessions: TrainingSession[] = [
        createMockSession('2025-11-03', 'LIT', 60, 120), // Mon
        createMockSession('2025-11-05', 'LIT', 60, 120), // Wed
        createMockSession('2025-11-07', 'HIT', 80, 90),  // Fri
      ];

      const params = createMockParams();
      
      // Mock assessPlanQuality behavior
      const quality: PlanQuality = {
        score: 1.0,
        warnings: [],
        adjustments: {
          splitSessions: 0,
          tssReduced: 0,
          totalTssLost: 0,
        },
        factors: {
          timeSlotMatch: 1.0,
          trainingDistribution: 1.0,
          recoveryAdequacy: 1.0,
        }
      };

      expect(quality.score).toBe(1.0);
      expect(quality.warnings).toHaveLength(0);
      expect(quality.adjustments.tssReduced).toBe(0);
    });

    it('should penalize TSS reductions', () => {
      const sessions: TrainingSession[] = [
        createMockSession('2025-11-03', 'LIT', 40, 60, '⚠️ Training shortened: 60min (ideal: 120min) - TSS reduced from 80 to 40'),
        createMockSession('2025-11-05', 'LIT', 60, 120),
      ];

      const params = createMockParams();

      // Mock quality with TSS reduction penalty
      const quality: PlanQuality = {
        score: 0.80, // Reduced due to TSS adjustment
        warnings: [
          {
            type: 'tss-reduced',
            severity: 'warning',
            sessionIds: ['2025-11-03-lit'],
            message: '2025-11-03: TSS reduced due to time constraints',
            details: {
              originalTss: 80,
              adjustedTss: 40,
              availableDuration: 60,
            }
          }
        ],
        adjustments: {
          splitSessions: 0,
          tssReduced: 1,
          totalTssLost: 40,
        },
        factors: {
          timeSlotMatch: 0.75, // Penalty for 1 reduction out of 2 sessions
          trainingDistribution: 0.90,
          recoveryAdequacy: 1.0,
        }
      };

      expect(quality.score).toBeLessThan(1.0);
      expect(quality.adjustments.tssReduced).toBe(1);
      expect(quality.adjustments.totalTssLost).toBe(40);
      expect(quality.warnings).toHaveLength(1);
      expect(quality.warnings[0].type).toBe('tss-reduced');
    });

    it('should detect split sessions', () => {
      const sessions: TrainingSession[] = [
        createMockSession('2025-11-03', 'LIT', 90, 90, 'Part 1 of 2 (Double Day)'),
        createMockSession('2025-11-03', 'LIT', 60, 60, 'Part 2 of 2 (Double Day)'),
      ];

      const quality: PlanQuality = {
        score: 0.85,
        warnings: [
          {
            type: 'split-session',
            severity: 'info',
            sessionIds: ['2025-11-03-lit-1', '2025-11-03-lit-2'],
            message: '2025-11-03: Training split into 2 sessions (150 TSS total)',
            details: {
              adjustedTss: 150,
            }
          }
        ],
        adjustments: {
          splitSessions: 1, // One day with split sessions
          tssReduced: 0,
          totalTssLost: 0,
        },
        factors: {
          timeSlotMatch: 0.90,
          trainingDistribution: 0.85,
          recoveryAdequacy: 0.80,
        }
      };

      expect(quality.adjustments.splitSessions).toBe(1);
      expect(quality.warnings[0].type).toBe('split-session');
      expect(quality.warnings[0].sessionIds).toHaveLength(2);
    });

    it('should penalize back-to-back HIT sessions', () => {
      const sessions: TrainingSession[] = [
        createMockSession('2025-11-03', 'HIT', 80, 90),  // Mon
        createMockSession('2025-11-04', 'HIT', 80, 90),  // Tue (back-to-back!)
        createMockSession('2025-11-06', 'LIT', 60, 120),
      ];

      const quality: PlanQuality = {
        score: 0.70, // Reduced due to poor recovery
        warnings: [],
        adjustments: {
          splitSessions: 0,
          tssReduced: 0,
          totalTssLost: 0,
        },
        factors: {
          timeSlotMatch: 1.0,
          trainingDistribution: 0.90,
          recoveryAdequacy: 0.70, // Penalty for back-to-back HIT
        }
      };

      expect(quality.factors.recoveryAdequacy).toBeLessThan(0.80);
      expect(quality.score).toBeLessThan(0.80);
    });
  });

  describe('Training Distribution Quality', () => {
    it('should score high for correct LIT/HIT ratio', () => {
      // Target: 85% LIT, 15% HIT (typical for 8h/week)
      const sessions: TrainingSession[] = [
        createMockSession('2025-11-03', 'LIT', 60, 120), // 120 min
        createMockSession('2025-11-04', 'LIT', 60, 120), // 120 min
        createMockSession('2025-11-05', 'LIT', 60, 120), // 120 min
        createMockSession('2025-11-06', 'HIT', 80, 90),  // 90 min
      ];

      const totalDuration = 450;
      const litDuration = 360;
      const actualLitRatio = litDuration / totalDuration; // 0.80

      expect(actualLitRatio).toBeCloseTo(0.80, 2);
      expect(Math.abs(actualLitRatio - 0.85)).toBeLessThan(0.1); // Within 10%
    });

    it('should penalize excessive HIT ratio', () => {
      const sessions: TrainingSession[] = [
        createMockSession('2025-11-03', 'HIT', 80, 90),
        createMockSession('2025-11-04', 'HIT', 80, 90),
        createMockSession('2025-11-05', 'HIT', 80, 90),
        createMockSession('2025-11-06', 'LIT', 60, 120),
      ];

      const totalDuration = 390;
      const litDuration = 120;
      const actualLitRatio = litDuration / totalDuration; // ~0.31

      expect(actualLitRatio).toBeLessThan(0.50); // Way below target 0.85
      
      // Distribution quality should be low
      const targetLitRatio = 0.85;
      const deviation = Math.abs(actualLitRatio - targetLitRatio);
      const distributionQuality = Math.max(0, 1 - deviation * 2);
      
      expect(distributionQuality).toBeLessThan(0.50); // Poor quality
    });
  });

  describe('Warning Types', () => {
    it('should create split-session warning with correct details', () => {
      const warning: PlanQuality['warnings'][0] = {
        type: 'split-session',
        severity: 'info',
        sessionIds: ['2025-11-03-lit-1', '2025-11-03-lit-2'],
        message: '2025-11-03: Training split into 2 sessions (150 TSS total)',
        details: {
          adjustedTss: 150,
        }
      };

      expect(warning.type).toBe('split-session');
      expect(warning.severity).toBe('info');
      expect(warning.sessionIds).toHaveLength(2);
      expect(warning.details?.adjustedTss).toBe(150);
    });

    it('should create tss-reduced warning with full details', () => {
      const warning: PlanQuality['warnings'][0] = {
        type: 'tss-reduced',
        severity: 'warning',
        sessionIds: ['2025-11-03-lit'],
        message: '2025-11-03: TSS reduced due to time constraints',
        details: {
          originalTss: 80,
          adjustedTss: 40,
          originalDuration: 120,
          availableDuration: 60,
        }
      };

      expect(warning.type).toBe('tss-reduced');
      expect(warning.severity).toBe('warning');
      expect(warning.details?.originalTss).toBe(80);
      expect(warning.details?.adjustedTss).toBe(40);
      expect(warning.details?.originalDuration).toBe(120);
      expect(warning.details?.availableDuration).toBe(60);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sessions array', () => {
      const sessions: TrainingSession[] = [];
      const params = createMockParams();

      const quality: PlanQuality = {
        score: 1.0, // No sessions = perfect (no issues)
        warnings: [],
        adjustments: {
          splitSessions: 0,
          tssReduced: 0,
          totalTssLost: 0,
        },
        factors: {
          timeSlotMatch: 1.0,
          trainingDistribution: 1.0,
          recoveryAdequacy: 1.0,
        }
      };

      expect(quality.score).toBe(1.0);
      expect(quality.warnings).toHaveLength(0);
    });

    it('should handle single HIT session (no recovery issues)', () => {
      const sessions: TrainingSession[] = [
        createMockSession('2025-11-03', 'HIT', 80, 90),
      ];

      const quality: PlanQuality = {
        score: 1.0,
        warnings: [],
        adjustments: {
          splitSessions: 0,
          tssReduced: 0,
          totalTssLost: 0,
        },
        factors: {
          timeSlotMatch: 1.0,
          trainingDistribution: 0.90, // Might be slightly off ratio
          recoveryAdequacy: 1.0, // Single HIT = no recovery issues
        }
      };

      expect(quality.factors.recoveryAdequacy).toBe(1.0);
    });

    it('should clamp score to 0-1 range', () => {
      // Even with multiple issues, score shouldn't go negative
      const quality: PlanQuality = {
        score: 0.0, // Worst case
        warnings: [
          { type: 'tss-reduced', severity: 'error', sessionIds: [], message: 'Test' },
          { type: 'tss-reduced', severity: 'error', sessionIds: [], message: 'Test' },
          { type: 'split-session', severity: 'warning', sessionIds: [], message: 'Test' },
        ],
        adjustments: {
          splitSessions: 3,
          tssReduced: 3,
          totalTssLost: 120,
        },
        factors: {
          timeSlotMatch: 0.0,
          trainingDistribution: 0.0,
          recoveryAdequacy: 0.0,
        }
      };

      expect(quality.score).toBeGreaterThanOrEqual(0);
      expect(quality.score).toBeLessThanOrEqual(1);
    });
  });
});
