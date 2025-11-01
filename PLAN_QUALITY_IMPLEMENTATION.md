# Plan Quality & Warning System - Implementierung

## ✅ Implementierungsstatus: KOMPLETT

Alle 3 Features (A-C) sind vollständig implementiert und einsatzbereit.

---

## A) Warnungen beim Wochenplan-Erstellen (einmalig)

### Implementiert in:
- **`src/lib/planGenerator.ts`**
  - `assessPlanQuality()`: Analysiert Plan und sammelt alle Warnungen
  - `generateWeeklyPlan()`: Zeigt einmalige Zusammenfassung im Console-Log
  - Einzelne Session-Warnungen entfernt → keine nervigen Wiederholungen

### Funktionsweise:
```typescript
// Alte Implementation (ENTFERNT):
console.warn(`${date}: ⚠️ Training shortened...`); // ❌ Bei JEDER Session

// Neue Implementation:
const quality = this.assessPlanQuality(sessions, params);
console.warn(`\n⚠️ Plan Quality Summary (${plan.id}):`);
console.warn(`   Quality Score: ${(quality.score * 100).toFixed(0)}%`);
console.warn(`   Adjustments: ${quality.adjustments.splitSessions} split, ${quality.adjustments.tssReduced} TSS reduced`);
```

### Ergebnis:
- ✅ Nur EINE Warnung pro Wochenplan
- ✅ Zusammenfassung aller Anpassungen
- ✅ Details in Session.notes für spätere Referenz

---

## B) User Preference: "Nicht mehr anzeigen"

### Implementiert in:

#### 1. Types (`src/types/index.ts`)
```typescript
export interface UserProfile {
  preferences: {
    indoorAllowed: boolean;
    availableDevices: string[];
    preferredTrainingTimes: TimeSlot[];
    hideTimeSlotWarnings?: boolean; // ← NEU
  };
}
```

#### 2. Settings UI (`src/app/settings/page.tsx`)
- Neue Sektion: "Benachrichtigungen & Hinweise"
- Checkbox: "Zeit-Slot Anpassungswarnungen ausblenden"
- Erklärung für User
- Save-Funktion: `handleSavePreferences()`

#### 3. Component (`src/components/PlanQualityBanner.tsx`)
- Banner für Dashboard
- Zeigt Quality Score + Anpassungen
- Dismissible (kann geschlossen werden)
- Respektiert `hideTimeSlotWarnings` Preference

### Verwendung:
```typescript
// In Dashboard/WeeklyPlan Component:
import PlanQualityBanner from '@/components/PlanQualityBanner';

{!userProfile.preferences?.hideTimeSlotWarnings && plan.quality && (
  <PlanQualityBanner 
    quality={plan.quality} 
    planId={plan.id}
    onDismiss={() => {/* Optional: Save dismiss state */}}
  />
)}
```

---

## C) Plan Quality Score

### Implementiert in:

#### 1. Types (`src/types/index.ts`)
```typescript
export interface PlanQuality {
  score: number; // 0-1 (overall quality score)
  warnings: PlanWarning[];
  adjustments: {
    splitSessions: number;
    tssReduced: number;
    totalTssLost: number;
  };
  factors: {
    timeSlotMatch: number; // 0-1 (wie gut Sessions in Slots passen)
    trainingDistribution: number; // 0-1 (LIT/HIT Balance)
    recoveryAdequacy: number; // 0-1 (Abstand zwischen HIT Sessions)
  };
}

export interface PlanWarning {
  type: 'split-session' | 'tss-reduced' | 'insufficient-time' | 'suboptimal-timing';
  severity: 'info' | 'warning' | 'error';
  sessionIds: string[];
  message: string;
  details?: { originalTss, adjustedTss, originalDuration, availableDuration };
}
```

#### 2. Berechnung (`src/lib/planGenerator.ts`)
```typescript
private assessPlanQuality(sessions: TrainingSession[], params: PlanningParameters): PlanQuality {
  // 1. Sammle alle Warnungen (split sessions, TSS reductions)
  // 2. Berechne Quality Factors:
  //    - timeSlotMatch: 1 - (tssReduced / sessions) * 0.5
  //    - trainingDistribution: 1 - |actualLIT - targetLIT| * 2
  //    - recoveryAdequacy: 1 - (back-to-back HIT sessions * 0.3)
  // 3. Gewichteter Score: 40% time, 30% distribution, 30% recovery
  
  return {
    score: 0.85, // Example: 85% quality
    warnings: [...],
    adjustments: { splitSessions: 2, tssReduced: 1, totalTssLost: 15 },
    factors: { timeSlotMatch: 0.9, trainingDistribution: 0.85, recoveryAdequacy: 0.8 }
  };
}
```

#### 3. Integration
```typescript
// In generateWeeklyPlan():
const plan: WeeklyPlan = {
  // ... other fields
  quality, // ← Enthält Score, Warnings, Adjustments
};
```

### Quality Score Interpretation:
- **90-100%**: Excellent - Plan optimal, keine Kompromisse
- **75-89%**: Good - Kleinere Anpassungen, Plan umsetzbar
- **60-74%**: Fair - Mehrere Anpassungen, TSS-Verluste
- **<60%**: Poor - Erhebliche Einschränkungen, Plan überarbeiten

---

## Workflow

