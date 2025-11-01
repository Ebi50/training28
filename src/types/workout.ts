// Workout-related types for the training system

/**
 * Workout segment definition (building block of a workout)
 */
export interface WorkoutSegment {
  type: 'warmup' | 'steady' | 'interval' | 'cooldown';
  duration_s?: number;            // For warmup/steady/cooldown
  reps?: number;                  // For intervals
  on_duration_s?: number;         // For intervals (work duration)
  off_duration_s?: number;        // For intervals (rest duration)
  on_intensity_ftp: number;       // 0.60 to 1.80 (% of FTP)
  off_intensity_ftp?: number;     // For intervals (rest intensity)
  cadence?: number;               // Optional (rpm)
  text?: string;                  // Optional description
}

/**
 * Complete workout definition
 */
export interface Workout {
  id: string;                     // e.g. "tempo_06_3x20_tempo_85"
  name: string;                   // e.g. "3x20min Tempo @85%"
  category: WorkoutCategory;
  description: string;
  structure: WorkoutSegment[];
  total_duration_s: number;       // Total duration in seconds
  target_tss: number;             // Estimated TSS
  indoor_suitable: boolean;       // Can be done on trainer
  outdoor_suitable: boolean;      // Can be done outdoors
  difficulty: 1 | 2 | 3 | 4 | 5;  // 1=easy, 5=very hard
  tags?: string[];                // e.g. ["sweetspot", "threshold", "intervals"]
}

/**
 * Workout category (training zone focus)
 */
export type WorkoutCategory = 
  | 'LIT'           // Low Intensity Training (<75% FTP)
  | 'TEMPO'         // Tempo/Sweetspot (75-85% FTP)
  | 'FTP'           // Threshold (88-95% FTP)
  | 'VO2MAX'        // VO2max intervals (105-120% FTP)
  | 'ANAEROBIC'     // Anaerobic capacity (>120% FTP)
  | 'NEUROMUSCULAR' // Neuromuscular power (sprints)
  | 'SKILL'         // Skills/drills (cadence, cornering, etc.)
  | 'RECOVERY';     // Active recovery

/**
 * Workout library metadata
 */
export interface WorkoutLibrary {
  version: string;
  total_workouts: number;
  categories: Record<WorkoutCategory, number>;
  workouts: Workout[];
}

/**
 * ZWO (Zwift Workout) file generation parameters
 */
export interface ZwoOptions {
  ftp: number;
  author?: string;
  description?: string;
  sportType?: 'bike' | 'run';
}

/**
 * Workout rating from user feedback
 */
export type WorkoutRating = 'TOO_HARD' | 'PERFECT' | 'TOO_EASY';

/**
 * Workout completion record
 */
export interface WorkoutCompletion {
  workout_id: string;
  planned_tss: number;
  actual_tss: number;
  planned_duration_s: number;
  actual_duration_s: number;
  rating?: WorkoutRating;
  rating_timestamp?: Date;
  notes?: string;
}
