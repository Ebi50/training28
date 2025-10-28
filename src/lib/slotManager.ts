import { TimeSlot, TrainingCamp, SeasonGoal, PlanningParameters } from '@/types';
import { format, addDays, startOfWeek, isWithinInterval } from 'date-fns';

/**
 * Manage time slots and scheduling constraints
 */
export class SlotManager {
  /**
   * Get available time slots for a specific date
   */
  static getAvailableSlots(
    availableSlots: TimeSlot[],
    date: Date,
    excludeBookedSlots: { startTime: string; endTime: string }[] = []
  ): TimeSlot[] {
    const dayOfWeek = date.getDay(); // 0 = Sunday
    
    // Filter slots for this day of week
    const daySlots = availableSlots.filter(slot => slot.day === dayOfWeek);
    
    // Remove booked slots
    return daySlots.filter(slot => {
      return !excludeBookedSlots.some(booked => 
        this.slotsOverlap(slot, { ...booked, day: dayOfWeek, type: 'both' })
      );
    });
  }

  /**
   * Check if two time slots overlap
   */
  private static slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.day !== slot2.day) return false;
    
    const start1 = this.timeToMinutes(slot1.startTime);
    const end1 = this.timeToMinutes(slot1.endTime);
    const start2 = this.timeToMinutes(slot2.startTime);
    const end2 = this.timeToMinutes(slot2.endTime);
    
    return start1 < end2 && start2 < end1;
  }

  /**
   * Convert HH:MM time to minutes since midnight
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Split a long session into multiple shorter sessions to fit available slots
   */
  static splitSessionIntoSlots(
    targetDuration: number,
    targetTss: number,
    availableSlots: TimeSlot[]
  ): { duration: number; tss: number; timeSlot: { startTime: string; endTime: string } }[] {
    if (availableSlots.length === 0) return [];

    const sessions: { duration: number; tss: number; timeSlot: { startTime: string; endTime: string } }[] = [];
    let remainingDuration = targetDuration;
    let remainingTss = targetTss;

    // Sort slots by duration (longest first)
    const sortedSlots = [...availableSlots].sort((a, b) => {
      const aDuration = this.timeToMinutes(a.endTime) - this.timeToMinutes(a.startTime);
      const bDuration = this.timeToMinutes(b.endTime) - this.timeToMinutes(b.startTime);
      return bDuration - aDuration;
    });

    for (const slot of sortedSlots) {
      if (remainingDuration <= 0) break;

      const slotDuration = this.timeToMinutes(slot.endTime) - this.timeToMinutes(slot.startTime);
      const sessionDuration = Math.min(remainingDuration, slotDuration);
      const sessionTss = Math.round((sessionDuration / targetDuration) * targetTss);

      sessions.push({
        duration: sessionDuration,
        tss: sessionTss,
        timeSlot: {
          startTime: slot.startTime,
          endTime: this.addMinutesToTime(slot.startTime, sessionDuration),
        },
      });

      remainingDuration -= sessionDuration;
      remainingTss -= sessionTss;
    }

    return sessions;
  }

  /**
   * Add minutes to a time string (HH:MM)
   */
  private static addMinutesToTime(time: string, minutes: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Find optimal time slot for a session
   */
  static findOptimalSlot(
    requiredDuration: number,
    availableSlots: TimeSlot[],
    preferences: {
      preferMorning?: boolean;
      preferEvening?: boolean;
      preferIndoor?: boolean;
      preferOutdoor?: boolean;
    } = {}
  ): TimeSlot | null {
    if (availableSlots.length === 0) return null;

    // Filter slots that can accommodate the duration
    const viableSlots = availableSlots.filter(slot => {
      const slotDuration = this.timeToMinutes(slot.endTime) - this.timeToMinutes(slot.startTime);
      return slotDuration >= requiredDuration;
    });

    if (viableSlots.length === 0) return null;

    // Score slots based on preferences
    const scoredSlots = viableSlots.map(slot => {
      let score = 0;
      const startMinutes = this.timeToMinutes(slot.startTime);

      // Time preferences
      if (preferences.preferMorning && startMinutes < 12 * 60) score += 10;
      if (preferences.preferEvening && startMinutes > 17 * 60) score += 10;

      // Location preferences
      if (preferences.preferIndoor && slot.type === 'indoor') score += 5;
      if (preferences.preferOutdoor && slot.type === 'outdoor') score += 5;

      // Prefer longer slots (less wasted time)
      const slotDuration = this.timeToMinutes(slot.endTime) - this.timeToMinutes(slot.startTime);
      score += Math.min(slotDuration / requiredDuration, 2) * 3;

      return { slot, score };
    });

    // Return slot with highest score
    return scoredSlots.reduce((best, current) => 
      current.score > best.score ? current : best
    ).slot;
  }

  /**
   * Check if a slot is suitable for indoor training
   */
  static isIndoorSuitable(slot: TimeSlot): boolean {
    return slot.type === 'indoor' || slot.type === 'both';
  }

  /**
   * Check if a slot is suitable for outdoor training
   */
  static isOutdoorSuitable(slot: TimeSlot): boolean {
    return slot.type === 'outdoor' || slot.type === 'both';
  }

  /**
   * Get total available training time for a week
   */
  static getTotalWeeklyAvailableTime(slots: TimeSlot[]): number {
    const dailyTotals = new Array(7).fill(0);

    slots.forEach(slot => {
      const duration = this.timeToMinutes(slot.endTime) - this.timeToMinutes(slot.startTime);
      dailyTotals[slot.day] += duration;
    });

    return dailyTotals.reduce((total, daily) => total + daily, 0);
  }

  /**
   * Validate that time slots don't overlap for the same day
   */
  static validateSlots(slots: TimeSlot[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const daySlots: { [day: number]: TimeSlot[] } = {};

    // Group slots by day
    slots.forEach(slot => {
      if (!daySlots[slot.day]) daySlots[slot.day] = [];
      daySlots[slot.day].push(slot);
    });

    // Check for overlaps within each day
    Object.entries(daySlots).forEach(([day, daySlotList]) => {
      for (let i = 0; i < daySlotList.length; i++) {
        for (let j = i + 1; j < daySlotList.length; j++) {
          if (this.slotsOverlap(daySlotList[i], daySlotList[j])) {
            errors.push(
              `Overlapping slots on day ${day}: ${daySlotList[i].startTime}-${daySlotList[i].endTime} and ${daySlotList[j].startTime}-${daySlotList[j].endTime}`
            );
          }
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate default time slots for typical training schedule
   */
  static generateDefaultSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // Weekday morning slots (6:00-8:00)
    for (let day = 1; day <= 5; day++) {
      slots.push({
        day,
        startTime: '06:00',
        endTime: '08:00',
        type: 'both',
      });
    }

    // Weekday evening slots (18:00-20:00)
    for (let day = 1; day <= 5; day++) {
      slots.push({
        day,
        startTime: '18:00',
        endTime: '20:00',
        type: 'both',
      });
    }

    // Weekend longer slots
    // Saturday morning (8:00-12:00)
    slots.push({
      day: 6,
      startTime: '08:00',
      endTime: '12:00',
      type: 'outdoor',
    });

    // Sunday morning (8:00-12:00)
    slots.push({
      day: 0,
      startTime: '08:00',
      endTime: '12:00',
      type: 'outdoor',
    });

    return slots;
  }

  /**
   * Adjust slots for training camp (more flexible schedule)
   */
  static generateCampSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // Camp schedule: longer, more flexible slots every day
    for (let day = 0; day < 7; day++) {
      // Morning slot
      slots.push({
        day,
        startTime: '07:00',
        endTime: '12:00',
        type: 'outdoor',
      });

      // Afternoon slot
      slots.push({
        day,
        startTime: '15:00',
        endTime: '18:00',
        type: 'outdoor',
      });
    }

    return slots;
  }
}

/**
 * Camp and Season Goal Management
 */
export class CampSeasonManager {
  /**
   * Check if a date falls within an active training camp
   */
  static getActiveCamp(date: Date, camps: TrainingCamp[]): TrainingCamp | null {
    return camps.find(camp => 
      isWithinInterval(date, { start: camp.startDate, end: camp.endDate })
    ) || null;
  }

  /**
   * Apply camp-specific overrides to planning parameters
   */
  static applyCampOverrides(
    params: PlanningParameters,
    camp: TrainingCamp
  ): PlanningParameters {
    return {
      ...params,
      weeklyHours: params.weeklyHours * (1 + camp.volumeBump / 100),
      litRatio: Math.max(params.litRatio, 0.88), // Force more aerobic work
      maxHitDays: Math.min(params.maxHitDays, camp.hitCap),
      availableTimeSlots: SlotManager.generateCampSlots(), // More flexible schedule
      indoorAllowed: false, // Force outdoor during camps
    };
  }

  /**
   * Generate post-camp deload parameters
   */
  static generateDeloadParameters(
    normalParams: PlanningParameters,
    camp: TrainingCamp
  ): PlanningParameters {
    if (!camp.deloadAfter.enabled) return normalParams;

    return {
      ...normalParams,
      weeklyHours: normalParams.weeklyHours * (1 - camp.deloadAfter.volumeReduction / 100),
      maxHitDays: Math.min(normalParams.maxHitDays, 1),
      litRatio: Math.max(normalParams.litRatio, 0.95), // Almost all easy
    };
  }

  /**
   * Find upcoming season goals within specified timeframe
   */
  static getUpcomingGoals(
    currentDate: Date,
    goals: SeasonGoal[],
    daysAhead: number = 90
  ): SeasonGoal[] {
    const futureDate = addDays(currentDate, daysAhead);
    
    return goals.filter(goal => 
      goal.date >= currentDate && goal.date <= futureDate
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Check if we should apply taper for any upcoming goals
   */
  static shouldTaper(
    currentDate: Date,
    goals: SeasonGoal[]
  ): { shouldTaper: boolean; goal: SeasonGoal | null; daysRemaining: number } {
    const upcomingGoals = this.getUpcomingGoals(currentDate, goals, 21); // Look 3 weeks ahead
    
    if (upcomingGoals.length === 0) {
      return { shouldTaper: false, goal: null, daysRemaining: 0 };
    }

    const nextGoal = upcomingGoals[0];
    const daysRemaining = Math.ceil((nextGoal.date.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const shouldTaper = daysRemaining <= nextGoal.taperStrategy.daysBeforeEvent;
    
    return {
      shouldTaper,
      goal: shouldTaper ? nextGoal : null,
      daysRemaining,
    };
  }

  /**
   * Calculate taper intensity based on days remaining
   */
  static calculateTaperIntensity(daysRemaining: number, taperDays: number): number {
    if (daysRemaining >= taperDays) return 1.0; // No taper yet
    
    // Linear taper from 100% to 60% over taper period
    const taperProgress = (taperDays - daysRemaining) / taperDays;
    return 1.0 - (taperProgress * 0.4);
  }

  /**
   * Determine training focus based on season goals
   */
  static getTrainingFocus(goals: SeasonGoal[]): {
    focus: 'base' | 'build' | 'peak' | 'recovery';
    primaryDiscipline: string;
    intensityBias: 'aerobic' | 'threshold' | 'vo2max' | 'neuromuscular';
  } {
    const upcomingGoals = this.getUpcomingGoals(new Date(), goals, 120); // 4 months ahead
    
    if (upcomingGoals.length === 0) {
      return {
        focus: 'base',
        primaryDiscipline: 'road',
        intensityBias: 'aerobic',
      };
    }

    const nextGoal = upcomingGoals[0];
    const daysToGoal = Math.ceil((nextGoal.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    let focus: 'base' | 'build' | 'peak' | 'recovery' = 'base';
    let intensityBias: 'aerobic' | 'threshold' | 'vo2max' | 'neuromuscular' = 'aerobic';

    if (daysToGoal <= 14) {
      focus = 'peak';
      intensityBias = 'neuromuscular';
    } else if (daysToGoal <= 42) {
      focus = 'build';
      intensityBias = nextGoal.discipline === 'mtb' ? 'vo2max' : 'threshold';
    } else if (daysToGoal <= 84) {
      focus = 'build';
      intensityBias = 'threshold';
    } else {
      focus = 'base';
      intensityBias = 'aerobic';
    }

    return {
      focus,
      primaryDiscipline: nextGoal.discipline,
      intensityBias,
    };
  }
}