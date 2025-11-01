# Time Slot Compliance - Implementation Documentation

## Problem Statement

Previously, the training plan generator did not properly account for available time slots, potentially creating sessions that were too long for the allocated time.

**Example Issue**:
- User has 1-hour morning slot (06:00-07:00)
- System generates 2-hour endurance ride with 80 TSS
- **Result**: Impossible to complete ❌

---

## Solution Implemented

### 1. **TSS Proportional Adjustment** ✅

Sessions are now automatically adjusted if the time slot is too short:

```typescript
// BEFORE: Session could exceed slot duration
targetTss: 80, duration: 120 min → Won't fit in 60 min slot!

// AFTER: TSS adjusted proportionally
targetTss: 40, duration: 60 min → Fits perfectly! ✅
```

**Logic**:
```typescript
if (slotDuration < idealDuration && durationRatio < 0.7) {
  adjustedTss = Math.round(targetTss * durationRatio);
}
```

**Threshold**: Only adjust if slot is < 70% of ideal duration to avoid micro-adjustments.

---

### 2. **Warning System** ⚠️

Sessions that are shortened get a warning note:

```typescript
notes: "⚠️ Training shortened: 60min (ideal: 120min) - TSS reduced from 80 to 40"
```

**Logged to console** for developer awareness:
```
2025-11-01: ⚠️ Training shortened: 60min (ideal: 120min) - TSS reduced from 80 to 40
```

---

### 3. **Multi-Session Support (Double Days)** 🔄

For long workouts that won't fit in a single slot, the system can now create multiple sessions:

**Scenario**: 3-hour endurance ride, but only 2x 90-minute slots available

**Solution**: Split into AM + PM sessions
- **Session 1** (AM): 60% TSS = 72 TSS, 90 minutes
- **Session 2** (PM): 40% TSS = 48 TSS, 90 minutes

**Benefits**:
- ✅ Respects time constraints
- ✅ Maintains total training load
- ✅ Follows best practices (main workout AM, recovery PM)

**Conditions for Multi-Session**:
1. Multiple slots available (e.g., morning + evening)
2. Only for LIT sessions (HIT stays single)
3. Total available time > 60% of ideal duration
4. Ideal duration exceeds any single slot by 20%+

---

## Code Changes

### File: `src/lib/planGenerator.ts`

**New Functions**:

1. **`createTrainingSessions()`** - Wrapper that decides single vs. multi-session
   ```typescript
   private createTrainingSessions(
     date: string,
     type: 'LIT' | 'HIT' | 'REC',
     targetTss: number,
     availableSlots: TimeSlot[],
     indoorAllowed: boolean
   ): TrainingSession[]
   ```

2. **`createMultiSessionDay()`** - Creates double-day sessions
   ```typescript
   private createMultiSessionDay(
     date: string,
     type: 'LIT' | 'HIT' | 'REC',
     targetTss: number,
     availableSlots: TimeSlot[],
     indoorAllowed: boolean
   ): TrainingSession[]
   ```

**Modified Functions**:

3. **`createTrainingSession()`** - Enhanced with TSS adjustment
   - Calculates slot vs. ideal duration
   - Adjusts TSS if slot < 70% of ideal
   - Adds warning notes
   - Returns adjusted session

---

## Examples

### Example 1: Short Morning Slot

**Input**:
- Slot: 06:00-07:00 (60 minutes)
- Planned: LIT, 80 TSS (ideal: 120 minutes)

**Output**:
```typescript
{
  duration: 60,
  targetTss: 40,  // Adjusted from 80
  notes: "⚠️ Training shortened: 60min (ideal: 120min) - TSS reduced from 80 to 40"
}
```

**Intensity**: Remains moderate (IF ~0.65)

---

### Example 2: Double Day

**Input**:
- Slot 1: 06:00-07:30 (90 minutes)
- Slot 2: 17:00-18:30 (90 minutes)
- Planned: LIT, 150 TSS (ideal: 180 minutes)

**Output**:
```typescript
[
  {
    id: "2025-11-01-lit-1",
    duration: 90,
    targetTss: 90,  // 60% of 150
    notes: "Part 1 of 2 (Double Day)"
  },
  {
    id: "2025-11-01-lit-2",
    duration: 90,
    targetTss: 60,  // 40% of 150
    notes: "Part 2 of 2 (Double Day)"
  }
]
```

**Total**: 180 minutes, 150 TSS across both sessions ✅

---

### Example 3: Acceptable Fit

**Input**:
- Slot: 08:00-10:00 (120 minutes)
- Planned: HIT, 80 TSS (ideal: 90 minutes)

