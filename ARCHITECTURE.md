# Cyclona - System Architecture

**Version**: 1.0  
**Datum**: 2025-11-01  
**Status**: ✅ READY FOR IMPLEMENTATION  

---

## Übersicht

Cyclona ist eine **serverless, cloud-native** Webanwendung mit folgender Architektur:

```
┌─────────────────────────────────────────────────────────────┐
│                      USER DEVICES                            │
│  (Browser: Desktop, Tablet, Mobile)                         │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTPS
             ▼
┌─────────────────────────────────────────────────────────────┐
│               FIREBASE HOSTING (CDN)                         │
│  - Next.js Static Export / App Router                       │
│  - Workout Library JSON Files (/workouts/*.json)            │
│  - Edge Caching (Global)                                    │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Firebase SDK
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE SERVICES                         │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  AUTHENTICATION  │  │    FIRESTORE     │                │
│  │  - Email/Pass    │  │  - User Data     │                │
│  │  - Strava OAuth  │  │  - Plans         │                │
│  └──────────────────┘  │  - Workouts      │                │
│                         │  - Metrics       │                │
│  ┌──────────────────┐  └──────────────────┘                │
│  │ CLOUD FUNCTIONS  │                                       │
│  │  - Strava Sync   │  ┌──────────────────┐                │
│  │  - Plan Update   │  │  SECRET MANAGER  │                │
│  │  - Readiness Calc│  │  - API Keys      │                │
│  └──────────────────┘  │  - OAuth Tokens  │                │
│                         └──────────────────┘                │
└────────────┬────────────────────────────────────────────────┘
             │
             │ REST API / Webhooks
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  - Strava API (Activity Sync)                               │
│  - OpenWeatherMap (Weather Data) [Phase 2]                  │
│  - Garmin Connect (HRV/Sleep) [Phase 2]                     │
│  - Whoop API (Readiness) [Phase 2]                          │
│  - Oura API (HRV/Sleep) [Phase 2]                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Technologie-Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3
- **Charts**: Recharts / Chart.js
- **State Management**: React Context + SWR (für Data Fetching)
- **Forms**: React Hook Form + Zod (Validation)

### Backend
- **Serverless**: Firebase Cloud Functions (Node.js 20)
- **Database**: Cloud Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Hosting (Static Assets)
- **Secrets**: Google Cloud Secret Manager

### External APIs
- **Strava**: OAuth 2.0 + REST API + Webhooks
- **Weather**: OpenWeatherMap API (Phase 2)
- **Wearables**: Garmin Connect, Whoop, Oura APIs (Phase 2)

---

## Layer-Architektur

### Layer 1: Presentation (Frontend)

```
src/
├── app/
│   ├── layout.tsx              # Root Layout
│   ├── page.tsx                # Landing Page
│   ├── dashboard/
│   │   ├── page.tsx            # Dashboard Main
│   │   └── loading.tsx         # Loading State
│   ├── setup/
│   │   └── page.tsx            # Initial Setup Flow
│   └── settings/
│       └── page.tsx            # User Settings
│
├── components/
│   ├── TodayWorkoutCard.tsx    # Today's Training Display
│   ├── FitnessCurveChart.tsx   # CTL/ATL/TSB Graph
│   ├── NextGoalCard.tsx        # Event Countdown
│   ├── SlotEditor.tsx          # Time Slot Definition
│   └── WorkoutRating.tsx       # Post-Workout Rating
│
├── lib/
│   ├── firebase.ts             # Firebase Client SDK Init
│   ├── firestore.ts            # Firestore CRUD Operations
│   ├── planGenerator.ts        # Training Plan Logic
│   ├── tssCalculator.ts        # TSS/CTL/ATL/TSB Calculations
│   ├── zwoGenerator.ts         # ZWO File Generation (Client-Side)
│   └── readinessScore.ts       # Readiness Calculation
│
├── types/
│   ├── workout.ts              # Workout Type Definitions
│   ├── user.ts                 # User Profile Types
│   └── plan.ts                 # Training Plan Types
│
└── hooks/
    ├── useAuth.ts              # Authentication Hook
    ├── useDashboard.ts         # Dashboard Data Hook
    └── usePlans.ts             # Plan Fetching Hook
