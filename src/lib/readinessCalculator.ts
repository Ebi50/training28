/**
 * Readiness Calculator
 * Berechnet den Readiness Score basierend auf subjektiven Morning Check Daten
 */

import { MorningCheck, DailyMetrics } from '@/types';

/**
 * Berechne Readiness Score aus Morning Check
 * Score: 0-1 (0 = nicht bereit, 1 = top bereit)
 */
export function calculateReadinessScore(check: MorningCheck): number {
  // Gewichtungen für verschiedene Faktoren
  const weights = {
    sleepQuality: 0.30,  // 30% - Schlaf ist am wichtigsten
    fatigue: 0.30,       // 30% - Müdigkeit sehr wichtig
    motivation: 0.20,    // 20% - Motivation wichtig
    soreness: 0.15,      // 15% - Muskelkater relevant
    stress: 0.05,        // 5% - Stress weniger relevant für körperliche Bereitschaft
  };
  
  // Normalize values to 0-1 (1 = best)
  // sleepQuality: 5 = best → normalize to 1
  // fatigue: 1 = best (frisch) → invert
  // motivation: 5 = best → normalize to 1
  // soreness: 1 = best (keine) → invert
  // stress: 1 = best (niedrig) → invert
  
  const normalizedSleep = (check.sleepQuality - 1) / 4; // 1-5 → 0-1
  const normalizedFatigue = (5 - check.fatigue) / 4;    // 5-1 → 0-1 (inverted)
  const normalizedMotivation = (check.motivation - 1) / 4; // 1-5 → 0-1
  const normalizedSoreness = (5 - check.soreness) / 4;  // 5-1 → 0-1 (inverted)
  const normalizedStress = (5 - check.stress) / 4;      // 5-1 → 0-1 (inverted)
  
  // Gewichtete Summe
  const readiness = 
    normalizedSleep * weights.sleepQuality +
    normalizedFatigue * weights.fatigue +
    normalizedMotivation * weights.motivation +
    normalizedSoreness * weights.soreness +
    normalizedStress * weights.stress;
  
  // Ensure 0-1 range
  return Math.max(0, Math.min(1, readiness));
}

/**
 * Interpretiere Readiness Score in menschenlesbare Kategorie
 */
export function interpretReadiness(score: number): {
  level: 'low' | 'moderate' | 'good' | 'excellent';
  recommendation: string;
  adjustmentFactor: number; // Faktor für Workout-Anpassung
} {
  if (score >= 0.85) {
    return {
      level: 'excellent',
      recommendation: 'Top Form! Perfekt für intensive Einheiten.',
      adjustmentFactor: 1.0, // Keine Anpassung nötig
    };
  } else if (score >= 0.70) {
    return {
      level: 'good',
      recommendation: 'Gute Form. Training wie geplant durchführbar.',
      adjustmentFactor: 1.0,
    };
  } else if (score >= 0.50) {
    return {
      level: 'moderate',
      recommendation: 'Moderate Form. Intensität reduzieren oder LIT bevorzugen.',
      adjustmentFactor: 0.85, // 15% Reduktion
    };
  } else {
    return {
      level: 'low',
      recommendation: 'Niedrige Bereitschaft. Erholung oder leichtes Training empfohlen.',
      adjustmentFactor: 0.70, // 30% Reduktion
    };
  }
}

/**
 * Berechne Trend der Readiness über mehrere Tage
 */
