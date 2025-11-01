/**
 * End-to-End Test: MVP Plan Generation Flow
 * 
 * Tests the complete flow:
 * 1. Generate 12-week plan using MVP generator
 * 2. Verify sessions created for all phases
 * 3. Verify Today's Workout Card would display correctly
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateMvpWeeklyPlan } from '@/lib/mvpPlanGenerator';
import type { UserProfile, TimeSlot, SeasonGoal } from '@/types/user';
import type { WeeklyPlan } from '@/types/plan';
import { addDays, format } from 'date-fns';

describe('E2E: MVP Plan Generation Flow', () => {
  let testProfile: UserProfile;
  let testSlots: TimeSlot[];
  let eventDate: Date;

  beforeAll(() => {
    // Setup test user profile
    testProfile = {
      email: 'test@cyclona.app',
      ftp: 250,
      lthr: 165,
      maxHr: 185,
      restHr: 45,
      weight: 75,
      preferences: {
        indoorAllowed: true,
        availableDevices: ['trainer', 'power_meter', 'hr_monitor'],
        preferredTrainingTimes: [],
        units: 'metric',
        timezone: 'Europe/Berlin',
        language: 'de'
      }
    };

    // Setup realistic time slots (Tuesday, Thursday, Saturday, Sunday)
    testSlots = [
      { day: 2, startTime: '18:00', endTime: '20:00', type: 'indoor', priority: 2 },  // Tue 2h
      { day: 4, startTime: '18:00', endTime: '19:30', type: 'indoor', priority: 2 },  // Thu 1.5h
      { day: 6, startTime: '08:00', endTime: '12:00', type: 'outdoor', priority: 1 }, // Sat 4h
      { day: 0, startTime: '09:00', endTime: '12:00', type: 'outdoor', priority: 1 }  // Sun 3h
    ];

    // Event in 12 weeks (BUILD phase)
    eventDate = addDays(new Date(), 12 * 7);
  });

  it('should generate 12 weeks of training plan', async () => {
    const weeks: WeeklyPlan[] = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // Generate 12 weeks
    for (let weekNum = 1; weekNum <= 12; weekNum++) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + (weekNum - 1) * 7);

      const weekPlan = await generateMvpWeeklyPlan({
        userId: 'test-user-123',
        userProfile: testProfile,
        weekStart: weekStartDate,
        slots: testSlots,
        eventDate,
        weekNumber: weekNum
      });

      weeks.push(weekPlan);
    }

    // Verify we got 12 weeks
    expect(weeks).toHaveLength(12);

    // Verify each week has sessions
    weeks.forEach((week, index) => {
      expect(week.sessions.length).toBeGreaterThan(0);
      expect(week.sessions.length).toBeLessThanOrEqual(4); // Max 4 slots
      
      console.log(`Week ${index + 1}: ${week.sessions.length} sessions, Total TSS: ${week.totalTss}`);
    });

    // Verify first week has sessions
    const firstWeek = weeks[0];
    expect(firstWeek.sessions.length).toBeGreaterThan(0);

    // Verify sessions have required fields
    firstWeek.sessions.forEach(session => {
      expect(session.date).toBeDefined();
      expect(session.type).toMatch(/^(HIT|LIT|REC)$/);
      expect(session.duration).toBeGreaterThan(0);
      expect(session.targetTss).toBeGreaterThan(0);
      expect(session.description).toBeDefined();
    });
  }, 60000); // 60s timeout for async operations

  it('should have today\'s workout available', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekPlan = await generateMvpWeeklyPlan({
      userId: 'test-user-123',
      userProfile: testProfile,
      weekStart: today,
      slots: testSlots,
      eventDate,
      weekNumber: 1
    });

    // Find today's session
    const todayISO = format(today, 'yyyy-MM-dd');
    const todaySession = weekPlan.sessions.find(
      session => session.date.startsWith(todayISO)
    );

    // If today is a training day (Tue/Thu/Sat/Sun), we should have a session
    const todayDay = today.getDay();
    const isTrainingDay = [0, 2, 4, 6].includes(todayDay);

    if (isTrainingDay) {
      expect(todaySession).toBeDefined();
      if (todaySession) {
        console.log('Today\'s workout:', {
          type: todaySession.type,
          subType: todaySession.subType,
          duration: todaySession.duration,
          tss: todaySession.targetTss,
          description: todaySession.description
        });
      }
    } else {
      console.log('Today is a rest day:', format(today, 'EEEE'));
    }
  }, 30000);

  it('should distribute HIT and LIT sessions correctly', async () => {
    const weeks: WeeklyPlan[] = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // Generate 4 weeks to check distribution
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + (weekNum - 1) * 7);

      const weekPlan = await generateMvpWeeklyPlan({
        userId: 'test-user-123',
        userProfile: testProfile,
        weekStart: weekStartDate,
        slots: testSlots,
        eventDate,
        weekNumber: weekNum
      });

      weeks.push(weekPlan);
    }

    // Check each week has a mix of HIT and LIT
    weeks.forEach((week, index) => {
      const hitCount = week.sessions.filter(s => s.type === 'HIT').length;
      const litCount = week.sessions.filter(s => s.type === 'LIT').length;

      // Should have both types (unless it's a recovery week)
      const isRecoveryWeek = (index + 1) % 4 === 0;
      
      if (!isRecoveryWeek) {
        expect(hitCount).toBeGreaterThan(0);
        expect(litCount).toBeGreaterThan(0);
      }

      console.log(`Week ${index + 1}: ${hitCount} HIT, ${litCount} LIT, Total: ${week.totalTss} TSS`);
    });
  }, 60000);

  it('should handle recovery week (every 4th week)', async () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // Generate week 4 (recovery week)
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + 3 * 7);

    const recoveryWeekPlan = await generateMvpWeeklyPlan({
      userId: 'test-user-123',
      userProfile: testProfile,
      weekStart: weekStartDate,
      slots: testSlots,
      eventDate,
      weekNumber: 4
    });

    // Recovery week should have lower TSS
    expect(recoveryWeekPlan.totalTss).toBeLessThan(400);

    // Should have more recovery/LIT sessions
    const recCount = recoveryWeekPlan.sessions.filter(s => s.type === 'REC').length;
    const litCount = recoveryWeekPlan.sessions.filter(s => s.type === 'LIT').length;
    
    expect(recCount + litCount).toBeGreaterThan(0);

    console.log('Recovery Week (Week 4):', {
      totalTss: recoveryWeekPlan.totalTss,
      sessions: recoveryWeekPlan.sessions.length,
      recovery: recCount,
      lit: litCount
    });
  }, 30000);

  it('should match sessions to time slots', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekPlan = await generateMvpWeeklyPlan({
      userId: 'test-user-123',
      userProfile: testProfile,
      weekStart: today,
      slots: testSlots,
      eventDate,
      weekNumber: 1
    });

    // Verify each session has a matching time slot
    weekPlan.sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const dayOfWeek = sessionDate.getDay();
      
      const matchingSlot = testSlots.find(slot => slot.day === dayOfWeek);
      expect(matchingSlot).toBeDefined();

      // Session should respect slot's indoor/outdoor preference
      if (matchingSlot?.type === 'indoor') {
        expect(session.indoor).toBe(true);
      } else if (matchingSlot?.type === 'outdoor') {
        // Outdoor slots can have either indoor or outdoor sessions
        expect([true, false]).toContain(session.indoor);
      }
    });
  }, 30000);

  it('should generate valid ZWO-compatible sessions', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekPlan = await generateMvpWeeklyPlan({
      userId: 'test-user-123',
      userProfile: testProfile,
      weekStart: today,
      slots: testSlots,
      eventDate,
      weekNumber: 1
    });

    // Check first session has required fields for ZWO generation
    const firstSession = weekPlan.sessions[0];
    if (firstSession) {
      expect(firstSession.id).toBeDefined();
      expect(firstSession.type).toBeDefined();
      expect(firstSession.subType).toBeDefined();
      expect(firstSession.duration).toBeGreaterThan(0);
      expect(firstSession.targetTss).toBeGreaterThan(0);
      
      console.log('First session:', {
        id: firstSession.id,
        type: firstSession.type,
        subType: firstSession.subType,
        duration: firstSession.duration,
        tss: firstSession.targetTss,
        indoor: firstSession.indoor
      });
    }
  }, 30000);
});
