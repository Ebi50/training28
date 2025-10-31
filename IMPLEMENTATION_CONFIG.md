# 🎯 Implementierungs-Konfiguration - Dynamischer Trainingsplan

**Erstellt:** 31.10.2025  
**Basierend auf:** User-Entscheidungen + Firebase Storage Status

---

## ✅ ENTSCHEIDUNGEN GETROFFEN

### 1. ML-Modell
- **Status:** ✅ Bereits in Firebase Storage hochgeladen
- **Pfad:** `gs://training-21319928-b377a-firebasestorage.app/ml-models/`
- **Dateien:**
  - `tss-predictor-v1.onnx` (430 B)
  - `tss-predictor-v1.json` (7.05 KB - Metadata)
- **Feature-Count:** 15 Features
- **Modell-Typ:** XGBoost → ONNX

### 2. Auto-Update Strategie
- **Trigger:** Nach jedem Tag (nicht nach jeder Aktivität)
- **Timing:** Täglich um 23:00 Uhr prüfen
- **Logik:** Wenn Activity am Tag absolviert → Update nächste Woche
- **Frequenz-Limit:** Max. 1x pro Tag

### 3. Benachrichtigungen
- **Phase 1:** In-App Notifications (JETZT)
- **Phase 2:** Email (SPÄTER)
- **Phase 3:** Push (OPTIONAL)

### 4. Event-Management
- **Max A-Events:** 5 pro Jahr
- **Max B-Events:** 10 pro Jahr
- **Max C-Events:** Unbegrenzt
- **Mindestabstand A-Events:** 8 Wochen empfohlen (Warnung bei weniger)

### 5. Camp-Deload
- **Modus:** User-konfigurierbar
- **Defaults:**
  - Deload nach Camp: JA (optional abschaltbar)
  - Deload-Dauer: 1 Woche
  - Volumen-Reduktion: 40%

### 6. Zeitfenster (Slot-Overrides)
- **Persistent:** Änderungen an Standard-Slots (dauerhaft)
- **Temporär:** Wöchentliche Overrides (einmalig)
- **Speicherung:** Beides in Firestore
- **UI:** Kalender-View mit Drag & Drop (Phase 4)

---

## 🔧 TECHNISCHE KONFIGURATION

### ML-Modell Features (15 Features)

```typescript
interface MLModelInput {
  // Historische TSS-Werte
  TSS_lag1: number;      // Gestern
  TSS_3d: number;        // Letzte 3 Tage (Summe)
  TSS_7d: number;        // Letzte 7 Tage (Summe)
  TSS_14d: number;       // Letzte 14 Tage (Summe)
  TSS_28d: number;       // Letzte 28 Tage (Summe)
  TSS_std7: number;      // Standard-Abweichung (7 Tage)
  TSS_zero7: number;     // Anzahl Ruhetage (7 Tage)
  
  // Fitness-Metriken
  CTL_42: number;        // Chronic Training Load (42-Tage-Durchschnitt)
  ATL_7: number;         // Acute Training Load (7-Tage-Durchschnitt)
  TSB: number;           // Training Stress Balance (CTL - ATL)
  ramp_7v42: number;     // Ramp Rate (7d Durchschnitt vs. 42d)
  
  // Zyklische Zeit-Features
  dow_sin: number;       // Day of Week (sin-transformiert, 0-6)
  dow_cos: number;       // Day of Week (cos-transformiert)
  mon_sin: number;       // Month (sin-transformiert, 1-12)
  mon_cos: number;       // Month (cos-transformiert)
}
```

### Firestore Datenmodell-Erweiterung

```typescript
// Neu: Notifications Collection
interface Notification {
  id: string;
  userId: string;
  type: 'plan_updated' | 'event_reminder' | 'performance_alert';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: {
    weekId?: string;
    eventId?: string;
    change?: {
      oldValue: number;
      newValue: number;
      metric: string;
    };
  };
}

// Erweiterung: UserProfile
interface UserProfile {
  // ... bestehende Felder ...
  
  // NEU: Slot Management
  weeklyOverrides?: {
    [weekId: string]: TimeSlot[];  // z.B. "2025-W45": [...]
  };
  
  // NEU: Auto-Update Settings
  autoUpdate?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    notifyOnChange: boolean;
    lastUpdate: Date;
  };
}

// Erweiterung: WeeklyPlan
interface WeeklyPlan {
  // ... bestehende Felder ...
  
  // NEU: Update-Tracking
  updateHistory?: {
    date: Date;
    reason: 'manual' | 'auto_daily' | 'performance' | 'event';
    changedMetrics: {
      totalTss?: { old: number; new: number };
      totalHours?: { old: number; new: number };
      sessions?: { added: number; removed: number; modified: number };
    };
  }[];
  
  // NEU: Compliance-Tracking
  compliance?: {
    planned: number;      // Anzahl geplanter Sessions
    completed: number;    // Anzahl absolvierter Sessions
    missed: number;       // Anzahl verpasster Sessions
    modified: number;     // Anzahl modifizierter Sessions
    rate: number;         // Prozent (completed / planned)
  };
}
```

