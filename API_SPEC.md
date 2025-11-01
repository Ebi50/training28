# Cyclona - API Specification

**Version**: 1.0  
**Datum**: 2025-11-01  
**Status**: ✅ READY FOR IMPLEMENTATION  

---

## Übersicht

Dieses Dokument spezifiziert:
1. **Cloud Functions** (Backend API)
2. **Firestore Schema** (Database Structure)
3. **Client API Helpers** (Frontend → Backend)
4. **External APIs** (Strava, Weather, Wearables)

---

## 1. Cloud Functions API

### Base URL

```
Production: https://us-central1-cyclona-prod.cloudfunctions.net
Staging:    https://us-central1-cyclona-staging.cloudfunctions.net
Local:      http://localhost:5001/cyclona-staging/us-central1
```

---

### 1.1 `stravaOAuth` (HTTPS Callable)

**Purpose**: Handle Strava OAuth callback

**Trigger**: HTTPS GET Request  
**URL**: `/stravaOAuth?code={code}&state={userId}`

**Request Query Parameters**:
```typescript
{
  code: string;      // OAuth authorization code from Strava
  state: string;     // User ID (for CSRF protection)
}
```

**Response**: HTTP Redirect to `/dashboard?strava=connected`

**Side Effects**:
- Exchanges code for access_token + refresh_token
- Stores tokens in Secret Manager (`strava-token-{athleteId}`, `strava-refresh-{athleteId}`)
- Updates Firestore `users/{userId}/profile`:
  ```typescript
  {
    strava_connected: true,
    strava_athlete_id: number
  }
  ```

**Error Handling**:
- Invalid code → Redirect to `/dashboard?strava=error`
- Expired code → Redirect to `/dashboard?strava=expired`

---

### 1.2 `stravaWebhook` (HTTPS Request)

**Purpose**: Receive activity updates from Strava

**Trigger**: HTTPS POST (from Strava Webhook Subscription)  
**URL**: `/stravaWebhook`

**Subscription Validation (GET)**:
```typescript
// Request Query Parameters
{
  "hub.mode": "subscribe",
  "hub.challenge": string,
  "hub.verify_token": string
}

// Response
{
  "hub.challenge": string  // Echo back
}
```

**Activity Event (POST)**:
```typescript
// Request Body
{
  object_type: "activity",
  object_id: number,        // Strava Activity ID
  aspect_type: "create" | "update" | "delete",
  owner_id: number,         // Strava Athlete ID
  subscription_id: number,
  event_time: number        // Unix timestamp
}

// Response
Status: 200 OK
Body: "EVENT_RECEIVED"
```

**Processing Flow**:
1. Verify webhook signature (optional but recommended)
2. Find user by `strava_athlete_id`
3. Fetch activity details from Strava API:
   ```typescript
   GET https://www.strava.com/api/v3/activities/{id}
   Headers: { Authorization: "Bearer {access_token}" }
   ```
4. Calculate TSS (power-based, HR-based, or RPE fallback)
5. Store completion:
   ```typescript
   firestore.doc(`users/{userId}/completions/{activityId}`).set({...})
   ```
6. Update daily metrics (CTL, ATL, TSB)
7. Match to planned workout (by date + duration ±10%)

**Error Handling**:
- Invalid signature → 401 Unauthorized
- User not found → 404 (log + ignore)
- Strava API error → Retry with exponential backoff (max 3 retries)

---

### 1.3 `scheduledPlanUpdate` (HTTPS Callable)

**Purpose**: Generate/update daily plan with TSB adjustment

**Trigger**: Client calls (on-demand)  
**URL**: `/scheduledPlanUpdate`

**Request**:
```typescript
{
  date?: string;  // Optional: "2025-11-01" (default: today)
}
```

**Response**:
```typescript
{
  status: "cached" | "updated" | "generated";
  plan: DailyPlan;
  adjustment?: {
    tsb: number;
    ftp_scale: number;
    reason: string;
  };
}
```

**Processing Flow**:
1. Check if plan exists AND is fresh (< 1h old):
   ```typescript
   const existingPlan = await firestore
     .doc(`users/{userId}/plans_daily/{date}`)
     .get();
   
   if (existingPlan.exists && isFresh(existingPlan.data().updated_at)) {
     return { status: "cached", plan: existingPlan.data() };
   }
   ```

