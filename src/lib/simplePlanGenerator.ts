/**
 * Simple Plan Generator Wrapper
 * 
 * Simplified interface for MVP - wraps the complex TrainingPlanGenerator
 * with sensible defaults for quick start.
 */

import { TrainingPlanGenerator } from './planGenerator';
import { TimeSlot, UserProfile, SeasonGoal } from '@/types/user';
import { WeeklyPlan, PlanningParameters } from '@/types/plan';
import { DailyMetrics } from '@/types/metrics';
import { calculatePhase } from './phaseCalculator';

export interface SimplePlanInput {
  userId: string;
  userProfile: UserProfile;
  slots: TimeSlot[];
  eventDate: Date | null;
  weekStart?: Date;
}

/**
 * Generate a simple weekly plan with minimal input
 */
export async function generateSimpleWeeklyPlan(
  input: SimplePlanInput
): Promise<WeeklyPlan> {
  const {
    userId,
    userProfile,
    slots,
    eventDate,
    weekStart = new Date(),
  } = input;

  // Calculate total available hours from slots
  const weeklyHours = slots.reduce((total, slot) => {
    const duration = calculateSlotDuration(slot);
    return total + (duration / 60); // Convert minutes to hours
  }, 0);

  // Determine phase and adjust parameters
  const phase = calculatePhase(eventDate, weekStart);
  
  // Calculate max HIT days based on phase
  let maxHitDays = 1;
  if (phase.phase === 'BUILD') maxHitDays = 2;
  else if (phase.phase === 'PEAK') maxHitDays = 2;
  else if (phase.phase === 'TAPER') maxHitDays = 1;

  // Create planning parameters
  const parameters: PlanningParameters = {
    weeklyHours,
    litRatio: phase.categoryDistribution?.LIT ?? 0.7, // Default 70% LIT
    maxHitDays,
    rampRate: 0.10, // 10% max weekly increase
    tsbTarget: 0, // Balanced TSB
    indoorAllowed: userProfile.preferences?.indoorAllowed ?? true,
    availableTimeSlots: slots,
    upcomingGoals: [],
  };

  // Convert event to SeasonGoal if present
  const goals: SeasonGoal[] = eventDate
    ? [
        {
          id: 'main-event',
          title: 'Main Event',
          date: eventDate,
          priority: 'A',
          discipline: 'road',
          taperStrategy: {
            daysBeforeEvent: 14,
            volumeReduction: 30,
            intensityMaintenance: true,
          },
        },
      ]
    : [];

  // Initialize generator
  const generator = new TrainingPlanGenerator();
  await generator.initialize();

  // Generate plan (no previous metrics for MVP)
  const plan = await generator.generateWeeklyPlan(
    userId,
    weekStart,
    parameters,
    [], // previousMetrics - empty for first week
    userProfile,
    goals
  );

  return plan;
}

/**
 * Helper: Calculate slot duration in minutes
 */
function calculateSlotDuration(slot: TimeSlot): number {
  const [startHour, startMin] = slot.startTime.split(':').map(Number);
  const [endHour, endMin] = slot.endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes - startMinutes;
}
