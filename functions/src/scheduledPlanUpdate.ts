/**
 * Scheduled Plan Update Cloud Function
 * Läuft täglich um 23:00 und aktualisiert Trainingspläne basierend auf:
 * - Absolvierte Aktivitäten
 * - Compliance
 * - CTL/ATL/TSB
 * - Morning Check Readiness
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface UserAutoUpdateSettings {
  enabled: boolean;
  lastUpdate: Date;
}

interface DailyMetrics {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
  tss: number;
  morningCheck?: {
    readinessScore?: number;
  };
}

interface WeeklyPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  totalTss: number;
  totalHours: number;
  sessions: any[];
}

/**
 * Scheduled Function: Läuft täglich um 23:00 Uhr
 */
export const dailyPlanUpdate = functions
  .region('europe-west1')
  .pubsub
  .schedule('0 23 * * *') // Täglich um 23:00
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    console.log('🔄 Starting daily plan update...');
    
    try {
      // 1. Hole alle User mit aktiviertem Auto-Update
      const users = await getUsersWithAutoUpdate();
      console.log(`📊 Found ${users.length} users with auto-update enabled`);
      
      let updated = 0;
      let skipped = 0;
      let errors = 0;

      // 2. Verarbeite jeden User
      for (const user of users) {
        try {
          const result = await processUserUpdate(user.id);
          
          if (result.updated) {
            updated++;
            console.log(`✅ Updated plan for user ${user.id}: ${result.reason}`);
          } else {
            skipped++;
            console.log(`⏭️  Skipped user ${user.id}: ${result.reason}`);
          }
        } catch (error) {
          errors++;
          console.error(`❌ Error processing user ${user.id}:`, error);
        }
      }

      console.log('✅ Daily plan update completed:', {
        total: users.length,
        updated,
        skipped,
        errors,
      });

      return { success: true, updated, skipped, errors };
      
    } catch (error) {
      console.error('❌ Daily plan update failed:', error);
      throw error;
    }
  });

/**
 * Hole alle User mit Auto-Update aktiviert
 */
async function getUsersWithAutoUpdate(): Promise<Array<{ id: string; settings: UserAutoUpdateSettings }>> {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  const users: Array<{ id: string; settings: UserAutoUpdateSettings }> = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const autoUpdate = data.autoUpdate;
    
    // Check if auto-update is enabled
    if (autoUpdate?.enabled !== false) { // Default: enabled
      users.push({
        id: doc.id,
        settings: {
          enabled: true,
          lastUpdate: autoUpdate?.lastUpdate?.toDate() || new Date(0),
        },
      });
    }
  });
  
  return users;
}

/**
 * Verarbeite Plan-Update für einen User
 */
async function processUserUpdate(userId: string): Promise<{
  updated: boolean;
  reason: string;
}> {
  // 1. Prüfe ob heute Aktivität stattgefunden hat
  const today = new Date().toISOString().split('T')[0];
  const todayActivity = await getTodaysActivity(userId, today);
  
  if (!todayActivity) {
    return { updated: false, reason: 'Keine Aktivität heute' };
  }

  // 2. Hole aktuelle Metrics
  const metrics = await getRecentMetrics(userId, 7);
  const latestMetrics = metrics[metrics.length - 1];
  
  if (!latestMetrics) {
    return { updated: false, reason: 'Keine Metriken verfügbar' };
  }

  // 3. Prüfe Compliance
  const compliance = await checkCompliance(userId);
  
  // 4. Entscheide: Update nötig?
  const shouldUpdate = shouldRegeneratePlan(compliance, latestMetrics);
  
  if (!shouldUpdate.update) {
    return { updated: false, reason: shouldUpdate.reason };
  }

  // 5. Generiere neuen Plan (nächste Woche)
  const nextWeekStart = getNextWeekStart();
  const newPlan = await generateUpdatedPlan(userId, nextWeekStart, metrics);
  
  if (!newPlan) {
    return { updated: false, reason: 'Plan-Generierung fehlgeschlagen' };
  }

  // 6. Speichere neuen Plan
  await savePlan(userId, newPlan);
  
  // 7. Erstelle Notification
  await createUpdateNotification(userId, newPlan, shouldUpdate.reason);
  
  // 8. Update lastUpdate timestamp
  await db.collection('users').doc(userId).update({
    'autoUpdate.lastUpdate': admin.firestore.FieldValue.serverTimestamp(),
  });

  return { 
    updated: true, 
    reason: shouldUpdate.reason 
  };
}

/**
 * Hole heutige Aktivität
 */
