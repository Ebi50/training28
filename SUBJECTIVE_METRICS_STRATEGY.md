# 🧠 Subjektive Metriken - Strategie & Bewertung

**Erstellt:** 31.10.2025  
**Frage:** Sollen subjektive Bewertungen (Schlaf, Müdigkeit, Wohlbefinden) in die Trainingsplan-Anpassung einfließen?

---

## ✅ WAS BEREITS EXISTIERT

### Datenmodell vorhanden (aber nicht genutzt):
```typescript
interface DailyMetrics {
  hrv?: number;           // Heart Rate Variability (objektiv, z.B. von Garmin)
  sleepScore?: number;    // Schlafqualität (objektiv, z.B. von Whoop/Garmin)
  rpe?: number;           // Rate of Perceived Exertion (1-10)
  fatigue?: number;       // Subjektive Müdigkeit (1-10)
}
```

**Status:** Felder sind definiert, aber:
- ❌ Keine UI zum Eingeben
- ❌ Nicht in ML-Features
- ❌ Nicht in Planungs-Algorithmus berücksichtigt

---

## 🎯 BEWERTUNG: Ist das sinnvoll?

### ✅ PRO - Gute Gründe dafür:

1. **Wissenschaftlich fundiert:**
   - HRV ist einer der **besten Indikatoren** für Erholung
   - Schlafqualität korreliert stark mit Performance
   - RPE ist valide (wird in Studien verwendet)

2. **Praktischer Nutzen:**
   - Verhindert Übertraining (z.B. "Heute müde → LIT statt HIT")
   - Optimiert Erholung
   - Personalisierter als nur TSS/CTL/ATL

3. **Echtes Adaptive Training:**
   - Plan reagiert auf **aktuellen Zustand**, nicht nur Historie
   - Flexibilität: "Plane 5h, aber wenn müde → 3h"

### ⚠️ CONTRA - Herausforderungen:

1. **Komplexität:**
   - User muss **täglich** Daten eingeben (nervt?)
   - Zusätzlicher Aufwand vor jedem Training
   - Compliance: Werden User das tun?

2. **Update-Frequenz:**
   - Nicht mehr 1x täglich, sondern **vor jedem Training**
   - Mehr Cloud Function Calls (Kosten?)
   - Plan ändert sich häufiger (verwirrend?)

3. **Datenqualität:**
   - Subjektive Werte schwanken (Stimmung, Tagesform)
   - Nicht jeder hat HRV-Sensor (Whoop, Oura Ring)
   - "Garbage in, garbage out" Risiko

---

## 💡 MEINE EMPFEHLUNG: Hybrid-Ansatz

### ✨ Phase 1 (MVP) - OPTIONAL SUBJEKTIV:
**Tägliche morgendliche Eingabe (freiwillig):**

```typescript
interface MorningCheckIn {
  date: string;
  sleepQuality: 1-5;      // Skala: 😴 😐 😊 😃 🤩
  fatigue: 1-5;           // Skala: 🔋 (frisch) bis 🪫 (kaputt)
  motivation: 1-5;        // Skala: 😫 bis 💪
  soreness: 1-5;          // Muskelkater: 0-5
  stress: 1-5;            // Mentaler Stress: niedrig-hoch
  notes?: string;         // Freies Textfeld
}
```

**Timing:** Einmal morgens (Push-Notification um 07:00)  
**Frequenz:** Täglich, aber **OPTIONAL**  
**Update:** 1x pro Tag (morgens) → Plan für heute anpassen

### 🎯 Phase 2 (Advanced) - PRE-WORKOUT CHECK:
**Vor jedem Training (optional, aber empfohlen):**

```typescript
interface PreWorkoutCheck {
  sessionId: string;
  readiness: 1-10;       // "Wie bereit fühlst du dich?"
  energyLevel: 1-10;     // Energielevel jetzt
  timeAvailable: number; // Tatsächlich verfügbare Zeit (Minuten)
  indoorOption: boolean; // Kann nur indoor? (Wetter, etc.)
}
```

**Effekt:** 
- Workout wird **in Echtzeit angepasst**
- "Geplant: 2h, aber nur 90min Zeit + müde" → automatisch 90min LIT
- **Kein Re-Planning der ganzen Woche**, nur diese Session

---

## 🔧 TECHNISCHE UMSETZUNG

### Variante A: Einfach (EMPFEHLUNG)
**Morgen-Check (1x täglich):**

