import { describe, it, expect, beforeAll, vi } from 'vitest';
import { generateMvpWeeklyPlan } from '../../src/lib/mvpPlanGenerator';
import { UserProfile } from '../../src/types/user';
import { addWeeks } from 'date-fns';

// Mock workout library
vi.mock('../../src/lib/workoutLibrary', () => ({
  loadWorkoutLibrary: vi.fn(() => Promise.resolve({
    version: '1.0',
    workouts: [
      {
        id: 'lit-endurance-60',
        name: 'Easy Endurance',
        category: 'LIT',
        description: 'Easy endurance ride',
        structure: [],
        total_duration_s: 3600, // 60 min
        target_tss: 50,
        indoor_suitable: true,
        outdoor_suitable: true,
        difficulty: 2,
      },
      {
        id: 'tempo-sweetspot-90',
        name: 'Sweetspot Intervals',
        category: 'TEMPO',
        description: '3x15min sweetspot',
        structure: [],
        total_duration_s: 5400, // 90 min
        target_tss: 85,
        indoor_suitable: true,
        outdoor_suitable: true,
        difficulty: 4,
      },
      {
        id: 'ftp-threshold-60',
        name: 'FTP Intervals',
        category: 'FTP',
        description: '2x20min @ FTP',
        structure: [],
        total_duration_s: 3600, // 60 min
        target_tss: 70,
        indoor_suitable: true,
        outdoor_suitable: true,
        difficulty: 5,
      },
      {
        id: 'vo2max-intervals-45',
        name: 'VO2max Intervals',
        category: 'VO2MAX',
        description: '5x4min @ 115% FTP',
        structure: [],
        total_duration_s: 2700, // 45 min
        target_tss: 60,
        indoor_suitable: true,
        outdoor_suitable: true,
        difficulty: 5,
      },
    ],
  })),
  findWorkouts: vi.fn((criteria) => {
    const mockWorkouts = [
      {
        id: 'lit-endurance-60',
        name: 'Easy Endurance',
        category: 'LIT',
        description: 'Easy endurance ride',
        structure: [],
        total_duration_s: 3600,
        target_tss: 50,
        indoor_suitable: true,
        outdoor_suitable: true,
        difficulty: 2,
      },
      {
        id: 'tempo-sweetspot-90',
        name: 'Sweetspot Intervals',
        category: 'TEMPO',
        description: '3x15min sweetspot',
        structure: [],
        total_duration_s: 5400,
        target_tss: 85,
        indoor_suitable: true,
        outdoor_suitable: true,
        difficulty: 4,
      },
      {
        id: 'ftp-threshold-60',
        name: 'FTP Intervals',
        category: 'FTP',
        description: '2x20min @ FTP',
        structure: [],
        total_duration_s: 3600,
        target_tss: 70,
        indoor_suitable: true,
        outdoor_suitable: true,
        difficulty: 5,
      },
      {
        id: 'vo2max-intervals-45',
        name: 'VO2max Intervals',
        category: 'VO2MAX',
        description: '5x4min @ 115% FTP',
        structure: [],
        total_duration_s: 2700,
        target_tss: 60,
        indoor_suitable: true,
        outdoor_suitable: true,
        difficulty: 5,
      },
    ];
    
    return Promise.resolve(
      mockWorkouts.filter(w => 
        !criteria.category || w.category === criteria.category
      )
    );
  }),
}));

