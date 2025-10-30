import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // Should contain userId

  // Check for errors
  if (error) {
    console.error('Strava OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?strava_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard?strava_error=no_code', request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Strava token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/dashboard?strava_error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_at, athlete } = tokenData;

    // Decode state to get userId (in production, verify this is signed/encrypted)
    const userId = state;
    if (!userId) {
      return NextResponse.redirect(
        new URL('/dashboard?strava_error=invalid_state', request.url)
      );
    }

    // Update user profile in Firestore
    const userRef = doc(db, 'users', userId, 'profile', 'data');
    await updateDoc(userRef, {
      stravaConnected: true,
      stravaAthleteId: athlete.id.toString(),
      stravaAccessToken: access_token,
      stravaRefreshToken: refresh_token,
      stravaExpiresAt: expires_at,
      stravaLastSync: new Date().toISOString(),
    });

    // Success - redirect to dashboard
    return NextResponse.redirect(
      new URL('/dashboard?strava_connected=true', request.url)
    );
  } catch (error) {
    console.error('Strava OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?strava_error=unknown', request.url)
    );
  }
}
