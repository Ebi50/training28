# 🧪 Testing Feedback Tracker

Dieses Dokument trackt alle offenen Feedback-Punkte aus dem User Testing. Wenn ein Punkt als "erledigt" markiert wird, wird er aus dieser Liste gelöscht.

---

## 📋 Offene Punkte

### ⏳ In Bearbeitung

#### 1. 🔍 SessionNotes Speichern-Fehler (DEBUGGING)
**Problem:** "Das speichern funktioniert nicht bitte nochmals prüfen"

**Status:** 🔍 ERWEITERTE DEBUG-LOGS
- ✅ Code überprüft: `SessionNotes.tsx`, `plan/page.tsx`, `firestore.ts` - alles korrekt
- ✅ Zusätzliche Checks hinzugefügt:
  * `trainingPlan?.id` Validierung (muss existieren)
  * `session?.id` Validierung
  * Detaillierte Console-Logs mit Emojis (💾, ✅, ❌)
  * Bessere Error-Messages mit Hinweis auf Browser-Console
  
**Nächster Schritt:**
- Browser-Console öffnen (F12 → Console Tab)
- "Speichern" klicken
- Schauen was geloggt wird:
  * `💾 Saving session updates:` → Zeigt alle Daten
  * `✅ Session saved successfully` → Erfolgreich gespeichert
  * `❌ Error saving notes:` → Fehler (mit Details)
- Screenshot von Console-Logs teilen!

#### 2. ✅ Workout-Beschreibung Format
**Problem 1:** `Tempo Ride - 2x20min @ 88-94% FTP (5min rest) • Total: 1:05h (54 TSS)`
- User wollte "• Total: 1:05h" entfernen
- TSS (54 TSS) soll bleiben

**Problem 2:** `Endurance Base - 55min @ 60-75% FTP (Zone 2) (36 TSS)`
- Zeitangabe "55min" unnötig, steht unten drunter

**Status:** ✅ GEFIXT
- "• Total: X" entfernt aus allen HIT-Workouts (vo2max, threshold, tempo)
- Zeitangabe aus Endurance entfernt: Jetzt nur `@ 60-75% FTP (Zone 2) (36 TSS)`
- TSS bleibt in Beschreibung

#### 3. ✅ Wochenübersicht Layout
**Problem:** TSS, Hours, HIT, LIT standen untereinander (Grid)
- Sollen nebeneinander stehen
- HIT soll als Prozent angezeigt werden (wie LIT)

**Status:** ✅ GEFIXT → ✅ ERLEDIGT (User bestätigt)
- Layout: `flex gap-6` statt Grid
- Trennlinien: `|` zwischen den Werten
- HIT: `{(1 - litRatio) * 100}%` (Komplementär zu LIT)
- LIT: `{litRatio * 100}%` (wie vorher)

#### 4. ✅ Trainingsdauer vs TimeSlot
**Problem:** Montag TimeSlot 6:00-7:00 (60min), aber Training zeigt 1:05h (65min)
- Training muss sich am verfügbaren TimeSlot orientieren
- User erwartet: Slot = 60min → Training = 60min

**Status:** ✅ GEFIXT
- **Vorher:** `sessionDuration = Math.min(slotDuration, idealDuration)`
  - `idealDuration` war Formel (z.B. `TSS * 1.5`), konnte Slot überschreiben
- **Jetzt:** `sessionDuration = slotDuration`
  - Training passt **exakt** in verfügbaren TimeSlot
  - `idealDuration` nur noch für TSS-Adjustment-Berechnung
- **Beispiel:** 6:00-7:00 Slot → Session = genau 60min

---

## ✅ Erledigte Punkte

*(Punkte werden hier aufgelistet wenn User "erledigt" bestätigt, dann aus "Offene Punkte" gelöscht)*

### Bereits implementiert in dieser Session:
1. ✅ RPE Slider → Buttons (Leicht/Mittel/Schwer)
2. ✅ Export-Button kombiniert (Zwift / MyWhoosh)
3. ✅ Workout-Beschreibung Format (TSS behalten, "Total: X" entfernen)
4. ✅ Wochenübersicht horizontal mit HIT als Prozent
5. ✅ Features von Dashboard auf Training Plan Seite verschoben
6. ✅ Zeit-Format bei LIT/HIT gefixt (1:08h statt 1:7.5h)