2. Fetch TSB from `metrics_daily/{date}`
3. Fetch weekly plan from `plans_weekly/{weekId}`
4. Find today's workout from weekly plan
5. Apply TSB adjustment:
   ```typescript
   if (tsb < -25) {
     adjustedWorkout = reduceIntensity(workout, 0.95);
     reason = "Low TSB: reduced intensity to prevent overtraining";
   } else if (tsb > 15) {
     adjustedWorkout = increaseIntensity(workout, 1.02);
     reason = "High TSB: increased intensity for progression";
   }
   ```
6. Check guardrails:
   - No HIT if injury_flag or TSB < -25
   - Cap daily TSS ≤ 1.6 × ATL
7. Write updated plan to Firestore
8. Return adjusted plan

**Error Handling**:
- User not authenticated → 401 Unauthenticated
- User not found → 404 Not Found
- No weekly plan → Generate new weekly plan (fallback)
- Firestore error → 500 Internal Server Error

**Cache Strategy**:
- Plan cached for 1 hour
- Invalidated if TSB changes > 5 points
- Invalidated if user updates weekly goal

---

### 1.4 `generateWeeklyPlan` (HTTPS Callable)

**Purpose**: Generate new weekly plan (macro-level)

**Trigger**: Client calls (manual or scheduled)  
**URL**: `/generateWeeklyPlan`

**Request**:
```typescript
{
  weekId: string;              // "2025-W45"
  weeklyTSS?: number;          // Optional override (default: from profile)
  forceRegenerate?: boolean;   // Force regeneration even if exists
}
```

**Response**:
```typescript
{
  weeklyPlan: WeeklyPlan;
  dailyPlans: DailyPlan[];
  summary: {
    totalTSS: number;
    slotUtilization: number;  // Percentage of available slots used
    categoryMix: {
      LIT: number;            // Percentage
      TEMPO: number;
      FTP: number;
      VO2MAX: number;
      SKILL: number;
    };
  };
}
```

**Processing Flow**:
1. Fetch user profile (FTP, event, phase)
2. Calculate current phase (BASE/BUILD/PEAK/TAPER)
3. Fetch time slots
4. Load workout library (cached)
5. Determine category distribution (based on phase)
6. Allocate TSS to slots:
   ```typescript
   const distribution = {
     BASE: { LIT: 0.80, TEMPO: 0.10, FTP: 0.05, SKILL: 0.05 },
     BUILD: { LIT: 0.50, TEMPO: 0.20, FTP: 0.20, VO2MAX: 0.05, SKILL: 0.05 },
     PEAK: { LIT: 0.30, TEMPO: 0.20, FTP: 0.25, VO2MAX: 0.15, ANAEROBIC: 0.05, SKILL: 0.05 },
     TAPER: { LIT: 0.60, TEMPO: 0.20, FTP: 0.10, VO2MAX: 0.05, SKILL: 0.05 }
   };
   ```
7. For each slot, select matching workout:
   - Filter by category
   - Filter by duration ≤ slot.duration_max
   - Prefer variety (not same workout as last week)
   - Match closest TSS
8. Scale workouts if needed (proportional)
9. Write weekly plan + 7 daily plans to Firestore
10. Return summary

**Error Handling**:
- No slots defined → 400 Bad Request: "Please define time slots first"
- No workouts match slots → 400 Bad Request: "No workouts fit your time constraints"
- Firestore error → 500 Internal Server Error

---

### 1.5 `updateWeights` (Cloud Scheduler)

**Purpose**: Re-train readiness weights based on user feedback

**Trigger**: Cloud Scheduler (every Sunday 23:00 UTC)  
**URL**: (Internal, not exposed)

**Processing Flow**:
1. Query all users with >= 20 rated completions in last 4 weeks
2. For each user:
   ```typescript
   const completions = await firestore
     .collection(`users/${userId}/completions`)
     .where('rating', '!=', null)
     .where('date', '>=', fourWeeksAgo)
     .get();
   ```
