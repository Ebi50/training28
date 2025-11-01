/**
 * Workout Library Loader
 * 
 * Loads and caches workout definitions from JSON files.
 * Provides filtering and search capabilities.
 */

import type { Workout, WorkoutCategory, WorkoutLibrary } from '@/types/workout';

// Cache for loaded workouts
let cachedLibrary: WorkoutLibrary | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

/**
 * Workout metadata from index.json
 */
interface WorkoutIndex {
  version: string;
  created: string;
  description: string;
  total_workouts: number;
  categories: Record<string, {
    name: string;
    file: string;
    count: number;
    intensity_range: string;
    duration_range: string;
  }>;
}

/**
 * Raw workout structure from JSON files
 */
interface RawWorkout {
  id: string;
  name: string;
  duration_min: number;
  tss_estimate: number;
  structure: Array<{
    type: 'warmup' | 'steady' | 'interval' | 'cooldown';
    duration_s?: number;
    reps?: number;
    on_duration_s?: number;
    off_duration_s?: number;
    intensity_ftp: number;
    off_intensity_ftp?: number;
    cadence?: number;
    description?: string;
  }>;
  tags?: string[];
  difficulty?: 1 | 2 | 3 | 4 | 5;
  indoor_suitable?: boolean;
  outdoor_suitable?: boolean;
  description?: string;
}

/**
 * Raw category file structure
 */
interface RawCategoryFile {
  category: string;
  name: string;
  description: string;
  intensity_range: string;
  workouts: RawWorkout[];
}

/**
 * Load workout library from JSON files
 * Uses in-memory cache to avoid repeated file reads
 */
export async function loadWorkoutLibrary(forceRefresh = false): Promise<WorkoutLibrary> {
  // Return cached library if valid
  const now = Date.now();
  if (!forceRefresh && cachedLibrary && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return cachedLibrary;
  }

  try {
    // Load index file
    console.log('📦 Loading workout index from /workouts/index.json');
    const indexResponse = await fetch('/workouts/index.json');
    console.log('📦 Index response status:', indexResponse.status, indexResponse.statusText);
    
    if (!indexResponse.ok) {
      console.error('❌ Index response not OK:', indexResponse.status, indexResponse.statusText);
      throw new Error(`Failed to load workout index: ${indexResponse.statusText}`);
    }
    
    const indexText = await indexResponse.text();
    console.log('📦 Index raw text (first 200 chars):', indexText.substring(0, 200));
    
    const index: WorkoutIndex = JSON.parse(indexText);
    console.log('✅ Index parsed successfully:', index);

    // Load all category files in parallel
    const categoryPromises = Object.entries(index.categories).map(async ([category, meta]) => {
      const response = await fetch(`/workouts/${meta.file}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${category} workouts: ${response.statusText}`);
      }
      const data: RawCategoryFile = await response.json();
      return { category: category as WorkoutCategory, data };
    });

    const categoryResults = await Promise.all(categoryPromises);

    // Transform raw workouts into typed Workout objects
    const allWorkouts: Workout[] = [];
    const categoryCounts: Record<WorkoutCategory, number> = {
      LIT: 0,
      TEMPO: 0,
      FTP: 0,
      VO2MAX: 0,
      ANAEROBIC: 0,
      NEUROMUSCULAR: 0,
      SKILL: 0,
      RECOVERY: 0,
    };

    for (const { category, data } of categoryResults) {
      const workouts = data.workouts.map(raw => transformWorkout(raw, category, data.description));
      allWorkouts.push(...workouts);
      categoryCounts[category] = workouts.length;
    }

    // Build library object
    const library: WorkoutLibrary = {
      version: index.version,
      total_workouts: allWorkouts.length,
      categories: categoryCounts,
      workouts: allWorkouts,
    };

    // Update cache
    cachedLibrary = library;
    cacheTimestamp = now;

    console.log(`✅ Loaded workout library: ${library.total_workouts} workouts across ${Object.keys(library.categories).length} categories`);

    return library;
  } catch (error) {
    console.error('❌ Failed to load workout library:', error);
    throw error;
  }
}

/**
 * Transform raw workout JSON into typed Workout object
 */
