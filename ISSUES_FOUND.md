# 🐛 Gefundene Issues - Browser Testing (01.11.2025)

## 🔴 KRITISCH - HÖCHSTE PRIORITÄT

### Issue #1: Plan-Generierung funktioniert nicht
**Seite:** Training Plan  
**Status:** ✅ GEFIXT  
**Beschreibung:** Bei Klick auf "Generate Plan" wird nur der alte Plan angezeigt, kein neuer Plan wird erstellt.  

**ROOT CAUSE GEFUNDEN:**
1. ❌ Plan wurde generiert aber NICHT in Firestore gespeichert
2. ❌ API Route suchte nach Plan mit ID "current" statt neuesten Plan
3. ❌ Beim Reload wurde alter Plan aus Firestore geladen

**LÖSUNG IMPLEMENTIERT:**
- ✅ Neue Funktion `saveTrainingPlan()` in `src/lib/firestore.ts` erstellt
- ✅ Dashboard ruft jetzt `await saveTrainingPlan()` nach Generierung auf
- ✅ API Route `/api/training/plan` lädt jetzt neuesten Plan (sortiert nach `createdAt DESC`)
- ✅ Plan wird mit Timestamp-ID gespeichert: `plan-${Date.now()}`

**Geänderte Dateien:**
1. `src/lib/firestore.ts` - Neue Funktionen hinzugefügt:
   - `saveTrainingPlan()` - Speichert vollständigen Plan
   - `getTrainingPlan()` - Lädt Plan per ID
   - `getLatestTrainingPlan()` - Lädt neuesten Plan
2. `src/app/dashboard/page.tsx` - Zeile ~640:
   - Import von `saveTrainingPlan` hinzugefügt
   - `await saveTrainingPlan(userId, fullPlan)` nach Generierung
3. `src/app/api/training/plan/route.ts`:
   - Query von `.doc('current')` zu `.orderBy('createdAt', 'desc').limit(1)`

**TESTEN:**
1. Browser öffnen: http://localhost:3001
2. Login
3. "Generate Plan" klicken
4. Console prüfen: "💾 Saving plan to Firestore..." → "✅ Plan saved"
5. Firebase Console: `users/{userId}/plans/plan-{timestamp}` sollte existieren
6. Page reload → Neuer Plan sollte geladen werden

---

## 🟡 HOCH - Funktionalität eingeschränkt

### Issue #2: Fitness-Chart zeigt keine Zukunftsprognose
**Seite:** Dashboard  
**Status:** 🟡 HOCH  
**Beschreibung:** Der Fitness-Graph zeigt nur aktuelle Werte, aber keine zukünftige Prognose basierend auf geplantem Training.  
**Erwartetes Verhalten:** 
- Vergangenheit: CTL/ATL/TSB aus tatsächlichen Aktivitäten
- Zukunft: Prognose basierend auf geplantem Training (gestrichelte Linie)

**Zu prüfen:**
- [ ] Wird `forecastFitnessMetrics()` aufgerufen?
- [ ] Werden geplante Sessions für Forecast übergeben?
- [ ] FitnessChart Component unterstützt Forecast-Daten?

**Technische Details:**
- Component: `src/components/FitnessChart.tsx`
- Funktion: `forecastFitnessMetrics()` aus `src/lib/fitnessMetrics.ts`
- Dashboard: Zeile ~450-500

---

### Issue #3: Settings - Slot-Änderungen werden nicht gespeichert
**Seite:** Settings → Training Time Slots  
**Status:** 🟡 HOCH  
**Beschreibung:** Trotz Änderungen der Time Slots und Klick auf "Save Time Slots" werden die Werte nicht übernommen/gespeichert.  
**Screenshot:** Siehe Image 2+3  
**Erwartetes Verhalten:** 
- Slots bearbeitbar (Tag, Zeit, Typ ändern)
- Nach "Save" → Firestore Update
- Nach "Save" → UI zeigt gespeicherte Werte

**Zu prüfen:**
- [ ] Console-Fehler bei Save?
- [ ] Firestore Update erfolgreich?
- [ ] State-Update in React?
- [ ] Form-Validierung blockiert Save?
- [ ] Firestore Rules erlauben Update?

**Technische Details:**
- Seite: `src/app/settings/page.tsx` oder Settings-Component
- Firestore: `users/{userId}` → `preferences.preferredTrainingTimes[]`
- Funktion: `updateUserProfile()` aus `src/lib/firestore.ts`

---

