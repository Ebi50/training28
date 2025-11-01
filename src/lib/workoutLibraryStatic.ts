/**
 * Static Workout Library Loader
 * 
 * Imports workout definitions statically instead of fetching at runtime.
 * More reliable for client-side usage.
 */

import type { Workout, WorkoutCategory, WorkoutLibrary } from '@/types/workout';

// Import all workout JSON files statically
import indexData from '@/../../workouts/index.json';
import litData from '@/../../workouts/lit.json';
import tempoData from '@/../../workouts/tempo.json';
import ftpData from '@/../../workouts/ftp.json';
import vo2maxData from '@/../../workouts/vo2max.json';
import anaerobicData from '@/../../workouts/anaerobic.json';
import neuromuscularData from '@/../../workouts/neuromuscular.json';
import skillData from '@/../../workouts/skill.json';

// Cache for loaded workouts
let cachedLibrary: WorkoutLibrary | null = null;

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
 * Load workout library from static imports
 */
export async function loadWorkoutLibrary(): Promise<WorkoutLibrary> {
  // Return cached library if available
  if (cachedLibrary) {
    console.log('✅ Using cached workout library');
    return cachedLibrary;
  }

  console.log('📦 Loading workout library from static imports...');

  try {
    // Map category files
    const categoryFiles: Record<WorkoutCategory, RawCategoryFile> = {
      LIT: litData as RawCategoryFile,
      TEMPO: tempoData as RawCategoryFile,
      FTP: ftpData as RawCategoryFile,
      VO2MAX: vo2maxData as RawCategoryFile,
      ANAEROBIC: anaerobicData as RawCategoryFile,
      NEUROMUSCULAR: neuromuscularData as RawCategoryFile,
      SKILL: skillData as RawCategoryFile,
      RECOVERY: litData as RawCategoryFile, // Use LIT for recovery
    };

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

    for (const [categoryKey, data] of Object.entries(categoryFiles)) {
      const category = categoryKey as WorkoutCategory;
      const workouts = data.workouts.map(raw => transformWorkout(raw, category, data.description));
      allWorkouts.push(...workouts);
      categoryCounts[category] = workouts.length;
    }

    // Build library object
    const library: WorkoutLibrary = {
      version: (indexData as any).version || '1.0.0',
      total_workouts: allWorkouts.length,
      categories: categoryCounts,
      workouts: allWorkouts,
    };

    // Update cache
    cachedLibrary = library;

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
  // Transform structure to match WorkoutSegment type
  const structure = raw.structure.map(segment => ({
    ...segment,
    on_intensity_ftp: segment.intensity_ftp,
    text: segment.description,
  }));

  return {
    id: raw.id,
    name: raw.name,
    category,
    description: raw.description || categoryDescription,
    structure,
    total_duration_s: raw.duration_min * 60,
    target_tss: raw.tss_estimate,
    indoor_suitable: raw.indoor_suitable ?? true,
    outdoor_suitable: raw.outdoor_suitable ?? true,
    difficulty: raw.difficulty || 3,
    tags: raw.tags || [],
  };
}

/**
 * Find workouts matching criteria
 */
export function findWorkouts(
  library: WorkoutLibrary,
  criteria: {
    category?: WorkoutCategory;
    minDuration?: number;
    maxDuration?: number;
    minTSS?: number;
    maxTSS?: number;
    tags?: string[];
    difficulty?: number[];
    indoor?: boolean;
    outdoor?: boolean;
  }
): Workout[] {
  let results = library.workouts;

  // Filter by category
  if (criteria.category) {
    results = results.filter(w => w.category === criteria.category);
  }

  // Filter by duration
  if (criteria.minDuration !== undefined) {
    results = results.filter(w => w.total_duration_s / 60 >= criteria.minDuration!);
  }
  if (criteria.maxDuration !== undefined) {
    results = results.filter(w => w.total_duration_s / 60 <= criteria.maxDuration!);
  }

  // Filter by TSS
  if (criteria.minTSS !== undefined) {
    results = results.filter(w => w.target_tss >= criteria.minTSS!);
  }
  if (criteria.maxTSS !== undefined) {
    results = results.filter(w => w.target_tss <= criteria.maxTSS!);
  }

  // Filter by tags
  if (criteria.tags && criteria.tags.length > 0) {
    results = results.filter(w =>
      w.tags && criteria.tags!.some(tag => w.tags!.includes(tag))
    );
  }

  // Filter by difficulty
  if (criteria.difficulty && criteria.difficulty.length > 0) {
    results = results.filter(w => criteria.difficulty!.includes(w.difficulty));
  }

  // Filter by indoor/outdoor suitability
  if (criteria.indoor !== undefined) {
    results = results.filter(w => w.indoor_suitable === criteria.indoor);
  }
  if (criteria.outdoor !== undefined) {
    results = results.filter(w => w.outdoor_suitable === criteria.outdoor);
  }

  return results;
}