3. Build training dataset:
   ```typescript
   const dataset = completions.map(doc => ({
     features: {
       hrv_z: doc.data().readiness_features.hrv_z,
       rhr_z: doc.data().readiness_features.rhr_z,
       sleepdur_z: doc.data().readiness_features.sleepdur_z,
       sleepq_z: doc.data().readiness_features.sleepq_z,
       soreness_z: doc.data().readiness_features.soreness_z,
       stress_z: doc.data().readiness_features.stress_z
     },
     reward: ratingToReward(doc.data().rating)
     // "TOO_HARD" → -1, "PERFECT" → 0, "TOO_EASY" → +1
   }));
   ```
4. Run Elastic Net regression (coordinate descent)
5. Convert coefficients to weights (normalize to sum=1)
6. Apply EMA smoothing (80% old, 20% new)
7. Apply drift cap (max 5% change per week)
8. Update user's readiness config:
   ```typescript
   await firestore.doc(`users/${userId}/readiness_config`).update({
     weights: updatedWeights,
     version: incrementVersion(),
     updated_at: FieldValue.serverTimestamp()
   });
   ```
9. Log results (Cloud Logging)

**Error Handling**:
- Not enough samples (< 20) → Skip user, log info
- Regression fails → Use previous weights, log error
- Firestore error → Retry, send alert

---

## 2. Firestore Schema

### Collection Structure

```
/users/{userId}/
  ├── profile (Document)
  ├── availability/{slotId} (Collection)
  ├── plans_weekly/{weekId} (Collection)
  ├── plans_daily/{date} (Collection)
  ├── completions/{activityId} (Collection)
  ├── metrics_daily/{date} (Collection)
  └── readiness_config (Document)
```

---

### 2.1 `users/{userId}/profile`

**Type**: Document

**Schema**:
```typescript
interface UserProfile {
  // Identity
  uid: string;
  email: string;
  created_at: Timestamp;
  
  // Training Data
  ftp: number;                    // Watts
  weight_kg: number;
  max_hr: number;                 // bpm
  
  // Goals
  weekly_duration_max: number;    // Minutes (current week)
  weekly_durations: {             // Historical + future
    [weekId: string]: number;     // e.g. "2025-W45": 600
  };
  current_phase: 'BASE' | 'BUILD' | 'PEAK' | 'TAPER';
  
  // Events
  events: {
    id: string;
    name: string;
    date: Timestamp;
    type: 'RACE' | 'GRAN_FONDO' | 'CENTURY' | 'CUSTOM';
    priority: 1 | 2 | 3;           // 1=A-Goal, 2=B-Goal, 3=C-Goal
    target_ctl?: number;           // Optional target fitness
  }[];
  
  // Integrations
  strava_connected: boolean;
  strava_athlete_id?: number;
  garmin_connected?: boolean;     // Phase 2
  whoop_connected?: boolean;      // Phase 2
  
  // Settings
  units: 'METRIC' | 'IMPERIAL';
  timezone: string;
  language: 'en' | 'de';
  
  // Metadata
  updated_at: Timestamp;
}
```

