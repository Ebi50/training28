/**
 * Phase Calculator - Training Phase Determination
 * 
 * Calculates current training phase based on event date and provides
 * category distribution for workout selection.
 * 
 * Phases:
 * - BASE: Focus on aerobic base (80% LIT)
 * - BUILD: Progressive intensity (50% LIT, 30% TEMPO/FTP, 20% VO2MAX)
 * - PEAK: Race-specific intensity (40% LIT, 40% FTP/VO2MAX, 20% ANAEROBIC)
 * - TAPER: Volume reduction, maintain intensity
 * - MAINTENANCE: No specific goal, general fitness
 */

export type TrainingPhase = 'BASE' | 'BUILD' | 'PEAK' | 'TAPER' | 'MAINTENANCE';

export interface PhaseInfo {
  phase: TrainingPhase;
  weeksToEvent: number;
  description: string;
  categoryDistribution: CategoryDistribution;
}

export interface CategoryDistribution {
  LIT: number;       // Low Intensity Training (Z1-Z2)
  TEMPO: number;     // Tempo (Z3)
  FTP: number;       // Threshold (Z4)
  VO2MAX: number;    // VO2max intervals (Z5)
  ANAEROBIC: number; // Anaerobic capacity (Z6)
  NEUROMUSCULAR: number; // Sprints (Z7)
  SKILL: number;     // Technical skills
  RECOVERY: number;  // Active recovery
}

/**
 * Calculate training phase based on event date
 * 
 * Phase Timeline:
 * - 16+ weeks: BASE
 * - 8-16 weeks: BUILD
 * - 3-8 weeks: PEAK
 * - 0-3 weeks: TAPER
 * - No event: MAINTENANCE
 */
export function calculatePhase(
  eventDate: Date | null,
  currentDate: Date = new Date()
): PhaseInfo {
  // No event = Maintenance
  if (!eventDate) {
    return {
      phase: 'MAINTENANCE',
      weeksToEvent: 0,
      description: 'General fitness maintenance - balanced training',
      categoryDistribution: getMaintenanceDistribution(),
    };
  }

  // Calculate weeks to event
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksToEvent = Math.ceil((eventDate.getTime() - currentDate.getTime()) / msPerWeek);

  // Past event - maintenance
  if (weeksToEvent < 0) {
    return {
      phase: 'MAINTENANCE',
      weeksToEvent: 0,
      description: 'Event has passed - maintenance mode',
      categoryDistribution: getMaintenanceDistribution(),
    };
  }

  // Determine phase
  if (weeksToEvent >= 16) {
    return {
      phase: 'BASE',
      weeksToEvent,
      description: 'Building aerobic base - high volume, low intensity',
      categoryDistribution: getBaseDistribution(),
    };
  } else if (weeksToEvent >= 8) {
    return {
      phase: 'BUILD',
      weeksToEvent,
      description: 'Progressive intensity - lactate threshold development',
      categoryDistribution: getBuildDistribution(),
    };
  } else if (weeksToEvent >= 3) {
    return {
      phase: 'PEAK',
      weeksToEvent,
      description: 'Race-specific intensity - sharpening fitness',
      categoryDistribution: getPeakDistribution(),
    };
  } else {
    return {
      phase: 'TAPER',
      weeksToEvent,
      description: 'Reducing volume - maintaining intensity',
      categoryDistribution: getTaperDistribution(),
    };
  }
}

/**
 * BASE Phase Distribution (16+ weeks out)
 * Focus: Aerobic base, high volume, low intensity
 */
function getBaseDistribution(): CategoryDistribution {
  return {
    LIT: 0.80,          // 80% endurance rides
    TEMPO: 0.05,        // 5% tempo
    FTP: 0.05,          // 5% threshold
    VO2MAX: 0.02,       // 2% VO2max
    ANAEROBIC: 0.01,    // 1% anaerobic
    NEUROMUSCULAR: 0.02, // 2% sprints
    SKILL: 0.03,        // 3% skills
    RECOVERY: 0.02,     // 2% recovery
  };
}

/**
 * BUILD Phase Distribution (8-16 weeks out)
 * Focus: Progressive intensity, threshold development
 */
