import { 
  User, 
  UserProfile, 
  StravaIntegration, 
  Activity, 
  DailyMetrics, 
  WeeklyPlan,
  TrainingSession,
  SeasonGoal,
  TrainingCamp 
} from '@/types';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

// User management
export const createUser = async (user: Partial<User>): Promise<void> => {
  if (!user.uid) throw new Error('User UID is required');
  
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    ...user,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  // Read from main user document
  const userRef = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userRef);
  if (!userSnapshot.exists()) return null;
  
  const userData = userSnapshot.data();
  
  // ✅ FIXED: Read Strava connection status from main doc (tokens are in integrations/strava)
  const profile: UserProfile = {
    birthDate: userData.birthDate,
    age: userData.age,
    weight: userData.weight,
    ftp: userData.ftp,
    lthr: userData.lthr,
    maxHr: userData.maxHr,
    restHr: userData.restHr,
    // ✅ Read Strava status from main user document
    stravaConnected: userData.stravaConnected || false,
    stravaAthleteId: userData.stravaAthleteId,
    weeklyOverrides: userData.weeklyOverrides || {},
    // ✅ Read training hours targets (standard + week-specific overrides)
    weeklyTrainingHoursTarget: userData.weeklyTrainingHoursTarget,
    weeklyTargetHoursOverrides: userData.weeklyTargetHoursOverrides || {},
    preferences: userData.preferences || {
      indoorAllowed: true,
      availableDevices: [],
      preferredTrainingTimes: []
    }
  };
  
  // ✅ MIGRATION: Convert old day=0 (Sunday) to day=7 (ISO 8601)
  if (profile.preferences?.preferredTrainingTimes) {
    profile.preferences.preferredTrainingTimes = profile.preferences.preferredTrainingTimes.map(slot => {
      if (slot.day === 0) {
        console.log('🔄 Migrating slot from day=0 (Sun) to day=7 (ISO 8601)');
        return { ...slot, day: 7 };
      }
      return slot;
    });
  }
  
  // Same for weekly overrides
  if (profile.weeklyOverrides) {
    Object.keys(profile.weeklyOverrides).forEach(weekKey => {
      profile.weeklyOverrides![weekKey] = profile.weeklyOverrides![weekKey].map(slot => {
        if (slot.day === 0) {
          console.log(`🔄 Migrating weekly override slot from day=0 to day=7 for week ${weekKey}`);
          return { ...slot, day: 7 };
        }
        return slot;
      });
    });
  }
  
  // Debug: Log loaded TimeSlots and Target Hours
  console.log('📥 getUserProfile - Loaded TimeSlots:', profile.preferences?.preferredTrainingTimes?.length || 0, 'slots');
  console.log('📥 getUserProfile - Target Hours:', profile.weeklyTrainingHoursTarget || 'not set');
  console.log('📥 getUserProfile - Weekly Overrides:', Object.keys(profile.weeklyTargetHoursOverrides || {}).length, 'weeks');
  if (profile.preferences?.preferredTrainingTimes?.length) {
    console.log('📅 TimeSlots:', profile.preferences.preferredTrainingTimes);
  }
  
  return profile;
};

export const updateUserProfile = async (userId: string, profile: Partial<UserProfile>): Promise<void> => {
  // ✅ FIX: Write to main user document, not subcollection
  const userRef = doc(db, 'users', userId);
  
  // Debug: Log what we're saving
  if (profile.preferences?.preferredTrainingTimes) {
    console.log('💾 updateUserProfile - Saving TimeSlots:', profile.preferences.preferredTrainingTimes.length, 'slots');
    console.log('📅 TimeSlots to save:', profile.preferences.preferredTrainingTimes);
  }
  
  await setDoc(userRef, {
    ...profile,
    updatedAt: Timestamp.now()
  }, { merge: true });
  
  console.log('✅ updateUserProfile - Saved successfully');
};

// Strava integration
export const getStravaIntegration = async (userId: string): Promise<StravaIntegration | null> => {
  const stravaRef = doc(db, 'users', userId, 'integrations', 'strava');
  const snapshot = await getDoc(stravaRef);
  return snapshot.exists() ? snapshot.data() as StravaIntegration : null;
};

export const updateStravaIntegration = async (userId: string, integration: Partial<StravaIntegration>): Promise<void> => {
  const stravaRef = doc(db, 'users', userId, 'integrations', 'strava');
  await setDoc(stravaRef, integration, { merge: true });
};

