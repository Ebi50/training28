import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Debug endpoint to check current user's Firebase Auth UID
 * GET /api/debug/current-user
 */
export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get this from Firebase Auth session
    // For now, we'll return all users with Strava connected
    const usersSnapshot = await adminDb.collection('users')
      .where('stravaConnected', '==', true)
      .get();
    
    const users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName,
      stravaAthleteId: doc.data().stravaAthleteId,
      stravaConnected: doc.data().stravaConnected,
      ftp: doc.data().ftp,
      lthr: doc.data().lthr,
    }));

    return NextResponse.json({
      message: 'All users with Strava connected',
      users,
      instruction: 'Use the UID from here to test the activities API'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
