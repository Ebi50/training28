import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getCombinedFitnessMetrics, calculateTSS } from '@/lib/fitnessMetrics';

/**
 * API Route: Get fitness forecast (CTL/ATL/TSB projection)
 * GET /api/fitness/forecast?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log('📊 Getting fitness forecast for user:', userId);

    // Get user profile for FTP/LTHR
    const profileDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!profileDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const profile = profileDoc.data();
    const ftp = profile?.ftp;
    const lthr = profile?.lthr;

    // Get past activities (last 90 days for accurate CTL)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

    const metricsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('dailyMetrics')
      .where('date', '>=', ninetyDaysAgoStr)
      .orderBy('date', 'asc')
      .get();

    // Collect past activities with TSS
    const pastActivities: { date: string; tss: number }[] = [];
    
    metricsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.activities && Array.isArray(data.activities)) {
        data.activities.forEach((activity: any) => {
          const tss = calculateTSS({
            movingTimeSeconds: activity.moving_time,
            averagePower: activity.average_watts,
            averageHeartRate: activity.average_heartrate,
            ftp,
            lthr,
          });
          pastActivities.push({
            date: activity.start_date,
            tss,
          });
        });
      }
    });

    console.log('📈 Past activities:', pastActivities.length);

    // Get active training plan
    const planDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('trainingPlans')
      .doc('active')
      .get();

    let plannedActivities: { date: string; tss: number }[] = [];

    if (planDoc.exists) {
      const planData = planDoc.data();
      if (planData?.sessions && Array.isArray(planData.sessions)) {
        // Only include future sessions
        const today = new Date().toISOString().split('T')[0];
        
        plannedActivities = planData.sessions
          .filter((session: any) => session.date >= today)
          .map((session: any) => ({
            date: session.date,
            tss: session.targetTss || 0,
          }));
      }
    }

    console.log('📅 Planned activities:', plannedActivities.length);

    // Calculate combined metrics
    const result = getCombinedFitnessMetrics({
      pastActivities,
      plannedActivities,
    });

    return NextResponse.json({
      success: true,
      current: result.current,
      forecast: result.forecast,
      stats: {
        pastActivities: pastActivities.length,
        plannedSessions: plannedActivities.length,
        forecastDays: result.forecast.length,
      },
    });

  } catch (error: any) {
    console.error('❌ Error getting fitness forecast:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