function getBuildDistribution(): CategoryDistribution {
  return {
    LIT: 0.50,          // 50% endurance
    TEMPO: 0.15,        // 15% tempo
    FTP: 0.15,          // 15% threshold
    VO2MAX: 0.10,       // 10% VO2max
    ANAEROBIC: 0.03,    // 3% anaerobic
    NEUROMUSCULAR: 0.03, // 3% sprints
    SKILL: 0.02,        // 2% skills
    RECOVERY: 0.02,     // 2% recovery
  };
}

/**
 * PEAK Phase Distribution (3-8 weeks out)
 * Focus: Race-specific intensity, maintaining volume
 */
function getPeakDistribution(): CategoryDistribution {
  return {
    LIT: 0.40,          // 40% endurance
    TEMPO: 0.10,        // 10% tempo
    FTP: 0.20,          // 20% threshold
    VO2MAX: 0.15,       // 15% VO2max
    ANAEROBIC: 0.08,    // 8% anaerobic
    NEUROMUSCULAR: 0.05, // 5% sprints
    SKILL: 0.01,        // 1% skills
    RECOVERY: 0.01,     // 1% recovery
  };
}

/**
 * TAPER Phase Distribution (0-3 weeks out)
 * Focus: Volume reduction, intensity maintenance
 */
function getTaperDistribution(): CategoryDistribution {
  return {
    LIT: 0.50,          // 50% easy rides (shorter)
    TEMPO: 0.10,        // 10% tempo
    FTP: 0.15,          // 15% threshold (maintain)
    VO2MAX: 0.15,       // 15% VO2max (maintain sharpness)
    ANAEROBIC: 0.05,    // 5% anaerobic
    NEUROMUSCULAR: 0.03, // 3% sprints
    SKILL: 0.01,        // 1% skills
    RECOVERY: 0.01,     // 1% recovery
  };
}

/**
 * MAINTENANCE Distribution (no event)
 * Focus: Balanced training, general fitness
 */
function getMaintenanceDistribution(): CategoryDistribution {
  return {
    LIT: 0.60,          // 60% endurance
    TEMPO: 0.10,        // 10% tempo
    FTP: 0.10,          // 10% threshold
    VO2MAX: 0.08,       // 8% VO2max
    ANAEROBIC: 0.04,    // 4% anaerobic
    NEUROMUSCULAR: 0.04, // 4% sprints
    SKILL: 0.02,        // 2% skills
    RECOVERY: 0.02,     // 2% recovery
  };
}

/**
 * Get weekly TSS target based on phase
 * Returns recommended TSS range for the week
 */
export function getWeeklyTssTarget(
  phase: TrainingPhase,
  baseTss: number = 400
): { min: number; target: number; max: number } {
  const multipliers: Record<TrainingPhase, { min: number; target: number; max: number }> = {
    BASE: { min: 0.9, target: 1.0, max: 1.1 },      // 90-110% of base
    BUILD: { min: 0.95, target: 1.1, max: 1.2 },    // 95-120% of base
    PEAK: { min: 0.9, target: 1.0, max: 1.1 },      // 90-110% of base
    TAPER: { min: 0.4, target: 0.5, max: 0.6 },     // 40-60% reduction
    MAINTENANCE: { min: 0.7, target: 0.8, max: 0.9 }, // 70-90% of base
  };

  const mult = multipliers[phase];
  return {
    min: Math.round(baseTss * mult.min),
    target: Math.round(baseTss * mult.target),
    max: Math.round(baseTss * mult.max),
  };
}

/**
 * Calculate progressive TSS for BUILD phase
 * Increases TSS gradually over weeks
 */
export function getProgressiveTss(
  weekNumber: number,
  totalBuildWeeks: number,
  startTss: number,
  targetTss: number
): number {
  if (weekNumber <= 0 || weekNumber > totalBuildWeeks) {
    return startTss;
  }

  const progress = weekNumber / totalBuildWeeks;
  const tssIncrease = targetTss - startTss;
  return Math.round(startTss + (tssIncrease * progress));
}

/**
 * Determine if recovery week is needed
 * Typically every 3-4 weeks
 */
export function isRecoveryWeek(weekNumber: number, frequency: number = 4): boolean {
  return weekNumber % frequency === 0;
}

/**
 * Calculate recovery week TSS reduction
 */
export function getRecoveryWeekTss(normalTss: number, reduction: number = 0.4): number {
  return Math.round(normalTss * (1 - reduction));
}