```typescript
// 1. User füllt Morgen-Check aus (07:00)
const morningCheck = {
  date: '2025-10-31',
  sleepQuality: 3,  // Mittel
  fatigue: 4,       // Etwas müde
  motivation: 5,    // Top motiviert
  soreness: 2,      // Leichter Muskelkater
};

// 2. Algorithmus berechnet "Readiness Score"
const readinessScore = calculateReadiness(morningCheck);
// Output: 0.7 (70% bereit)

// 3. Plan-Anpassung für HEUTE
if (readinessScore < 0.6) {
  // Zu müde → Workout reduzieren oder verschieben
  adjustTodaysWorkout('reduce', 0.7); // 30% Reduktion
} else if (readinessScore > 0.9) {
  // Top-Form → Optional: Workout intensivieren
  suggestBonusSession();
}
```

**Vorteile:**
- ✅ Nur 1x täglich (30 Sekunden Aufwand)
- ✅ Keine Unterbrechung vor Training
- ✅ Einfache Logik
- ✅ Plan bleibt stabil (nur heute angepasst)

### Variante B: Komplex (SPÄTER)
**Pre-Workout Check (vor jeder Session):**

```typescript
// User öffnet App vor Training
// → Pop-up: "Wie fühlst du dich?" (3 Fragen, 15 Sekunden)
const preWorkoutCheck = {
  readiness: 7,
  energyLevel: 6,
  timeAvailable: 90, // Nur 90min, nicht 120min geplant
};

// Algorithmus passt SESSION an (nicht ganze Woche)
const adjustedSession = adaptSession(plannedSession, preWorkoutCheck);
// Geplant: 2h HIT (120 TSS)
// Angepasst: 90min Tempo (80 TSS)
```

**Vorteile:**
- ✅ Maximale Flexibilität
- ✅ Präziseste Anpassung

**Nachteile:**
- ❌ User muss vor JEDEM Training eingeben (nervt)
- ❌ Komplexer
- ❌ Plan wird instabil (schwer zu tracken)

---

## 🚀 EMPFOHLENE IMPLEMENTIERUNG

### Phase 1a: Morgen-Check (JETZT)
**Aufwand:** ~3-4 Stunden  
**User-Experience:** ⭐⭐⭐⭐ (gut)

1. ✅ Morning-Check UI (Modal, 5 Fragen)
2. ✅ `calculateReadiness()` Algorithmus
3. ✅ Heute-Anpassung (nur aktueller Tag)
4. ✅ Push-Notification um 07:00 (optional)

**Output:** Plan bleibt stabil, aber reagiert auf Tagesform

### Phase 1b: HRV-Integration (OPTIONAL)
**Wenn User Whoop/Garmin/Oura hat:**

```typescript
// Automatischer Import von HRV-Daten
const hrvData = await getHrvFromDevice(userId);
if (hrvData.hrv < hrvData.baseline * 0.85) {
  // HRV deutlich unter Baseline → Forced Recovery
  recommendRecoveryDay();
}
```

**Vorteil:** Objektive Daten, keine manuelle Eingabe

### Phase 2: Pre-Workout Check (SPÄTER)
**Nur wenn User das wollen** (Opt-in Feature)

---

## 🤖 KI-INTEGRATION: Ja oder Nein?

### Frage: Brauchen wir KI für subjektive Metriken?

**Meine Antwort: JEIN - Kommt drauf an:**

### ✅ KI sinnvoll für:
1. **Pattern Recognition:**
   - "User sagt immer müde, trainiert aber gut" → Lerne das
   - "Nach 3 HIT-Tagen immer Fatigue-Spike" → Erkenne Pattern

2. **Personalisierte Schwellenwerte:**
   - User A: Fatigue 4/10 = OK
   - User B: Fatigue 4/10 = zu viel
   - KI lernt individuelle Toleranz

3. **Natürliche Sprache:**
   - User: "Heute etwas schlapp, aber kann trainieren"
   - KI: → Readiness = 6/10, reduziere Intensität 20%

### ❌ KI NICHT nötig für:
1. **Basis-Logik:**
   ```typescript
   if (fatigue > 7 && sleepQuality < 3) {
     return 'recovery_day';  // Einfache Regel
   }
   ```

2. **Readiness Score:**
   ```typescript
   const readiness = (
     sleepQuality * 0.3 +
     (10 - fatigue) * 0.3 +
     motivation * 0.2 +
     (10 - soreness) * 0.1 +
     (10 - stress) * 0.1
   ) / 10;
   ```
   → Einfache gewichtete Summe, keine KI nötig!

---

## 📊 VERGLEICH: Verschiedene Ansätze