export function calculateReadinessTrend(metrics: DailyMetrics[]): {
  trend: 'improving' | 'stable' | 'declining';
  avgReadiness: number;
  daysWithCheck: number;
} {
  // Filter metrics with morning check
  const metricsWithCheck = metrics.filter(m => m.morningCheck?.readinessScore !== undefined);
  
  if (metricsWithCheck.length === 0) {
    return { trend: 'stable', avgReadiness: 0.75, daysWithCheck: 0 };
  }
  
  // Calculate average
  const avgReadiness = metricsWithCheck.reduce(
    (sum, m) => sum + (m.morningCheck!.readinessScore || 0),
    0
  ) / metricsWithCheck.length;
  
  // Determine trend (compare first half vs second half)
  if (metricsWithCheck.length < 4) {
    return { trend: 'stable', avgReadiness, daysWithCheck: metricsWithCheck.length };
  }
  
  const mid = Math.floor(metricsWithCheck.length / 2);
  const firstHalf = metricsWithCheck.slice(0, mid);
  const secondHalf = metricsWithCheck.slice(mid);
  
  const avgFirst = firstHalf.reduce((sum, m) => sum + (m.morningCheck!.readinessScore || 0), 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, m) => sum + (m.morningCheck!.readinessScore || 0), 0) / secondHalf.length;
  
  const diff = avgSecond - avgFirst;
  
  let trend: 'improving' | 'stable' | 'declining';
  if (diff > 0.10) {
    trend = 'improving';
  } else if (diff < -0.10) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }
  
  return { trend, avgReadiness, daysWithCheck: metricsWithCheck.length };
}

/**
 * Prüfe ob Forced Recovery nötig ist
 */
export function shouldForceRecovery(check: MorningCheck, metrics: DailyMetrics[]): {
  force: boolean;
  reason?: string;
} {
  const readiness = calculateReadinessScore(check);
  
  // Kritisch niedrige Readiness
  if (readiness < 0.40) {
    return {
      force: true,
      reason: 'Sehr niedrige Bereitschaft. Erholung dringend empfohlen.',
    };
  }
  
  // Sehr schlechter Schlaf + hohe Müdigkeit
  if (check.sleepQuality <= 2 && check.fatigue >= 4) {
    return {
      force: true,
      reason: 'Kombination aus schlechtem Schlaf und hoher Müdigkeit.',
    };
  }
  
  // Trend-Analyse: Konstant schlechte Werte
  const trend = calculateReadinessTrend(metrics);
  if (trend.daysWithCheck >= 3 && trend.avgReadiness < 0.50 && trend.trend === 'declining') {
    return {
      force: true,
      reason: 'Bereitschaft verschlechtert sich über mehrere Tage.',
    };
  }
  
  // TSB-Check: Wenn TSB sehr niedrig UND Readiness niedrig
  const latestMetrics = metrics[metrics.length - 1];
  if (latestMetrics && latestMetrics.tsb < -25 && readiness < 0.55) {
    return {
      force: true,
      reason: 'Kombination aus niedrigem TSB und Müdigkeit deutet auf Übertraining hin.',
    };
  }
  
  return { force: false };
}

/**
 * Empfehle Workout-Typ basierend auf Readiness
 */
export function recommendWorkoutType(check: MorningCheck): {
  type: 'HIT' | 'LIT' | 'REC' | 'REST';
  reason: string;
} {
  const readiness = calculateReadinessScore(check);
  const interpretation = interpretReadiness(readiness);
  
  if (readiness >= 0.80) {
    return {
      type: 'HIT',
      reason: 'Ausgezeichnete Form für intensive Einheiten',
    };
  } else if (readiness >= 0.65) {
    return {
      type: 'LIT',
      reason: 'Gute Form für moderates Training',
    };
  } else if (readiness >= 0.45) {
    return {
      type: 'REC',
      reason: 'Moderate Form - aktive Erholung empfohlen',
    };
  } else {
    return {
      type: 'REST',
      reason: 'Niedrige Bereitschaft - Ruhetag empfohlen',
    };
  }
}

/**
 * Log Readiness Score für Debugging
 */
export function logReadinessDetails(check: MorningCheck): void {
  const readiness = calculateReadinessScore(check);
  const interpretation = interpretReadiness(readiness);
  
  console.log('🧠 Readiness Score:', {
    date: check.date,
    score: (readiness * 100).toFixed(0) + '%',
    level: interpretation.level,
    components: {
      sleep: check.sleepQuality + '/5',
      fatigue: check.fatigue + '/5',
      motivation: check.motivation + '/5',
      soreness: check.soreness + '/5',
      stress: check.stress + '/5',
    },
    recommendation: interpretation.recommendation,
    adjustmentFactor: interpretation.adjustmentFactor,
  });
}