#### 5. ✅ TimeSlot-Respektierung & Multi-Session-Tage (REVIDIERT)
**Problem 1:** "generiert nur noch jeden Tag 2h stupide und einseitig"
- Plan ignorierte TimeSlots komplett
- Generierte z.B. 2h Training obwohl User nur 2x 1h Slots hat

**Problem 2:** "Donnerstag nicht trainiert wird"
- System ignorierte wenn User für bestimmte Tage KEINE TimeSlots definiert hat

**Problem 3:** "da ging etwas schief ...er findet keinen Trainingsplan"
- Erste Fix-Version war zu aggressiv (generierte gar keine Sessions mehr)

**Status:** ✅ GEFIXT (2. Iteration - intelligentere Logik)

**Multi-Slot-Logik (SMART):**
```typescript
// Single Slot → Immer eine Session
if (availableSlots.length === 1) { ... }

// Multiple Slots → Split NUR wenn nötig:
const needsSplit = 
  longestSlotDuration < idealDuration * 0.7  // Slot zu kurz für Training
  || (type === 'LIT' && totalTime > 120 && idealDuration > 90); // Lange LIT-Sessions

if (needsSplit) {
  return createMultiSessionDay(); // 2+ Sessions
} else {
  return createSingleSession(); // 1 Session im besten Slot
}
```

**Wann wird gesplittet:**
- ✅ Längster Slot < 70% der idealen Duration (z.B. 2x 30min für 80min Training)
- ✅ LIT-Training > 90min ideal UND total verfügbar > 120min (lange Ausfahrten)
- ❌ NICHT bei 2x 60min für 60min Training (nutzt einen Slot)

**TimeSlot-Respektierung:**
- **Szenario 1:** KEINE TimeSlots → Defaults (Mo-Fr 8:00-10:00, **Day 0-4 korrigiert!**)
- **Szenario 2:** TimeSlots vorhanden, Tag ohne Slot → Rest Day
- **Beispiel:** Donnerstag keine Slots → Rest Day

**Ergebnis:**
- ✅ Plan wird wieder generiert
- ✅ Intelligentes Splitting (nur wenn sinnvoll)
- ✅ Respektiert User-Zeitplan

---

## 🎯 Neue Features

### HIT-Intervall-Varianz (NEU!)
**Problem:** "HIT scheint immer gleich zu sein... wird das sehr stupide beim Training"

**Lösung:** ✅ IMPLEMENTIERT
- **4 verschiedene Intervall-Varianten** pro HIT-Typ die rotieren:

**VO2max Varianten:**
1. Classic: 5min @ 110-120% FTP (3min rest)
2. Equal: 4min @ 110-120% FTP (4min rest)
3. Short: 3min @ 110-120% FTP (2min rest)
4. Long: 6min @ 110-120% FTP (3min rest)

**Threshold Varianten:**
1. Classic: 10min @ 95-105% FTP (5min rest)
2. Short: 8min @ 95-105% FTP (4min rest)
3. Long: 12min @ 95-105% FTP (5min rest)
4. Extended: 15min @ 95-105% FTP (5min rest)

**Tempo Varianten:**
1. Classic: 20min @ 88-94% FTP (5min rest)
2. Short: 15min @ 88-94% FTP (5min rest)
3. Frequent: 12min @ 88-94% FTP (3min rest)
4. Long: 25min @ 88-94% FTP (5min rest)

**System:** Varianten rotieren automatisch basierend auf HIT-Session-Count (% 4)
→ Jede 4. HIT-Session hat eine andere Struktur = Mehr Abwechslung! 🎉

---

## 📝 Notizen

- ZWO-Format ist identisch für Zwift und MyWhoosh → Ein Button reicht
- Duration-Rundung jetzt in allen Workout-Typen (vo2max, threshold, tempo, endurance)
- Button-Styling: Gradient Orange→Lila
- HIT-Varianz: Kein Extra-Input nötig, rotiert automatisch

---

**Letzte Aktualisierung:** 2025-11-01
**Nächster Test:** HIT-Intervall-Varianz + Speichern-Error (brauche Console-Log)
