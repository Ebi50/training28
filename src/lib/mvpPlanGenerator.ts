/**
 * MVP Plan Generator - Heuristic Approach
 * 
 * Uses Workout Library + Phase Calculator for simple, deterministic plan generation.
 * Perfect for MVP - no ML, straightforward logic.
 * 
 * Flow:
 * 1. Calculate phase → Get TSS targets and category distribution
 * 2. Search Workout Library → Find matching workouts
 * 3. Match to time slots → Respect user availability
 * 4. Generate weekly plan → Return structured plan
 */

import { 
  calculatePhase, 
  getWeeklyTssTarget, 
  getProgressiveTss,
  isRecoveryWeek 
} from './phaseCalculator';
import { loadWorkoutLibrary, findWorkouts } from './workoutLibraryStatic';
import { TimeSlot, UserProfile } from '@/types/user';
import { WeeklyPlan, TrainingSession } from '@/types/plan';
import { Workout, WorkoutCategory } from '@/types/workout';
import { addDays, format, differenceInWeeks, startOfWeek } from 'date-fns';

export interface MvpPlanInput {
  userId: string;
  userProfile: UserProfile;
  weekStart: Date;
  slots: TimeSlot[];
  eventDate: Date | null;
  weekNumber?: number; // For progressive loading in BUILD phase
}

/**
 * Generate a weekly training plan using Workout Library
 */