// Activities
export const getRecentActivities = async (userId: string, limitCount: number = 10): Promise<Activity[]> => {
  const activitiesRef = collection(db, 'users', userId, 'activities');
  const q = query(activitiesRef, orderBy('startTime', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    startTime: doc.data().startTime.toDate(),
  })) as Activity[];
};

export const createActivity = async (userId: string, activity: Omit<Activity, 'id'>): Promise<string> => {
  const activitiesRef = collection(db, 'users', userId, 'activities');
  const docRef = await addDoc(activitiesRef, {
    ...activity,
    startTime: Timestamp.fromDate(activity.startTime),
  });
  return docRef.id;
};

// Daily metrics
export const getDailyMetrics = async (userId: string, date: string): Promise<DailyMetrics | null> => {
  const metricsRef = doc(db, 'fact_daily_metrics', userId, 'metrics', date);
  const snapshot = await getDoc(metricsRef);
  return snapshot.exists() ? snapshot.data() as DailyMetrics : null;
};

export const updateDailyMetrics = async (userId: string, metrics: DailyMetrics): Promise<void> => {
  const metricsRef = doc(db, 'fact_daily_metrics', userId, 'metrics', metrics.date);
  await setDoc(metricsRef, metrics, { merge: true });
};

export const getMetricsRange = async (userId: string, startDate: string, endDate: string): Promise<DailyMetrics[]> => {
  const metricsRef = collection(db, 'fact_daily_metrics', userId, 'metrics');
  const q = query(
    metricsRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => doc.data() as DailyMetrics);
};

// Training plans
export const getCurrentWeekPlan = async (userId: string): Promise<WeeklyPlan | null> => {
  const plansRef = collection(db, 'users', userId, 'plans');
  const q = query(plansRef, orderBy('weekStartDate', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const planDoc = snapshot.docs[0];
  return {
    ...planDoc.data(),
    id: planDoc.id,
    generated: planDoc.data().generated.toDate(),
    lastModified: planDoc.data().lastModified.toDate(),
  } as WeeklyPlan;
};

export const createWeeklyPlan = async (userId: string, plan: Omit<WeeklyPlan, 'id'>): Promise<string> => {
  const plansRef = collection(db, 'users', userId, 'plans');
  const docRef = await addDoc(plansRef, {
    ...plan,
    generated: Timestamp.fromDate(plan.generated),
    lastModified: Timestamp.fromDate(plan.lastModified),
  });
  return docRef.id;
};

export const updateWeeklyPlan = async (userId: string, planId: string, updates: Partial<WeeklyPlan>): Promise<void> => {
  const planRef = doc(db, 'users', userId, 'plans', planId);
  await updateDoc(planRef, {
    ...updates,
    lastModified: Timestamp.now(),
  });
};

// Season goals
export const getSeasonGoals = async (userId: string): Promise<SeasonGoal[]> => {
  const goalsRef = collection(db, 'users', userId, 'season_goals');
  const q = query(goalsRef, orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date,
  })) as SeasonGoal[];
};

export const createSeasonGoal = async (userId: string, goal: Omit<SeasonGoal, 'id'>): Promise<string> => {
  const goalsRef = collection(db, 'users', userId, 'season_goals');
  const docRef = await addDoc(goalsRef, {
    ...goal,
    date: Timestamp.fromDate(goal.date),
  });
  return docRef.id;
};

export const updateSeasonGoal = async (userId: string, goalId: string, updates: Partial<SeasonGoal>): Promise<void> => {
  const goalRef = doc(db, 'users', userId, 'planning', 'season_goals', goalId);
  const updateData = { ...updates };
  if (updateData.date) {
    updateData.date = Timestamp.fromDate(updateData.date) as any;
  }
  await updateDoc(goalRef, updateData);
};

export const deleteSeasonGoal = async (userId: string, goalId: string): Promise<void> => {
  const goalRef = doc(db, 'users', userId, 'planning', 'season_goals', goalId);
  await deleteDoc(goalRef);
};

// Training camps
export const getTrainingCamps = async (userId: string): Promise<TrainingCamp[]> => {
  const campsRef = collection(db, 'users', userId, 'planning', 'camps');
  const q = query(campsRef, orderBy('startDate', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    startDate: doc.data().startDate.toDate(),
    endDate: doc.data().endDate.toDate(),
  })) as TrainingCamp[];
};