function transformWorkout(
  raw: RawWorkout,
  category: WorkoutCategory,
  categoryDescription: string
): Workout {
  return {
    id: raw.id,
    name: raw.name,
    category,
    description: raw.description || categoryDescription,
    structure: raw.structure.map(segment => ({
      type: segment.type,
      duration_s: segment.duration_s,
      reps: segment.reps,
      on_duration_s: segment.on_duration_s,
      off_duration_s: segment.off_duration_s,
      on_intensity_ftp: segment.intensity_ftp,
      off_intensity_ftp: segment.off_intensity_ftp,
      cadence: segment.cadence,
      text: segment.description,
    })),
    total_duration_s: raw.duration_min * 60,
    target_tss: raw.tss_estimate,
    indoor_suitable: raw.indoor_suitable ?? true, // Default to true
    outdoor_suitable: raw.outdoor_suitable ?? true, // Default to true
    difficulty: raw.difficulty ?? 3, // Default to medium difficulty
    tags: raw.tags,
  };
}

/**
 * Get workout by ID
 */
export async function getWorkoutById(workoutId: string): Promise<Workout | null> {
  const library = await loadWorkoutLibrary();
  return library.workouts.find(w => w.id === workoutId) || null;
}

/**
 * Filter workouts by category
 */
export async function getWorkoutsByCategory(category: WorkoutCategory): Promise<Workout[]> {
  const library = await loadWorkoutLibrary();
  return library.workouts.filter(w => w.category === category);
}

/**
 * Find workouts matching duration and TSS constraints
 */
export interface WorkoutSearchCriteria {
  category?: WorkoutCategory;
  minDuration?: number; // minutes
  maxDuration?: number; // minutes
  minTss?: number;
  maxTss?: number;
  indoorOnly?: boolean;
  outdoorOnly?: boolean;
  difficulty?: number[];
  tags?: string[];
}

export async function findWorkouts(criteria: WorkoutSearchCriteria): Promise<Workout[]> {
  const library = await loadWorkoutLibrary();
  
  return library.workouts.filter(workout => {
    // Category filter
    if (criteria.category && workout.category !== criteria.category) {
      return false;
    }

    // Duration filters
    const durationMin = workout.total_duration_s / 60;
    if (criteria.minDuration && durationMin < criteria.minDuration) {
      return false;
    }
    if (criteria.maxDuration && durationMin > criteria.maxDuration) {
      return false;
    }

    // TSS filters
    if (criteria.minTss && workout.target_tss < criteria.minTss) {
      return false;
    }
    if (criteria.maxTss && workout.target_tss > criteria.maxTss) {
      return false;
    }

    // Indoor/outdoor filters
    if (criteria.indoorOnly && !workout.indoor_suitable) {
      return false;
    }
    if (criteria.outdoorOnly && !workout.outdoor_suitable) {
      return false;
    }

    // Difficulty filter
    if (criteria.difficulty && criteria.difficulty.length > 0) {
      if (!criteria.difficulty.includes(workout.difficulty)) {
        return false;
      }
    }

    // Tags filter
    if (criteria.tags && criteria.tags.length > 0) {
      if (!workout.tags || !criteria.tags.some(tag => workout.tags!.includes(tag))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get random workout matching criteria (useful for variety)
 */
export async function getRandomWorkout(criteria: WorkoutSearchCriteria): Promise<Workout | null> {
  const matches = await findWorkouts(criteria);
  if (matches.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * matches.length);
  return matches[randomIndex];
}

/**
 * Get workout statistics
 */
export interface WorkoutStats {
  totalWorkouts: number;
  byCategory: Record<WorkoutCategory, number>;
  avgDurationMin: number;
  avgTss: number;
  durationRange: { min: number; max: number };
  tssRange: { min: number; max: number };
}

export async function getWorkoutStats(): Promise<WorkoutStats> {
  const library = await loadWorkoutLibrary();
  
  const durations = library.workouts.map(w => w.total_duration_s / 60);
  const tssValues = library.workouts.map(w => w.target_tss);

  return {
    totalWorkouts: library.total_workouts,
    byCategory: library.categories,
    avgDurationMin: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    avgTss: tssValues.reduce((sum, t) => sum + t, 0) / tssValues.length,
    durationRange: {
      min: Math.min(...durations),
      max: Math.max(...durations),
    },
    tssRange: {
      min: Math.min(...tssValues),
      max: Math.max(...tssValues),
    },
  };
}

/**
 * Clear workout library cache (useful for testing)
 */
export function clearWorkoutCache(): void {
  cachedLibrary = null;
  cacheTimestamp = 0;
}