**Output**:
```typescript
{
  duration: 90,
  targetTss: 80,  // No adjustment needed
  notes: "Session fits in 90min slot (ideal: 90min)"
}
```

**No TSS adjustment** - slot is sufficient (> 70% threshold)

---

## Guardrails & Logic

### TSS Adjustment Threshold: 70%

**Why 70%?**
- Slots 70-100% of ideal: Acceptable, minor intensity increase
- Slots < 70% of ideal: Significant intensity increase, TSS must be reduced

**Example**:
- 100 min ideal, 75 min slot = 75% → No adjustment (acceptable)
- 100 min ideal, 60 min slot = 60% → Adjust TSS (too short)

### Multi-Session Criteria

**When to split**:
1. ✅ Type is LIT (long endurance rides)
2. ✅ Multiple slots available (2+)
3. ✅ Ideal duration > 60% of total available time
4. ✅ Ideal duration > single slot by 20%+

**When NOT to split**:
- ❌ HIT sessions (should be focused, not split)
- ❌ REC sessions (short by nature)
- ❌ Only one slot available
- ❌ Slot is sufficient for full session

---

## Benefits

### For Users
- ✅ **Realistic Training Plans** - No impossible sessions
- ✅ **Better Intensity Management** - TSS matches available time
- ✅ **Flexible Scheduling** - Can use AM + PM slots
- ✅ **Clear Communication** - Warnings when sessions are adjusted

### For System
- ✅ **Accurate Load Management** - CTL/ATL/TSB calculations remain valid
- ✅ **Compliance Tracking** - Easier to track plan adherence
- ✅ **Predictable Outcomes** - Users can actually complete what's planned
- ✅ **Professional Quality** - Matches real coaching practices

---

## Testing

### Unit Tests Needed

1. **Short Slot with TSS Adjustment**
   ```typescript
   it('adjusts TSS when slot is < 70% of ideal', () => {
     const slot = { startTime: '06:00', endTime: '07:00' }; // 60 min
     const session = createTrainingSession('2025-11-01', 'LIT', 80, [slot], true);
     
     expect(session.duration).toBe(60);
     expect(session.targetTss).toBeLessThan(80);
     expect(session.notes).toContain('shortened');
   });
   ```

2. **Double Day Creation**
   ```typescript
   it('creates double day for long LIT sessions', () => {
     const slots = [
       { startTime: '06:00', endTime: '07:30' },
       { startTime: '17:00', endTime: '18:30' }
     ];
     const sessions = createTrainingSessions('2025-11-01', 'LIT', 150, slots, true);
     
     expect(sessions).toHaveLength(2);
     expect(sessions[0].targetTss + sessions[1].targetTss).toBe(150);
   });
   ```

3. **No Adjustment for Sufficient Slots**
   ```typescript
   it('does not adjust when slot is sufficient', () => {
     const slot = { startTime: '08:00', endTime: '10:00' }; // 120 min
     const session = createTrainingSession('2025-11-01', 'HIT', 80, [slot], true);
     
     expect(session.duration).toBe(90); // Ideal for HIT
     expect(session.targetTss).toBe(80); // No adjustment
     expect(session.notes).not.toContain('shortened');
   });
   ```

---

## Future Enhancements

### Phase 2 (Optional)
1. **User Preferences for Splitting**
   - Let users choose: "Auto-split long rides" or "Shorten to fit"
   
2. **Smart Slot Selection**
   - Prefer longer slots for HIT sessions
   - Prefer outdoor slots for weekend long rides
   
3. **Load Distribution Optimization**
   - Adjust double-day TSS split based on user fitness
   - Consider recovery needs between sessions

4. **UI Feedback**
   - Show visual indicator for adjusted sessions
   - Display original vs. adjusted TSS in UI
   - Allow manual override of TSS adjustment

---

## Migration Notes

### Backwards Compatibility
- ✅ Existing plans continue to work
- ✅ No database schema changes required
- ✅ `notes` field already exists in TrainingSession type

### Monitoring
- Check console logs for "Training shortened" warnings
- Monitor compliance rates (should improve)
- Track double-day session completion rates

---

## Summary

**Problem**: Training sessions could exceed available time slots
**Solution**: Automatic TSS adjustment + multi-session support
**Result**: Realistic, compliant training plans that fit user schedules

**Key Metrics**:
- TSS Adjustment Threshold: **70%**
- Double Day TSS Split: **60% / 40%**
- Session Types Supporting Multi-Session: **LIT only**

**Status**: ✅ **Implemented and Ready**

---

*Last Updated: November 1, 2025*
*Implementation: planGenerator.ts lines 343-440*
