// Core types for the training system
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  stravaAthleteId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  age?: number;
  weight?: number;
  ftp?: number;
  lthr?: number;
  maxHr?: number;
  restHr?: number;
  preferences: {
    indoorAllowed: boolean;
    availableDevices: string[];
    preferredTrainingTimes: TimeSlot[];
  };
}

export interface TimeSlot {
  day: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: 'indoor' | 'outdoor' | 'both';
}

export interface StravaIntegration {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: string;
  scopes: string[];
  lastSync?: Date;
}

export interface SeasonGoal {
  id: string;
  title: string;
  date: Date;
  priority: 'A' | 'B' | 'C';
  discipline: 'road' | 'mtb' | 'cyclocross' | 'triathlon' | 'other';
  targetMetrics?: {
    targetPower?: number;
    targetDuration?: number;
    targetDistance?: number;
  };
  taperStrategy: {
    daysBeforeEvent: number;
    volumeReduction: number; // percentage
    intensityMaintenance: boolean;
  };
  notes?: string;
}

export interface TrainingCamp {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  volumeBump: number; // percentage increase
  hitCap: number; // max HIT sessions per week
  environment: {
    altitude?: number;
    temperature?: 'hot' | 'moderate' | 'cold';
    terrain?: 'flat' | 'hilly' | 'mountainous';
  };
  deloadAfter: {
    enabled: boolean;
    volumeReduction: number; // percentage
    durationWeeks: number;
  };
  notes?: string;
}

export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  ctl: number; // Chronic Training Load
  atl: number; // Acute Training Load
  tsb: number; // Training Stress Balance
  tss: number; // Training Stress Score for the day
  hrv?: number;
  sleepScore?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  fatigue?: number; // Subjective fatigue (1-10)
  indoor: boolean;
  tags?: string[];
  notes?: string;
}

export interface Activity {
  id: string;
  stravaId?: string;
  startTime: Date;
  duration: number; // seconds
  type: 'ride' | 'run' | 'swim' | 'strength' | 'other';
  tss: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgPower?: number;
  maxPower?: number;
  distance?: number; // meters
  elevation?: number; // meters
  indoor: boolean;
  deviceFlags: {
    powerMeter: boolean;
    heartRateMonitor: boolean;
    cadenceSensor: boolean;
  };
  source: 'strava' | 'manual' | 'garmin' | 'wahoo' | 'other';
  completed: boolean;
  compliance?: 'completed' | 'partial' | 'missed' | 'modified';
}

export interface TrainingSession {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'LIT' | 'HIT' | 'REC' | 'STRENGTH';
  subType?: 'endurance' | 'tempo' | 'threshold' | 'vo2max' | 'neuromuscular' | 'recovery';
  duration: number; // minutes
  targetTss: number;
  actualTss?: number;
  indoor: boolean;
  description: string;
  notes?: string;
  completed: boolean;
  activityId?: string; // Link to actual activity
  timeSlot?: {
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  };
}

export interface WeeklyPlan {
  id: string; // e.g., "2025-W45"
  weekStartDate: string; // YYYY-MM-DD (Monday)
  userId: string;
  totalHours: number;
  totalTss: number;
  litRatio: number; // percentage
  hitSessions: number;
  sessions: TrainingSession[];
  constraints: {
    availableHours: number;
    maxHitDays: number;
    campActive?: string; // camp ID if active
    goalApproaching?: string; // goal ID if within taper period
  };
  generated: Date;
  lastModified: Date;
  compliance?: {
    completedSessions: number;
    totalSessions: number;
    adherenceScore: number; // 0-1
  };
}

export interface PlanningParameters {
  weeklyHours: number;
  litRatio: number;
  maxHitDays: number;
  rampRate: number; // max weekly increase
  tsbTarget: number;
  indoorAllowed: boolean;
  availableTimeSlots: TimeSlot[];
  activeCamp?: TrainingCamp;
  upcomingGoals: SeasonGoal[];
}

export interface Guardrails {
  maxRampRate: number; // 0.15 = 15%
  minTsb: number; // -20
  maxTsb: number; // +15
  noHitBackToBack: boolean;
  minRecoveryAfterHit: number; // hours
  maxHitDuration: number; // minutes per week
  tsbBeforeRace: number; // target TSB for race day
  maxConsecutiveHitWeeks: number;
}

// ML and Analytics types
export interface ModelFeatures {
  tss_lag1: number;
  tss_3d: number;
  tss_7d: number;
  tss_14d: number;
  tss_28d: number;
  tss_std7: number;
  tss_zero7: number;
  ctl_42: number;
  atl_7: number;
  tsb: number;
  ramp_7v42: number;
  dow_sin: number;
  dow_cos: number;
  mon_sin: number;
  mon_cos: number;
  [key: string]: number;
}

export interface TssPrediction {
  date: string;
  predictedTss: number;
  confidence: number;
  features: ModelFeatures;
  modelVersion: string;
}

export interface PlanningStrategy {
  type: 'heuristic' | 'ml' | 'hybrid';
  version: string;
  parameters: Record<string, any>;
}