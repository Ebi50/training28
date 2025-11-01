// User profile and settings types

/**
 * Core user authentication data
 */
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  stravaAthleteId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User training profile and settings
 */
export interface UserProfile {
  // Basic info
  email?: string;
  birthDate?: string;             // ISO date format (YYYY-MM-DD)
  age?: number;                   // Deprecated, use birthDate
  weight?: number;                // kg
  
  // Physiological data
  ftp?: number;                   // Functional Threshold Power (watts)
  lthr?: number;                  // Lactate Threshold Heart Rate (bpm)
  maxHr?: number;                 // Maximum Heart Rate (bpm)
  restHr?: number;                // Resting Heart Rate (bpm)
  
  // Strava integration
  stravaConnected?: boolean;
  stravaAthleteId?: string;
  
  // Weekly duration management
  weeklyOverrides?: Record<string, TimeSlot[]>; // Week-specific time slot overrides
  weeklyTrainingHoursTarget?: number; // Target training hours per week (e.g., 8.0) - STANDARD
  weeklyTargetHoursOverrides?: Record<string, number>; // Week-specific target hours overrides
  
  // Settings
  autoLogoutMinutes?: number;     // 0 = never, 5, 10, etc.
  preferences: UserPreferences;
}

/**
 * User training preferences
 */
export interface UserPreferences {
  indoorAllowed: boolean;
  availableDevices: string[];     // e.g. ["trainer", "power_meter", "hr_monitor"]
  preferredTrainingTimes: TimeSlot[];
  hideTimeSlotWarnings?: boolean; // User can dismiss time slot adjustment warnings
  units?: 'metric' | 'imperial';
  timezone?: string;
  language?: 'en' | 'de';
}

/**
 * Time slot for training availability
 */
export interface TimeSlot {
  day: number;                    // 1-7 (Monday-Sunday, ISO 8601)
  startTime: string;              // HH:MM (24-hour format)
  endTime: string;                // HH:MM (24-hour format)
  type: 'indoor' | 'outdoor' | 'both';
  priority?: 1 | 2 | 3;           // 1=Must use, 2=Prefer, 3=Optional
  active?: boolean;               // Can be temporarily disabled
}

/**
 * Strava OAuth integration data
 */
export interface StravaIntegration {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;              // Unix timestamp
  athleteId: string;
  scopes: string[];
  lastSync?: Date;
}

/**
 * Season goal/event (e.g. race, gran fondo)
 */
export interface SeasonGoal {
  id: string;
  title: string;
  date: Date;
  priority: 'A' | 'B' | 'C';      // A=main goal, B=important, C=training race
  discipline: 'road' | 'mtb' | 'cyclocross' | 'triathlon' | 'other';
  targetMetrics?: {
    targetPower?: number;         // Target average power (watts)
    targetDuration?: number;      // Target duration (minutes)
    targetDistance?: number;      // Target distance (km)
  };
  taperStrategy: TaperStrategy;
  notes?: string;
}

/**
 * Taper strategy for goal events
 */
export interface TaperStrategy {
  daysBeforeEvent: number;        // When to start taper
  volumeReduction: number;        // Percentage (e.g. 40 = 40% reduction)
  intensityMaintenance: boolean;  // Keep intensity high during taper
}

/**
 * Training camp configuration
 */
export interface TrainingCamp {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  volumeBump: number;             // Percentage increase (e.g. 30 = 30% more volume)
  hitCap: number;                 // Max HIT sessions per week during camp
  environment: {
    altitude?: number;            // meters
    temperature?: 'hot' | 'moderate' | 'cold';
    terrain?: 'flat' | 'hilly' | 'mountainous';
  };
  deloadAfter: {
    enabled: boolean;
    volumeReduction: number;      // Percentage reduction
    durationWeeks: number;        // How many weeks of deload
  };
  notes?: string;
}

/**
 * Wearable device integration (Phase 2)
 */
export interface WearableIntegration {
  provider: 'garmin' | 'whoop' | 'oura' | 'polar';
  connected: boolean;
  lastSync?: Date;
  capabilities: {
    hrv: boolean;
    sleep: boolean;
    stress: boolean;
    readiness: boolean;
  };
}