```

### Layer 2: Business Logic (Cloud Functions)

```
functions/
├── src/
│   ├── index.ts                # Function Exports
│   ├── stravaOAuth.ts          # OAuth Callback Handler
│   ├── stravaWebhook.ts        # Activity Sync Webhook
│   ├── scheduledPlanUpdate.ts  # Daily Plan Update (On-Demand)
│   ├── readinessUpdate.ts      # Readiness Score Calculation
│   └── updateWeights.ts        # Weekly Weight Re-Training
│
└── package.json                # Function Dependencies
```

### Layer 3: Data (Firestore)

```
firestore/
├── users/
│   └── {userId}/
│       ├── profile             # User Profile (FTP, Goals, etc.)
│       ├── availability/       # Time Slots
│       │   └── {slotId}
│       ├── plans_weekly/       # Weekly Plans
│       │   └── {weekId}
│       ├── plans_daily/        # Daily Plans (with Readiness Adjustments)
│       │   └── {date}
│       ├── completions/        # Completed Workouts (from Strava)
│       │   └── {activityId}
│       └── metrics_daily/      # Daily Metrics (CTL, ATL, TSB, Readiness)
│           └── {date}
│
└── workouts_library/           # Workout Library (Optional - kann auch static sein)
    └── {workoutId}
```

---

## Datenfluss-Szenarien

### Szenario 1: Initial Setup

```
1. User landet auf /setup
   ↓
2. Frontend: Setup-Form (FTP, Slots, Event-Datum)
   ↓
3. User submits → POST /api/setup
   ↓
4. Firestore: Create user/profile, user/availability
   ↓
5. Cloud Function: Generate initial 4-week plan
   ↓
