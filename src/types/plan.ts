// Training plan types (weekly, daily, sessions)

import type { WorkoutCategory, WorkoutSegment, WorkoutRating } from './workout';
import type { TimeSlot, TrainingCamp, SeasonGoal } from './user';

/**
 * Weekly training plan
 */
export interface WeeklyPlan {
  id: string;                     // e.g., "2025-W45"
  weekStartDate: string;          // YYYY-MM-DD (Monday)
  userId: string;
  
  // Volume and intensity
  totalHours: number;
  totalTss: number;
  litRatio: number;               // Percentage (0-1)
  hitSessions: number;
  
  // Sessions
  sessions: TrainingSession[];
  
  // Constraints and context
  constraints: {
    availableHours: number;
    maxHitDays: number;
    campActive?: string;          // camp ID if active
    goalApproaching?: string;     // goal ID if within taper period
  };
  
  // Metadata
  generated: Date;
  lastModified: Date;
  
  // Compliance tracking
  compliance?: {
    completedSessions: number;
    totalSessions: number;
    adherenceScore: number;       // 0-1
  };
  
  // Quality assessment
  quality?: PlanQuality;
}

/**
 * Daily training plan
 */
export interface DailyPlan {
  date: string;                   // YYYY-MM-DD
  weekId: string;                 // e.g., "2025-W45"
  
  // Planned workout
  workoutId: string;
  workoutName: string;
  workoutCategory: WorkoutCategory;
  workoutStructure: WorkoutSegment[];
  plannedTss: number;
  plannedDurationMin: number;
  
  // Slot assignment
  slotId?: string;
  slotStartTime?: string;         // HH:MM
  
  // TSB-based adjustment
  tsb?: number;
  adjustmentApplied?: TsbAdjustment;
  
  // Completion status
  completed: boolean;
  actualActivityId?: string;      // Strava Activity ID
  actualTss?: number;
  actualDurationMin?: number;
  
  // User feedback
  rating?: WorkoutRating;
  ratingTimestamp?: Date;
  notes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TSB-based workout adjustment
 */
export interface TsbAdjustment {
  ftpScale: number;               // 0.95 to 1.02
  repsDelta: number;              // -1, 0, +1
  onPct: number;                  // -0.10 to +0.05
  offPct: number;                 // -0.05 to +0.10
  reason: string;                 // e.g., "Low TSB: reduced intensity"
}

/**
 * Training session (building block of weekly plan)
 */
export interface TrainingSession {
  id: string;
  date: string;                   // YYYY-MM-DD
  type: 'LIT' | 'HIT' | 'REC' | 'STRENGTH';
  subType?: 'endurance' | 'tempo' | 'threshold' | 'vo2max' | 'neuromuscular' | 'recovery';
  duration: number;               // minutes
  targetTss: number;
  actualTss?: number;
  indoor: boolean;
  description: string;
  notes?: string;                 // User notes/comments
  rpe?: number;                   // Rate of Perceived Exertion (1-10 scale)
  completed: boolean;
  activityId?: string;            // Link to actual activity
  timeSlot?: {
    startTime: string;            // HH:MM
    endTime: string;              // HH:MM
  };
}

/**
 * Planning parameters (input to plan generator)
 */
export interface PlanningParameters {
  weeklyHours: number;
  litRatio: number;               // Percentage (0-1)
  maxHitDays: number;
  rampRate: number;               // Max weekly increase (e.g., 0.10 = 10%)
  tsbTarget: number;
  indoorAllowed: boolean;
  availableTimeSlots: TimeSlot[];
  activeCamp?: TrainingCamp;
  upcomingGoals: SeasonGoal[];
}

/**
 * Training guardrails (safety constraints)
 */
export interface Guardrails {
  maxRampRate: number;            // e.g., 0.15 = 15% max weekly increase
  minTsb: number;                 // e.g., -20
  maxTsb: number;                 // e.g., +15
  noHitBackToBack: boolean;       // Prevent HIT sessions on consecutive days
  minRecoveryAfterHit: number;    // Hours between HIT sessions
  maxHitDuration: number;         // Minutes per week
  tsbBeforeRace: number;          // Target TSB for race day
  maxConsecutiveHitWeeks: number; // Prevent too many hard weeks
}

/**
 * Plan quality assessment
 */
export interface PlanQuality {
  score: number;                  // 0-1 (overall quality score)
  warnings: PlanWarning[];
  adjustments: {
    splitSessions: number;        // Number of sessions split into multiple
    tssReduced: number;           // Number of sessions with reduced TSS
    totalTssLost: number;         // Total TSS reduction due to time constraints
  };
  factors: {
    timeSlotMatch: number;        // 0-1 (how well sessions fit available time)
    trainingDistribution: number; // 0-1 (LIT/HIT balance quality)
    recoveryAdequacy: number;     // 0-1 (recovery time between hard sessions)
  };
}

/**
 * Plan quality warning
 */
export interface PlanWarning {
  type: 'split-session' | 'tss-reduced' | 'insufficient-time' | 'suboptimal-timing';
  severity: 'info' | 'warning' | 'error';
  sessionIds: string[];
  message: string;
  details?: {
    originalTss?: number;
    adjustedTss?: number;
    originalDuration?: number;
    availableDuration?: number;
  };
}

/**
 * Training phase
 */
export type TrainingPhase = 'BASE' | 'BUILD' | 'PEAK' | 'TAPER' | 'TRANSITION';

/**
 * Phase configuration
 */
export interface PhaseConfig {
  phase: TrainingPhase;
  startDate: string;              // YYYY-MM-DD
  endDate: string;                // YYYY-MM-DD
  categoryDistribution: {
    LIT: number;                  // Percentage (0-1)
    TEMPO: number;
    FTP: number;
    VO2MAX: number;
    ANAEROBIC: number;
    NEUROMUSCULAR: number;
    SKILL: number;
  };
  intensityBias: number;          // -1 to +1 (-1=recovery focused, +1=intensity focused)
  volumeMultiplier: number;       // e.g., 1.2 = 20% more volume
}

/**
 * Planning strategy (for ML integration - Phase 2)
 */
export interface PlanningStrategy {
  type: 'heuristic' | 'ml' | 'hybrid';
  version: string;
  parameters: Record<string, any>;
}

/**
 * ML model features (for TSS prediction - Phase 2)
 */
export interface ModelFeatures {
  TSS_lag1: number;
  TSS_3d: number;
  TSS_7d: number;
  TSS_14d: number;
  TSS_28d: number;
  TSS_std7: number;
  TSS_zero7: number;
  CTL_42: number;
  ATL_7: number;
  TSB: number;
  ramp_7v42: number;
  dow_sin: number;
  dow_cos: number;
  mon_sin: number;
  mon_cos: number;
  [key: string]: number;
}

/**
 * TSS prediction from ML model (Phase 2)
 */
export interface TssPrediction {
  date: string;                   // YYYY-MM-DD
  predictedTss: number;
  confidence: number;             // 0-1
  features: ModelFeatures;
  modelVersion: string;
}
