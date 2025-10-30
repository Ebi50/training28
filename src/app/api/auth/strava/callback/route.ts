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

    // Check if this is a login flow or connect flow
    let userId: string;
    
    if (state === 'login') {
      // LOGIN FLOW: Create/find user by Strava athlete ID
      console.log('🔑 Login flow detected - creating/finding user by Strava ID');
      
      // Search for existing user with this Strava athlete ID
      const usersQuery = await adminDb.collection('users')
        .where('stravaAthleteId', '==', athlete.id.toString())
        .limit(1)
        .get();
      
      if (!usersQuery.empty) {
        // Existing user found
        userId = usersQuery.docs[0].id;
        console.log('✅ Existing user found:', userId);
      } else {
        // Create new user with Strava athlete ID as base
        const newUserRef = adminDb.collection('users').doc();
        userId = newUserRef.id;
        
        await newUserRef.set({
          email: athlete.email || `strava-${athlete.id}@temp.local`,
          displayName: `${athlete.firstname} ${athlete.lastname}`,
          stravaAthleteId: athlete.id.toString(),
          stravaConnected: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        console.log('✅ New user created:', userId);
      }
    } else {
      // CONNECT FLOW: Use userId from state
      userId = state || '';
      if (!userId) {
        return NextResponse.redirect(
          new URL('/dashboard?strava_error=invalid_state', request.url)
        );
      }
      console.log('🔗 Connect flow detected - updating existing user:', userId);
    }

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

    // Success - redirect based on flow type
    if (state === 'login') {
      // LOGIN FLOW: Create Firebase custom token and redirect to login page
      const { getAuth } = await import('firebase-admin/auth');
      const adminAuth = getAuth();
      const customToken = await adminAuth.createCustomToken(userId);
      
      console.log('✅ Custom token created for login');
      
      // Redirect to login page with custom token
      return NextResponse.redirect(
        new URL(`/login?token=${customToken}&strava_login=true`, request.url)
      );
    } else {
      // CONNECT FLOW: Just redirect to dashboard
      return NextResponse.redirect(
        new URL('/dashboard?strava_connected=true', request.url)
      );
    }
  } catch (error) {
    console.error('Strava OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?strava_error=unknown', request.url)
    );
  }
}
