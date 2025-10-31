/**
 * Notification Service
 * Verwaltet In-App Benachrichtigungen
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
  id?: string;
  userId: string;
  type: 'plan_updated' | 'morning_check_reminder' | 'performance_alert' | 'compliance_low' | 'goal_reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date | Timestamp;
  actionUrl?: string;
  metadata?: {
    weekId?: string;
    eventId?: string;
    sessionId?: string;
    change?: {
      oldValue: number;
      newValue: number;
      metric: string;
    };
  };
}

/**
 * Erstelle neue Notification
 */
export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  options?: {
    actionUrl?: string;
    metadata?: Notification['metadata'];
  }
): Promise<string> {
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    
    const notification: Omit<Notification, 'id'> = {
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: serverTimestamp() as Timestamp,
      actionUrl: options?.actionUrl,
      metadata: options?.metadata,
    };

    const docRef = await addDoc(notificationsRef, notification);
    
    console.log('✅ Notification created:', {
      id: docRef.id,
      type,
      userId,
    });

    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    throw error;
  }
}

/**
 * Hole ungelesene Notifications
 */
export async function getUnreadNotifications(
  userId: string,
  maxCount: number = 10
): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const q = query(
      notificationsRef,
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Notification));
  } catch (error) {
    console.error('❌ Failed to fetch notifications:', error);
    return [];
  }
}

/**
 * Hole alle Notifications (gelesen + ungelesen)
 */
export async function getAllNotifications(
  userId: string,
  maxCount: number = 50
): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Notification));
  } catch (error) {
    console.error('❌ Failed to fetch all notifications:', error);
    return [];
  }
}

/**
 * Markiere Notification als gelesen
 */
export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, `users/${userId}/notifications/${notificationId}`);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
    
    console.log('✅ Notification marked as read:', notificationId);
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error);
    throw error;
  }
}

/**
 * Markiere alle Notifications als gelesen
 */
export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const unread = await getUnreadNotifications(userId, 100);
    
    const promises = unread.map(notification => 
      notification.id ? markAsRead(userId, notification.id) : Promise.resolve()
    );
    
    await Promise.all(promises);
    
    console.log(`✅ Marked ${unread.length} notifications as read`);
  } catch (error) {
    console.error('❌ Failed to mark all as read:', error);
    throw error;
  }
}

/**
 * Plan-Update Notification
 */
export async function notifyPlanUpdated(
  userId: string,
  weekId: string,
  changes: {
    totalTssChange: number;
    totalHoursChange: number;
    sessionsModified: number;
  }
): Promise<void> {
  const title = '📅 Trainingsplan aktualisiert';
  
  let message = 'Dein Trainingsplan wurde angepasst: ';
  const parts: string[] = [];
  
  if (Math.abs(changes.totalTssChange) > 10) {
    parts.push(`TSS ${changes.totalTssChange > 0 ? '+' : ''}${changes.totalTssChange.toFixed(0)}`);
  }
  
  if (Math.abs(changes.totalHoursChange) > 0.5) {
    parts.push(`${changes.totalHoursChange > 0 ? '+' : ''}${changes.totalHoursChange.toFixed(1)}h`);
  }
  
  if (changes.sessionsModified > 0) {
    parts.push(`${changes.sessionsModified} Sessions angepasst`);
  }
  
  message += parts.join(', ');

  await createNotification(userId, 'plan_updated', title, message, {
    actionUrl: '/dashboard/plan',
    metadata: { weekId, change: {
      oldValue: 0,
      newValue: changes.totalTssChange,
      metric: 'TSS',
    }},
  });
}

/**
 * Morning Check Reminder
 */
export async function notifyMorningCheckReminder(userId: string): Promise<void> {
  const title = '☀️ Guten Morgen!';
  const message = 'Wie fühlst du dich heute? (30 Sekunden)';

  await createNotification(userId, 'morning_check_reminder', title, message, {
    actionUrl: '/dashboard/morning-check',
  });
}

/**
 * Performance Alert Notification
 */
export async function notifyPerformanceAlert(
  userId: string,
  alertType: 'overtraining' | 'undertraining' | 'low_tsb' | 'high_compliance',
  details: string
): Promise<void> {
  let title: string;
  let message: string;

  switch (alertType) {
    case 'overtraining':
      title = '⚠️ Übertraining-Warnung';
      message = details;
      break;
    case 'undertraining':
      title = '💪 Potenzial für mehr Training';
      message = details;
      break;
    case 'low_tsb':
      title = '🔴 TSB kritisch niedrig';
      message = details;
      break;
    case 'high_compliance':
      title = '🎉 Ausgezeichnete Compliance!';
      message = details;
      break;
  }

  await createNotification(userId, 'performance_alert', title, message, {
    actionUrl: '/dashboard',
  });
}

/**
 * Compliance Low Notification
 */
export async function notifyLowCompliance(
  userId: string,
  complianceRate: number,
  missedSessions: number
): Promise<void> {
  const title = '📊 Compliance-Hinweis';
  const message = `Deine Compliance liegt bei ${(complianceRate * 100).toFixed(0)}% (${missedSessions} Sessions verpasst). Sollen wir den Plan anpassen?`;

  await createNotification(userId, 'compliance_low', title, message, {
    actionUrl: '/dashboard/plan',
  });
}

/**
 * Goal Reminder Notification
 */
export async function notifyGoalReminder(
  userId: string,
  goalName: string,
  daysUntil: number,
  goalId: string
): Promise<void> {
  const title = '🎯 Event-Erinnerung';
  const message = `Noch ${daysUntil} Tage bis "${goalName}"!`;

  await createNotification(userId, 'goal_reminder', title, message, {
    actionUrl: `/dashboard/events/${goalId}`,
    metadata: { eventId: goalId },
  });
}

/**
 * Zähle ungelesene Notifications
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const unread = await getUnreadNotifications(userId);
    return unread.length;
  } catch (error) {
    console.error('❌ Failed to get unread count:', error);
    return 0;
  }
}

/**
 * Lösche alte Notifications (älter als 30 Tage)
 */
export async function cleanupOldNotifications(userId: string): Promise<number> {
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      notificationsRef,
      where('createdAt', '<', Timestamp.fromDate(thirtyDaysAgo))
    );

    const snapshot = await getDocs(q);
    
    // Delete old notifications
    const { deleteDoc } = await import('firebase/firestore');
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log(`🗑️  Deleted ${snapshot.size} old notifications`);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Failed to cleanup notifications:', error);
    return 0;
  }
}
