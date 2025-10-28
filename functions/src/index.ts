import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import axios from 'axios';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize CORS
const corsHandler = cors({ origin: true });

// Secret Manager client
const secretClient = new SecretManagerServiceClient();

// Strava OAuth callback
export const stravaOAuthCallback = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state parameter' });
      }

      // Get Strava client secret from Secret Manager
      const [secretVersion] = await secretClient.accessSecretVersion({
        name: `projects/${process.env.GCLOUD_PROJECT}/secrets/strava-client-secret/versions/latest`,
      });
      
      const stravaClientSecret = secretVersion.payload?.data?.toString();
      
      if (!stravaClientSecret) {
        throw new Error('Failed to retrieve Strava client secret');
      }

      // Exchange code for tokens
      const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: stravaClientSecret,
        code: code,
        grant_type: 'authorization_code',
      });

      const { access_token, refresh_token, expires_at, athlete } = tokenResponse.data;

      // Decode state to get user ID (base64 encoded)
      const userId = Buffer.from(state as string, 'base64').toString('utf-8');

      // Store tokens in Firestore
      await db.collection('users').doc(userId).collection('integrations').doc('strava').set({
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_at,
        athleteId: athlete.id.toString(),
        scopes: tokenResponse.data.scope?.split(',') || [],
        lastSync: admin.firestore.FieldValue.serverTimestamp(),
        connected: true,
      });

      // Update user profile with athlete info
      await db.collection('users').doc(userId).update({
        stravaAthleteId: athlete.id.toString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Redirect back to app
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? `https://${process.env.GCLOUD_PROJECT}.web.app/dashboard?connected=true`
        : `http://localhost:3000/dashboard?connected=true`;
        
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('Strava OAuth callback error:', error);
      res.status(500).json({ error: 'OAuth callback failed' });
    }
  });
});

// Strava webhook handler
export const stravaWebhook = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      if (req.method === 'GET') {
        // Webhook verification
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // Get webhook verify token from Secret Manager
        const [secretVersion] = await secretClient.accessSecretVersion({
          name: `projects/${process.env.GCLOUD_PROJECT}/secrets/strava-webhook-verify-token/versions/latest`,
        });
        
        const verifyToken = secretVersion.payload?.data?.toString();

        if (mode === 'subscribe' && token === verifyToken) {
          console.log('Strava webhook verified');
          res.json({ 'hub.challenge': challenge });
        } else {
          console.error('Webhook verification failed');
          res.status(403).send('Forbidden');
        }
        return;
      }

      if (req.method === 'POST') {
        // Handle webhook events
        const event = req.body;
        console.log('Strava webhook event:', event);

        if (event.object_type === 'activity' && event.aspect_type === 'create') {
          // Queue activity processing
          await processStravaActivity(event.owner_id.toString(), event.object_id.toString());
        }

        res.status(200).send('EVENT_RECEIVED');
      }
    } catch (error) {
      console.error('Strava webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
});

