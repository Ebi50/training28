import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Get current training plan for a user
 * GET /api/training/plan?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get latest plan from Firestore (sorted by createdAt)
    const plansSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('plans')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (plansSnapshot.empty) {
      console.log('ℹ️ No plan found for user:', userId);
      return NextResponse.json({ plan: null }, { status: 200 });
    }

    const plan = plansSnapshot.docs[0].data();
    console.log('✅ Plan loaded:', plan.planId, 'with', plan.weeks?.length, 'weeks');
    
    return NextResponse.json({
      success: true,
      plan
    });
  } catch (error: any) {
    console.error('Error loading plan:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