async function getTodaysActivity(userId: string, date: string): Promise<any | null> {
  const activitiesRef = db.collection(`users/${userId}/activities`);
  const snapshot = await activitiesRef
    .where('startTime', '>=', new Date(date + 'T00:00:00'))
    .where('startTime', '<=', new Date(date + 'T23:59:59'))
    .limit(1)
    .get();
  
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * Hole letzte N Tage Metrics
 */
async function getRecentMetrics(userId: string, days: number): Promise<DailyMetrics[]> {
  const metricsRef = db.collection(`users/${userId}/dailyMetrics`);
  const snapshot = await metricsRef
    .orderBy('date', 'desc')
    .limit(days)
    .get();
  
  return snapshot.docs.map(doc => doc.data() as DailyMetrics).reverse();
}

/**
 * Prüfe Compliance
 */
async function checkCompliance(userId: string): Promise<{
  rate: number;
  missed: number;
  completed: number;
}> {
  // Simplified - würde normalerweise complianceTracker nutzen
  const currentWeekPlan = await getCurrentWeekPlan(userId);
  
  if (!currentWeekPlan) {
    return { rate: 0, missed: 0, completed: 0 };
  }

  const completedSessions = currentWeekPlan.sessions.filter((s: any) => s.completed).length;
  const totalSessions = currentWeekPlan.sessions.length;
  const missed = totalSessions - completedSessions;
  const rate = totalSessions > 0 ? completedSessions / totalSessions : 0;

  return { rate, missed, completed: completedSessions };
}

/**
 * Hole aktuellen Wochenplan
 */
async function getCurrentWeekPlan(userId: string): Promise<WeeklyPlan | null> {
  const plansRef = db.collection(`users/${userId}/weeklyPlans`);
  const snapshot = await plansRef
    .orderBy('weekStartDate', 'desc')
    .limit(1)
    .get();
  
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as WeeklyPlan;
}

/**
 * Entscheide ob Re-Planning nötig ist
 */
function shouldRegeneratePlan(
  compliance: { rate: number; missed: number },
  metrics: DailyMetrics
): { update: boolean; reason: string } {
  // Compliance zu niedrig
  if (compliance.rate < 0.60 && compliance.missed >= 2) {
    return { 
      update: true, 
      reason: `Compliance niedrig (${(compliance.rate * 100).toFixed(0)}%), ${compliance.missed} Sessions verpasst` 
    };
  }

  // TSB kritisch niedrig
  if (metrics.tsb < -25) {
    return { 
      update: true, 
      reason: 'TSB kritisch niedrig - Erholung nötig' 
    };
  }

  // Readiness konstant niedrig (wenn Morning Check vorhanden)
  if (metrics.morningCheck?.readinessScore && metrics.morningCheck.readinessScore < 0.50) {
    return { 
      update: true, 
      reason: 'Readiness niedrig - Plan reduzieren' 
    };
  }

  // Signifikante TSS-Abweichung (zu viel oder zu wenig)
  const tssDeviation = Math.abs(metrics.tss - 60) / 60; // 60 TSS als Referenz
  if (tssDeviation > 0.50) {
    return { 
      update: true, 
      reason: 'Große TSS-Abweichung vom Plan' 
    };
  }

  return { update: false, reason: 'Plan ist aktuell' };
}

/**
 * Berechne Start der nächsten Woche (Montag)
 */
function getNextWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  
  return nextMonday;
}

/**
 * Generiere aktualisierten Plan
 */
async function generateUpdatedPlan(
  userId: string,
  weekStart: Date,
  metrics: DailyMetrics[]
): Promise<WeeklyPlan | null> {
  // Simplified - würde normalerweise TrainingPlanGenerator nutzen
  // Für Cloud Function: Basic heuristic approach
  
  const latestMetrics = metrics[metrics.length - 1];
  const avgTss = metrics.reduce((sum, m) => sum + m.tss, 0) / metrics.length;
  
  // Adjust based on TSB
  let targetWeeklyTss = avgTss * 7;
  
  if (latestMetrics.tsb < -15) {
    targetWeeklyTss *= 0.80; // Reduce 20%
  } else if (latestMetrics.tsb > 10) {
    targetWeeklyTss *= 1.10; // Increase 10%
  }

  const weekId = `${weekStart.getFullYear()}-W${getISOWeek(weekStart)}`;
  
  return {
    id: weekId,
    userId,
    weekStartDate: weekStart.toISOString().split('T')[0],
    totalTss: Math.round(targetWeeklyTss),
    totalHours: Math.round(targetWeeklyTss / 45 * 10) / 10,
    sessions: [], // Würde normalerweise Sessions generieren
  };
}

/**
 * ISO Week Number berechnen
 */
function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Speichere Plan in Firestore
 */
async function savePlan(userId: string, plan: WeeklyPlan): Promise<void> {
  await db.collection(`users/${userId}/weeklyPlans`).doc(plan.id).set({
    ...plan,
    generated: admin.firestore.FieldValue.serverTimestamp(),
    lastModified: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  console.log(`💾 Plan saved: ${plan.id} for user ${userId}`);
}

/**
 * Erstelle Update-Notification
 */
async function createUpdateNotification(
  userId: string,
  newPlan: WeeklyPlan,
  reason: string
): Promise<void> {
  await db.collection(`users/${userId}/notifications`).add({
    type: 'plan_updated',
    title: '📅 Trainingsplan aktualisiert',
    message: `Dein Plan wurde angepasst: ${reason}`,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    actionUrl: '/dashboard/plan',
    metadata: {
      weekId: newPlan.id,
      change: {
        oldValue: 0,
        newValue: newPlan.totalTss,
        metric: 'TSS',
      },
    },
  });
  
  console.log(`🔔 Notification created for user ${userId}`);
}
