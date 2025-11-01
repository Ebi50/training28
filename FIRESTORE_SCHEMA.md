# Firestore Schema Documentation

**Version**: 1.0  
**Datum**: 2025-11-01  
**Status**: ✅ IMPLEMENTATION READY  

---

## Collection Structure Overview

```
/users/{userId}/
  ├── profile (Document)                    # User profile and settings
  ├── availability/{slotId} (Collection)    # Time slot availability
  ├── season_goals/{goalId} (Collection)    # Season goals/events
  ├── camps/{campId} (Collection)           # Training camps
  ├── plans_weekly/{weekId} (Collection)    # Weekly training plans
  ├── plans_daily/{date} (Collection)       # Daily training plans
  ├── completions/{activityId} (Collection) # Completed workouts
  ├── metrics_daily/{date} (Collection)     # Daily fitness metrics
  └── readiness_config (Document)           # Readiness calculation weights [Phase 2]
```

---

## 1. User Profile

**Path**: `/users/{userId}/profile`  
**Type**: Document

### Schema

```typescript
interface UserProfile {
  // Identity
  uid: string;
  email: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  
  // Personal Data
  birthDate?: string;                // YYYY-MM-DD
  weight_kg?: number;
  
  // Physiological Data
  ftp: number;                       // Watts (required for training)
  lthr?: number;                     // Lactate Threshold Heart Rate (bpm)
  max_hr?: number;                   // Maximum Heart Rate (bpm)
  rest_hr?: number;                  // Resting Heart Rate (bpm)
  
  // Training Configuration
  weekly_duration_max: number;       // Minutes (current week)
  weekly_durations?: {               // Historical + future overrides
    [weekId: string]: number;        // e.g. "2025-W45": 600
  };
  current_phase: 'BASE' | 'BUILD' | 'PEAK' | 'TAPER' | 'TRANSITION';
  lit_ratio: number;                 // 0.0-1.0 (e.g., 0.8 = 80% LIT)
  max_hit_days: number;              // Max HIT sessions per week
  
  // Preferences
  indoor_allowed: boolean;
  available_devices: string[];       // ["trainer", "power_meter", "hr_monitor"]
  timezone: string;                  // "Europe/Berlin"
  language: 'en' | 'de';
  units: 'METRIC' | 'IMPERIAL';
  auto_logout_minutes?: number;      // 0 = never, 5, 10, etc.
  
  // Integrations
  strava_connected: boolean;
  strava_athlete_id?: number;
  garmin_connected?: boolean;        // Phase 2
  whoop_connected?: boolean;         // Phase 2
  oura_connected?: boolean;          // Phase 2
}
```

### Example

```json
{
  "uid": "abc123",
  "email": "user@example.com",
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-01T10:00:00Z",
  "birthDate": "1990-05-15",
  "weight_kg": 75,
  "ftp": 260,
  "lthr": 165,
  "max_hr": 190,
  "rest_hr": 48,
  "weekly_duration_max": 600,
  "current_phase": "BUILD",
  "lit_ratio": 0.7,
  "max_hit_days": 3,
  "indoor_allowed": true,
  "available_devices": ["trainer", "power_meter", "hr_monitor"],
  "timezone": "Europe/Berlin",
  "language": "de",
  "units": "METRIC",
  "strava_connected": true,
  "strava_athlete_id": 12345678
}
```

---

## 2. Time Slots (Availability)

**Path**: `/users/{userId}/availability/{slotId}`  
**Type**: Collection

### Schema

```typescript
interface TimeSlot {
  id: string;                        // Auto-generated or custom
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0=Sunday, 6=Saturday
  start_time?: string;               // "18:00" (24h format) - optional
  duration_max: number;              // Minutes (required)
  priority: 1 | 2 | 3;               // 1=Must use, 2=Prefer, 3=Optional
  type: 'indoor' | 'outdoor' | 'both';
  active: boolean;                   // Can be temporarily disabled
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Example

```json
{
  "id": "slot_mon_evening",
  "day_of_week": 1,
  "start_time": "18:00",
  "duration_max": 90,
  "priority": 1,
  "type": "indoor",
  "active": true,
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-01T10:00:00Z"
}
```

---

## 3. Season Goals

**Path**: `/users/{userId}/season_goals/{goalId}`  
**Type**: Collection

### Schema

```typescript
interface SeasonGoal {
  id: string;
  title: string;                     // "Gran Fondo Dolomites"
  date: Timestamp;                   // Event date
  priority: 'A' | 'B' | 'C';         // A=main goal, B=important, C=training race
  discipline: 'road' | 'mtb' | 'cyclocross' | 'triathlon' | 'other';
  
