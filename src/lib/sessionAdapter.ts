/**
 * Session Adapter
 * Passt geplante Training Sessions basierend auf Readiness Score an
 */

import { TrainingSession, MorningCheck, DailyMetrics } from '@/types';
import { 
  calculateReadinessScore, 
  interpretReadiness, 
  shouldForceRecovery,
  recommendWorkoutType 
} from './readinessCalculator';

/**
 * Passe eine geplante Session basierend auf Morning Check an
 */
export function adaptSession(
  plannedSession: TrainingSession,
  morningCheck: MorningCheck,
  recentMetrics: DailyMetrics[]
): {
  adaptedSession: TrainingSession;
  changed: boolean;
  reason: string;
} {
  const readiness = calculateReadinessScore(morningCheck);
  const interpretation = interpretReadiness(readiness);
  const forceRecovery = shouldForceRecovery(morningCheck, recentMetrics);
  
  // Forced Recovery überschreibt alles
  if (forceRecovery.force) {
    return {
      adaptedSession: {
        ...plannedSession,
        type: 'REC',
        subType: 'recovery',
        duration: Math.min(plannedSession.duration, 60), // Max 60min
        targetTss: Math.min(plannedSession.targetTss, 40), // Max 40 TSS
        description: `🛑 Recovery erzwungen: ${forceRecovery.reason}`,
        notes: `Original: ${plannedSession.type} ${plannedSession.duration}min, ${plannedSession.targetTss} TSS`,
      },
      changed: true,
      reason: forceRecovery.reason!,
    };
  }
  
  // Keine Anpassung bei exzellenter Readiness
  if (readiness >= 0.85) {
    return {
      adaptedSession: plannedSession,
      changed: false,
      reason: 'Exzellente Bereitschaft - keine Anpassung nötig',
    };
  }
  
  // Moderate Anpassung bei guter Readiness
  if (readiness >= 0.70) {
    // Nur minimal anpassen wenn HIT geplant war
    if (plannedSession.type === 'HIT') {
      return {
        adaptedSession: {
          ...plannedSession,
          duration: Math.round(plannedSession.duration * 0.95), // 5% Reduktion
          targetTss: Math.round(plannedSession.targetTss * 0.95),
          notes: `Leicht angepasst (Readiness: ${(readiness * 100).toFixed(0)}%)`,
        },
        changed: true,
        reason: 'Gute Bereitschaft - minimale Anpassung',
      };
    }
    
    return {
      adaptedSession: plannedSession,
      changed: false,
      reason: 'Gute Bereitschaft - keine Anpassung nötig',
    };
  }
  
  // Signifikante Anpassung bei moderater Readiness (0.50 - 0.70)
  if (readiness >= 0.50) {
    const adjustmentFactor = interpretation.adjustmentFactor;
    
    if (plannedSession.type === 'HIT') {
      // HIT → LIT umwandeln
      return {
        adaptedSession: {
          ...plannedSession,
          type: 'LIT',
          subType: 'endurance',
          duration: Math.round(plannedSession.duration * adjustmentFactor),
          targetTss: Math.round(plannedSession.targetTss * adjustmentFactor),
          description: `Angepasst: LIT statt HIT (Readiness ${(readiness * 100).toFixed(0)}%)`,
          notes: `Original: ${plannedSession.type} ${plannedSession.duration}min, ${plannedSession.targetTss} TSS`,
        },
        changed: true,
        reason: 'Moderate Bereitschaft - HIT zu LIT reduziert',
      };
    } else if (plannedSession.type === 'LIT') {
      // LIT reduzieren
      return {
        adaptedSession: {
          ...plannedSession,
          duration: Math.round(plannedSession.duration * adjustmentFactor),
          targetTss: Math.round(plannedSession.targetTss * adjustmentFactor),
          notes: `Reduziert (Readiness: ${(readiness * 100).toFixed(0)}%)`,
        },
        changed: true,
        reason: 'Moderate Bereitschaft - Dauer/Intensität reduziert',
      };
    }
  }
  
  // Starke Reduktion bei niedriger Readiness (< 0.50)
  if (plannedSession.type === 'HIT') {
    // HIT → Recovery
    return {
      adaptedSession: {
        ...plannedSession,
        type: 'REC',
        subType: 'recovery',
        duration: Math.min(60, Math.round(plannedSession.duration * 0.5)),
        targetTss: Math.min(40, Math.round(plannedSession.targetTss * 0.4)),
        description: `Recovery (Readiness niedrig: ${(readiness * 100).toFixed(0)}%)`,
        notes: `Original: ${plannedSession.type} ${plannedSession.duration}min, ${plannedSession.targetTss} TSS`,
      },
      changed: true,
      reason: 'Niedrige Bereitschaft - HIT zu Recovery',
    };
  } else if (plannedSession.type === 'LIT') {
    // LIT → Recovery oder stark reduziert
    return {
      adaptedSession: {
        ...plannedSession,
        type: 'REC',
        subType: 'recovery',
        duration: Math.min(60, Math.round(plannedSession.duration * 0.6)),
        targetTss: Math.min(50, Math.round(plannedSession.targetTss * 0.6)),
        description: `Leichte Recovery (Readiness: ${(readiness * 100).toFixed(0)}%)`,
        notes: `Original: ${plannedSession.type} ${plannedSession.duration}min`,
      },
      changed: true,
      reason: 'Niedrige Bereitschaft - zu Recovery reduziert',
    };
  }
  
  // Default: Keine Änderung
  return {
    adaptedSession: plannedSession,
    changed: false,
    reason: 'Keine Anpassung nötig',
  };
}

