import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { adaptSession } from '@/lib/sessionAdapter';
import { DailyMetrics } from '@/types';

/**
 * API Route: Adapt today's training plan based on morning check
 * POST /api/adapt-plan
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, date } = await request.json();
    
    if (!userId || !date) {
      return NextResponse.json(
        { error: 'Missing userId or date' },
        { status: 400 }
      );
    }

    console.log('🔄 Adapting plan for:', { userId, date });

    // Get today's metrics with morning check
    const metricsRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('dailyMetrics')
      .doc(date);
    
    const metricsDoc = await metricsRef.get();
    
    if (!metricsDoc.exists) {
      return NextResponse.json(
        { error: 'No metrics found for today' },
        { status: 404 }
      );
    }

    const todayMetrics = metricsDoc.data() as DailyMetrics;
    
    if (!todayMetrics.morningCheck) {
      return NextResponse.json(
        { error: 'No morning check found' },
        { status: 404 }
      );
    }

    // Get recent metrics for context (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentMetricsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('dailyMetrics')
      .where('date', '>=', sevenDaysAgoStr)
      .where('date', '<', date)
      .orderBy('date', 'desc')
      .limit(7)
      .get();

    const recentMetrics = recentMetricsSnapshot.docs.map(
      doc => doc.data() as DailyMetrics
    );

    console.log('📊 Recent metrics count:', recentMetrics.length);

    // Get today's planned session
    const planRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('trainingPlans')
      .doc('active');
    
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      return NextResponse.json(
        { error: 'No active training plan found' },
        { status: 404 }
      );
    }

    const planData = planDoc.data();
    const todaySession = planData?.sessions?.find((s: any) => s.date === date);

    if (!todaySession) {
      console.log('⚠️ No session planned for today');
      return NextResponse.json({
        message: 'No session planned for today',
        adapted: false,
      });
    }

    console.log('📋 Original session:', {
      type: todaySession.type,
      duration: todaySession.duration,
      tss: todaySession.targetTss,
    });

    // Adapt the session
    const result = adaptSession(
      todaySession,
      todayMetrics.morningCheck,
      recentMetrics
    );

    console.log('🎯 Adaptation result:', {
      changed: result.changed,
      reason: result.reason,
      newType: result.adaptedSession.type,
      newDuration: result.adaptedSession.duration,
      newTss: result.adaptedSession.targetTss,
    });

    // Update the session in Firestore if changed
    if (result.changed && planData) {
      const updatedSessions = planData.sessions.map((s: any) =>
        s.date === date ? result.adaptedSession : s
      );

      await planRef.update({
        sessions: updatedSessions,
        lastAdaptedAt: new Date().toISOString(),
        lastAdaptedReason: result.reason,
      });

      console.log('✅ Plan updated in Firestore');
    }

    // Also store adaptation info in today's metrics
    await metricsRef.update({
      planAdaptation: {
        adapted: result.changed,
        reason: result.reason,
        originalType: todaySession.type,
        originalDuration: todaySession.duration,
        originalTss: todaySession.targetTss,
        adaptedType: result.adaptedSession.type,
        adaptedDuration: result.adaptedSession.duration,
        adaptedTss: result.adaptedSession.targetTss,
        adaptedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      adapted: result.changed,
      reason: result.reason,
      session: result.adaptedSession,
    });

  } catch (error: any) {
    console.error('❌ Error adapting plan:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