---

## 🚀 IMPLEMENTIERUNGS-PLAN

### Phase 1: ML-Integration (JETZT - 2h)

**Ziel:** ML-Modell funktionsfähig machen

**Tasks:**
1. ✅ Model aus Firebase Storage laden
2. ✅ Feature-Extraction implementieren
3. ✅ Prediction-Funktion vervollständigen
4. ✅ Integration in `planGenerator.ts`
5. ✅ Fallback-Logik testen

**Dateien:**
- `src/lib/mlPredictor.ts`
- `src/lib/planGenerator.ts`
- `src/lib/fitnessMetrics.ts` (Feature-Berechnung)

**Acceptance Criteria:**
- [ ] Model lädt ohne Fehler
- [ ] Predictions liefern sinnvolle TSS-Werte (20-150 TSS)
- [ ] Fallback auf Heuristik funktioniert
- [ ] Logs zeigen ML-Usage an

---

### Phase 2: Automatische Updates (HEUTE - 2-3h)

**Ziel:** Plan aktualisiert sich täglich automatisch

**Tasks:**
1. ✅ Cloud Function: `dailyPlanUpdate`
2. ✅ Scheduled Trigger (täglich 23:00 Uhr)
3. ✅ Compliance-Berechnung
4. ✅ Metrics-Update (CTL/ATL/TSB)
5. ✅ Notification System
6. ✅ Update-History speichern

**Neue Dateien:**
- `functions/src/scheduledPlanUpdate.ts`
- `functions/src/notificationService.ts`
- `src/lib/complianceTracker.ts`

**Logik-Flow:**
```typescript
// functions/src/scheduledPlanUpdate.ts
export const dailyPlanUpdate = functions.pubsub
  .schedule('0 23 * * *')  // Täglich um 23:00
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    const users = await getUsersWithAutoUpdate();
    
    for (const user of users) {
      // 1. Aktivitäten von heute abfragen
      const todaysActivities = await getTodaysActivities(user.id);
      
      if (todaysActivities.length === 0) continue;
      
      // 2. Metrics aktualisieren
      const newMetrics = await updateDailyMetrics(user.id, todaysActivities);
      
      // 3. Compliance prüfen
      const compliance = await checkCompliance(user.id);
      
      // 4. Entscheidung: Re-plan?
      if (shouldRegeneratePlan(compliance, newMetrics)) {
        // 5. Neuen Plan generieren
        const newPlan = await generateUpdatedPlan(user.id, newMetrics);
        
        // 6. Speichern & Benachrichtigen
        await savePlan(newPlan);
        await createNotification(user.id, {
          type: 'plan_updated',
          title: 'Dein Trainingsplan wurde angepasst',
          message: `Basierend auf deinem Training heute (${todaysActivities[0].tss} TSS)`,
          metadata: { weekId: newPlan.id }
        });
      }
    }
  });
```

**Acceptance Criteria:**
- [ ] Function deployt ohne Fehler
- [ ] Läuft täglich automatisch
- [ ] Plan wird nur bei signifikanten Änderungen aktualisiert
- [ ] Notifications erscheinen in UI
- [ ] Update-History wird gespeichert

---

### Phase 3: In-App Notifications (HEUTE - 1h)

**Ziel:** User sieht Benachrichtigungen in der App

**Tasks:**
1. ✅ Notification-Component erstellen
2. ✅ Notification-Provider (Context)
3. ✅ Badge auf Dashboard
4. ✅ Notification-Center
5. ✅ Mark-as-Read Funktion

**Neue Dateien:**
- `src/components/NotificationBell.tsx`
- `src/components/NotificationCenter.tsx`
- `src/contexts/NotificationContext.tsx`
- `src/lib/notificationService.ts`

**UI-Komponenten:**
```tsx
// src/components/NotificationBell.tsx
export function NotificationBell() {
  const { unreadCount } = useNotifications();
  
  return (
    <button className="relative">
      <BellIcon />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-accent3 text-white rounded-full w-5 h-5 text-xs">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
```

**Acceptance Criteria:**
- [ ] Badge zeigt Anzahl ungelesener Notifications
- [ ] Notification-Center öffnet beim Click
- [ ] Notifications können als gelesen markiert werden
- [ ] Real-time Updates (Firestore listener)

---

### Phase 4: Performance-Adaptation (NÄCHSTE SESSION - 3h)

**Ziel:** Plan passt sich an tatsächliche Leistung an

**Tasks:**
1. ✅ Performance-Analyzer implementieren
2. ✅ Deviation-Tracking (Soll vs. Ist)
3. ✅ Adaptive FTP-Berechnung
4. ✅ Fatigue-Detection (TSB-basiert)
5. ✅ Over-/Undertraining Alerts