| Ansatz | User-Aufwand | Komplexität | Genauigkeit | Empfehlung |
|--------|--------------|-------------|-------------|------------|
| **Keine Subjektiv-Daten** | ⭐ Minimal | ⭐ Einfach | ⭐⭐ Mittel | ❌ Zu unflexibel |
| **Morgen-Check (Optional)** | ⭐⭐ 30s/Tag | ⭐⭐ Mittel | ⭐⭐⭐⭐ Gut | ✅ **EMPFOHLEN** |
| **Pre-Workout Check** | ⭐⭐⭐ Vor jedem Training | ⭐⭐⭐ Komplex | ⭐⭐⭐⭐⭐ Sehr gut | ⏸️ Später (Opt-in) |
| **HRV Auto-Import** | ⭐ Automatisch | ⭐⭐⭐⭐ Sehr komplex | ⭐⭐⭐⭐⭐ Sehr gut | 🔮 Zukunft (Phase 3) |
| **KI-gestützt** | ⭐⭐ Mittel | ⭐⭐⭐⭐⭐ Sehr komplex | ⭐⭐⭐⭐⭐ Sehr gut | 🔮 Zukunft (Phase 4) |

---

## 🎯 FINALE EMPFEHLUNG

### ✅ JA, subjektive Metriken einbauen!

**ABER:** Schrittweise und optional:

### Start: Morgen-Check (Freiwillig)
```
07:00 Push: "☀️ Guten Morgen! Wie geht's?"
→ 5 Quick-Questions (30 Sekunden)
→ Plan für HEUTE anpassen
→ NICHT ganze Woche umwerfen
```

**Vorteile:**
- ✅ Einfach zu implementieren (~4h)
- ✅ User können es ignorieren (Plan läuft trotzdem)
- ✅ Nicht zu nervend (1x morgens)
- ✅ Echte Verbesserung für die, die es nutzen

### Später: Advanced Features
- HRV-Auto-Import (Garmin/Whoop API)
- Pre-Workout Check (Opt-in)
- KI-Pattern-Recognition

---

## 🔧 KONKRETE IMPLEMENTATION

### Neue Dateien:
```
src/app/dashboard/morning-check/page.tsx  (UI)
src/lib/readinessCalculator.ts            (Logik)
src/lib/sessionAdapter.ts                 (Workout-Anpassung)
functions/src/morningCheckTrigger.ts      (Notification)
```

### Firestore Collections:
```typescript
/users/{userId}/morningChecks/{date}
{
  date: '2025-10-31',
  sleepQuality: 3,
  fatigue: 4,
  motivation: 5,
  soreness: 2,
  stress: 3,
  readinessScore: 0.72,
  notes: 'Leichter Muskelkater von gestern',
  submittedAt: Timestamp
}
```

### ML-Feature Erweiterung:
```typescript
// Für ML-Predictions auch subjektive Daten nutzen
interface ExtendedMLFeatures extends MLFeatures {
  readiness_score: number;      // 0-1
  sleep_quality_7d: number;     // Durchschnitt letzte 7 Tage
  fatigue_trend: number;        // Steigend/Fallend
  hrv_deviation?: number;       // Wenn verfügbar
}
```

---

## ⏱️ ZEITPLAN

**Wenn wir das machen wollen:**

| Task | Dauer | Priorität |
|------|-------|-----------|
| Morning-Check UI | 2h | Phase 1a |
| Readiness-Calculator | 1h | Phase 1a |
| Session-Adapter | 1h | Phase 1a |
| Push-Notification | 1h | Phase 1b |
| ML-Feature-Update | 2h | Phase 2 |
| HRV-Integration | 4h | Phase 3 |
| Pre-Workout-Check | 3h | Phase 3 |

**Total Phase 1a:** ~4 Stunden  
**Total Phase 1a+1b:** ~5 Stunden

---

## 🤔 DEINE ENTSCHEIDUNG

### Option 1: Morgen-Check JETZT (Empfehlung)
- Implementieren in Phase 1 (vor Auto-Update)
- ~4h zusätzlicher Aufwand
- Bessere Trainingsplanung ab Tag 1

### Option 2: Erst ML-Integration, dann Subjektiv
- Fokus auf ML + Auto-Update (wie geplant)
- Subjektive Metriken in Phase 2-3
- Weniger Aufwand initial

### Option 3: Nur HRV-Import (keine manuelle Eingabe)
- Für User mit Whoop/Garmin/Oura
- Automatisch, kein User-Aufwand
- Aber: Nicht jeder hat HRV-Device

---

## ❓ MEINE FRAGE AN DICH

**Was bevorzugst du?**

1. **Morgen-Check JETZT** (4h mehr, aber besseres System)
2. **ML erst, Subjektiv später** (wie geplant, weniger Aufwand)
3. **Beides parallel** (anspruchsvoll, aber komplett)

**Und:** Wie wichtig ist dir das Thema? 
- 🔥 Sehr wichtig → JETZT machen
- 😊 Nice-to-have → Später
- 🤷 Optional → Kann warten

**Lass mich wissen was du denkst!** 💭
