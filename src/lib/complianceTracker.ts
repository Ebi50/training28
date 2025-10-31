/**
 * Compliance Tracker
 * Trackt wie gut User ihren Trainingsplan einhalten
 */

import { TrainingSession, Activity, WeeklyPlan, DailyMetrics } from '@/types';

export interface ComplianceStats {
  planned: number;
  completed: number;
  missed: number;
  modified: number;
  rate: number; // 0-1
}

export interface SessionCompliance {
  sessionId: string;
  date: string;
  status: 'completed' | 'partial' | 'missed' | 'modified';
  plannedTss: number;
  actualTss: number;
  deviation: number; // percentage
  reason?: string;
}

/**
 * Berechne Compliance für einen Wochenplan
 */
export function calculateWeeklyCompliance(
  plan: WeeklyPlan,
  activities: Activity[]
): ComplianceStats {
  let completed = 0;
  let missed = 0;
  let modified = 0;

  for (const session of plan.sessions) {
    // Find matching activity for this session
    const matchingActivity = activities.find(act => 
      act.startTime.toISOString().split('T')[0] === session.date
    );

    if (!matchingActivity) {
      if (new Date(session.date) < new Date()) {
        // Session is in the past and no activity found
        missed++;
      }
      // Future sessions don't count yet
      continue;
    }

    // Check if TSS is significantly different
    const deviation = Math.abs(matchingActivity.tss - session.targetTss) / session.targetTss;
    
    if (deviation < 0.15) {
      // Within 15% = completed
      completed++;
    } else {
      // More than 15% deviation = modified
      modified++;
    }
  }

  const planned = plan.sessions.length;
  const rate = planned > 0 ? completed / planned : 0;

  return {
    planned,
    completed,
    missed,
    modified,
    rate,
  };
}

/**
 * Detaillierte Session-by-Session Compliance
 */
export function analyzeSessionCompliance(
  sessions: TrainingSession[],
  activities: Activity[]
): SessionCompliance[] {
  const results: SessionCompliance[] = [];

  for (const session of sessions) {
    const matchingActivity = activities.find(act => 
      act.startTime.toISOString().split('T')[0] === session.date
    );

    if (!matchingActivity) {
      // No activity found
      if (new Date(session.date) < new Date()) {
        results.push({
          sessionId: session.id,
          date: session.date,
          status: 'missed',
          plannedTss: session.targetTss,
          actualTss: 0,
          deviation: -100,
          reason: 'Keine Aktivität gefunden',
        });
      }
      continue;
    }

    // Calculate deviation
    const deviation = ((matchingActivity.tss - session.targetTss) / session.targetTss) * 100;
    
    let status: 'completed' | 'partial' | 'modified';
    if (Math.abs(deviation) < 15) {
      status = 'completed';
    } else if (matchingActivity.tss < session.targetTss * 0.5) {
      status = 'partial';
    } else {
      status = 'modified';
    }

    results.push({
      sessionId: session.id,
      date: session.date,
      status,
      plannedTss: session.targetTss,
      actualTss: matchingActivity.tss,
      deviation,
      reason: status === 'completed' ? undefined : `${Math.abs(deviation).toFixed(0)}% Abweichung`,
    });
  }

  return results;
}

/**
 * Prüfe ob Plan-Update nötig ist basierend auf Compliance
 */
export function shouldUpdatePlan(
  compliance: ComplianceStats,
  recentMetrics: DailyMetrics[]
): {
  update: boolean;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
} {
  // Sehr schlechte Compliance
  if (compliance.rate < 0.50) {
    return {
      update: true,
      reason: 'Compliance unter 50% - Plan ist zu ambitioniert',
      urgency: 'high',
    };
  }

  // Viele verpasste Sessions
  if (compliance.missed >= 3) {
    return {
      update: true,
      reason: `${compliance.missed} Sessions verpasst - Anpassung empfohlen`,
      urgency: 'medium',
    };
  }

  // Moderate Compliance aber viele Modifikationen
  if (compliance.rate < 0.70 && compliance.modified >= 2) {
    return {
      update: true,
      reason: 'Häufige Anpassungen nötig - Plan passt nicht optimal',
      urgency: 'medium',
    };
  }

  // TSB-Check: Wenn TSB kritisch niedrig
  const latestMetrics = recentMetrics[recentMetrics.length - 1];
  if (latestMetrics && latestMetrics.tsb < -25) {
    return {
      update: true,
      reason: 'TSB kritisch niedrig - Erholung nötig',
      urgency: 'high',
    };
  }

  // Alles gut
  return {
    update: false,
    reason: 'Compliance gut - kein Update nötig',
    urgency: 'low',
  };
}