**Neue Dateien:**
- `src/lib/performanceAnalyzer.ts`
- `src/lib/adaptiveFtp.ts`

**Logik:**
```typescript
// Automatische FTP-Anpassung
function suggestFtpAdjustment(activities: Activity[], currentFtp: number): number | null {
  // 1. Prüfe letzten 4 Wochen
  const recentActivities = getLast28Days(activities);
  
  // 2. Berechne durchschnittliche Power-Deviation
  const avgDeviation = calculatePowerDeviation(recentActivities, currentFtp);
  
  // 3. Wenn konstant >5% über FTP → FTP erhöhen
  if (avgDeviation > 0.05 && recentActivities.length >= 10) {
    return Math.round(currentFtp * (1 + avgDeviation * 0.5)); // 50% der Deviation
  }
  
  // 4. Wenn konstant <-5% unter FTP → FTP senken (Fatigue?)
  if (avgDeviation < -0.05 && recentActivities.length >= 10) {
    return Math.round(currentFtp * (1 + avgDeviation * 0.3)); // 30% der Deviation
  }
  
  return null; // Keine Änderung nötig
}
```

---

### Phase 5: Event & Camp UI (SPÄTER - 4h)

**Ziel:** Vollständiges Event-Management in UI

**Tasks:**
1. ✅ Event-Kalender-Ansicht
2. ✅ Event erstellen/bearbeiten/löschen
3. ✅ Camp-Verwaltung
4. ✅ Periodisierungs-Visualisierung
5. ✅ Konflikt-Erkennung (zu viele A-Events)

**Neue Seiten:**
- `src/app/dashboard/events/page.tsx`
- `src/app/dashboard/events/[id]/page.tsx`
- `src/app/dashboard/camps/page.tsx`

---

## 🎯 SUCCESS METRICS

### ML-Performance
- **Target RMSE:** < 15 TSS zwischen Prediction und Actual
- **Model Load Time:** < 2 Sekunden
- **Prediction Time:** < 100ms

### Auto-Update
- **Success Rate:** > 95% (keine Fehler bei Cloud Function)
- **User Satisfaction:** > 80% finden Updates hilfreich
- **Plan Stability:** Nicht mehr als 2 Updates pro Woche

### Compliance
- **Target Compliance Rate:** > 75%
- **Missed Sessions Alert:** Bei < 60% Compliance

### Performance
- **App Load Time:** < 3 Sekunden (mit ML-Model)
- **Notification Delivery:** < 30 Sekunden nach Trigger

---

## 🚨 GUARDRAILS FÜR AUTO-UPDATE

```typescript
const AUTO_UPDATE_RULES = {
  // Minimale Änderungsschwelle
  minTssChangeToUpdate: 30,        // Nur updaten wenn ±30 TSS Änderung
  minHoursChangeToUpdate: 0.5,     // Nur updaten wenn ±30min Änderung
  
  // Frequenz-Limits
  maxUpdatesPerWeek: 2,            // Max. 2x pro Woche
  minDaysBetweenUpdates: 2,        // Mindestens 2 Tage Pause
  
  // Sicherheits-Checks
  maxRampRateIncrease: 0.15,       // Max. 15% Volumen-Steigerung
  minTsbBeforeUpdate: -25,         // Nicht updaten wenn TSB < -25
  
  // Compliance-Schwellen
  complianceThresholdForUpdate: 0.6,  // Bei <60% → Update
  missedSessionsAlert: 3,             // Alert bei 3+ verpassten Sessions
  
  // Event-Schutz
  noUpdateDaysBeforeAEvent: 14,    // 14 Tage vor A-Event: keine Auto-Updates
  noUpdateDaysBeforeBEvent: 7,     // 7 Tage vor B-Event: keine Auto-Updates
};
```

---

## 📅 ZEITPLAN

| Phase | Dauer | Start | Ende | Status |
|-------|-------|-------|------|--------|
| Phase 1: ML-Integration | 2h | Heute 14:00 | Heute 16:00 | ⏳ BEREIT |
| Phase 2: Auto-Updates | 2-3h | Heute 16:00 | Heute 19:00 | ⏳ BEREIT |
| Phase 3: Notifications | 1h | Heute 19:00 | Heute 20:00 | ⏳ BEREIT |
| **ZIEL HEUTE** | **5-6h** | | **Heute 20:00** | 🎯 |
| Phase 4: Performance | 3h | Morgen | Morgen | ⏸️ SPÄTER |
| Phase 5: Event UI | 4h | Später | Später | ⏸️ SPÄTER |

---

## ✅ READY TO START!

**Alle Entscheidungen getroffen ✅**  
**Alle Fragen beantwortet ✅**  
**Konfiguration komplett ✅**

### Nächster Schritt:
**Phase 1 starten: ML-Integration**

Sag Bescheid wenn du bereit bist! 🚀