  // Taper Configuration
  taper_days_before: number;         // Start taper X days before event
  taper_volume_reduction: number;    // Percentage (e.g., 40 = 40% reduction)
  taper_intensity_maintained: boolean;
  
  // Target Metrics (optional)
  target_power?: number;             // watts
  target_duration?: number;          // minutes
  target_distance?: number;          // km
  target_ctl?: number;               // Target fitness for event
  
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

## 4. Training Camps

**Path**: `/users/{userId}/camps/{campId}`  
**Type**: Collection

### Schema

```typescript
interface TrainingCamp {
  id: string;
  title: string;                     // "Mallorca Camp"
  start_date: Timestamp;
  end_date: Timestamp;
  
  // Volume Configuration
  volume_bump: number;               // Percentage increase (e.g., 30 = +30%)
  hit_cap: number;                   // Max HIT sessions per week during camp
  
  // Environment (optional)
  altitude?: number;                 // meters
  temperature?: 'hot' | 'moderate' | 'cold';
  terrain?: 'flat' | 'hilly' | 'mountainous';
  
  // Deload Configuration
  deload_enabled: boolean;
  deload_volume_reduction: number;   // Percentage
  deload_duration_weeks: number;     // Weeks of deload after camp
  
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

## 5. Weekly Plans

**Path**: `/users/{userId}/plans_weekly/{weekId}`  
**Type**: Collection

### Schema

```typescript
interface WeeklyPlan {
  week_id: string;                   // "2025-W45"
  start_date: Timestamp;             // Monday of week
  end_date: Timestamp;               // Sunday of week
  
  // Phase and Targets
  phase: 'BASE' | 'BUILD' | 'PEAK' | 'TAPER' | 'TRANSITION';
  weekly_tss_target: number;
  weekly_tss_actual: number;         // Updated as workouts completed
  
  // Session Planning
  daily_plan_ids: string[];          // ["2025-11-04", "2025-11-06", ...]
  lit_sessions: number;
  hit_sessions: number;
  
  // Category Distribution
  category_distribution: {
    LIT: number;                     // Percentage (0.0-1.0)
    TEMPO: number;
    FTP: number;
    VO2MAX: number;
    ANAEROBIC: number;
    NEUROMUSCULAR: number;
    SKILL: number;
  };
  
  // Quality Assessment
  quality_score?: number;            // 0-1
  warnings?: string[];               // ["Insufficient time for all workouts"]
  
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

## 6. Daily Plans

**Path**: `/users/{userId}/plans_daily/{date}`  
**Type**: Collection

### Schema

```typescript
interface DailyPlan {
  date: string;                      // "2025-11-01"
  week_id: string;                   // "2025-W45"
  
  // Planned Workout
  workout_id: string;                // e.g., "tempo_06_3x20_tempo_85"
  workout_name: string;
  workout_category: 'LIT' | 'TEMPO' | 'FTP' | 'VO2MAX' | 'ANAEROBIC' | 'NEUROMUSCULAR' | 'SKILL';
  workout_structure: WorkoutSegment[];
  planned_tss: number;
  planned_duration_min: number;
  
  // Slot Assignment
  slot_id?: string;
  slot_start_time?: string;          // "18:00"
  
  // TSB Adjustment (from daily update)
  tsb?: number;
  adjustment_applied?: {
    ftp_scale: number;               // 0.95 to 1.02
    reps_delta: number;              // -1, 0, +1
    on_pct: number;                  // -0.10 to +0.05
    off_pct: number;                 // -0.05 to +0.10
    reason: string;
  };
  
  // Completion Status
  completed: boolean;
  actual_activity_id?: string;       // Strava Activity ID
  actual_tss?: number;
  actual_duration_min?: number;
  
  // User Feedback
  rating?: 'TOO_HARD' | 'PERFECT' | 'TOO_EASY';
  rating_timestamp?: Timestamp;
  notes?: string;
  
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

## 7. Completions (Strava Activities)

**Path**: `/users/{userId}/completions/{activityId}`  
**Type**: Collection

### Schema

```typescript
interface Completion {
  activity_id: string;               // Strava Activity ID
  date: string;                      // "2025-11-01"
  
