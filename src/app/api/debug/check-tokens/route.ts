import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Debug endpoint to check if Strava tokens are saved correctly
 * Usage: GET /api/debug/check-tokens?userId=YOUR_USER_ID
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Check main user document
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Check integrations/strava subcollection
    const stravaDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('strava')
      .get();
    
    const stravaData = stravaDoc.data();

    return NextResponse.json({
      userId,
      mainDocument: {
        exists: userDoc.exists,
        stravaConnected: userData?.stravaConnected || false,
      },
      stravaIntegration: {
        exists: stravaDoc.exists,
        hasAccessToken: !!stravaData?.accessToken,
        hasRefreshToken: !!stravaData?.refreshToken,
        expiresAt: stravaData?.expiresAt || null,
        tokenExpired: stravaData?.expiresAt 
          ? stravaData.expiresAt < Math.floor(Date.now() / 1000)
          : null,
      }
    });
  } catch (error: any) {
    console.error('Error checking tokens:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