6. Firestore: Write plans_weekly/*, plans_daily/*
   ↓
7. Redirect to /dashboard
```

**Komponenten involviert**:
- `src/app/setup/page.tsx`
- `src/lib/firestore.ts` (createUserProfile)
- `functions/src/scheduledPlanUpdate.ts` (initialPlanGeneration)

---

### Szenario 2: Dashboard-Laden (Morgens)

```
1. User öffnet /dashboard
   ↓
2. Frontend: Check Auth (useAuth Hook)
   ↓
3. Firestore Read: plans_daily/{today}
   ↓
4. IF exists AND up-to-date:
   │  Display cached plan
   │  ↓
   │  END
   │
5. ELSE: Call Cloud Function /updateDailyPlan
   ↓
6. Cloud Function:
   │  - Fetch metrics_daily/{today} (Readiness, TSB)
   │  - Fetch plans_weekly/{currentWeek}
   │  - Apply Readiness Adjustment
   │  - Write plans_daily/{today}
   ↓
7. Frontend: Re-fetch and display updated plan
```

**Komponenten involviert**:
- `src/app/dashboard/page.tsx`
- `src/hooks/useDashboard.ts`
- `functions/src/scheduledPlanUpdate.ts`
- `src/components/TodayWorkoutCard.tsx`

**Performance-Optimierung**:
- SWR Cache: 5 Minuten
- Revalidate on Focus: Ja
- Stale-While-Revalidate: Ja

---

### Szenario 3: Workout-Start (ZWO-Download)

```
1. User klickt "Start Workout" auf Dashboard
   ↓
2. Frontend: Fetch Workout-Details aus plans_daily/{today}
   ↓
3. Client-Side: Generate ZWO-File
   │  - zwoGenerator.ts
   │  - Input: Workout Structure + User FTP
   │  - Output: XML String
   ↓
4. Browser: Download ZWO-File
   ↓
5. User: Öffnet in Zwift/MyWhoosh
```

**Komponenten involviert**:
- `src/components/TodayWorkoutCard.tsx` (Button Handler)
- `src/lib/zwoGenerator.ts` (ZWO XML Generation)

**Beispiel ZWO-Generation**:
```typescript
function generateZWO(workout: Workout, ftp: number): string {
  const xml = `
<workout_file>
  <author>Cyclona</author>
  <name>${workout.name}</name>
  <description>${workout.description}</description>
  <sportType>bike</sportType>
  <tags/>
  <workout>
    ${workout.structure.map(segment => {
      if (segment.type === 'warmup') {
        return `<Warmup Duration="${segment.duration_s}" PowerLow="${segment.intensity_ftp * 0.9}" PowerHigh="${segment.intensity_ftp}"/>`;
      }
      if (segment.type === 'interval') {
        return `<IntervalsT Repeat="${segment.reps}" OnDuration="${segment.on_duration_s}" OffDuration="${segment.off_duration_s}" OnPower="${segment.on_intensity_ftp}" OffPower="${segment.off_intensity_ftp}"/>`;
      }
      if (segment.type === 'cooldown') {
        return `<Cooldown Duration="${segment.duration_s}" PowerLow="${segment.intensity_ftp}" PowerHigh="${segment.intensity_ftp * 0.9}"/>`;
      }
    }).join('\n')}
  </workout>
</workout_file>
  `.trim();
  return xml;
}
```

---

### Szenario 4: Strava-Activity-Sync

```
1. User absolviert Training in Zwift
   ↓
2. Zwift sync zu Strava (automatisch)
   ↓
3. Strava Webhook → POST /stravaWebhook
   ↓
4. Cloud Function: stravaWebhook.ts
   │  - Verify Subscription
   │  - Fetch Activity Details (Power, HR, Duration)
   │  - Calculate TSS
   │  - Match zu geplantem Workout (Date + Duration)
   ↓
5. Firestore Write:
   │  - completions/{activityId}
   │  - Update metrics_daily/{date} (Actual TSS)
   ↓
6. Update CTL/ATL/TSB (Rolling Calculation)
   ↓
7. IF User rated Workout:
   │  Store rating in completions/{activityId}.rating
   │  Trigger weekly weight update (Sonntag)
```

**Komponenten involviert**:
- `functions/src/stravaWebhook.ts`
- `src/lib/tssCalculator.ts`

**TSS-Berechnung Logik**:
```typescript
function calculateTSS(activity: StravaActivity, ftp: number): number {
  // Priority 1: Power-based (if power data available)
  if (activity.average_watts && activity.weighted_power) {
    const IF = activity.weighted_power / ftp;
    const TSS = (activity.elapsed_time * activity.weighted_power * IF) / (ftp * 3600) * 100;
    return Math.round(TSS);
  }
  
  // Priority 2: HR-based (using HR zones)
  if (activity.average_heartrate && activity.max_heartrate) {
    const hrIntensity = activity.average_heartrate / activity.max_heartrate;
    const duration_hours = activity.elapsed_time / 3600;
    const TSS = duration_hours * hrIntensity * 100;
    return Math.round(TSS);
  }
  
  // Priority 3: RPE-based (from user rating if available)
  // Fallback: Estimate from planned workout TSS
  return activity.planned_tss || 50; // Default fallback
}
```

---

### Szenario 5: Weekly Plan Re-Generation

```
1. Sonntag Abend: User ändert Wochendauer für nächste Woche
   ↓
2. Frontend: POST /api/updateWeeklyGoal
   ↓
3. Cloud Function: scheduledPlanUpdate.ts
   │  - Fetch user/profile (FTP, Event-Datum, Phase)
   │  - Fetch user/availability (Slots)
   │  - Calculate Phase (Base/Build/Peak/Taper)
   │  - Load Workout Library (cached)
   │  - Generate 7-day plan
   │     - Kategorie-Verteilung nach Phase
   │     - Match Workouts zu Slots (Duration ≤ Slot Max)
   │     - Progression + Variety
   │     - Total TSS ≤ Weekly Goal
   ↓
4. Firestore Write:
   │  - plans_weekly/{nextWeek}
   │  - plans_daily/{date} × 7
   ↓
5. Frontend: Notification "Plan für nächste Woche bereit"
```

**Komponenten involviert**:
- `functions/src/scheduledPlanUpdate.ts`
- `src/lib/planGenerator.ts`

**Plan-Generation Algorithmus** (Pseudocode):
```typescript
function generateWeeklyPlan(user: User, slots: Slot[], phase: Phase, weeklyTSS: number): DailyPlan[] {
  // 1. Determine category distribution
  const distribution = getCategoryDistribution(phase);
  // Example: Build = {LIT: 50%, TEMPO: 20%, FTP: 20%, VO2MAX: 5%, SKILL: 5%}
  
  // 2. Allocate TSS to slots
  const slotTSS = allocateTSS(weeklyTSS, slots, distribution);
  // Example: Mo 60min LIT (45 TSS), Mi 90min TEMPO (85 TSS), ...
  
  // 3. For each slot, select matching workout
  const dailyPlans = slots.map(slot => {
    const category = slotTSS[slot.id].category;
    const targetTSS = slotTSS[slot.id].tss;
    const maxDuration = slot.duration_max;
    
    // Filter workouts: category match, duration ≤ max
    const candidates = workoutLibrary.filter(w => 
      w.category === category && 
      w.duration_min <= maxDuration
    );
    
    // Select best match (closest TSS, prefer variety)
    const selected = selectWorkout(candidates, targetTSS, recentWorkouts);
    
    // Scale if needed (proportional)
    const scaled = scaleWorkout(selected, maxDuration);
    
    return {
      date: slot.date,
      workout: scaled,
      slot: slot,
      planned_tss: calculateTSS(scaled, user.ftp)
    };
  });
  
  return dailyPlans;
}
```

---

## Firestore Schema (Detailliert)

### Collection: `users/{userId}/profile`

```typescript
interface UserProfile {
  uid: string;
  email: string;
  created_at: Timestamp;
  
  // Training Data
  ftp: number;                    // Functional Threshold Power (Watts)
  weight_kg: number;              // Body Weight
  max_hr: number;                 // Maximum Heart Rate
  
  // Goals
  weekly_duration_max: number;    // Minutes per week (maximum)
  current_phase: 'BASE' | 'BUILD' | 'PEAK' | 'TAPER';
  
  // Events
  events: {
    id: string;
    name: string;
    date: Timestamp;
    type: 'RACE' | 'GRAN_FONDO' | 'CENTURY' | 'CUSTOM';
    priority: 1 | 2 | 3;           // 1 = A-Goal, 2 = B-Goal, 3 = C-Goal
  }[];
  
  // Integrations
  strava_connected: boolean;
  strava_athlete_id?: number;
  garmin_connected?: boolean;
  whoop_connected?: boolean;
  
  // Settings
  units: 'METRIC' | 'IMPERIAL';
  timezone: string;
}
```

### Collection: `users/{userId}/availability/{slotId}`

```typescript
interface TimeSlot {
  id: string;                     // Auto-generated
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday
  start_time?: string;            // Optional: "18:00" (24h format)
  duration_max: number;           // Minutes (required)
  priority: 1 | 2 | 3;            // 1 = Must use, 2 = Prefer, 3 = Optional
  active: boolean;                // Can be temporarily disabled
}
```

### Collection: `users/{userId}/plans_weekly/{weekId}`

```typescript
interface WeeklyPlan {
  week_id: string;                // Format: "2025-W45"
  start_date: Timestamp;          // Monday of week
  end_date: Timestamp;            // Sunday of week
  
  phase: 'BASE' | 'BUILD' | 'PEAK' | 'TAPER';
  weekly_tss_target: number;
  weekly_tss_actual: number;      // Updated as workouts completed
  
  daily_plan_ids: string[];       // References to plans_daily
  
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Collection: `users/{userId}/plans_daily/{date}`

```typescript
interface DailyPlan {
  date: string;                   // Format: "2025-11-01"
  week_id: string;                // Reference: "2025-W45"
  
  // Planned Workout
  workout_id: string;             // Reference to workout library
  workout_name: string;
  workout_category: string;
  planned_tss: number;
  planned_duration_min: number;
  
  // Slot Assignment
  slot_id: string;
  slot_start_time?: string;
  
  // Readiness Adjustment (from daily update)
  readiness_score?: number;       // -1.0 to +1.0
  adjustment_applied: {
    ftp_scale: number;            // 0.95 to 1.01
    reps_delta: number;           // -1, 0, +1
    reason: string;               // "Low readiness: reduced intensity"
  } | null;
  
  // Completion Status
  completed: boolean;
  actual_activity_id?: string;    // Strava Activity ID
  actual_tss?: number;
  actual_duration_min?: number;
  
  // User Feedback
  rating?: 'TOO_HARD' | 'PERFECT' | 'TOO_EASY';
  rating_timestamp?: Timestamp;
  
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Collection: `users/{userId}/completions/{activityId}`

```typescript
interface Completion {
  activity_id: string;            // Strava Activity ID
  date: string;                   // "2025-11-01"
  
  // Activity Data (from Strava)
  name: string;
  type: string;                   // "Ride", "VirtualRide"
  duration_s: number;
  distance_m: number;
  elevation_gain_m: number;
  
  // Power Data
  average_watts?: number;
  weighted_power?: number;        // NP (Normalized Power)
  max_watts?: number;
  
  // Heart Rate Data
  average_heartrate?: number;
  max_heartrate?: number;
  
  // Calculated Metrics
  tss: number;                    // Training Stress Score
  intensity_factor?: number;      // IF = NP / FTP
  
  // Plan Matching
  matched_plan_id?: string;       // Reference to plans_daily
  was_planned: boolean;
  
  // User Rating
  rating?: 'TOO_HARD' | 'PERFECT' | 'TOO_EASY';
  
  synced_at: Timestamp;
}
```

### Collection: `users/{userId}/metrics_daily/{date}`

```typescript
interface DailyMetrics {
  date: string;                   // "2025-11-01"
  
  // Fitness Metrics (Updated after each workout)
  ctl: number;                    // Chronic Training Load (42-day EMA)
  atl: number;                    // Acute Training Load (7-day EMA)
  tsb: number;                    // Training Stress Balance (CTL - ATL)
  
  // Readiness Inputs (from Wearables or Manual)
  hrv?: number;                   // Raw HRV (ms)
  hrv_z?: number;                 // Z-score (rolling 21d)
  rhr?: number;                   // Resting Heart Rate (bpm)
  rhr_z?: number;                 // Z-score (rolling 21d, inverted)
  
  sleep_duration_min?: number;
  sleep_duration_z?: number;
  sleep_quality?: number;         // 1-10 (subjective)
  sleep_quality_z?: number;
  
  soreness?: number;              // 1-10 (subjective)
  soreness_z?: number;            // Standardized, inverted
  stress?: number;                // 1-10 (subjective)
  stress_z?: number;              // Standardized, inverted
  
  // Calculated Readiness
  readiness_score?: number;       // -1.0 to +1.0 (tanh of weighted sum)
  readiness_components?: {
    hrv_weight: number;
    rhr_weight: number;
    sleep_weight: number;
    soreness_weight: number;
    stress_weight: number;
  };
  
  // Flags
  injury_flag: boolean;
  illness_flag: boolean;
  
  updated_at: Timestamp;
}
```

---

## Cloud Functions (Detailliert)

### Function: `stravaOAuth`

**Trigger**: HTTPS (GET)  
**URL**: `https://us-central1-{project}.cloudfunctions.net/stravaOAuth`

**Purpose**: Handle Strava OAuth callback

**Flow**:
1. Receive `code` from Strava redirect
2. Exchange code for access_token + refresh_token
3. Store tokens in Secret Manager
4. Create/update user profile with Strava athlete data
5. Redirect to dashboard

**Code Snippet**:
```typescript
export const stravaOAuth = onRequest(async (req, res) => {
  const { code, state } = req.query;
  
  // Exchange code for tokens
  const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: await getSecret('strava-client-secret'),
      code,
      grant_type: 'authorization_code'
    })
  });
  
  const { access_token, refresh_token, athlete } = await tokenResponse.json();
  
  // Store tokens in Secret Manager (user-scoped)
  await setSecret(`strava-token-${athlete.id}`, access_token);
  await setSecret(`strava-refresh-${athlete.id}`, refresh_token);
  
  // Update Firestore
  await firestore.doc(`users/${state}`).update({
    strava_connected: true,
    strava_athlete_id: athlete.id
  });
  
  res.redirect('/dashboard?strava=connected');
});
```

---

### Function: `stravaWebhook`

**Trigger**: HTTPS (POST)  
**URL**: `https://us-central1-{project}.cloudfunctions.net/stravaWebhook`

**Purpose**: Receive activity updates from Strava

**Flow**:
1. Verify webhook signature
2. Handle subscription validation (if `hub.challenge`)
3. For activity events:
   - Fetch activity details from Strava API
   - Calculate TSS
   - Match to planned workout (by date + duration)
   - Store in `completions/{activityId}`
   - Update `metrics_daily/{date}`
   - Recalculate CTL/ATL/TSB

**Code Snippet**:
```typescript
export const stravaWebhook = onRequest(async (req, res) => {
  // Subscription validation
  if (req.query['hub.challenge']) {
    return res.json({ 'hub.challenge': req.query['hub.challenge'] });
  }
  
  // Activity event
  const { aspect_type, object_id, owner_id } = req.body;
  
  if (aspect_type === 'create' && object_type === 'activity') {
    // Fetch activity details
    const activity = await fetchStravaActivity(object_id, owner_id);
    
    // Calculate TSS
    const tss = calculateTSS(activity, user.ftp);
    
    // Store completion
    await firestore.doc(`users/${userId}/completions/${object_id}`).set({
      activity_id: object_id,
      date: formatDate(activity.start_date),
      tss,
      // ... other fields
    });
    
    // Update metrics
    await updateDailyMetrics(userId, formatDate(activity.start_date), tss);
  }
  
  res.status(200).send('OK');
});
```

---

### Function: `scheduledPlanUpdate`

**Trigger**: HTTPS (POST) - On-Demand (called from client)  
**URL**: `https://us-central1-{project}.cloudfunctions.net/scheduledPlanUpdate`

**Purpose**: Generate/update daily plan with readiness adjustment

**Flow**:
1. Check if plan already exists and is up-to-date
2. Fetch readiness metrics from `metrics_daily/{today}`
3. Fetch weekly plan from `plans_weekly/{currentWeek}`
4. Apply readiness adjustment (FTP scale, reps delta)
5. Check guardrails (no HIT if TSB < -25, injury flag, etc.)
6. Write updated plan to `plans_daily/{today}`

**Code Snippet**:
```typescript
export const scheduledPlanUpdate = onCall(async (data, context) => {
  const userId = context.auth?.uid;
  const date = data.date || formatDate(new Date());
  
  // Check if plan exists and up-to-date
  const existingPlan = await firestore.doc(`users/${userId}/plans_daily/${date}`).get();
  if (existingPlan.exists && existingPlan.data().updated_at > ...) {
    return { status: 'cached', plan: existingPlan.data() };
  }
  
  // Fetch readiness
  const metrics = await firestore.doc(`users/${userId}/metrics_daily/${date}`).get();
  const readinessScore = metrics.data()?.readiness_score || 0;
  
  // Fetch weekly plan
  const weekId = getWeekId(date);
  const weeklyPlan = await firestore.doc(`users/${userId}/plans_weekly/${weekId}`).get();
  const plannedWorkout = weeklyPlan.data().workouts.find(w => w.date === date);
  
  // Apply adjustment
  const adjustment = applyReadinessAdjustment(plannedWorkout, readinessScore);
  
  // Check guardrails
  if (metrics.data().injury_flag || metrics.data().tsb < -25) {
    if (plannedWorkout.category === 'VO2MAX' || plannedWorkout.category === 'FTP') {
      adjustment.workout = replaceWithLIT(plannedWorkout);
      adjustment.reason = "Injury flag or low TSB: replaced with LIT";
    }
  }
  
  // Write plan
  await firestore.doc(`users/${userId}/plans_daily/${date}`).set({
    ...plannedWorkout,
    adjustment_applied: adjustment,
    updated_at: FieldValue.serverTimestamp()
  });
  
  return { status: 'updated', plan: adjustment };
});
```

---

### Function: `updateWeights` (Weekly)

**Trigger**: Cloud Scheduler (jeden Sonntag 23:00 UTC)  
**Purpose**: Re-train readiness weights basierend auf User-Feedback

**Flow**:
1. Fetch alle `completions` mit `rating` der letzten Woche
2. Build Training-Dataset (features: HRV, RHR, Sleep, etc. → label: Rating)
3. Run Elastic Net Regression (via `update_weights.ts` logic)
4. Apply EMA Smoothing + Drift Cap (max 5% change)
5. Update `readiness_config.json` (versioniert)
6. Deploy updated config (CDN invalidation)

**Code Snippet**:
```typescript
export const updateWeights = onSchedule('0 23 * * 0', async () => {
  // Fetch all users with >= 20 rated completions
  const users = await getUsersWithRatings(20);
  
  for (const userId of users) {
    // Fetch completions with ratings
    const completions = await firestore
      .collection(`users/${userId}/completions`)
      .where('rating', '!=', null)
      .where('date', '>=', sevenDaysAgo)
      .get();
    
    // Build dataset
    const dataset = completions.docs.map(doc => ({
      features: doc.data().readiness_features,
      reward: ratingToReward(doc.data().rating) // 'TOO_HARD' → -1, 'PERFECT' → 0, 'TOO_EASY' → +1
    }));
    
    // Run Elastic Net (TypeScript implementation)
    const newWeights = elasticNet(dataset, alpha=0.1, l1_ratio=0.5);
    
    // Apply smoothing
    const smoothedWeights = smoothAndCap(
      oldWeights, 
      newWeights, 
      ema=0.8, 
      drift_cap=0.05
    );
    
    // Update config
    await updateReadinessConfig(userId, smoothedWeights);
  }
});
```

---

## Caching-Strategie

### Client-Side Caching (SWR)

```typescript
// Dashboard-Daten
const { data: dashboardData, error } = useSWR(
  `/api/dashboard?date=${today}`,
  fetcher,
  {
    refreshInterval: 300000,      // 5 Minuten
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 10000       // 10 Sekunden
  }
);

// Workout Library (Static, cached indefinitely)
const { data: workouts } = useSWR(
  '/workouts/index.json',
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0            // Never refresh (static)
  }
);
```

### Server-Side Caching (Cloud Functions)

```typescript
// In-Memory Cache für Workout Library (Cloud Function)
let cachedWorkouts: Workout[] | null = null;
let cacheTimestamp: number = 0;

async function getWorkoutLibrary(): Promise<Workout[]> {
  const now = Date.now();
  const CACHE_TTL = 3600000; // 1 hour
  
  if (cachedWorkouts && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedWorkouts;
  }
  
  // Load from CDN
  const response = await fetch('https://cyclona.app/workouts/index.json');
  cachedWorkouts = await response.json();
  cacheTimestamp = now;
  
  return cachedWorkouts;
}
```

### CDN Caching (Firebase Hosting)

```json
// firebase.json
{
  "hosting": {
    "headers": [
      {
        "source": "/workouts/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "/**/*.@(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=604800"
          }
        ]
      }
    ]
  }
}
```

---

## Security Architecture

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User-scoped data: only owner can read/write
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Workout Library: public read, no write
    match /workouts_library/{workoutId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### API Authentication

```typescript
// Cloud Function mit Auth-Check
export const protectedFunction = onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const userId = context.auth.uid;
  
  // Verify user owns data
  if (data.userId !== userId) {
    throw new HttpsError('permission-denied', 'Cannot access other user data');
  }
  
  // ... function logic
});
```

### Secrets Management

```typescript
// Access secrets from Secret Manager
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