/**
 * Passe alle heutigen Sessions an
 */
export function adaptDailySessions(
  plannedSessions: TrainingSession[],
  morningCheck: MorningCheck,
  recentMetrics: DailyMetrics[]
): {
  adaptedSessions: TrainingSession[];
  totalChanges: number;
  reasons: string[];
} {
  const adapted: TrainingSession[] = [];
  const reasons: string[] = [];
  let totalChanges = 0;
  
  for (const session of plannedSessions) {
    const result = adaptSession(session, morningCheck, recentMetrics);
    adapted.push(result.adaptedSession);
    
    if (result.changed) {
      totalChanges++;
      reasons.push(result.reason);
    }
  }
  
  return {
    adaptedSessions: adapted,
    totalChanges,
    reasons,
  };
}

/**
 * Prüfe ob Session heute überhaupt durchführbar ist
 */
export function isSessionFeasible(
  session: TrainingSession,
  morningCheck: MorningCheck,
  recentMetrics: DailyMetrics[]
): {
  feasible: boolean;
  reason?: string;
  alternative?: 'reduce' | 'postpone' | 'skip';
} {
  const readiness = calculateReadinessScore(morningCheck);
  const forceRecovery = shouldForceRecovery(morningCheck, recentMetrics);
  
  // Forced Recovery: HIT nicht möglich
  if (forceRecovery.force && session.type === 'HIT') {
    return {
      feasible: false,
      reason: 'Recovery erzwungen - HIT nicht empfohlen',
      alternative: 'postpone',
    };
  }
  
  // Sehr niedrige Readiness: Nur Recovery
  if (readiness < 0.40) {
    if (session.type !== 'REC') {
      return {
        feasible: false,
        reason: 'Readiness zu niedrig für Training',
        alternative: 'skip',
      };
    }
  }
  
  // Niedrige Readiness: HIT nicht empfohlen
  if (readiness < 0.55 && session.type === 'HIT') {
    return {
      feasible: false,
      reason: 'Readiness zu niedrig für HIT',
      alternative: 'reduce',
    };
  }
  
  // Moderate Readiness: Lange Sessions kürzen
  if (readiness < 0.60 && session.duration > 120) {
    return {
      feasible: true,
      reason: 'Lange Session - Dauer reduzieren empfohlen',
      alternative: 'reduce',
    };
  }
  
  return {
    feasible: true,
  };
}

/**
 * Berechne optimalen TSS für heute basierend auf Readiness
 */
export function calculateOptimalDailyTSS(
  plannedTss: number,
  morningCheck: MorningCheck,
  recentMetrics: DailyMetrics[]
): {
  optimalTss: number;
  adjustmentPercent: number;
  reason: string;
} {
  const readiness = calculateReadinessScore(morningCheck);
  const interpretation = interpretReadiness(readiness);
  const forceRecovery = shouldForceRecovery(morningCheck, recentMetrics);
  
  if (forceRecovery.force) {
    return {
      optimalTss: Math.min(plannedTss, 40),
      adjustmentPercent: -70,
      reason: 'Recovery erzwungen',
    };
  }
  
  const adjustmentFactor = interpretation.adjustmentFactor;
  const optimalTss = Math.round(plannedTss * adjustmentFactor);
  const adjustmentPercent = Math.round((adjustmentFactor - 1) * 100);
  
  return {
    optimalTss,
    adjustmentPercent,
    reason: interpretation.recommendation,
  };
}

/**
 * Log Session Adaptation für Debugging
 */
export function logSessionAdaptation(
  original: TrainingSession,
  adapted: TrainingSession,
  morningCheck: MorningCheck
): void {
  const readiness = calculateReadinessScore(morningCheck);
  
  console.log('🔄 Session Adaptation:', {
    date: original.date,
    readiness: (readiness * 100).toFixed(0) + '%',
    original: {
      type: original.type,
      duration: original.duration + 'min',
      tss: original.targetTss,
    },
    adapted: {
      type: adapted.type,
      duration: adapted.duration + 'min',
      tss: adapted.targetTss,
    },
    changes: {
      typeChanged: original.type !== adapted.type,
      durationChange: adapted.duration - original.duration,
      tssChange: adapted.targetTss - original.targetTss,
    },
  });
}
