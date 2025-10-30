import { NextRequest, NextResponse } from 'next/server';
import { TrainingPlanGenerator } from '@/lib/planGenerator';
import { calculateFitnessMetrics, calculateTSS } from '@/lib/fitnessMetrics';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Generate training plan based on user's current fitness and goals
 * POST /api/training/generate-plan
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get user profile
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData?.stravaConnected) {
      return NextResponse.json({ error: 'Strava not connected' }, { status: 400 });
    }

    // Get Strava token
    const stravaDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('strava')
      .get();
    
    if (!stravaDoc.exists) {
      return NextResponse.json({ error: 'No Strava tokens found' }, { status: 404 });
    }

    const stravaData = stravaDoc.data();
    if (!stravaData?.accessToken) {
      return NextResponse.json({ error: 'Invalid Strava token' }, { status: 401 });
    }

    // Fetch recent activities from Strava
    const ninetyDaysAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60);
    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${ninetyDaysAgo}&per_page=200`,
      {
        headers: {
          'Authorization': `Bearer ${stravaData.accessToken}`
        }
      }
    );

    if (!activitiesResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch Strava activities' }, { status: 500 });
    }

    const activities = await activitiesResponse.json();

    // Calculate current fitness metrics
    const activitiesWithTSS = activities.map((activity: any) => ({
      date: activity.start_date,
      tss: calculateTSS({
        movingTimeSeconds: activity.moving_time,
        averagePower: activity.average_watts,
        averageHeartRate: activity.average_heartrate,
        ftp: userData.ftp,
        lthr: userData.lthr
      })
    }));

    const fitnessMetrics = calculateFitnessMetrics(activitiesWithTSS);

    // Generate 8-week training plan
    const generator = new TrainingPlanGenerator();
    await generator.initialize();
    
    const parameters = {
      weeklyHours: userData.weeklyHours || 10,
      maxHitDays: 2,
      litRatio: 0.90,
      rampRate: 0.08,
      tsbTarget: 0,
      indoorAllowed: userData.preferences?.indoorAllowed || true,
      availableTimeSlots: userData.preferences?.availableTimeSlots || [],
      upcomingGoals: [],
    };

    const userProfile = {
      ftp: userData.ftp || 200,
      lthr: userData.lthr || 150,
      maxHr: userData.maxHr || 180,
      restHr: userData.restHr || 60,
      weight: userData.weight || 75,
      age: userData.age || 35,
      stravaConnected: userData.stravaConnected || false,
      weeklyOverrides: userData.weeklyOverrides || {},
      preferences: userData.preferences || {
        indoorAllowed: true,
        availableDevices: [],
        preferredTrainingTimes: []
      }
    };

    // Generate 8 weeks
    const weeks = [];
    let currentWeekStart = new Date();
    
    for (let i = 0; i < 8; i++) {
      const weekPlan = await generator.generateWeeklyPlan(
        userId,
        currentWeekStart,
        parameters,
        [], // previousMetrics - will load from DB later
        userProfile,
        [] // upcomingGoals
      );
      
      weeks.push({
        weekNumber: i + 1,
        startDate: currentWeekStart.toISOString(),
        ...weekPlan
      });
      
      // Move to next week
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    const plan = {
      weeks,
      totalWeeks: 8,
      startDate: new Date().toISOString(),
      currentWeek: 0
    };

    // Helper function to remove undefined values recursively
    const removeUndefined = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      if (Array.isArray(obj)) return obj.map(removeUndefined);
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = removeUndefined(value);
          }
        }
        return cleaned;
      }
      return obj;
    };

    // Store plan in Firestore (remove undefined values)
    const planRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('plans')
      .doc('current');
    
    console.log('📋 Plan before cleaning:', JSON.stringify(plan).substring(0, 500));
    
    const cleanedPlan = removeUndefined({
      ...plan,
      generatedAt: new Date().toISOString(),
      fitnessMetrics,
    });
    
    console.log('📋 Plan after cleaning:', JSON.stringify(cleanedPlan).substring(0, 500));
    console.log('📋 Weeks after cleaning:', cleanedPlan.weeks?.length, cleanedPlan.weeks?.[0]);
    
    await planRef.set(cleanedPlan);

    return NextResponse.json({
      success: true,
      plan,
      fitnessMetrics
    });

  } catch (error: any) {
    console.error('Error generating plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate plan' },
      { status: 500 }
    );
  }
}

/**
 * Get current training plan
 * GET /api/training/generate-plan?userId=XXX
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const planDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('plans')
      .doc('current')
      .get();

    if (!planDoc.exists) {
      return NextResponse.json({ error: 'No plan found' }, { status: 404 });
    }

    return NextResponse.json(planDoc.data());

  } catch (error: any) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}