  // Activity Data
  name: string;
  type: string;                      // "Ride", "VirtualRide", "Run"
  duration_s: number;
  distance_m?: number;
  elevation_gain_m?: number;
  
  // Power Data
  average_watts?: number;
  weighted_power?: number;           // Normalized Power
  max_watts?: number;
  
  // Heart Rate Data
  average_heartrate?: number;
  max_heartrate?: number;
  
  // Calculated Metrics
  tss: number;
  intensity_factor?: number;         // IF = NP / FTP
  
  // Plan Matching
  matched_plan_id?: string;          // Reference to plans_daily/{date}
  was_planned: boolean;
  
  // User Rating
  rating?: 'TOO_HARD' | 'PERFECT' | 'TOO_EASY';
  rating_timestamp?: Timestamp;
  
  synced_at: Timestamp;
}
```

---

## 8. Daily Metrics

**Path**: `/users/{userId}/metrics_daily/{date}`  
**Type**: Collection

### Schema

```typescript
interface DailyMetrics {
  date: string;                      // "2025-11-01"
  
  // Fitness Metrics (updated after each workout)
  ctl: number;                       // Chronic Training Load (42-day EMA)
  atl: number;                       // Acute Training Load (7-day EMA)
  tsb: number;                       // Training Stress Balance (CTL - ATL)
  
  // Daily Training
  planned_tss: number;
  actual_tss: number;
  
  // Readiness Inputs (Phase 2)
  hrv?: number;                      // Raw HRV (ms)
  hrv_z?: number;                    // Z-score
  rhr?: number;                      // Resting Heart Rate (bpm)
  rhr_z?: number;
  
  sleep_duration_min?: number;
  sleep_duration_z?: number;
  sleep_quality?: number;            // 1-10
  sleep_quality_z?: number;
  
  soreness?: number;                 // 1-10
  soreness_z?: number;
  stress?: number;                   // 1-10
  stress_z?: number;
  
  readiness_score?: number;          // -1.0 to +1.0
  
  // Flags
  injury_flag: boolean;
  illness_flag: boolean;
  
  updated_at: Timestamp;
}
```

---

## Indexes Configuration

See `firestore.indexes.json`:

1. **Activities by user and date**:
   - Collection: `activities`
   - Fields: `userId` (ASC), `startTime` (DESC)
   - Purpose: Fetch recent activities

2. **Plans by user and week**:
   - Collection: `plans`
   - Fields: `userId` (ASC), `weekStartDate` (DESC)
   - Purpose: Fetch recent plans

3. **Season goals by user and date**:
   - Collection: `season_goals`
   - Fields: `userId` (ASC), `date` (ASC)
   - Purpose: Find upcoming goals

4. **Camps by user and start date**:
   - Collection: `camps`
   - Fields: `userId` (ASC), `startDate` (ASC)
   - Purpose: Find active camps

5. **Daily metrics by date**:
   - Collection: `metrics_daily`
   - Fields: `date` (DESC)
   - Purpose: Fetch recent metrics

---

## Security Rules Summary

See `firestore.rules`:

- ✅ Users can only access their own data (`userId` must match `auth.uid`)
- ✅ All user subcollections inherit user-level access control
- ✅ Admin collections require `admin: true` token claim
- ✅ System collections are read-only for authenticated users

---

## Migration Notes

### From existing schema:
- ✅ `profile` document structure matches existing implementation
- ✅ `activities` → renamed to `completions` for clarity
- ✅ `dailyMetrics` → renamed to `metrics_daily` for consistency
- ⚠️ Add `season_goals` and `camps` collections (new in Phase 1)
- ⚠️ Add `availability` collection for time slots (new in Phase 1)
- ⚠️ Add `plans_weekly` and `plans_daily` collections (new in Phase 1)

---

## Deployment Checklist

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Test security rules with Firestore emulator
- [ ] Verify indexes are created in Firebase Console
- [ ] Test queries with composite indexes
