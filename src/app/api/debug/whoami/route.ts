import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Debug endpoint to show current user info
 * Usage: GET /api/debug/whoami
 */
export async function GET(request: NextRequest) {
  try {
    // Get all users with stravaConnected=true
    const usersQuery = await adminDb.collection('users')
      .where('stravaConnected', '==', true)
      .limit(10)
      .get();
    
    const users = usersQuery.docs.map(doc => ({
      userId: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName,
      stravaAthleteId: doc.data().stravaAthleteId,
      stravaConnected: doc.data().stravaConnected,
    }));

    return NextResponse.json({
      totalUsers: users.length,
      users
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
