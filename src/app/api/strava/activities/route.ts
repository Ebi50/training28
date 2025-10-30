import { NextRequest, NextResponse } from 'next/server';
import { getValidStravaToken, fetchStravaActivities } from '@/lib/stravaHelper';

/**
 * GET /api/strava/activities
 * Fetch activities from Strava API
 * Query params:
 *   - userId: User ID (required)
 *   - after: Unix timestamp to fetch activities after (optional)
 *   - page: Page number (default: 1)
 *   - per_page: Activities per page (default: 30)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const after = searchParams.get('after');
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('per_page') || '30';

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    // Get valid access token (will refresh if expired)
    const accessToken = await getValidStravaToken(userId);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No valid Strava token found. Please reconnect your Strava account.' },
        { status: 401 }
      );
    }

    // Fetch activities from Strava
    const activities = await fetchStravaActivities(
      accessToken,
      after ? parseInt(after) : undefined,
      parseInt(page),
      parseInt(perPage)
    );

    // Return activities array directly (not wrapped in object)
    return NextResponse.json(activities);

  } catch (error: any) {
    console.error('Error fetching Strava activities:', error);
    
    // Check if it's a 401 error from Strava
    if (error.message?.includes('401')) {
      return NextResponse.json(
        { error: 'Strava authentication failed. Please reconnect your account.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error.message },
      { status: 500 }
    );
  }
}
