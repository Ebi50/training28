/**
 * ZWO (Zwift Workout) Generator
 * 
 * Generates .ZWO files for Zwift and MyWhoosh from training sessions.
 * Based on the workout structure from planGenerator.ts
 */

import type { TrainingSession } from '@/types';

// Step types for ZWO workouts
type Step =
  | { type: "Warmup"; durationSec: number; powerLow: number; powerHigh: number; name?: string; cadence?: number }
  | { type: "SteadyState"; durationSec: number; power: number; name?: string; cadence?: number }
  | { type: "IntervalsT"; repeat: number; onSec: number; offSec: number; onPower: number; offPower: number; name?: string; cadence?: number }
  | { type: "Cooldown"; durationSec: number; powerLow: number; powerHigh: number; name?: string; cadence?: number }
  | { type: "FreeRide"; durationSec: number; flatRoad?: boolean; name?: string };

/**
 * Helper to convert value to string attribute
 */
function toAttr(v: number | string | boolean): string {
  return String(v);
}

/**
 * Build ZWO XML from workout steps
 */
export function buildZwoXML(opts: {
  title: string;
  description?: string;
  author?: string;
  sportType?: "bike";
  tags?: string[];
  steps: Step[];
}): string {
  const { 
    title, 
    description = "", 
    author = "Adaptive Training System", 
    sportType = "bike", 
    tags = ["Custom"], 
    steps 
  } = opts;

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  const attrs = (obj: Record<string, string | number | boolean | undefined>) =>
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => ` ${k[0].toUpperCase() + k.slice(1)}="${esc(toAttr(v as any))}"`)
      .join("");

  const stepXml = steps
    .map((s) => {
      switch (s.type) {
        case "Warmup":
          return `<Warmup${attrs({ duration: s.durationSec, powerLow: s.powerLow, powerHigh: s.powerHigh, name: s.name, cadence: s.cadence })} />`;
        case "SteadyState":
          return `<SteadyState${attrs({ duration: s.durationSec, power: s.power, name: s.name, cadence: s.cadence })} />`;
        case "IntervalsT":
          return `<IntervalsT${attrs({ repeat: s.repeat, onDuration: s.onSec, offDuration: s.offSec, onPower: s.onPower, offPower: s.offPower, name: s.name, cadence: s.cadence })} />`;
        case "Cooldown":
          return `<Cooldown${attrs({ duration: s.durationSec, powerLow: s.powerLow, powerHigh: s.powerHigh, name: s.name, cadence: s.cadence })} />`;
        case "FreeRide":
          return `<FreeRide${attrs({ duration: s.durationSec, flatRoad: s.flatRoad ?? true, name: s.name })} />`;
      }
    })
    .join("\n    ");

  const tagXml = tags.map((t) => `<tag name="${esc(t)}"/>`).join("\n    ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>${esc(author)}</author>
  <name>${esc(title)}</name>
  <description>${esc(description)}</description>
  <sportType>${sportType}</sportType>
  <tags>
    ${tagXml}
  </tags>
  <workout>
    ${stepXml}
  </workout>
</workout_file>`;
}

/**
 * Generate ZWO from TrainingSession
 * Maps our training session types to ZWO workout blocks
 */
export function generateZWOFromSession(session: TrainingSession, ftp: number): string {
  const steps: Step[] = [];
  const totalMinutes = session.duration;
  const subType = session.type; // We'll use the session type/subType

  // Determine workout type based on session
  const sessionType = session.type;
  
  if (sessionType === 'REC') {
    // Recovery: Simple easy ride
    steps.push({
      type: "SteadyState",
      durationSec: totalMinutes * 60,
      power: 0.50,
      name: "Recovery Ride"
    });
  } else if (sessionType === 'LIT') {
    // LIT: Dynamic Warmup + Steady + Cooldown (proportional to duration)
    const totalSec = totalMinutes * 60;
    const warmupPercentage = 0.15; // 15% of total time
    const cooldownPercentage = 0.10; // 10% of total time
    
    const warmupSec = Math.max(Math.round(totalSec * warmupPercentage), 5 * 60); // Min 5min
    const cooldownSec = Math.max(Math.round(totalSec * cooldownPercentage), 5 * 60); // Min 5min
    const steadySec = Math.max(totalSec - warmupSec - cooldownSec, 5 * 60);

    steps.push({
      type: "Warmup",
      durationSec: warmupSec,
      powerLow: 0.50,
      powerHigh: 0.65,
      name: "Warm-up"
    });

    steps.push({
      type: "SteadyState",
      durationSec: steadySec,
      power: 0.70, // Zone 2
      name: "Endurance Base"
    });

    steps.push({
      type: "Cooldown",
      durationSec: cooldownSec,
      powerLow: 0.65,
      powerHigh: 0.50,
      name: "Cool-down"
    });
  } else if (sessionType === 'HIT') {
    // HIT: Dynamic Warmup + Intervals + Cooldown
    const totalSec = totalMinutes * 60;
    const intensity = session.targetTss / totalMinutes;
    
    // Dynamic warmup/cooldown for HIT (longer warmup for harder sessions)
    const warmupPercentage = intensity > 1.0 ? 0.20 : 0.15; // 20% for hard, 15% for tempo
    const cooldownPercentage = 0.12; // 12% of total time
    
    const warmupSec = Math.max(Math.round(totalSec * warmupPercentage), 10 * 60); // Min 10min for HIT
    const cooldownSec = Math.max(Math.round(totalSec * cooldownPercentage), 8 * 60); // Min 8min
    
    // Calculate remaining time for intervals
    const intervalTimeSec = totalSec - warmupSec - cooldownSec;
    
    let intervalConfig: { repeat: number; onSec: number; offSec: number; onPower: number; offPower: number; name: string };
    
    if (intensity > 1.2) {
      // VO2max intervals - calculate reps based on available time
      const intervalCycleSec = (5 * 60) + (2 * 60); // 5min on + 2min off
      const repeat = Math.max(Math.floor(intervalTimeSec / intervalCycleSec), 3); // Min 3 reps
      
      intervalConfig = {
        repeat,
        onSec: 5 * 60, // 5 min
        offSec: 2 * 60, // 2 min rest
        onPower: 1.20,
        offPower: 0.50,
        name: "VO2max Intervals"
      };
    } else if (intensity > 0.9) {
      // Threshold intervals - calculate based on available time
      const intervalCycleSec = (10 * 60) + (3 * 60); // 10min on + 3min off
      const repeat = Math.max(Math.floor(intervalTimeSec / intervalCycleSec), 2); // Min 2 reps
      
      intervalConfig = {
        repeat,
        onSec: 10 * 60, // 10 min
        offSec: 3 * 60, // 3 min rest
        onPower: 1.00,
        offPower: 0.55,
        name: "Threshold Intervals"
      };
    } else {
      // Tempo intervals - longer blocks
      const intervalCycleSec = (20 * 60) + (5 * 60); // 20min on + 5min off
      const repeat = Math.max(Math.floor(intervalTimeSec / intervalCycleSec), 2); // Min 2 reps
      
      intervalConfig = {
        repeat,
        onSec: 20 * 60, // 20 min
        offSec: 5 * 60, // 5 min rest
        onPower: 0.90,
        offPower: 0.60,
        name: "Tempo Intervals"
      };
    }

    // Warmup (dynamic duration)
    steps.push({
      type: "Warmup",
      durationSec: warmupSec,
      powerLow: 0.50,
      powerHigh: 0.75,
      name: "Warm-up"
    });

    // Main intervals
    steps.push({
      type: "IntervalsT",
      ...intervalConfig
    });

    // Cooldown (dynamic duration)
    steps.push({
      type: "Cooldown",
      durationSec: cooldownSec,
      powerLow: 0.60,
      powerHigh: 0.50,
      name: "Cool-down"
    });
  } else {
    // REST day - short easy spin
    steps.push({
      type: "SteadyState",
      durationSec: 30 * 60, // 30 min
      power: 0.40,
      name: "Rest Day Spin (optional)"
    });
  }

  // Build title from session
  const dateStr = new Date(session.date).toISOString().split('T')[0];
  const title = `${dateStr}_${sessionType}_${session.description?.split('-')[0]?.trim() || 'Workout'}`;
  
  // Get clean description
  const description = session.description || `${sessionType} training session (${session.targetTss} TSS)`;

  // Tags based on session type
  const tags: string[] = [sessionType];
  if (session.indoor) tags.push('Indoor');
  if (session.timeSlot) tags.push(`Time: ${session.timeSlot.startTime}`);
  if (session.subType) tags.push(session.subType);

  return buildZwoXML({
    title,
    description,
    tags,
    steps
  });
}

/**
 * Generate filename for ZWO download
 */
export function generateZWOFilename(session: TrainingSession): string {
  const dateStr = new Date(session.date).toISOString().split('T')[0];
  const type = session.type;
  
  // Extract workout name (first part before dash)
  const name = session.description?.split('-')[0]?.trim().replace(/\s+/g, '_') || 'Workout';
  
  // Add time slot if specified
  const slot = session.timeSlot ? `_${session.timeSlot.startTime.replace(':', '')}` : '';
  
  return `${dateStr}${slot}_${type}_${name}.zwo`;
}

/**
 * Preset for LIT workouts (DYNAMIC warmup/cooldown)
 * 
 * @param totalMinutes Total workout duration
 * @param targetIF Target Intensity Factor (default 0.70 = Zone 2)
 * 
 * Warmup: 15% of total time (min 5min)
 * Cooldown: 10% of total time (min 5min)
 * Steady: Remaining time
 */
export function litPreset(totalMinutes: number, targetIF = 0.70): Step[] {
  const totalSec = totalMinutes * 60;
  
  // Dynamic warmup/cooldown
  const warmupSec = Math.max(Math.round(totalSec * 0.15), 5 * 60); // 15% or min 5min
  const cooldownSec = Math.max(Math.round(totalSec * 0.10), 5 * 60); // 10% or min 5min
  const steadySec = Math.max(totalSec - warmupSec - cooldownSec, 5 * 60);
  
  return [
    { 
      type: "Warmup", 
      durationSec: warmupSec, 
      powerLow: 0.50, 
      powerHigh: targetIF, 
      name: "Warm-up" 
    },
    { 
      type: "SteadyState", 
      durationSec: steadySec, 
      power: targetIF, 
      name: "LIT Steady" 
    },
    { 
      type: "Cooldown", 
      durationSec: cooldownSec, 
      powerLow: targetIF, 
      powerHigh: 0.50, 
      name: "Cool-down" 
    },
  ];
}

/**
 * Preset for HIT 4x4 intervals (DYNAMIC warmup/cooldown)
 * 
 * @param totalMinutes Total workout duration (if not specified, uses 4x4min + warmup/cooldown)
 * @param intensity Target power (default 1.20 = 120% FTP)
 * 
 * If totalMinutes provided: 
 *   - Warmup: 20% of total time (min 10min)
 *   - Intervals: 4x4min work + 4min rest
 *   - Cooldown: Remaining time (min 8min)
 * 
 * If not provided: Uses classic 4x4 (64min total)
 */
export function hit4x4Preset(intensity = 1.20, totalMinutes?: number): Step[] {
  if (!totalMinutes) {
    // Classic 4x4: 12min warmup + 4x(4min+4min) + 8min cooldown = 64min
    return [
      { 
        type: "Warmup", 
        durationSec: 12 * 60, 
        powerLow: 0.50, 
        powerHigh: 0.75, 
        name: "Warm-up" 
      },
      { 
        type: "IntervalsT", 
        repeat: 4, 
        onSec: 4 * 60, 
        offSec: 4 * 60, 
        onPower: intensity, 
        offPower: 0.50, 
        name: "4x4 Intervals" 
      },
      { 
        type: "Cooldown", 
        durationSec: 8 * 60, 
        powerLow: 0.60, 
        powerHigh: 0.50, 
        name: "Cool-down" 
      },
    ];
  }

  // Dynamic version based on total duration
  const totalSec = totalMinutes * 60;
  const warmupSec = Math.max(Math.round(totalSec * 0.20), 10 * 60); // 20% or min 10min
  const cooldownSec = Math.max(Math.round(totalSec * 0.12), 8 * 60); // 12% or min 8min
  
  // Intervals take remaining time
  const intervalTimeSec = totalSec - warmupSec - cooldownSec;
  const intervalCycleSec = (4 * 60) + (4 * 60); // 4min on + 4min off
  const repeat = Math.max(Math.floor(intervalTimeSec / intervalCycleSec), 3); // Min 3 reps

  return [
    { 
      type: "Warmup", 
      durationSec: warmupSec, 
      powerLow: 0.50, 
      powerHigh: 0.75, 
      name: "Warm-up" 
    },
    { 
      type: "IntervalsT", 
      repeat, 
      onSec: 4 * 60, 
      offSec: 4 * 60, 
      onPower: intensity, 
      offPower: 0.50, 
      name: "4x4 Intervals" 
    },
    { 
      type: "Cooldown", 
      durationSec: cooldownSec, 
      powerLow: 0.60, 
      powerHigh: 0.50, 
      name: "Cool-down" 
    },
  ];
}
