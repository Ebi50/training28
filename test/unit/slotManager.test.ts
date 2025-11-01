/**
 * Unit Tests: Slot Manager
 * Tests time slot management and camp/season logic
 */

import { describe, it, expect } from 'vitest';
import { SlotManager, CampSeasonManager } from '../../src/lib/slotManager';
import { TrainingCamp, SeasonGoal } from '../../src/types';

describe('Slot Manager', () => {
  describe('Default Slots', () => {
    it('should generate default weekly time slots', () => {
      const slots = SlotManager.generateDefaultSlots();
      
      expect(slots).toBeInstanceOf(Array);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty('day');
      expect(slots[0]).toHaveProperty('duration');
    });

    it('should calculate total weekly available time', () => {
      const slots = SlotManager.generateDefaultSlots();
      const totalTime = SlotManager.getTotalWeeklyAvailableTime(slots);
      
      expect(totalTime).toBeGreaterThan(0);
    });

    it('should validate time slots correctly', () => {
      const slots = SlotManager.generateDefaultSlots();
      const validation = SlotManager.validateSlots(slots);
      
      expect(validation).toHaveProperty('valid');
      expect(validation.valid).toBe(true);
    });
  });

  describe('Camp Slots', () => {
    it('should generate camp-specific time slots with higher availability', () => {
      const campSlots = SlotManager.generateCampSlots();
      const defaultSlots = SlotManager.generateDefaultSlots();
      
      const campTime = SlotManager.getTotalWeeklyAvailableTime(campSlots);
      const defaultTime = SlotManager.getTotalWeeklyAvailableTime(defaultSlots);
      
      expect(campTime).toBeGreaterThan(defaultTime);
    });
  });
});

describe('Camp & Season Manager', () => {
  describe('Taper Detection', () => {
    it('should detect when taper is needed before race', () => {
      const goals: SeasonGoal[] = [
        {
          id: 'race-1',
          title: 'Gran Fondo',
          date: new Date(2025, 11, 15),
          priority: 'A',
          discipline: 'road',
          taperStrategy: {
            daysBeforeEvent: 14,
            volumeReduction: 30,
            intensityMaintenance: true,
          },
        },
      ];

      const currentDate = new Date(2025, 11, 5); // 10 days before
      const result = CampSeasonManager.shouldTaper(currentDate, goals);

      expect(result.shouldTaper).toBe(true);
      expect(result.goal).toBeDefined();
      expect(result.daysRemaining).toBeLessThanOrEqual(14);
    });

    it('should not taper when no race is near', () => {
      const goals: SeasonGoal[] = [
        {
          id: 'race-1',
          title: 'Gran Fondo',
          date: new Date(2025, 11, 15),
          priority: 'A',
          discipline: 'road',
          taperStrategy: {
            daysBeforeEvent: 14,
            volumeReduction: 30,
            intensityMaintenance: true,
          },
        },
      ];

      const currentDate = new Date(2025, 10, 1); // Far away
      const result = CampSeasonManager.shouldTaper(currentDate, goals);

      expect(result.shouldTaper).toBe(false);
    });
  });

  describe('Camp Overrides', () => {
    it('should apply camp volume bump to parameters', () => {
      const baseParams = {
        weeklyHours: 8,
        litRatio: 0.85,
        maxHitDays: 2,
        rampRate: 0.1,
        tsbTarget: 0,
        indoorAllowed: true,
        availableTimeSlots: [],
        upcomingGoals: [],
      };

      const camp: TrainingCamp = {
        id: 'camp-1',
        title: 'Training Camp',
        startDate: new Date(2025, 11, 1),
        endDate: new Date(2025, 11, 7),
        volumeBump: 30,
        hitCap: 2,
        environment: {
          altitude: 200,
          temperature: 'moderate',
          terrain: 'hilly',
        },
        deloadAfter: {
          enabled: true,
          volumeReduction: 35,
          durationWeeks: 1,
        },
      };

      const campParams = CampSeasonManager.applyCampOverrides(baseParams, camp);

      expect(campParams.weeklyHours).toBeGreaterThan(baseParams.weeklyHours);
      expect(campParams.weeklyHours).toBeCloseTo(8 * 1.3, 1);
    });

    it('should generate deload parameters after camp', () => {
      const baseParams = {
        weeklyHours: 10,
        litRatio: 0.85,
        maxHitDays: 2,
        rampRate: 0.1,
        tsbTarget: 0,
        indoorAllowed: true,
        availableTimeSlots: [],
        upcomingGoals: [],
      };

      const camp: TrainingCamp = {
        id: 'camp-1',
        title: 'Training Camp',
        startDate: new Date(2025, 11, 1),
        endDate: new Date(2025, 11, 7),
        volumeBump: 30,
        hitCap: 2,
        environment: {
          altitude: 200,
          temperature: 'moderate',
          terrain: 'hilly',
        },
        deloadAfter: {
          enabled: true,
          volumeReduction: 35,
          durationWeeks: 1,
        },
      };

      const deloadParams = CampSeasonManager.generateDeloadParameters(baseParams, camp);

      expect(deloadParams.weeklyHours).toBeLessThan(baseParams.weeklyHours);
      expect(deloadParams.weeklyHours).toBeCloseTo(10 * 0.65, 1);
    });
  });
});
