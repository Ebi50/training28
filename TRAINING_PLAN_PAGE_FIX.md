# Training Plan Page - MVP Plan Generator Integration Fix

## Issue Identified
User reported: "das klappt noch gar nciht es wird nur der starre Plan umgesetzt" (plan generation not working correctly)

### Root Cause
The application had **TWO separate "Generate Plan" buttons** on different pages:

1. **Dashboard page** (`/dashboard`) - ✅ Already updated to use `mvpPlanGenerator`
2. **Training Plan page** (`/dashboard/plan`) - ❌ Still using old API endpoint

User was on the Training Plan page and clicked that button, which was still calling `/api/training/generate-plan` (old endpoint using `simplePlanGenerator`).

### Evidence from Server Logs
```
GET /dashboard/plan 200 (User on Training Plan page)
POST /api/training/generate-plan 200 (Old API called TWICE)
📋 Weeks after cleaning: 8 (Confirms old generator: 8 weeks not 12)
ℹ️ No plan found for user (No saved plans yet)
```

No console logs from new `mvpPlanGenerator` appeared because it was never executed.

## Fix Applied

### Changes to `src/app/dashboard/plan/page.tsx`

#### 1. Updated Imports
```typescript
// BEFORE - Missing key imports
import { getUserProfile, updateTrainingSession } from '@/lib/firestore';
import type { TrainingSession } from '@/types';

// AFTER - Added MVP generator and Firestore functions
import { getUserProfile, updateTrainingSession, getSeasonGoals, saveTrainingPlan } from '@/lib/firestore';
import { generateMvpWeeklyPlan } from '@/lib/mvpPlanGenerator';
import type { TrainingSession, WeeklyPlan, SeasonGoal, UserProfile } from '@/types';
```

#### 2. Removed Local UserProfile Interface
```typescript
// BEFORE - Local simplified interface
interface UserProfile {
  email?: string;
  ftp?: number;
  stravaConnected?: boolean;
}

// AFTER - Use proper type from @/types
import type { UserProfile } from '@/types';
```

#### 3. Replaced handleGeneratePlan Function
```typescript
// BEFORE - API call to old endpoint (8 weeks, simplePlanGenerator)
const handleGeneratePlan = async () => {
  const user = auth.currentUser;
  if (!user) return;
  
  setGeneratingPlan(true);
  try {
    const response = await fetch('/api/training/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid })
    });
    
    if (response.ok) {
      const data = await response.json();
      setTrainingPlan(data.plan);
      setCurrentWeek(0);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setGeneratingPlan(false);
  }
};

// AFTER - Local mvpPlanGenerator call (12 weeks, Workout Library)
const handleGeneratePlan = async () => {
  const user = auth.currentUser;
  if (!user || !profile) return;
  
  setGeneratingPlan(true);
  try {
    console.log('🚀 Starting MVP plan generation...');
    
    // Extract user slots from profile
    const userSlots = profile.preferences?.preferredTrainingTimes || [];
    
    // Get next event date from season goals
    const seasonGoals = await getSeasonGoals(user.uid);
    const nextEvent = seasonGoals.find(
      (goal: SeasonGoal) => goal.date && new Date(goal.date) > new Date()
    );
    const eventDate = nextEvent?.date 
      ? new Date(nextEvent.date)
      : null; // No event means MAINTENANCE phase

    // Generate 12 weeks of training
    const weeks: WeeklyPlan[] = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start at midnight
    
    for (let weekNum = 1; weekNum <= 12; weekNum++) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + (weekNum - 1) * 7);
      
      const weekPlan = await generateMvpWeeklyPlan({
        userId: user.uid,
        userProfile: profile,
        weekStart: weekStartDate,
        slots: userSlots,
        eventDate,
        weekNumber: weekNum
      });
      
      weeks.push(weekPlan);
    }

    const fullPlan = {
      userId: user.uid,
      planId: `plan-${Date.now()}`,
      startDate: startDate.toISOString(),
      endDate: new Date(startDate.getTime() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString(),
      weeks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('✅ MVP Plan generated:', fullPlan);
    console.log('💾 Saving plan to Firestore...');
    
    // Save to Firestore
    await saveTrainingPlan(user.uid, fullPlan);
    console.log('✅ Plan saved to Firestore');
    
    // Update UI
    setTrainingPlan(fullPlan);
    setCurrentWeek(0);
  } catch (error) {
    console.error('❌ Error generating plan:', error);
  } finally {
    setGeneratingPlan(false);
  }
};
```

#### 4. Updated Header Text
```typescript
// BEFORE
<p className={`${colors.text.secondary} ${spacing.micro} ${typography.body}`}>8-week training schedule</p>

// AFTER
<p className={`${colors.text.secondary} ${spacing.micro} ${typography.body}`}>12-week training schedule</p>
```

## Expected Behavior After Fix

### When User Clicks "Generate Plan" on Training Plan Page:
1. ✅ Console shows: "🚀 Starting MVP plan generation..."
2. ✅ Generates 12 weeks (not 8) using `mvpPlanGenerator`
3. ✅ Uses Workout Library intervals (not simple heuristics)
4. ✅ Respects user's time slots from preferences
5. ✅ Applies periodization based on season goals/camps
6. ✅ Console shows: "💾 Saving plan to Firestore..."
7. ✅ Plan saved with timestamp ID to `users/{userId}/plans/{planId}`
8. ✅ Console shows: "✅ Plan saved to Firestore"
9. ✅ UI updates immediately with new plan
10. ✅ Week 1 displayed with correct workouts

### What Changed:
- **Old**: API call → simplePlanGenerator → 8 weeks → static workouts → 288 TSS, 10:00h, 40/60% LIT/HIT
- **New**: Local call → mvpPlanGenerator → 12 weeks → Workout Library → Dynamic TSS, proper LIT/HIT distribution

## Testing Instructions

### 1. Clear Firestore Plans (Optional)
If you want to start fresh, delete existing plans in Firestore Console:
- Navigate to `users/{userId}/plans` collection
- Delete all documents

### 2. Test Plan Generation
1. Navigate to http://localhost:3001/dashboard/plan
2. Ensure Strava is connected (green checkmark)
3. Click "Generate Plan" button
4. Watch browser console for logs:
   ```
   🚀 Starting MVP plan generation...
   ✅ MVP Plan generated: {...}
   💾 Saving plan to Firestore...
   ✅ Plan saved to Firestore
   ```
5. Verify plan appears in UI:
   - Shows "Week 1" header
   - Displays 7 days of workouts
   - Shows correct TSS and duration values
   - LIT/HIT distribution from Workout Library

### 3. Verify Firestore Save
1. Open Firebase Console → Firestore Database
2. Navigate to `users/{userId}/plans`
3. Should see new document with timestamp ID (e.g., `plan-1234567890123`)
4. Document should contain:
   - `weeks` array with 12 WeeklyPlan objects
   - `createdAt` timestamp
   - `startDate` and `endDate`

### 4. Test Page Reload
1. Refresh page (F5)
2. Plan should load from Firestore
3. Still shows generated plan (not "No Plan Yet")

## Files Modified
- `src/app/dashboard/plan/page.tsx` (87 lines changed)

## Status
✅ **FIXED** - Training Plan page now uses MVP Plan Generator with Workout Library

## Next Steps
User should test the fix and verify:
1. Plan generates correctly (12 weeks, proper workouts)
2. Console shows correct logs
3. Plan saves to Firestore
4. UI displays plan properly

If working correctly, this resolves **Issue #1 (CRITICAL)** from `ISSUES_FOUND.md`.