async function getSecret(name: string): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/latest`
  });
  return version.payload.data.toString();
}
```

---

## Deployment-Architektur

### Environments

1. **Development** (Local)
   - Firebase Emulators (Auth, Firestore, Functions)
   - Next.js Dev Server (localhost:3000)
   - Mock Strava API (Postman/Insomnia)

2. **Staging** (Firebase Project: `cyclona-staging`)
   - Firebase Hosting (staging.cyclona.app)
   - Cloud Functions (staging)
   - Firestore (staging database)
   - Strava API (Test Account)

3. **Production** (Firebase Project: `cyclona-prod`)
   - Firebase Hosting (cyclona.app)
   - Cloud Functions (production)
   - Firestore (production database)
   - Strava API (Live)

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Tests
        run: npm test
      
      - name: Build Next.js
        run: npm run build
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: cyclona-prod
```

---

## Monitoring & Observability

### Logging

```typescript
// Structured logging in Cloud Functions
import { logger } from 'firebase-functions';

logger.info('Plan updated', {
  userId,
  date,
  readinessScore,
  adjustment: adjustment.ftp_scale
});

logger.error('Strava sync failed', {
  userId,
  activityId,
  error: error.message
});
```

### Metrics

**Firebase Console**:
- Function invocations/errors
- Firestore reads/writes
- Hosting bandwidth

**Custom Metrics** (Cloud Monitoring):
- Daily Active Users
- Workout Completion Rate
- Average Readiness Score
- ZWO Download Count

### Alerting

**Firebase Alerts**:
- Function error rate > 5%
- Firestore quota exceeded
- Hosting bandwidth > 10GB/day

**Email/Slack Notifications**:
- Critical errors in production
- User-reported bugs (Sentry integration)

---

## Skalierungs-Strategie

### Current Capacity (Free Tier)

- **Firestore**: 50k reads/day, 20k writes/day
- **Cloud Functions**: 2M invocations/month
- **Hosting**: 10GB bandwidth/month

**MVP Target**: 100 active users
- Estimated Firestore Reads: ~5k/day (within limit)
- Estimated Function Calls: ~10k/month (within limit)

### Scaling Plan (Phase 2)

**1,000 Users**:
- Upgrade to Blaze Plan (Pay-as-you-go)
- Expected Cost: ~$50/month

**10,000 Users**:
- Firestore Reads: ~500k/day → ~$3/day
- Function Calls: ~300k/month → Free
- Hosting Bandwidth: ~50GB/month → ~$5/month
- **Total**: ~$150/month

**Optimization Strategies**:
1. Aggressive client-side caching (reduce reads)
2. Batch function calls (reduce invocations)
3. CDN for static assets (reduce bandwidth)
4. Firestore indexes optimization

---

## Zusammenfassung

**Architektur-Typ**: Serverless, Cloud-Native, JAMstack  
**Haupt-Komponenten**:
- Frontend: Next.js (Static + Server Components)
- Backend: Firebase (Auth, Firestore, Functions)
- External: Strava API, Wearables APIs

**Key Design Decisions**:
- ✅ Client-side ZWO generation (fast, cheap)
- ✅ On-demand plan updates with caching (cost-efficient)
- ✅ User-scoped Firestore data (secure, GDPR-ready)
- ✅ Static workout library on CDN (global, fast)

**Estimated MVP Cost**: $0-20/month (Free Tier + minimal overages)  
**Estimated Scale Cost (10k users)**: ~$150/month  

🚀 **READY TO BUILD!**
