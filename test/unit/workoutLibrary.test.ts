/**
 * Unit tests for Workout Library loader
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadWorkoutLibrary,
  getWorkoutById,
  getWorkoutsByCategory,
  findWorkouts,
  getRandomWorkout,
  getWorkoutStats,
  clearWorkoutCache,
} from '@/lib/workoutLibrary';

// Mock fetch for testing
global.fetch = vi.fn();

const mockIndex = {
  version: '3.0',
  created: '2025-11-01',
  description: 'Test library',
  total_workouts: 2,
  categories: {
    LIT: {
      name: 'Low Intensity Training',
      file: 'lit.json',
      count: 1,
      intensity_range: '60-75% FTP',
      duration_range: '60-150min',
    },
    TEMPO: {
      name: 'Tempo',
      file: 'tempo.json',
      count: 1,
      intensity_range: '80-92% FTP',
      duration_range: '55-85min',
    },
  },
};

const mockLitWorkouts = {
  category: 'LIT',
  name: 'Low Intensity Training',
  description: 'LIT workouts for aerobic base',
  intensity_range: '60-75% FTP',
  workouts: [
    {
      id: 'lit_01_ga1_60',
      name: 'GA1 60',
      duration_min: 60,
      tss_estimate: 45,
      structure: [
        { type: 'warmup', duration_s: 600, intensity_ftp: 0.60, description: 'Warmup' },
        { type: 'steady', duration_s: 2400, intensity_ftp: 0.65, description: 'Steady Z2' },
        { type: 'cooldown', duration_s: 480, intensity_ftp: 0.50, description: 'Cooldown' },
      ],
      tags: ['endurance', 'z2'],
      difficulty: 2,
      indoor_suitable: true,
      outdoor_suitable: true,
    },
  ],
};

const mockTempoWorkouts = {
  category: 'TEMPO',
  name: 'Tempo',
  description: 'Sweet spot workouts',
  intensity_range: '80-92% FTP',
  workouts: [
    {
      id: 'tempo_01_3x10',
      name: '3x10 Tempo',
      duration_min: 65,
      tss_estimate: 75,
      structure: [
        { type: 'warmup', duration_s: 600, intensity_ftp: 0.60 },
        { type: 'interval', reps: 3, on_duration_s: 600, off_duration_s: 300, intensity_ftp: 0.88, off_intensity_ftp: 0.55 },
        { type: 'cooldown', duration_s: 480, intensity_ftp: 0.50 },
      ],
      tags: ['sweetspot', 'intervals'],
      difficulty: 3,
      indoor_suitable: true,
      outdoor_suitable: false,
    },
  ],
};

beforeEach(() => {
  clearWorkoutCache();
  vi.clearAllMocks();
  
  // Setup fetch mock
  (global.fetch as any).mockImplementation((url: string) => {
    if (url.includes('index.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockIndex),
      });
    } else if (url.includes('lit.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLitWorkouts),
      });
    } else if (url.includes('tempo.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTempoWorkouts),
      });
    }
    return Promise.resolve({
      ok: false,
      statusText: 'Not Found',
    });
  });
});

describe('loadWorkoutLibrary', () => {
  it('should load and parse workout library', async () => {
    const library = await loadWorkoutLibrary();

    expect(library.version).toBe('3.0');
    expect(library.total_workouts).toBe(2);
    expect(library.workouts).toHaveLength(2);
    expect(library.categories.LIT).toBe(1);
    expect(library.categories.TEMPO).toBe(1);
  });

  it('should cache library and not reload', async () => {
    await loadWorkoutLibrary();
    await loadWorkoutLibrary();

    // fetch should only be called 3 times (index + 2 categories)
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should force refresh when requested', async () => {
    await loadWorkoutLibrary();
    await loadWorkoutLibrary(true);

    // fetch should be called 6 times (2 loads × 3 files)
    expect(global.fetch).toHaveBeenCalledTimes(6);
  });

  it('should transform workouts correctly', async () => {
    const library = await loadWorkoutLibrary();
    const litWorkout = library.workouts.find(w => w.id === 'lit_01_ga1_60');

    expect(litWorkout).toBeDefined();
    expect(litWorkout?.name).toBe('GA1 60');
    expect(litWorkout?.category).toBe('LIT');
    expect(litWorkout?.total_duration_s).toBe(3600); // 60 min
    expect(litWorkout?.target_tss).toBe(45);
    expect(litWorkout?.structure).toHaveLength(3);
    expect(litWorkout?.indoor_suitable).toBe(true);
    expect(litWorkout?.outdoor_suitable).toBe(true);
    expect(litWorkout?.difficulty).toBe(2);
    expect(litWorkout?.tags).toContain('endurance');
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(loadWorkoutLibrary()).rejects.toThrow();
  });
});

describe('getWorkoutById', () => {
  it('should return workout by ID', async () => {
    const workout = await getWorkoutById('lit_01_ga1_60');

    expect(workout).toBeDefined();
    expect(workout?.id).toBe('lit_01_ga1_60');
    expect(workout?.name).toBe('GA1 60');
  });

  it('should return null for non-existent ID', async () => {
    const workout = await getWorkoutById('non_existent');

    expect(workout).toBeNull();
  });
});

describe('getWorkoutsByCategory', () => {
  it('should return workouts filtered by category', async () => {
    const litWorkouts = await getWorkoutsByCategory('LIT');

    expect(litWorkouts).toHaveLength(1);
    expect(litWorkouts[0].category).toBe('LIT');
  });

  it('should return empty array for category with no workouts', async () => {
    const workouts = await getWorkoutsByCategory('VO2MAX');

    expect(workouts).toHaveLength(0);
  });
});

describe('findWorkouts', () => {
  it('should filter by category', async () => {
    const workouts = await findWorkouts({ category: 'TEMPO' });

    expect(workouts).toHaveLength(1);
    expect(workouts[0].category).toBe('TEMPO');
  });

  it('should filter by duration range', async () => {
    const workouts = await findWorkouts({ minDuration: 60, maxDuration: 61 });

    expect(workouts).toHaveLength(1);
    expect(workouts[0].id).toBe('lit_01_ga1_60');
  });

  it('should filter by TSS range', async () => {
    const workouts = await findWorkouts({ minTss: 70, maxTss: 80 });

    expect(workouts).toHaveLength(1);
    expect(workouts[0].id).toBe('tempo_01_3x10');
  });

  it('should filter by indoor suitability', async () => {
    const workouts = await findWorkouts({ indoorOnly: true });

    expect(workouts).toHaveLength(2); // Both workouts are indoor suitable
  });

  it('should filter by outdoor suitability', async () => {
    const workouts = await findWorkouts({ outdoorOnly: true });

    expect(workouts).toHaveLength(1);
    expect(workouts[0].id).toBe('lit_01_ga1_60');
  });

  it('should filter by difficulty', async () => {
    const workouts = await findWorkouts({ difficulty: [2] });

    expect(workouts).toHaveLength(1);
    expect(workouts[0].difficulty).toBe(2);
  });

  it('should filter by tags', async () => {
    const workouts = await findWorkouts({ tags: ['sweetspot'] });

    expect(workouts).toHaveLength(1);
    expect(workouts[0].id).toBe('tempo_01_3x10');
  });

  it('should combine multiple filters', async () => {
    const workouts = await findWorkouts({
      category: 'TEMPO',
      minTss: 50,
      maxTss: 100,
      indoorOnly: true,
    });

    expect(workouts).toHaveLength(1);
    expect(workouts[0].id).toBe('tempo_01_3x10');
  });

  it('should return empty array when no workouts match', async () => {
    const workouts = await findWorkouts({
      category: 'LIT',
      minTss: 1000,
    });

    expect(workouts).toHaveLength(0);
  });
});

describe('getRandomWorkout', () => {
  it('should return a random workout matching criteria', async () => {
    const workout = await getRandomWorkout({ category: 'LIT' });

    expect(workout).toBeDefined();
    expect(workout?.category).toBe('LIT');
  });

  it('should return null when no workouts match', async () => {
    const workout = await getRandomWorkout({ category: 'VO2MAX' });

    expect(workout).toBeNull();
  });
});

describe('getWorkoutStats', () => {
  it('should calculate workout statistics', async () => {
    const stats = await getWorkoutStats();

    expect(stats.totalWorkouts).toBe(2);
    expect(stats.byCategory.LIT).toBe(1);
    expect(stats.byCategory.TEMPO).toBe(1);
    expect(stats.avgDurationMin).toBe(62.5); // (60 + 65) / 2
    expect(stats.avgTss).toBe(60); // (45 + 75) / 2
    expect(stats.durationRange.min).toBe(60);
    expect(stats.durationRange.max).toBe(65);
    expect(stats.tssRange.min).toBe(45);
    expect(stats.tssRange.max).toBe(75);
  });
});
