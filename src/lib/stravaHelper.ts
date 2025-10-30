import { adminDb } from './firebaseAdmin';

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Get valid Strava access token (refresh if needed)
 */
export async function getValidStravaToken(userId: string): Promise<string | null> {
  try {
    // Read from integrations/strava subcollection (where tokens are stored)
    const stravaRef = adminDb.collection('users').doc(userId).collection('integrations').doc('strava');
    const stravaDoc = await stravaRef.get();
    
    if (!stravaDoc.exists) {
      console.log('❌ No Strava integration found for user:', userId);
      return null;
    }
    
    const data = stravaDoc.data();
    if (!data) return null;
    
    const { accessToken, refreshToken, expiresAt } = data;
    
    // Check if token is still valid (with 5 min buffer)
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt && now < expiresAt - 300) {
      console.log('✅ Using existing valid access token');
      return accessToken;
    }
    
    // Token expired, refresh it
    console.log('🔄 Access token expired, refreshing...');
    const newTokens = await refreshStravaToken(refreshToken);
    
    if (!newTokens) {
      console.log('❌ Failed to refresh token');
      return null;
    }
    
    // Update stored tokens
    await stravaRef.update({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresAt: newTokens.expiresAt,
      lastSync: new Date().toISOString(),
    });
    
    console.log('✅ Token refreshed successfully');
    return newTokens.accessToken;
    
  } catch (error) {
    console.error('Error getting valid Strava token:', error);
    return null;
  }
}

/**
 * Refresh Strava access token
 */
async function refreshStravaToken(refreshToken: string): Promise<StravaTokens | null> {
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strava token refresh failed:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    };
    
  } catch (error) {
    console.error('Error refreshing Strava token:', error);
    return null;
  }
}

/**
 * Fetch activities from Strava API
 */
export async function fetchStravaActivities(
  accessToken: string,
  after?: number,
  page: number = 1,
  perPage: number = 30
) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    
    if (after) {
      params.append('after', after.toString());
    }
    
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strava API error:', response.status, errorText);
      throw new Error(`Strava API error: ${response.status}`);
    }
    
    const activities = await response.json();
    return activities;
    
  } catch (error) {
    console.error('Error fetching Strava activities:', error);
    throw error;
  }
}

/**
 * Get athlete profile from Strava
 */
export async function fetchStravaAthlete(accessToken: string) {
  try {
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strava API error:', response.status, errorText);
      throw new Error(`Strava API error: ${response.status}`);
    }
    
    const athlete = await response.json();
    return athlete;
    
  } catch (error) {
    console.error('Error fetching Strava athlete:', error);
    throw error;
  }
}