export const createTrainingCamp = async (userId: string, camp: Omit<TrainingCamp, 'id'>): Promise<string> => {
  const campsRef = collection(db, 'users', userId, 'planning', 'camps');
  const docRef = await addDoc(campsRef, {
    ...camp,
    startDate: Timestamp.fromDate(camp.startDate),
    endDate: Timestamp.fromDate(camp.endDate),
  });
  return docRef.id;
};

export const updateTrainingCamp = async (userId: string, campId: string, updates: Partial<TrainingCamp>): Promise<void> => {
  const campRef = doc(db, 'users', userId, 'planning', 'camps', campId);
  const updateData = { ...updates };
  if (updateData.startDate) {
    updateData.startDate = Timestamp.fromDate(updateData.startDate) as any;
  }
  if (updateData.endDate) {
    updateData.endDate = Timestamp.fromDate(updateData.endDate) as any;
  }
  await updateDoc(campRef, updateData);
};

export const deleteTrainingCamp = async (userId: string, campId: string): Promise<void> => {
  const campRef = doc(db, 'users', userId, 'planning', 'camps', campId);
  await deleteDoc(campRef);
};

// Training Plan Management
/**
 * Recursively remove undefined values from an object
 */
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  
  if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  
  return obj;
}

export const saveTrainingPlan = async (
  userId: string,
  plan: {
    planId: string;
    startDate: string;
    endDate: string;
    weeks: WeeklyPlan[];
    createdAt: string;
    updatedAt: string;
  }
): Promise<void> => {
  console.log('📦 Saving new plan:', plan.planId);
  
  // ✅ STEP 1: Delete ALL old plans first
  const plansCollectionRef = collection(db, 'users', userId, 'plans');
  const oldPlansSnapshot = await getDocs(plansCollectionRef);
  
  console.log(`🗑️ Found ${oldPlansSnapshot.size} old plan(s) to delete`);
  
  if (oldPlansSnapshot.size > 0) {
    oldPlansSnapshot.docs.forEach(doc => {
      console.log(`  🗑️ Deleting plan: ${doc.id}`);
    });
  }
  
  // Delete all old plans in batch
  const deletePromises = oldPlansSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  if (oldPlansSnapshot.size > 0) {
    console.log(`✅ Deleted ${oldPlansSnapshot.size} old plan(s)`);
  }
  
  // ✅ STEP 2: Save new plan
  const planRef = doc(db, 'users', userId, 'plans', plan.planId);
  
  console.log('📦 Original plan before cleaning:', plan);
  
  // Remove ALL undefined values recursively
  const cleanedPlan = removeUndefined({
    userId,
    planId: plan.planId,
    startDate: plan.startDate,
    endDate: plan.endDate,
    weeks: plan.weeks,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    lastModified: Timestamp.now(),
  });
  
  console.log('✨ Cleaned plan:', cleanedPlan);
  
  await setDoc(planRef, cleanedPlan);
  console.log('💾 New plan saved successfully');
};

export const getTrainingPlan = async (userId: string, planId: string): Promise<any | null> => {
  const planRef = doc(db, 'users', userId, 'plans', planId);
  const planSnap = await getDoc(planRef);
  
  if (!planSnap.exists()) {
    return null;
  }
  
  return planSnap.data();
};

export const getLatestTrainingPlan = async (userId: string): Promise<any | null> => {
  const plansRef = collection(db, 'users', userId, 'plans');
  const q = query(plansRef, orderBy('createdAt', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data();
};

// Training Session Updates (for notes, RPE, etc.)
export const updateTrainingSession = async (
  userId: string, 
  planId: string, 
  sessionId: string, 
  updates: Partial<TrainingSession>
): Promise<void> => {
  // Get the plan
  const planRef = doc(db, 'users', userId, 'plans', planId);
  const planSnap = await getDoc(planRef);
  
  if (!planSnap.exists()) {
    throw new Error('Training plan not found');
  }
  
  const plan = planSnap.data() as WeeklyPlan;
  
  // Update the specific session in the sessions array
  if (plan.sessions) {
    const updatedSessions = plan.sessions.map(session => {
      if (session.id === sessionId) {
        return { ...session, ...updates };
      }
      return session;
    });
    
    // Save back to Firestore
    await updateDoc(planRef, { 
      sessions: updatedSessions,
      lastModified: Timestamp.now()
    });
  }
};