### Issue #4: Settings - Standard-Woche Änderungen nicht übernommen
**Seite:** Settings → Training Time Slots → Standard-Woche  
**Status:** 🟡 HOCH  
**Beschreibung:** Trotz Änderung des Standard-Wochenplans werden die Werte nicht übernommen.  
**Erwartetes Verhalten:** 
- Wechsel zwischen "Standard-Woche" und "Wochen-Planung"
- Änderungen werden gespeichert
- Bei "Woche ausgleichen" werden Slots automatisch adjustiert

**Zu prüfen:**
- [ ] Welcher State speichert Standard vs. Custom?
- [ ] Firestore Schema korrekt?
- [ ] UI-Update nach Save?

---

## 🟢 NIEDRIG - UX Verbesserungen

### Issue #5: Settings - Layout könnte übersichtlicher sein
**Seite:** Settings  
**Status:** 🟢 NIEDRIG - UX Enhancement  
**Beschreibung:** Die Daten könnten nebeneinander stehen, das macht das Ganze übersichtlicher.  
**Vorschlag:** 
- Zwei-Spalten-Layout für Settings
- Gruppierung nach Kategorie (Physiological, Strava, Training Times, etc.)

**Zu prüfen:**
- [ ] Grid-Layout implementieren
- [ ] Responsive Design für Mobile

---

## ✅ FUNKTIONIERT

### Dashboard - Morning Check
**Status:** ✅ OK  
**Beschreibung:** Morning Check scheint zu funktionieren, wird zumindest keine Fehlermeldung ausgegeben.

### Dashboard - Tagesplan wird angezeigt
**Status:** ✅ OK  
**Beschreibung:** Tagesplan wird angezeigt, Details kommen unter Trainingsplan.

### Dashboard - Graph wird angezeigt
**Status:** ✅ OK (aber siehe Issue #2 für Zukunftsprognose)  
**Beschreibung:** Der aktuelle Fitness-Graph wird angezeigt.

### Dashboard - Weekly Training Plan Button
**Status:** ✅ OK  
**Beschreibung:** Der Button funktioniert (vermutlich Navigation zu Training Plan Page).

### Activities
**Status:** ✅ OK  
**Beschreibung:** Alle Aktivitäten sind vorhanden.

---

## 🔧 NÄCHSTE SCHRITTE - PRIORISIERT

1. **🔴 KRITISCH:** Issue #1 - Plan-Generierung reparieren (HÖCHSTE PRIO)
2. **🟡 HOCH:** Issue #3 - Settings Slot-Speicherung fixen
3. **🟡 HOCH:** Issue #4 - Standard-Woche Speicherung fixen
4. **🟡 HOCH:** Issue #2 - Fitness Forecast implementieren
5. **🟢 NIEDRIG:** Issue #5 - Settings Layout verbessern

---

## 📋 DEBUG-CHECKLISTE FÜR ISSUE #1 (Plan-Generierung)

### Browser Console Checks:
```javascript
// 1. Prüfen ob generateMvpWeeklyPlan aufgerufen wird
console.log('🔍 Generating plan...');

// 2. Prüfen ob Workout Library lädt
console.log('✅ Loaded workout library:', library);

// 3. Prüfen ob Firestore schreibt
console.log('💾 Saving plan to Firestore:', planData);

// 4. Prüfen ob State updated
console.log('🔄 Updated trainingPlan state:', trainingPlan);
```

### Network Tab Checks:
- [ ] `/workouts/index.json` lädt erfolgreich (Status 200)
- [ ] `/workouts/lit.json`, `/workouts/ftp.json` etc. laden
- [ ] Firestore API Calls erfolgreich
- [ ] Keine 403 Forbidden Errors

### Firestore Rules Check:
```javascript
// Prüfen ob User schreiben darf:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /plans_weekly/{planId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 💡 DEBUGGING-TIPPS

### Für Issue #1 (Plan-Generierung):
1. Browser Dev Tools öffnen (F12)
2. Console Tab öffnen
3. Network Tab öffnen
4. "Generate Plan" Button klicken
5. Alle roten Errors dokumentieren
6. Firestore Tab in Firebase Console checken → Wird Plan geschrieben?

### Für Issue #3/4 (Settings nicht gespeichert):
1. Browser Dev Tools öffnen (F12)
2. Console Tab öffnen
3. "Save Time Slots" klicken
4. Firestore Network Request checken
5. Firebase Console → Firestore → users/{userId} → Wurden Werte geändert?

---

**Erstellt:** 01.11.2025  
**Letzte Aktualisierung:** 01.11.2025  
**Tester:** User (eberhard.janzen)  
**Status:** 🔴 4 kritische/hohe Issues offen
