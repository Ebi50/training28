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

    // Get current plan from Firestore
    const planDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('plans')
      .doc('current')
      .get();
    
    if (!planDoc.exists) {
      return NextResponse.json({ plan: null }, { status: 200 });
    }

    const plan = planDoc.data();
    
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