**Indexes**:
```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "profile",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "strava_athlete_id", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

### 2.2 `users/{userId}/availability/{slotId}`

**Type**: Collection

**Schema**:
```typescript
interface TimeSlot {
  id: string;                     // Auto-generated
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0=Sunday, 6=Saturday
  start_time?: string;            // Optional: "18:00" (24h format)
  duration_max: number;           // Minutes (required)
  priority: 1 | 2 | 3;            // 1=Must use, 2=Prefer, 3=Optional
  active: boolean;                // Can be temporarily disabled
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Example Document**:
```json
{
  "id": "slot_mon_evening",
  "day_of_week": 1,
  "start_time": "18:00",
  "duration_max": 60,
  "priority": 1,
  "active": true,
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-01T10:00:00Z"
}
```

---

### 2.3 `users/{userId}/plans_weekly/{weekId}`

**Type**: Collection

**Schema**:
```typescript
interface WeeklyPlan {
  week_id: string;                // "2025-W45"
  start_date: Timestamp;          // Monday of week
  end_date: Timestamp;            // Sunday of week
  
  phase: 'BASE' | 'BUILD' | 'PEAK' | 'TAPER';
  weekly_tss_target: number;
  weekly_tss_actual: number;      // Updated as workouts completed
  
  daily_plan_ids: string[];       // ["2025-11-04", "2025-11-06", ...]
  
  category_distribution: {
    LIT: number;                  // Percentage (0.0-1.0)
    TEMPO: number;
    FTP: number;
    VO2MAX: number;
    ANAEROBIC: number;
    NEUROMUSCULAR: number;
    SKILL: number;
  };
  
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Example Document**:
```json
{
  "week_id": "2025-W45",
  "start_date": "2025-11-04T00:00:00Z",
  "end_date": "2025-11-10T23:59:59Z",
  "phase": "BUILD",
  "weekly_tss_target": 420,
  "weekly_tss_actual": 385,
  "daily_plan_ids": ["2025-11-04", "2025-11-06", "2025-11-08", "2025-11-09"],
  "category_distribution": {
    "LIT": 0.50,
    "TEMPO": 0.20,
    "FTP": 0.20,
    "VO2MAX": 0.05,
    "SKILL": 0.05
  },
  "created_at": "2025-11-03T20:00:00Z",
  "updated_at": "2025-11-03T20:00:00Z"
}
```

---

### 2.4 `users/{userId}/plans_daily/{date}`

**Type**: Collection

**Schema**:
```typescript
interface DailyPlan {
  date: string;                   // "2025-11-01"
  week_id: string;                // "2025-W45"
  
  // Planned Workout
  workout_id: string;             // e.g. "tempo_06_3x20_tempo_85"
  workout_name: string;
  workout_category: 'LIT' | 'TEMPO' | 'FTP' | 'VO2MAX' | 'ANAEROBIC' | 'NEUROMUSCULAR' | 'SKILL';
  workout_structure: WorkoutSegment[];
  planned_tss: number;
  planned_duration_min: number;
  
  // Slot Assignment
  slot_id: string;
  slot_start_time?: string;
  