export async function generateMvpWeeklyPlan(
  input: MvpPlanInput
): Promise<WeeklyPlan> {
  const { userId, userProfile, weekStart, slots, eventDate, weekNumber = 1 } = input;

  // Load workout library
  const libraryData = await loadWorkoutLibrary();

  // Calculate phase and targets
  const phase = calculatePhase(eventDate, weekStart);
  const tssTarget = getWeeklyTssTarget(phase.phase);
  
  // Adjust TSS for BUILD phase progression
  let adjustedTss = tssTarget.min;
  if (phase.phase === 'BUILD' && weekNumber) {
    const weeksSinceBuildStart = weekNumber;
    const totalBuildWeeks = 8; // BUILD phase is 8-16 weeks
    adjustedTss = getProgressiveTss(weeksSinceBuildStart, tssTarget.min, tssTarget.max, totalBuildWeeks);
  }

  // Check if recovery week (every 4th week)
  const isRecovery = isRecoveryWeek(weekNumber || 1);
  if (isRecovery) {
    adjustedTss *= 0.6; // 40% reduction
  }

  // Calculate available hours from slots
  const weeklyHours = calculateWeeklyHours(slots);

  // Determine max HIT days based on phase
  let maxHitDays = 1;
  if (phase.phase === 'BUILD') maxHitDays = 2;
  else if (phase.phase === 'PEAK') maxHitDays = 2;
  else if (phase.phase === 'TAPER') maxHitDays = 1;

  // Generate sessions for the week
  const sessions = await generateWeeklySessions(
    weekStart,
    slots,
    adjustedTss,
    maxHitDays,
    phase.categoryDistribution,
    libraryData.workouts,
    userProfile,
    isRecovery,
    libraryData
  );

  // Calculate plan totals
  const totalHours = sessions.reduce((sum, s) => sum + s.duration / 60, 0);
  const totalTss = sessions.reduce((sum, s) => sum + s.targetTss, 0);
  const hitSessions = sessions.filter(s => 
    s.subType && ['VO2MAX', 'FTP', 'ANAEROBIC'].includes(s.subType)
  ).length;
  
  // Calculate LIT ratio
  const litDuration = sessions
    .filter(s => s.type === 'LIT')
    .reduce((sum, s) => sum + s.duration, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const litRatio = totalDuration > 0 ? litDuration / totalDuration : 0;

  const plan: WeeklyPlan = {
    id: `${format(weekStart, 'yyyy')}-W${format(weekStart, 'II')}`,
    weekStartDate: format(weekStart, 'yyyy-MM-dd'),
    userId,
    totalHours,
    totalTss,
    litRatio,
    hitSessions,
    sessions,
    constraints: {
      availableHours: weeklyHours,
      maxHitDays,
      campActive: undefined,
      goalApproaching: phase.phase === 'TAPER' ? 'main-event' : undefined,
    },
    generated: new Date(),
    lastModified: new Date(),
  };

  return plan;
}

/**
 * Calculate total weekly hours from time slots
 */
function calculateWeeklyHours(slots: TimeSlot[]): number {
  return slots.reduce((total, slot) => {
    const duration = calculateSlotDuration(slot);
    return total + duration / 60; // Convert to hours
  }, 0);
}

/**
 * Calculate slot duration in minutes
 */
function calculateSlotDuration(slot: TimeSlot): number {
  const [startHour, startMin] = slot.startTime.split(':').map(Number);
  const [endHour, endMin] = slot.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes - startMinutes;
}

/**
 * Generate training sessions for the week
 */
async function generateWeeklySessions(
  weekStart: Date,
  slots: TimeSlot[],
  weeklyTss: number,
  maxHitDays: number,
  categoryDistribution: any,
  library: Workout[],
  userProfile: UserProfile,
  isRecoveryWeek: boolean,
  libraryData: import('@/types/workout').WorkoutLibrary
): Promise<TrainingSession[]> {
  const sessions: TrainingSession[] = [];
  
  // Group slots by day
  const slotsByDay = groupSlotsByDay(slots);
  
  // Select HIT days (spread them out)
  const hitDays = selectHitDays(slotsByDay, maxHitDays);
  
  // Calculate daily TSS targets
  const dailyTssTargets = distributeTss(
    weeklyTss,
    slotsByDay,
    hitDays,
    categoryDistribution
  );

  // Generate sessions for each day
  for (const dayStr of Object.keys(slotsByDay)) {
    const dayIndex = parseInt(dayStr);
    const daySlots = slotsByDay[dayIndex];
    const targetTss = dailyTssTargets[dayIndex] || 0;
    const isHitDay = hitDays.includes(dayIndex);
    const date = addDays(weekStart, dayIndex);

    if (targetTss === 0) continue; // Rest day

    // Determine workout category
    let category: WorkoutCategory;
    if (isRecoveryWeek) {
      category = 'LIT';
    } else if (isHitDay) {
      // Select HIT category based on distribution
      category = selectHitCategory(categoryDistribution);
    } else {
      category = 'LIT';
    }

    // Find matching workouts from library
    const slotDuration = daySlots.reduce((sum, s) => sum + calculateSlotDuration(s), 0);
    const matchingWorkouts = findWorkouts(libraryData, {
      category,
      minDuration: slotDuration * 0.7, // Allow 30% shorter
      maxDuration: slotDuration * 1.1, // Allow 10% longer
      outdoor: userProfile.preferences?.indoorAllowed === false ? true : undefined,
    });

    if (matchingWorkouts.length === 0) {
      console.warn(`No matching workouts for ${category} on ${format(date, 'yyyy-MM-dd')}`);
      continue;
    }

    // Select best matching workout
    const workout = selectBestWorkout(matchingWorkouts, targetTss, slotDuration);

    // Create training session
    const session = createSessionFromWorkout(
      workout,
      date,
      daySlots[0], // Use first slot
      targetTss
    );

    sessions.push(session);
  }

  return sessions;
}

/**
 * Group time slots by day of week
 */
function groupSlotsByDay(slots: TimeSlot[]): Record<number, TimeSlot[]> {
  const grouped: Record<number, TimeSlot[]> = {};
  
  slots.forEach((slot) => {
    if (!grouped[slot.day]) {
      grouped[slot.day] = [];
    }
    grouped[slot.day].push(slot);
  });

  return grouped;
}

/**
 * Select which days should be HIT days (spread them out)
 */
function selectHitDays(
  slotsByDay: Record<number, TimeSlot[]>,
  maxHitDays: number
): number[] {
  const availableDays = Object.keys(slotsByDay).map(Number).sort();
  
  if (availableDays.length === 0) return [];
  if (maxHitDays === 0) return [];

  // Simple strategy: Tuesday and Friday for 2 HIT days
  // Or just Tuesday for 1 HIT day
  const hitDays: number[] = [];
  
  if (maxHitDays >= 1 && availableDays.includes(2)) {
    hitDays.push(2); // Tuesday
  }
  
  if (maxHitDays >= 2 && availableDays.includes(5)) {
    hitDays.push(5); // Friday
  }

  // If preferred days not available, use first and middle day
  if (hitDays.length === 0 && availableDays.length > 0) {
    hitDays.push(availableDays[0]);
  }
  
  if (hitDays.length < maxHitDays && availableDays.length > 1) {
    const middleIndex = Math.floor(availableDays.length / 2);
    const middleDay = availableDays[middleIndex];
    if (!hitDays.includes(middleDay)) {
      hitDays.push(middleDay);
    }
  }

  return hitDays.slice(0, maxHitDays);
}

/**
 * Distribute weekly TSS across days
 */
function distributeTss(
  weeklyTss: number,
  slotsByDay: Record<number, TimeSlot[]>,
  hitDays: number[],
  categoryDistribution: Record<string, number>
): Record<number, number> {
  const dailyTss: Record<number, number> = {};
  const availableDays = Object.keys(slotsByDay).map(Number);
  
  if (availableDays.length === 0) return dailyTss;

  // Calculate TSS per day based on HIT vs LIT
  const hitTssRatio = 1.5; // HIT days get 50% more TSS
  const litTssRatio = 1.0;
  
  const totalRatio = hitDays.reduce((sum) => sum + hitTssRatio, 0) +
                    availableDays.filter(d => !hitDays.includes(d)).reduce((sum) => sum + litTssRatio, 0);
  
  availableDays.forEach((day) => {
    const isHit = hitDays.includes(day);
    const ratio = isHit ? hitTssRatio : litTssRatio;
    dailyTss[day] = Math.round((weeklyTss * ratio) / totalRatio);
  });

  return dailyTss;
}

/**
 * Select HIT category based on distribution
 */
function selectHitCategory(distribution: Record<string, number>): WorkoutCategory {
  // For MVP, rotate through HIT categories
  // In production, use distribution weights
  const hitCategories: WorkoutCategory[] = ['FTP', 'VO2MAX', 'TEMPO'];
  
  // Simple rotation: alternate between categories
  const randomIndex = Math.floor(Math.random() * hitCategories.length);
  return hitCategories[randomIndex];
}

/**
 * Select best matching workout from candidates
 */
function selectBestWorkout(
  workouts: Workout[],
  targetTss: number,
  targetDuration: number
): Workout {
  // Score each workout based on TSS and duration match
  const scored = workouts.map((workout) => {
    const workoutDurationMin = workout.total_duration_s / 60;
    const tssDiff = Math.abs(workout.target_tss - targetTss);
    const durationDiff = Math.abs(workoutDurationMin - targetDuration);
    
    // Normalize scores (lower is better)
    const tssScore = tssDiff / targetTss;
    const durationScore = durationDiff / targetDuration;
    
    const totalScore = tssScore * 0.6 + durationScore * 0.4; // TSS weighted more
    
    return { workout, score: totalScore };
  });

  // Sort by score (lower is better)
  scored.sort((a, b) => a.score - b.score);
  
  return scored[0].workout;
}

/**
 * Create training session from workout
 */
function createSessionFromWorkout(
  workout: Workout,
  date: Date,
  slot: TimeSlot,
  targetTss: number
): TrainingSession {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Map WorkoutCategory to session subType
  const subTypeMap: Record<string, string> = {
    'LIT': 'endurance',
    'TEMPO': 'tempo',
    'FTP': 'threshold',
    'VO2MAX': 'vo2max',
    'ANAEROBIC': 'vo2max', // Map to vo2max
    'NEUROMUSCULAR': 'neuromuscular',
    'SKILL': 'endurance', // Map to endurance
    'RECOVERY': 'recovery',
  };
  
  return {
    id: `${dateStr}-${workout.category.toLowerCase()}`,
    date: dateStr,
    type: workout.category === 'LIT' || workout.category === 'RECOVERY' ? 'LIT' : 'HIT',
    subType: subTypeMap[workout.category] as any,
    duration: Math.round(workout.total_duration_s / 60),
    targetTss: workout.target_tss,
    indoor: slot.type === 'indoor',
    description: `${workout.name} - ${workout.description}`,
    notes: `Workout ID: ${workout.id}`,
    completed: false,
    timeSlot: {
      startTime: slot.startTime,
      endTime: slot.endTime,
    },
  };
}