/**
 * Berechne Compliance-Trend über mehrere Wochen
 */
export function calculateComplianceTrend(
  weeklyCompliances: { week: string; compliance: ComplianceStats }[]
): {
  trend: 'improving' | 'stable' | 'declining';
  avgRate: number;
  recommendation: string;
} {
  if (weeklyCompliances.length < 2) {
    return {
      trend: 'stable',
      avgRate: weeklyCompliances[0]?.compliance.rate || 0,
      recommendation: 'Zu wenig Daten für Trend-Analyse',
    };
  }

  const rates = weeklyCompliances.map(w => w.compliance.rate);
  const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;

  // Compare first half vs second half
  const mid = Math.floor(rates.length / 2);
  const firstHalf = rates.slice(0, mid);
  const secondHalf = rates.slice(mid);

  const avgFirst = firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;

  let trend: 'improving' | 'stable' | 'declining';
  let recommendation: string;

  if (diff > 0.10) {
    trend = 'improving';
    recommendation = 'Compliance verbessert sich - weiter so!';
  } else if (diff < -0.10) {
    trend = 'declining';
    recommendation = 'Compliance verschlechtert sich - Plan überprüfen';
  } else {
    trend = 'stable';
    recommendation = avgRate >= 0.70 
      ? 'Compliance stabil und gut' 
      : 'Compliance stabil aber niedrig - Anpassung erwägen';
  }

  return {
    trend,
    avgRate,
    recommendation,
  };
}

/**
 * Generate Compliance Report für UI
 */
export function generateComplianceReport(
  plan: WeeklyPlan,
  activities: Activity[]
): {
  stats: ComplianceStats;
  sessions: SessionCompliance[];
  shouldUpdate: boolean;
  updateReason?: string;
  recommendations: string[];
} {
  const stats = calculateWeeklyCompliance(plan, activities);
  const sessions = analyzeSessionCompliance(plan.sessions, activities);
  
  const recommendations: string[] = [];

  // Generate recommendations
  if (stats.rate >= 0.85) {
    recommendations.push('✅ Exzellente Compliance! Dein Plan funktioniert gut.');
  } else if (stats.rate >= 0.70) {
    recommendations.push('👍 Gute Compliance. Plan ist realistisch.');
  } else if (stats.rate >= 0.50) {
    recommendations.push('⚠️ Moderate Compliance. Überlege Plan anzupassen.');
  } else {
    recommendations.push('🚨 Niedrige Compliance. Plan ist zu ambitioniert.');
  }

  if (stats.missed > 0) {
    recommendations.push(`📅 ${stats.missed} Sessions verpasst. Sind die Zeitfenster realistisch?`);
  }

  if (stats.modified > 0) {
    recommendations.push(`🔄 ${stats.modified} Sessions angepasst. Plan entspricht nicht immer der Tagesform.`);
  }

  // Check if update needed (would need metrics - simplified here)
  const shouldUpdate = stats.rate < 0.60 || stats.missed >= 3;
  const updateReason = shouldUpdate 
    ? stats.rate < 0.60 
      ? 'Compliance zu niedrig'
      : 'Zu viele verpasste Sessions'
    : undefined;

  return {
    stats,
    sessions,
    shouldUpdate,
    updateReason,
    recommendations,
  };
}

/**
 * Log Compliance für Debugging
 */
export function logCompliance(stats: ComplianceStats, weekId: string): void {
  console.log(`📊 Compliance Report - ${weekId}:`, {
    planned: stats.planned,
    completed: stats.completed,
    missed: stats.missed,
    modified: stats.modified,
    rate: (stats.rate * 100).toFixed(1) + '%',
    status: stats.rate >= 0.70 ? '✅ Good' : stats.rate >= 0.50 ? '⚠️ OK' : '🚨 Low',
  });
}
