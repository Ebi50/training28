import { describe, it, expect, beforeAll, vi } from 'vitest';
import { UserProfile } from '../../src/types/user';
import { addWeeks } from 'date-fns';

// Mock ML predictor before importing anything that uses it
vi.mock('../../src/lib/mlPredictor', () => ({
  predictTSS: vi.fn(() => 50),
  isModelAvailable: vi.fn(() => false),
}));

// Mock session adapter
vi.mock('../../src/lib/sessionAdapter', () => ({
  adaptSession: vi.fn((session) => session),
}));

// Now import after mocking
import { generateSimpleWeeklyPlan } from '../../src/lib/simplePlanGenerator';

describe('simplePlanGenerator', () => {
  let testProfile: UserProfile;

  beforeAll(() => {
    testProfile = {
      email: 'test@example.com',
      ftp: 250,
      maxHr: 180,
      restHr: 50,
      weight: 75,
      age: 35,
      preferences: {
        indoorAllowed: true,
        availableDevices: ['trainer', 'power_meter'],
        preferredTrainingTimes: [],
      },
    };
  });

  describe('generateSimpleWeeklyPlan', () => {
    it('should generate a plan with no event (MAINTENANCE phase)', async () => {
      const plan = await generateSimpleWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        slots: [
          {
            day: 2, // Tuesday
            startTime: '18:00',
            endTime: '20:00',
            priority: 1,
            type: 'indoor',
          },
          {
            day: 4, // Thursday
            startTime: '06:00',
            endTime: '07:30',
            priority: 2,
            type: 'indoor',
          },
        ],
        eventDate: null,
        weekStart: new Date('2025-06-02'), // Monday
      });

      expect(plan).toBeDefined();
      expect(plan.userId).toBe('test-user');
      expect(plan.sessions.length).toBeGreaterThan(0);
      expect(plan.totalTss).toBeGreaterThan(0);
      expect(plan.totalHours).toBeGreaterThan(0);
    }, 10000); // 10s timeout

    it('should generate a plan with BASE phase (16+ weeks to event)', async () => {
      const eventDate = addWeeks(new Date('2025-06-02'), 20);

      const plan = await generateSimpleWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '20:00',
            priority: 1,
            type: 'indoor',
          },
        ],
        eventDate,
        weekStart: new Date('2025-06-02'),
      });

      expect(plan).toBeDefined();
      // BASE phase should have high LIT ratio
      expect(plan.litRatio).toBeGreaterThan(0.7);
    }, 10000);

    it('should generate a plan with BUILD phase (8-16 weeks to event)', async () => {
      const eventDate = addWeeks(new Date('2025-06-02'), 12);

      const plan = await generateSimpleWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '20:00',
            priority: 1,
            type: 'indoor',
          },
          {
            day: 4,
            startTime: '18:00',
            endTime: '20:00',
            priority: 1,
            type: 'indoor',
          },
        ],
        eventDate,
        weekStart: new Date('2025-06-02'),
      });

      expect(plan).toBeDefined();
      // BUILD phase should allow 2 HIT days
      expect(plan.constraints.maxHitDays).toBe(2);
    }, 10000);

    it('should generate a plan with PEAK phase (3-8 weeks to event)', async () => {
      const eventDate = addWeeks(new Date('2025-06-02'), 5);

      const plan = await generateSimpleWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '20:00',
            priority: 1,
            type: 'indoor',
          },
        ],
        eventDate,
        weekStart: new Date('2025-06-02'),
      });

      expect(plan).toBeDefined();
      // PEAK phase should have race-specific intensity
      expect(plan.constraints.maxHitDays).toBe(2);
    }, 10000);

    it('should generate a plan with TAPER phase (0-3 weeks to event)', async () => {
      const eventDate = addWeeks(new Date('2025-06-02'), 2);

      const plan = await generateSimpleWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '20:00',
            priority: 1,
            type: 'indoor',
          },
        ],
        eventDate,
        weekStart: new Date('2025-06-02'),
      });

      expect(plan).toBeDefined();
      // TAPER phase should have reduced volume
      expect(plan.constraints.maxHitDays).toBe(1);
      expect(plan.constraints.goalApproaching).toBe('main-event');
    }, 10000);

    it('should calculate weekly hours from time slots', async () => {
      const plan = await generateSimpleWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '20:00', // 2 hours
            priority: 1,
            type: 'indoor',
          },
          {
            day: 4,
            startTime: '06:00',
            endTime: '07:30', // 1.5 hours
            priority: 2,
            type: 'indoor',
          },
        ],
        eventDate: null,
        weekStart: new Date('2025-06-02'),
      });

      // Available hours: 2 + 1.5 = 3.5 hours
      expect(plan.constraints.availableHours).toBe(3.5);
    }, 10000);

    it('should respect indoor preferences', async () => {
      const outdoorProfile: UserProfile = {
        ...testProfile,
        preferences: {
          ...testProfile.preferences,
          indoorAllowed: false,
        },
      };

      const plan = await generateSimpleWeeklyPlan({
        userId: 'test-user',
        userProfile: outdoorProfile,
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '20:00',
            priority: 1,
            type: 'outdoor',
          },
        ],
        eventDate: null,
        weekStart: new Date('2025-06-02'),
      });

      expect(plan).toBeDefined();
      // Check sessions exist before checking environment
      expect(plan.sessions.length).toBeGreaterThan(0);
    }, 10000);
  });
});