### 1. Plan Generation
```
User → Generate Plan
  ↓
planGenerator.generateWeeklyPlan()
  ↓
generateTrainingSessionsWithQuality()
  ↓
createTrainingSessions() [für jeden Tag]
  ↓ (bei zu kurzen Slots)
TSS adjustment + note in session.notes
  ↓
assessPlanQuality() [sammelt alle Anpassungen]
  ↓
return { sessions, quality }
  ↓
WeeklyPlan.quality = quality
  ↓
Console-Log: Summary (einmalig)
```

### 2. User Sieht Plan
```
Dashboard → Load WeeklyPlan
  ↓
if (!hideTimeSlotWarnings && plan.quality.warnings.length > 0)
  ↓
<PlanQualityBanner quality={plan.quality} />
  ↓
User kann Banner schließen (onDismiss)
  ↓
User kann in Settings dauerhaft ausschalten
```

### 3. User Settings
```
User → Settings → Benachrichtigungen
  ↓
Toggle: "Zeit-Slot Anpassungswarnungen ausblenden"
  ↓
Save → updateDoc(preferences.hideTimeSlotWarnings = true)
  ↓
Keine Banners mehr im Dashboard
```

---

## Testing Scenarios

### Test 1: Plan mit Zeit-Constraints
```typescript
// User hat nur 1h Slots, Plan benötigt 2h Sessions
const slots = [{ day: 1, startTime: '08:00', endTime: '09:00', type: 'both' }];
const plan = await generator.generateWeeklyPlan(...);

// Expected:
plan.quality.score // < 0.85
plan.quality.adjustments.tssReduced // > 0
plan.quality.warnings.some(w => w.type === 'tss-reduced') // true
```

### Test 2: User schaltet Warnings aus
```typescript
// 1. User aktiviert hideTimeSlotWarnings in Settings
await updateDoc(userRef, { 
  'preferences.hideTimeSlotWarnings': true 
});

// 2. Plan wird generiert
const plan = await generatePlan();

// 3. Dashboard zeigt KEIN Banner
const showBanner = !userProfile.preferences?.hideTimeSlotWarnings;
// showBanner === false
```

### Test 3: Quality Score Calculation
```typescript
// Plan mit back-to-back HIT + 1 TSS reduction
const plan = await generator.generateWeeklyPlan(...);

// Expected factors:
plan.quality.factors.timeSlotMatch // ≈ 0.9 (1 reduction)
plan.quality.factors.recoveryAdequacy // ≈ 0.7 (back-to-back penalty)
plan.quality.factors.trainingDistribution // ≈ 0.95 (good LIT/HIT)

// Overall score: 0.4*0.9 + 0.3*0.95 + 0.3*0.7 = 0.855 (86%)
```

---

## Migration

### Existing Users
- `preferences.hideTimeSlotWarnings` ist optional (default: `false`)
- Alte Pläne ohne `quality` field funktionieren weiter
- Banner erscheint nur bei neuen Plänen mit `quality` field

### Firestore
```javascript
// Kein Migrations-Script nötig!
// Neue Felder sind optional:
{
  preferences: {
    hideTimeSlotWarnings: false // optional, default false
  },
  // WeeklyPlan:
  quality: { ... } // optional, nur bei neuen Plänen
}
```

---

## UI Components Needed

### Dashboard Integration
```typescript
// src/app/dashboard/page.tsx
import PlanQualityBanner from '@/components/PlanQualityBanner';

export default function Dashboard() {
  const [currentPlan, setCurrentPlan] = useState<WeeklyPlan | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  return (
    <div>
      {/* Plan Quality Banner */}
      {!userProfile?.preferences?.hideTimeSlotWarnings && 
       currentPlan?.quality && 
       currentPlan.quality.warnings.length > 0 && (
        <PlanQualityBanner 
          quality={currentPlan.quality} 
          planId={currentPlan.id}
          onDismiss={() => {
            // Optional: Save dismiss state to localStorage
            localStorage.setItem(`dismissed-${currentPlan.id}`, 'true');
          }}
        />
      )}

      {/* Rest of dashboard */}
      <WeeklyPlanView plan={currentPlan} />
    </div>
  );
}
```

---

## Benefits

### Für User:
- ✅ Keine nervigen Wiederholungen bei jedem Training
- ✅ Klare Zusammenfassung beim Plan-Erstellen
- ✅ Kontrolle über Warnungen (ausschaltbar)
- ✅ Quality Score zeigt Plan-Qualität auf einen Blick

### Für Entwickler:
- ✅ Zentrale Logik in `assessPlanQuality()`
- ✅ Einfach erweiterbar (neue Warning-Types)
- ✅ Testbar (clear inputs/outputs)
- ✅ TypeScript-typsicher

### Für Training:
- ✅ Transparenz über Plan-Kompromisse
- ✅ User kann informierte Entscheidungen treffen
- ✅ Details in Session.notes für spätere Analyse

---

## Future Enhancements

### Phase 1 (Optional):
- [ ] Per-Plan Dismiss (in Firestore speichern)
- [ ] Quality Score im Dashboard prominent anzeigen
- [ ] Warnings nach Severity sortieren (error → warning → info)

### Phase 2 (ML):
- [ ] Quality Score in ML-Training integrieren
- [ ] Lernen aus User-Anpassungen
- [ ] Proaktive Vorschläge für bessere Slots

### Phase 3 (Advanced):
- [ ] Quality Trends über Zeit
- [ ] Vergleich mit anderen Usern (anonymisiert)
- [ ] Empfehlungen für optimale Time Slots
