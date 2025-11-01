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
  const availableHours = calculateWeeklyHours(slots);
  
  // Use user's target hours if set, otherwise use available hours
  const targetHours = userProfile.weeklyTrainingHoursTarget || availableHours;
  const weeklyHours = Math.min(targetHours, availableHours); // Can't train more than slots allow
  
  // ✅ Adjust TSS based on target time
  const maxPossibleTss = weeklyHours * 45; // ~45 TSS per hour
  if (adjustedTss > maxPossibleTss) {
    console.log(`⚠️ TSS capped: ${adjustedTss} → ${maxPossibleTss} (target: ${targetHours.toFixed(1)}h, available: ${availableHours.toFixed(1)}h)`);
    adjustedTss = maxPossibleTss;
  }
  
  console.log(`📊 Week ${weekNumber}: Target ${targetHours.toFixed(1)}h / Available ${availableHours.toFixed(1)}h → Using ${weeklyHours.toFixed(1)}h, Target TSS: ${adjustedTss}`);

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
  let totalScheduledHours = 0; // Track how many hours we've scheduled
  const targetHours = userProfile.weeklyTrainingHoursTarget || 999; // Get user's target
  
  // Group slots by day
  const slotsByDay = groupSlotsByDay(slots);
  console.log(`📅 Days with slots:`, Object.keys(slotsByDay).map(d => {
    const dayNames = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']; // Index 1-7 (ISO 8601)
    const dayIndex = parseInt(d);
    return `${dayNames[dayIndex] || `day${dayIndex}`} (${slotsByDay[dayIndex].length} slot(s))`;
  }).join(', '));
  
  // Select HIT days (spread them out)
  const hitDays = selectHitDays(slotsByDay, maxHitDays);
  
  // Calculate daily TSS targets
  const dailyTssTargets = distributeTss(
    weeklyTss,
    slotsByDay,
    hitDays,
    categoryDistribution
  );

  // Generate sessions for each day (sort by ISO day: 1=Mon, 2=Tue, ..., 7=Sun)
  const sortedDays = Object.keys(slotsByDay).sort((a, b) => {
    const dayA = parseInt(a);
    const dayB = parseInt(b);
    // Simple numeric sort: 1 (Mon) < 2 (Tue) < ... < 7 (Sun)
    return dayA - dayB;
  });

  for (const dayStr of sortedDays) {
    const dayIndex = parseInt(dayStr); // ISO day: 1=Mon, 2=Tue, ..., 7=Sun
    const daySlots = slotsByDay[dayIndex];
    const targetTss = dailyTssTargets[dayIndex] || 0;
    const isHitDay = hitDays.includes(dayIndex);
    
    // Convert ISO day (1=Mon, 7=Sun) to offset from week start (0=Mon, 6=Sun)
    const dayOffset = dayIndex - 1; // 1(Mon) → 0, 2(Tue) → 1, ..., 7(Sun) → 6
    const date = addDays(weekStart, dayOffset);
    
    const dayNames = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']; // Index 1-7 (ISO 8601)
    console.log(`📆 Processing ${dayNames[dayIndex]} (${format(date, 'yyyy-MM-dd')}): ${daySlots.length} slot(s), Target TSS: ${targetTss}`);

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

    // ✅ FIX: Group slots by time - if same time = alternatives, different times = separate sessions
    if (daySlots.length > 1) {
      console.log(`📅 Multiple slots on ${format(date, 'yyyy-MM-dd')}: ${daySlots.length} slots`);
      
      // Group by start time to identify alternatives vs separate sessions
      const slotsByTime = daySlots.reduce((acc, slot) => {
        const key = slot.startTime;
        if (!acc[key]) acc[key] = [];
        acc[key].push(slot);
        return acc;
      }, {} as Record<string, TimeSlot[]>);
      
      const timeSlotGroups = Object.values(slotsByTime);
      console.log(`  → ${timeSlotGroups.length} time slot(s) with alternatives`);
      
      // Calculate TSS per time slot group
      const totalGroupDuration = timeSlotGroups.reduce((sum, group) => {
        const duration = calculateSlotDuration(group[0]); // All in group have same time
        return sum + duration;
      }, 0);
      
      // Create ONE session per time slot (use first as primary, others as alternatives)
      for (const slotGroup of timeSlotGroups) {
        const primarySlot = slotGroup[0];
        const slotDuration = calculateSlotDuration(primarySlot);
        const slotTss = Math.round((slotDuration / totalGroupDuration) * targetTss);
        
        console.log(`  → Time ${primarySlot.startTime}: ${slotGroup.length} option(s) (${slotDuration}min, ${slotTss} TSS)`);
        
        // Find workout matching this time slot
        let matchingWorkouts = findWorkouts(libraryData, {
          category,
          minDuration: slotDuration * 0.7,
          maxDuration: slotDuration * 1.1,
          outdoor: userProfile.preferences?.indoorAllowed === false ? true : undefined,
        });

        // ✅ Fallback: If no exact match, broaden search
        if (matchingWorkouts.length === 0) {
          console.warn(`⚠️ No exact match for ${category} (${slotDuration}min), trying broader search...`);
          matchingWorkouts = findWorkouts(libraryData, {
            category,
            minDuration: slotDuration * 0.5, // Allow 50% shorter
            maxDuration: slotDuration * 1.5, // Allow 50% longer
          });
        }

        if (matchingWorkouts.length === 0) {
          console.warn(`❌ No matching workouts for ${category} on ${format(date, 'yyyy-MM-dd')} (${slotDuration}min slot) - SKIPPING`);
          continue;
        }

        const workout = selectBestWorkout(matchingWorkouts, slotTss, slotDuration);
        const session = createSessionFromWorkout(workout, date, primarySlot, slotTss);
        
        // Check if adding this session would exceed target hours
        const sessionHours = session.duration / 60;
        if (totalScheduledHours + sessionHours > targetHours) {
          console.log(`  ⏭️ Skipping session (would exceed ${targetHours}h target: ${totalScheduledHours.toFixed(1)}h + ${sessionHours.toFixed(1)}h = ${(totalScheduledHours + sessionHours).toFixed(1)}h)`);
          continue; // Skip this time slot
        }
        
        console.log(`  ✅ Created session: ${workout.name} (${session.duration}min, ${session.targetTss} TSS)`);
        
        // If multiple time slots on same day, add suffix to differentiate
        if (timeSlotGroups.length > 1) {
          session.id = `${session.id}-${primarySlot.startTime}`;
        }
        
        sessions.push(session);
        totalScheduledHours += sessionHours;
        console.log(`  📊 Total scheduled: ${totalScheduledHours.toFixed(1)}h / ${targetHours}h`);
      }
    } else {
      // Single slot - original logic
      const slotDuration = calculateSlotDuration(daySlots[0]);
      let matchingWorkouts = findWorkouts(libraryData, {
        category,
        minDuration: slotDuration * 0.7,
        maxDuration: slotDuration * 1.1,
        outdoor: userProfile.preferences?.indoorAllowed === false ? true : undefined,
      });

      // ✅ Fallback: If no exact match, broaden search
      if (matchingWorkouts.length === 0) {
        console.warn(`⚠️ No exact match for ${category} (${slotDuration}min), trying broader search...`);
        matchingWorkouts = findWorkouts(libraryData, {
          category,
          minDuration: slotDuration * 0.5,
          maxDuration: slotDuration * 1.5,
        });
      }

      if (matchingWorkouts.length === 0) {
        console.warn(`❌ No matching workouts for ${category} on ${format(date, 'yyyy-MM-dd')} - SKIPPING`);
        continue;
      }

      const workout = selectBestWorkout(matchingWorkouts, targetTss, slotDuration);
      const session = createSessionFromWorkout(workout, date, daySlots[0], targetTss);
      
      // Check if adding this session would exceed target hours
      const sessionHours = session.duration / 60;
      if (totalScheduledHours + sessionHours > targetHours) {
        console.log(`  ⏭️ Skipping session (would exceed ${targetHours}h target: ${totalScheduledHours.toFixed(1)}h + ${sessionHours.toFixed(1)}h = ${(totalScheduledHours + sessionHours).toFixed(1)}h)`);
        continue; // Skip this day
      }
      
      console.log(`  ✅ Created session: ${workout.name} (${session.duration}min, ${session.targetTss} TSS)`);
      
      sessions.push(session);
      totalScheduledHours += sessionHours;
      console.log(`  📊 Total scheduled: ${totalScheduledHours.toFixed(1)}h / ${targetHours}h`);
    }
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
  
  // Calculate slot duration in minutes
  const slotDuration = calculateSlotDuration(slot);
  
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
    duration: slotDuration, // ✅ Use slot duration, not workout duration
    targetTss: targetTss, // ✅ Use calculated TSS, not workout library TSS
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