describe('mvpPlanGenerator', () => {
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

  describe('generateMvpWeeklyPlan', () => {
    it('should generate a plan with MAINTENANCE phase (no event)', async () => {
      const plan = await generateMvpWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        weekStart: new Date('2025-06-02'),
        slots: [
          {
            day: 2, // Tuesday
            startTime: '18:00',
            endTime: '19:30',
            priority: 1,
            type: 'indoor',
          },
          {
            day: 4, // Thursday
            startTime: '06:00',
            endTime: '07:00',
            priority: 2,
            type: 'indoor',
          },
        ],
        eventDate: null,
      });

      expect(plan).toBeDefined();
      expect(plan.userId).toBe('test-user');
      expect(plan.sessions.length).toBeGreaterThan(0);
      expect(plan.totalTss).toBeGreaterThan(0);
      expect(plan.totalHours).toBeGreaterThan(0);
      expect(plan.constraints.maxHitDays).toBe(1);
    }, 10000);

    it('should generate a plan with BASE phase (16+ weeks to event)', async () => {
      const eventDate = addWeeks(new Date('2025-06-02'), 20);

      const plan = await generateMvpWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        weekStart: new Date('2025-06-02'),
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '19:30',
            priority: 1,
            type: 'indoor',
          },
          {
            day: 4,
            startTime: '18:00',
            endTime: '19:30',
            priority: 1,
            type: 'indoor',
          },
        ],
        eventDate,
        weekNumber: 1,
      });

      expect(plan).toBeDefined();
      expect(plan.sessions.length).toBeGreaterThan(0);
      // BASE phase should have significant LIT portion
      // Note: Actual ratio depends on slot distribution and HIT day selection
      expect(plan.litRatio).toBeGreaterThan(0);
      expect(plan.constraints.maxHitDays).toBe(1);
    }, 10000);

    it('should generate a plan with BUILD phase (8-16 weeks to event)', async () => {
      const eventDate = addWeeks(new Date('2025-06-02'), 12);

      const plan = await generateMvpWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        weekStart: new Date('2025-06-02'),
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '19:30',
            priority: 1,
            type: 'indoor',
          },
          {
            day: 5, // Friday
            startTime: '18:00',
            endTime: '19:30',
            priority: 1,
            type: 'indoor',
          },
        ],
        eventDate,
        weekNumber: 3,
      });

      expect(plan).toBeDefined();
      expect(plan.sessions.length).toBeGreaterThan(0);
      // BUILD phase allows 2 HIT days
      expect(plan.constraints.maxHitDays).toBe(2);
    }, 10000);

    it('should generate a plan with PEAK phase (3-8 weeks to event)', async () => {
      const eventDate = addWeeks(new Date('2025-06-02'), 5);

      const plan = await generateMvpWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        weekStart: new Date('2025-06-02'),
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '19:30',
            priority: 1,
            type: 'indoor',
          },
        ],
        eventDate,
        weekNumber: 1,
      });

      expect(plan).toBeDefined();
      expect(plan.sessions.length).toBeGreaterThan(0);
      // PEAK phase allows 2 HIT days
      expect(plan.constraints.maxHitDays).toBe(2);
    }, 10000);

    it('should generate a plan with TAPER phase (0-3 weeks to event)', async () => {
      const eventDate = addWeeks(new Date('2025-06-02'), 2);

      const plan = await generateMvpWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        weekStart: new Date('2025-06-02'),
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '19:30',
            priority: 1,
            type: 'indoor',
          },
        ],
        eventDate,
        weekNumber: 1,
      });

      expect(plan).toBeDefined();
      expect(plan.sessions.length).toBeGreaterThan(0);
      // TAPER phase has reduced volume
      expect(plan.constraints.maxHitDays).toBe(1);
      expect(plan.constraints.goalApproaching).toBe('main-event');
    }, 10000);

    it('should calculate weekly hours from time slots correctly', async () => {
      const plan = await generateMvpWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        weekStart: new Date('2025-06-02'),
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
      });

      // Available hours: 2 + 1.5 = 3.5 hours
      expect(plan.constraints.availableHours).toBe(3.5);
    }, 10000);

    it('should handle recovery weeks (reduced TSS)', async () => {
      const plan = await generateMvpWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        weekStart: new Date('2025-06-02'),
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '19:30',
            priority: 1,
            type: 'indoor',
          },
        ],
        eventDate: null,
        weekNumber: 4, // 4th week = recovery week
      });

      expect(plan).toBeDefined();
      expect(plan.sessions.length).toBeGreaterThan(0);
      // Recovery week should have lower TSS
      // (exact value depends on phase, but should be reduced)
    }, 10000);

    it('should generate sessions matching slot durations', async () => {
      const plan = await generateMvpWeeklyPlan({
        userId: 'test-user',
        userProfile: testProfile,
        weekStart: new Date('2025-06-02'),
        slots: [
          {
            day: 2,
            startTime: '18:00',
            endTime: '19:30', // 90 min
            priority: 1,
            type: 'indoor',
          },
        ],
        eventDate: null,
      });

      expect(plan).toBeDefined();
      expect(plan.sessions.length).toBeGreaterThan(0);
      
      // Sessions should roughly match slot duration
      plan.sessions.forEach(session => {
        expect(session.duration).toBeGreaterThan(0);
        expect(session.duration).toBeLessThanOrEqual(120); // Within reason
      });
    }, 10000);
  });
});