// Process Strava activity
async function processStravaActivity(athleteId: string, activityId: string) {
  try {
    // Find user by Strava athlete ID
    const userQuery = await db.collection('users')
      .where('stravaAthleteId', '==', athleteId)
      .limit(1)
      .get();

    if (userQuery.empty) {
      console.log(`No user found for Strava athlete ID: ${athleteId}`);
      return;
    }

    const userId = userQuery.docs[0].id;
    
    // Get user's Strava tokens
    const stravaIntegration = await db.collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('strava')
      .get();

    if (!stravaIntegration.exists) {
      console.log(`No Strava integration found for user: ${userId}`);
      return;
    }

    const tokens = stravaIntegration.data();
    let accessToken = tokens?.accessToken;

    // Check if token needs refresh
    if (tokens?.expiresAt && tokens.expiresAt < Math.floor(Date.now() / 1000)) {
      accessToken = await refreshStravaToken(userId, tokens.refreshToken);
    }

    // Fetch activity details from Strava
    const activityResponse = await axios.get(`https://www.strava.com/api/v3/activities/${activityId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const activity = activityResponse.data;

    // Calculate TSS (simplified calculation)
    const tss = calculateTss(activity);

    // Store activity in Firestore
    const activityData = {
      id: activity.id.toString(),
      stravaId: activity.id.toString(),
      startTime: admin.firestore.Timestamp.fromDate(new Date(activity.start_date)),
      duration: activity.elapsed_time,
      type: mapStravaActivityType(activity.type),
      tss: tss,
      avgHeartRate: activity.average_heartrate || null,
      maxHeartRate: activity.max_heartrate || null,
      avgPower: activity.average_watts || null,
      maxPower: activity.max_watts || null,
      distance: activity.distance || null,
      elevation: activity.total_elevation_gain || null,
      indoor: activity.trainer || false,
      deviceFlags: {
        powerMeter: !!activity.device_watts,
        heartRateMonitor: !!activity.average_heartrate,
        cadenceSensor: !!activity.average_cadence,
      },
      source: 'strava',
      completed: true,
      compliance: 'completed',
    };

    await db.collection('users')
      .doc(userId)
      .collection('activities')
      .doc(activity.id.toString())
      .set(activityData);

    // Update daily metrics
    await updateDailyMetrics(userId, new Date(activity.start_date), tss);

    console.log(`Processed activity ${activityId} for user ${userId}`);
    
  } catch (error) {
    console.error('Error processing Strava activity:', error);
  }
}

// Refresh Strava token
async function refreshStravaToken(userId: string, refreshToken: string): Promise<string> {
  try {
    const [secretVersion] = await secretClient.accessSecretVersion({
      name: `projects/${process.env.GCLOUD_PROJECT}/secrets/strava-client-secret/versions/latest`,
    });
    
    const stravaClientSecret = secretVersion.payload?.data?.toString();

    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: stravaClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const { access_token, refresh_token: newRefreshToken, expires_at } = response.data;

    // Update tokens in Firestore
    await db.collection('users')
      .doc(userId)
      .collection('integrations')
      .doc('strava')
      .update({
        accessToken: access_token,
        refreshToken: newRefreshToken,
        expiresAt: expires_at,
      });

    return access_token;
  } catch (error) {
    console.error('Error refreshing Strava token:', error);
    throw error;
  }
}

// Calculate TSS (simplified)
function calculateTss(activity: any): number {
  // Simplified TSS calculation
  // In production, this would use more sophisticated algorithms
  const duration = activity.elapsed_time / 3600; // hours
  const avgPower = activity.average_watts || 0;
  const normalizedPower = activity.weighted_average_watts || avgPower;
  
  if (normalizedPower > 0) {
    // Power-based TSS (requires FTP - using estimated 250W for now)
    const ftp = 250; // This should come from user profile
    const intensityFactor = normalizedPower / ftp;
    return Math.round(duration * normalizedPower * intensityFactor * 100 / ftp);
  } else if (activity.average_heartrate) {
    // HR-based TSS estimation
    const avgHr = activity.average_heartrate;
    const maxHr = 190; // This should come from user profile
    const lthr = 170; // This should come from user profile
    const hrRatio = (avgHr - 50) / (maxHr - 50);
    return Math.round(duration * hrRatio * hrRatio * 100);
  } else {
    // Fallback: RPE-based estimation
    const estimatedRpe = activity.type === 'Ride' ? 5 : 4;
    return Math.round(duration * estimatedRpe * estimatedRpe * 10);
  }
}

// Map Strava activity types to our types
function mapStravaActivityType(stravaType: string): string {
  const typeMap: { [key: string]: string } = {
    'Ride': 'ride',
    'VirtualRide': 'ride',
    'Run': 'run',
    'Swim': 'swim',
    'WeightTraining': 'strength',
    'Workout': 'other',
  };
  
  return typeMap[stravaType] || 'other';
}

// Update daily metrics
async function updateDailyMetrics(userId: string, date: Date, tss: number) {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const metricsRef = db.collection('fact_daily_metrics')
    .doc(userId)
    .collection('metrics')
    .doc(dateStr);

  const existingMetrics = await metricsRef.get();
  
  if (existingMetrics.exists) {
    // Update existing metrics
    const data = existingMetrics.data();
    await metricsRef.update({
      tss: (data?.tss || 0) + tss,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // Create new metrics entry
    await metricsRef.set({
      date: dateStr,
      userId: userId,
      tss: tss,
      ctl: 0, // These will be calculated by batch job
      atl: 0,
      tsb: 0,
      indoor: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}