  // TSB Adjustment (from daily update)
  tsb?: number;
  adjustment_applied: {
    ftp_scale: number;            // 0.95 to 1.02
    reps_delta: number;           // -1, 0, +1
    on_pct: number;               // -0.10 to +0.05
    off_pct: number;              // -0.05 to +0.10
    reason: string;               // "Low TSB: reduced intensity"
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

interface WorkoutSegment {
  type: 'warmup' | 'steady' | 'interval' | 'cooldown';
  duration_s?: number;            // For warmup/steady/cooldown
  reps?: number;                  // For intervals
  on_duration_s?: number;         // For intervals
  off_duration_s?: number;        // For intervals
  on_intensity_ftp: number;       // 0.60 to 1.80
  off_intensity_ftp?: number;     // For intervals
  cadence?: number;               // Optional (rpm)
}
```

**Example Document**:
```json
{
  "date": "2025-11-04",
  "week_id": "2025-W45",
  "workout_id": "tempo_06_3x20_tempo_85",
  "workout_name": "3x20min Tempo @85%",
  "workout_category": "TEMPO",
  "workout_structure": [
    { "type": "warmup", "duration_s": 600, "on_intensity_ftp": 0.60 },
    { "type": "interval", "reps": 3, "on_duration_s": 1200, "on_intensity_ftp": 0.85, "off_duration_s": 300, "off_intensity_ftp": 0.55 },
    { "type": "cooldown", "duration_s": 600, "on_intensity_ftp": 0.50 }
  ],
  "planned_tss": 95,
  "planned_duration_min": 85,
  "slot_id": "slot_mon_evening",
  "slot_start_time": "18:00",
  "tsb": -12,
  "adjustment_applied": null,
  "completed": false,
  "created_at": "2025-11-03T20:00:00Z",
  "updated_at": "2025-11-04T06:00:00Z"
}
```

**Indexes**:
```javascript
{
  "indexes": [
    {
      "collectionGroup": "plans_daily",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" },
        { "fieldPath": "completed", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

### 2.5 `users/{userId}/completions/{activityId}`

**Type**: Collection

**Schema**:
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
  matched_plan_id?: string;       // Reference to plans_daily/{date}
  was_planned: boolean;
  
  // Readiness Context (for ML training)
  readiness_features?: {
    hrv_z: number;
    rhr_z: number;
    sleepdur_z: number;
    sleepq_z: number;
    soreness_z: number;
    stress_z: number;
  };
  
  // User Rating
  rating?: 'TOO_HARD' | 'PERFECT' | 'TOO_EASY';
  rating_timestamp?: Timestamp;
  
  synced_at: Timestamp;
}
```

**Example Document**:
```json
{
  "activity_id": "12345678901",
  "date": "2025-11-04",
  "name": "Evening Tempo Ride",
  "type": "VirtualRide",
  "duration_s": 5100,
  "distance_m": 38500,
  "elevation_gain_m": 150,
  "average_watts": 215,
  "weighted_power": 225,
  "max_watts": 380,
  "average_heartrate": 152,
  "max_heartrate": 172,
  "tss": 92,
  "intensity_factor": 0.85,
  "matched_plan_id": "2025-11-04",
  "was_planned": true,
  "rating": "PERFECT",
  "rating_timestamp": "2025-11-04T20:30:00Z",
  "synced_at": "2025-11-04T20:15:00Z"
}
```

---

### 2.6 `users/{userId}/metrics_daily/{date}`

**Type**: Collection

**Schema**:
```typescript
interface DailyMetrics {
  date: string;                   // "2025-11-01"
  
  // Fitness Metrics (Updated after each workout)
  ctl: number;                    // Chronic Training Load (42-day EMA)
  atl: number;                    // Acute Training Load (7-day EMA)
  tsb: number;                    // Training Stress Balance (CTL - ATL)
  
  // Daily Training
  planned_tss: number;
  actual_tss: number;
  
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
  
  // Flags
  injury_flag: boolean;
  illness_flag: boolean;
  
  updated_at: Timestamp;
}
```

**Example Document**:
```json
{
  "date": "2025-11-04",
  "ctl": 82.5,
  "atl": 94.8,
  "tsb": -12.3,
  "planned_tss": 95,
  "actual_tss": 92,
  "hrv": 62,
  "hrv_z": -0.45,
  "rhr": 48,
  "rhr_z": -0.30,
  "sleep_duration_min": 420,
  "sleep_duration_z": 0.15,
  "sleep_quality": 7,
  "sleep_quality_z": 0.20,
  "soreness": 4,
  "soreness_z": -0.10,
  "stress": 5,
  "stress_z": 0.0,
  "readiness_score": -0.15,
  "injury_flag": false,
  "illness_flag": false,
  "updated_at": "2025-11-04T20:15:00Z"
}
```

**Indexes**:
```javascript
{
  "indexes": [
    {
      "collectionGroup": "metrics_daily",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

### 2.7 `users/{userId}/readiness_config`

**Type**: Document (Phase 2)

**Schema**:
```typescript
interface ReadinessConfig {
  version: string;                // "1.05"
  updated_at: Timestamp;
  
  weights: {
    hrv: number;                  // 0.0-1.0
    rhr: number;
    sleepdur: number;
    sleepq: number;
    soreness: number;
    stress: number;
  };
  
  normalization: {
    hrv: string;                  // "zscore(rolling=21d)"
    rhr: string;                  // "-zscore(rolling=21d)"
    sleepdur: string;             // "zscore(rolling=21d)"
    sleepq: string;               // "std(0..10)"
    soreness: string;             // "std(0..10) inverted"
    stress: string;               // "std(0..10) inverted"
  };
  
  prescription_mapping: {
    range: [number, number];      // e.g. [-1.0, -0.75]
    ftp_scale: number;            // 0.95
    reps_delta: number;           // -1
    on_pct: number;               // -0.10
    off_pct: number;              // +0.10
  }[];
}
```

---

## 3. Client API Helpers

### 3.1 Firestore CRUD Operations

**File**: `src/lib/firestore.ts`

```typescript
// User Profile
export async function getUserProfile(userId: string): Promise<UserProfile>;
export async function createUserProfile(userId: string, data: Partial<UserProfile>): Promise<void>;
export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void>;

// Time Slots
export async function getTimeSlots(userId: string): Promise<TimeSlot[]>;
export async function createTimeSlot(userId: string, slot: Omit<TimeSlot, 'id'>): Promise<string>;
export async function updateTimeSlot(userId: string, slotId: string, data: Partial<TimeSlot>): Promise<void>;
export async function deleteTimeSlot(userId: string, slotId: string): Promise<void>;

// Plans
export async function getWeeklyPlan(userId: string, weekId: string): Promise<WeeklyPlan | null>;
export async function getDailyPlan(userId: string, date: string): Promise<DailyPlan | null>;
export async function getDailyPlans(userId: string, startDate: string, endDate: string): Promise<DailyPlan[]>;

// Completions
export async function getCompletion(userId: string, activityId: string): Promise<Completion | null>;
export async function getCompletions(userId: string, startDate: string, endDate: string): Promise<Completion[]>;

// Metrics
export async function getDailyMetrics(userId: string, date: string): Promise<DailyMetrics | null>;
export async function getDailyMetricsRange(userId: string, startDate: string, endDate: string): Promise<DailyMetrics[]>;
```

---

### 3.2 Cloud Function Callers

**File**: `src/lib/cloudFunctions.ts`

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Plan Updates
export const scheduledPlanUpdate = httpsCallable<
  { date?: string },
  { status: string; plan: DailyPlan; adjustment?: any }
>(functions, 'scheduledPlanUpdate');

export const generateWeeklyPlan = httpsCallable<
  { weekId: string; weeklyTSS?: number; forceRegenerate?: boolean },
  { weeklyPlan: WeeklyPlan; dailyPlans: DailyPlan[]; summary: any }
>(functions, 'generateWeeklyPlan');

// Usage Example
const result = await scheduledPlanUpdate({ date: '2025-11-04' });
console.log(result.data.plan);
```

---

## 4. External APIs

### 4.1 Strava API

**Base URL**: `https://www.strava.com/api/v3`

**Authentication**: OAuth 2.0 (Bearer Token)

**Key Endpoints**:

#### Get Activity
```
GET /activities/{id}
Headers: { Authorization: "Bearer {access_token}" }

Response:
{
  id: number,
  name: string,
  type: "Ride" | "VirtualRide" | ...,
  start_date: string,
  moving_time: number,
  elapsed_time: number,
  distance: number,
  total_elevation_gain: number,
  average_watts: number,
  weighted_average_watts: number,
  max_watts: number,
  average_heartrate: number,
  max_heartrate: number,
  // ... more fields
}
```

#### List Activities
```
GET /athlete/activities?before={timestamp}&after={timestamp}&per_page=30

Response: Activity[]
```

**Rate Limits**:
- 100 requests per 15 minutes
- 1,000 requests per day

---

### 4.2 OpenWeatherMap API (Phase 2)

**Base URL**: `https://api.openweathermap.org/data/2.5`

**Authentication**: API Key (Query Parameter)

**Key Endpoints**:

#### 5-Day Forecast
```
GET /forecast?lat={lat}&lon={lon}&appid={apiKey}&units=metric

Response:
{
  list: [
    {
      dt: number,
      main: { temp: number, ... },
      weather: [{ main: "Rain", description: "light rain", ... }],
      wind: { speed: number, ... },
      pop: number  // Probability of precipitation (0-1)
    },
    ...
  ]
}
```

---

### 4.3 Garmin Connect API (Phase 2)

**Note**: Unofficial API (no public documentation)

**Alternative**: Garmin Health API (requires Enterprise Account)

**Key Data**:
- HRV (ms)
- Resting HR (bpm)
- Sleep Duration + Stages
- Stress Score

---

## 5. Data Flows (Summary)

### 5.1 Initial Setup
```
User → Setup Form → POST createUserProfile() → Firestore
User → Add Slots → POST createTimeSlot() × N → Firestore
User → Submit → CALL generateWeeklyPlan() → Cloud Function
                 → Load Workout Library
                 → Generate Plans
                 → Write plans_weekly + plans_daily → Firestore
User → Redirect to Dashboard
```

### 5.2 Daily Dashboard Load
```
User → Open Dashboard → useDashboard Hook
                       → Fetch plans_daily/{today}
                       → IF cached → Display
                       → ELSE → CALL scheduledPlanUpdate()
                                → Fetch TSB
                                → Apply Adjustment
                                → Write updated plan
                                → Return to client
User → View Today's Workout
```

### 5.3 Workout Completion (Strava Sync)
```
User → Complete Workout in Zwift
Zwift → Sync to Strava
Strava → POST /stravaWebhook → Cloud Function
         → Fetch Activity Details (Strava API)
         → Calculate TSS
         → Write completions/{activityId}
         → Update metrics_daily/{date} (CTL, ATL, TSB)
         → Trigger: Firestore Change Listener
Dashboard → Refresh (useSWR revalidate)
          → Display updated metrics
```

---

## 6. Security

### 6.1 Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User-scoped data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Workout Library (if stored in Firestore - optional)
    match /workouts_library/{workoutId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 6.2 Cloud Function Authentication

```typescript
import { HttpsError } from 'firebase-functions/v2/https';

export const protectedFunction = onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const userId = context.auth.uid;
  
  // Verify user owns data
  if (data.userId && data.userId !== userId) {
    throw new HttpsError('permission-denied', 'Cannot access other user data');
  }
  
  // ... function logic
});
```

---

## 7. Testing

### 7.1 Cloud Functions Testing

```typescript
// tests/cloudFunctions.test.ts
import { describe, it, expect } from 'vitest';
import { generateWeeklyPlan } from '../functions/src/generateWeeklyPlan';

describe('generateWeeklyPlan', () => {
  it('should generate plan for BASE phase', async () => {
    const result = await generateWeeklyPlan({
      userId: 'test-user',
      weekId: '2025-W45',
      weeklyTSS: 420
    });
    
    expect(result.weeklyPlan.phase).toBe('BASE');
    expect(result.summary.categoryMix.LIT).toBeGreaterThan(0.7); // 70%+
  });
});
```

### 7.2 Firestore Testing (Emulator)

```typescript
// tests/firestore.test.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Rules', () => {
  it('should allow user to read own profile', async () => {
    const testEnv = await initializeTestEnvironment({
      projectId: 'test-project'
    });
    
    const userDb = testEnv.authenticatedContext('user123').firestore();
    await userDb.doc('users/user123/profile').get();
    // Should succeed
  });
  
  it('should deny user from reading other profile', async () => {
    const testEnv = await initializeTestEnvironment({
      projectId: 'test-project'
    });
    
    const userDb = testEnv.authenticatedContext('user123').firestore();
    await expect(
      userDb.doc('users/user456/profile').get()
    ).rejects.toThrow(); // Should fail
  });
});
```

---

## 8. Monitoring & Logging

### 8.1 Structured Logging

```typescript
import { logger } from 'firebase-functions';

// Info
logger.info('Plan generated', {
  userId,
  weekId,
  totalTSS: result.summary.totalTSS
});

// Error
logger.error('Strava sync failed', {
  userId,
  activityId,
  error: error.message,
  stack: error.stack
});
```

### 8.2 Custom Metrics (Cloud Monitoring)

```typescript
import { Monitoring } from '@google-cloud/monitoring';

const monitoring = new Monitoring();

async function recordMetric(name: string, value: number) {
  const timeSeries = {
    metric: { type: `custom.googleapis.com/${name}` },
    points: [{ interval: { endTime: { seconds: Date.now() / 1000 } }, value: { doubleValue: value } }]
  };
  await monitoring.createTimeSeries({ name: projectPath, timeSeries: [timeSeries] });
}

// Usage
await recordMetric('workout_completion_rate', 0.85);
```

---

## Zusammenfassung

**API Surface**:
- 5 Cloud Functions (OAuth, Webhook, Plan Updates, Weight Training)
- 7 Firestore Collections (Profile, Slots, Plans, Completions, Metrics, Config)
- 12+ Client Helper Functions (CRUD Operations)
- 3 External APIs (Strava, Weather, Wearables)

**Security**: User-scoped Firestore rules + Authenticated Cloud Functions  
**Performance**: Client-side caching (SWR) + CDN for static assets  
**Scalability**: Serverless architecture, auto-scaling  

🚀 **READY TO IMPLEMENT!**
