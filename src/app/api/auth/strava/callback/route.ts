import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // Should contain userId

  console.log('🔵 Strava callback called:', { code: !!code, error, state });

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

    console.log('✅ Token exchange successful:', { 
      athleteId: athlete.id, 
      expiresAt: expires_at 
    });

    // CONNECT FLOW: Use userId from state (state should contain the Firebase UID)
    const userId = state || '';
    
    if (!userId || userId === 'login') {
      // Old "login" flow or missing state - redirect to login with error
      console.error('❌ Invalid state - user must login first, then connect Strava');
      return NextResponse.redirect(
        new URL('/login?error=please_login_first', request.url)
      );
    }
    
    console.log('🔗 Connect flow - updating existing user:', userId);

    // ✅ CRITICAL: Store tokens in integrations/strava subcollection (NOT profile/data)
    const stravaRef = adminDb.collection('users').doc(userId).collection('integrations').doc('strava');
    await stravaRef.set({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: expires_at,
      athleteId: athlete.id.toString(),
      scopes: tokenData.scope?.split(',') || [],
      lastSync: new Date().toISOString(),
      connected: true,
    }, { merge: true });

    // Also update main user document for easy access (create if not exists)
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.set({
      stravaConnected: true,
      stravaAthleteId: athlete.id.toString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.log('✅ Tokens stored in Firestore:', userId);

    // Success - redirect to dashboard (user is already logged in)
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
