# Cyclona Adaptive Training System - Finale Spezifikation

**Version**: 1.0  
**Datum**: 2025-11-01  
**Status**: ✅ READY FOR IMPLEMENTATION  

---

## Übersicht

Cyclona ist ein adaptives Trainingssystem für Radsportler, das drei Kernkomponenten vereint:

1. **Weekly Duration & Slots System** - User definiert maximale Wochendauer und verfügbare Zeitfenster
2. **Workout Library (120 Workouts)** - Strukturierte, wissenschaftlich fundierte Trainingseinheiten
3. **Adaptive Engine** - KI-gestützte tägliche Anpassung basierend auf Readiness und TSB

### Kernprinzipien

- **User Constraints First**: System plant NIE mehr als festgelegte Wochendauer oder Slot-Maximaldauer
- **Recovery-Awareness**: System kann WENIGER planen als Maximum (für optimale Erholung)
- **Scientific Foundation**: Basiert auf TSS, CTL/ATL/TSB, Periodisierung, FTP-Zonen
- **Transparency**: User versteht immer WARUM die App etwas tut
- **User Control**: Override-Möglichkeiten mit Warnungen

---

## TEIL 1: Alle Fragen & Antworten

### Kategorie A: Weekly Duration & Slots

#### A1: Slot-Definition
**Frage**: Wie definiert User die Slots?

**Antwort**: ✅ Wie aktuelles System
- Wochentag auswählen
- Start-Zeit (optional)
- Maximaldauer (Pflicht)
- Beispiel: "Montag, 18:00-19:00 (60min max)"

---

#### A2: Wochendauer variabel?
**Frage**: Kann User verschiedene Wochendauern für verschiedene Wochen definieren?

**Antwort**: ✅ JA, wöchentlich variabel
- Base-Phase: 8h/Woche
- Build-Phase: 10h/Woche
- Taper: 5h/Woche
- User kann manuell anpassen oder Auto-Vorschläge akzeptieren

---

#### A3: Mehrere Trainings pro Tag?
**Frage**: Kann die App 2+ Trainings am selben Tag planen?

**Antwort**: ✅ JA, App entscheidet
- Wenn sinnvoll (z.B. 2x LIT für Camp-Vorbereitung)
- User kann zwei separate Slots am gleichen Tag definieren
- App plant intelligent basierend auf Phase und Ziel

---

#### A4: Dashboard-Anzeige bei Unter-Auslastung
**Frage**: Wie zeigen wir, wenn User nur 7h von 10h nutzt?

**Antwort**: ✅ "7h von 10h (70%)" mit Erklärung
- Grün: 80-100% (optimal)
- Gelb: 50-79% (OK, Recovery-Fokus)
- Rot: <50% (Warnung nach 4+ Wochen: "Ziel anpassen?")

---

#### A5: Auto-Adjust bei Slot-Änderung
**Frage**: Was passiert, wenn User Slots ändert (weniger verfügbare Zeit)?

**Antwort**: ✅ Auto-Adjust mit Warnung
- System passt Wochenziel automatisch an Slot-Kapazität an
- Warnung: "Deine Zeitslots erlauben max. 6h/Woche. Wochenziel auf 6h reduziert."
- Bei wöchentlicher Änderung: Warnung vor Planung

---

### Kategorie B: Workout Library

#### B1: Workout-Anpassung (Scaling)
**Frage**: Wie passen wir Workouts an Slots an, wenn sie nicht perfekt passen?

**Antwort**: ✅ Proportionales Scaling (inklusive Intervalle)
- Beispiel: 4x10min Sweet Spot in 75min Slot → 4x8min (proportional)
- Warmup/Cooldown bleiben fix
- TSS wird neu berechnet

---

#### B2: Progression vs. Variety
**Frage**: Wie kombinieren wir Progression (Steigerung) mit Variety (Abwechslung)?

**Antwort**: ✅ Kombination aus beiden
- **Progression**: Woche-zu-Woche Steigerung (TSS +5-10%)
- **Variety**: Rotation verschiedener Workout-Formate
- Beispiel Build-Phase Mittwoch:
  - Woche 1: 2x20min Sweet Spot
  - Woche 2: 3x15min Sweet Spot
  - Woche 3: 4x10min Sweet Spot
  - Woche 4: 2x25min Sweet Spot (Progression)

---

#### B3: Custom Workouts
**Frage**: Können User eigene Workouts hinzufügen?

**Antwort**: ❌ NEIN für MVP
- Zu risikoreich (Qualität, Sicherheit, Übertraining)
- User kann EXTERN anders trainieren
- Input kommt über Strava-Sync zurück
- System passt sich an tatsächlich absolvierte Trainings an

---

#### B4: Workout-Rating & KI-Learning
**Frage**: Sollen User Workouts bewerten?

**Antwort**: ✅ JA mit intelligenter Progression
- Rating nach jedem Workout: "Zu hart" / "Genau richtig" / "Zu leicht"
- KI lernt daraus UND setzt strategische Anreize:
  - "Zu hart" → nächstes Mal -5% Intensität
  - "Zu leicht" → NICHT zu leicht (Performance-Steigerung!)
  - **Ziel**: Außerhalb der Komfortzone, aber nicht überfordern

---

### Kategorie C: Adaptive Engine & Readiness

#### C1: Wearable-Integration
**Frage**: Welche Wearables/Apps priorisieren?

**Antwort**: ✅ Option A + B + C (All-inclusive)
- **Priorität 1**: Garmin, Whoop, Oura
- **Priorität 2**: Apple Health, Polar, COROS
- **Fallback**: Manuelle Eingabe
- Verbindung auf Einstellungsseite

---

#### C2: Fehlende Daten - Fallback
**Frage**: Was passiert ohne HRV-Daten?

**Antwort**: ✅ Quick Survey
- Frage User: "Wie fühlst du dich?"
- Inputs: Müdigkeit (1-10), Muskelkater (1-10), Schlafqualität (1-10)
- System berechnet Readiness-Score aus subjektiven Daten

---

#### C3: User-Override
**Frage**: Kann User KI-Anpassung überstimmen?

**Antwort**: ✅ JA mit Warnung
- User kann immer entscheiden
- Warnung: "Deine Daten sprechen dagegen, aber du entscheidest"
- Keine Limitierung (volle User-Kontrolle)

---

#### C4: Readiness-Score-Gewichtung
**Frage**: Wie stark gewichten wir verschiedene Faktoren?

**Antwort**: ✅ Verwendung der `readiness_config.json`
```json
{
  "readiness_weights": {
    "hrv": 0.3,        // 30% - Höchste Priorität
    "rhr": 0.2,        // 20% - Resting Heart Rate
    "sleepdur": 0.15,  // 15% - Schlafdauer
    "sleepq": 0.1,     // 10% - Schlafqualität (subjektiv)
    "soreness": 0.15,  // 15% - Muskelkater
    "stress": 0.1      // 10% - Stress-Level
  }
}
```
- **Adaptive Gewichtung**: Wöchentliches Re-Training via `update_weights.ts`
- **EMA Smoothing**: 80% alte Gewichte, 20% neue
- **Drift Cap**: Max 5% Änderung pro Woche

---

#### C5: Wetter-Integration
**Frage**: Wetter-Daten beeinflussen Planung?

**Antwort**: ✅ User entscheidet mit Warnung + Alternativen
- System warnt bei:
  - Starkregen: >70% Wahrscheinlichkeit UND >5mm/h
  - Starker Wind: >50 km/h
  - Hitze: >32°C
  - Kälte: <-5°C
- User bekommt 3 Optionen:
  1. **Indoor**: Gleiche Struktur, Indoor-geeignet
  2. **Verschieben**: Slot-Tausch innerhalb Woche
  3. **Ignorieren**: "Trotzdem fahren"

---

### Kategorie RF: Rückfragen (Vertiefung)

#### RF1: Readiness-Score-Training
**Frage**: Automatisch oder manuell re-trainieren?

**Antwort**: ✅ Option A (Automatisch)
- Cloud Function läuft **jeden Sonntag nachts**
- Re-trainiert Gewichte aus User-Feedback
- Minimum 20 Samples für Re-Training

---

#### RF2: Prescription Mapping
**Frage**: Wie stark FTP anpassen basierend auf Readiness?

**Antwort**: ✅ Option B (Konservativ 95-101%)
```
Score -1.0 bis -0.75: FTP 95%
Score -0.75 bis -0.25: FTP 97%
Score -0.25 bis +0.25: FTP 98-100%
Score +0.25 bis +0.75: FTP 100-101%
Score +0.75 bis +1.0:  FTP 101%
```
- Sicher für MVP (kein Übertraining-Risiko)

---

#### RF3: Wetter-Schwellenwerte
**Frage**: Konkrete Werte für Warnungen?

**Antwort**: ✅ Vorschlag akzeptiert (siehe C5)

---

#### RF4: Event-basierte Phasen
**Frage**: Wie viele Wochen pro Phase?

**Antwort**: ✅ 16-Wochen-Standardzyklus
- **Base**: 16-9 Wochen vor Event (7 Wochen)
- **Build**: 8-3 Wochen vor Event (6 Wochen)
- **Peak**: 2 Wochen vor Event
- **Taper**: 1 Woche vor Event

---

### Kategorie D: Integration & Workflows

#### D1: Setup-Flow
**Frage**: Welcher Setup-Flow?

**Antwort**: ✅ Advanced Setup (Single-Page)
- FTP-Test-Ergebnis (oder Schätzung)
- Wochendauer-Maximum
- Zeitslots definieren
- **Saisonziel (Event-Datum)** → Auto-berechnet Phase
- Wearable verbinden (optional)

---

#### D2: Dashboard-Priorität
**Frage**: Was zeigen wir auf der Hauptseite?

**Antwort**: ✅ Fokus auf 3 Elemente
1. **Heutiges Training** (mit "Start Workout" Button) - TOP
2. **Fitness-Kurve** (CTL/ATL/TSB Graph) - CRITICAL
3. **Nächstes Ziel** (z.B. "Race in 8 Wochen, CTL-Ziel: 95")
- ❌ KEINE Wochenübersicht
- Readiness-Score: Optional als Badge/Icon

---

#### D3: Workout-Start-Flow
**Frage**: Was passiert bei "Start Workout"?

**Antwort**: ✅ Option A (Direct Download)
- System generiert ZWO-File
- Direkter Download
- User öffnet in Zwift/MyWhoosh
- **Simple & Fast** (MVP-geeignet)

---

#### D4: FTP-Updates
**Frage**: Wie oft FTP neu testen?

**Antwort**: ✅ Option B (AI-Erkennung)
- AI erkennt aus Power-Daten: "FTP könnte gestiegen sein"
- Vorschlag für Test wenn User konstant über FTP fährt
- **Alle 3 Test-Formate unterstützen**:
  1. Ramp Test (standardisiert in ZWO)
  2. 2x8min Test
  3. 20min Test (× 0.95)
- Bei Unklarheit: Eingebauter FTP-Test wird empfohlen

---

#### D5: Multi-Sport
**Frage**: Triathlon-Support?

**Antwort**: ✅ Phase 1 nur Cycling
- Fokus auf Cycling für MVP
- Triathlon in Phase 2 (Swim/Bike/Run)
- Architektur berücksichtigt später Multi-Sport

---

### Kategorie E: Performance & Skalierung

#### E1: Workout Library Caching
**Frage**: Wie laden wir die 120 Workouts?

**Antwort**: ✅ Option A + C (Client-Side + CDN)
- Workouts in `/public/workouts/` → Firebase Hosting CDN
- Client lädt einmal beim App-Start
- Cached lokal (LocalStorage)
- **Kostenlos, schnell, einfach**

---

#### E2: Cloud Function Kosten
**Frage**: Batch oder On-Demand?

**Antwort**: ✅ Option B (On-Demand mit Cache)
- User öffnet App → Check: Readiness geändert?
- Falls NEIN → Plan aus Cache (kein Function Call)
- Falls JA → Neu generieren
- **Kosteneffizient**: ~30% der User/Tag = 3k statt 10k Calls
- Free Tier reicht für 20k User

---

#### E3: ZWO-Generation
**Frage**: Client oder Server?

**Antwort**: ✅ Option A (Client-Side)
- Browser generiert ZWO aus Workout-Daten
- Schnell, kostenlos
- Keine Server-Last

---

### Kategorie F: MVP-Scope

#### F1: Phase 1 (MVP)
**Frage**: Was muss in Launch?

**Antwort**: ✅ MVP-Scope definiert

**Must-Have**:
- ✅ Weekly Duration & Slots Setup
- ✅ Workout Library (120 Workouts)
- ✅ Makro-Planung (deterministisch)
- ✅ TSB-basierte Anpassung (ohne Readiness)
- ✅ Workout-Rating ("Zu hart"/"Perfekt"/"Zu leicht")
- ✅ ZWO-Export
- ✅ Strava-Sync (bereits vorhanden)
- ✅ Dashboard (3 Kern-Elemente)

**Phase 2** (nach Launch):
- Readiness-Integration (Garmin/Whoop/Oura)
- Volle KI-Mikroanpassung
- Wetter-Integration

---

#### F2: Phase 2 Prioritäten
**Frage**: Was nach MVP?

**Antwort**: ✅ Top 3 festgelegt
1. **Volle KI-Integration** (Garmin/Whoop Readiness + Adaptive Engine)
2. **Advanced Analytics** (Performance-Trends, Fitness-Forecast)
3. **Mobile App** (Native iOS/Android)

**Später**:
- Social Features
- Multi-Sport
- Custom Workouts

---

## TEIL 2: Technische Spezifikation

### Readiness-Score-Berechnung

```typescript
// Normalisierung (aus readiness_config.json)
hrv_z = zscore(hrv, rolling_21d)
rhr_z = -zscore(rhr, rolling_21d)  // Invertiert (niedriger = besser)
sleepdur_z = zscore(sleep_duration, rolling_21d)
sleepq_z = standardize(sleep_quality_1_10)
soreness_z = standardize_inverted(soreness_1_10)
stress_z = standardize_inverted(stress_1_10)

// Weighted Sum
readiness_raw = 
  0.3 * hrv_z + 
  0.2 * rhr_z + 
  0.15 * sleepdur_z + 
  0.1 * sleepq_z + 
  0.15 * soreness_z + 
  0.1 * stress_z

// Tanh-Mapping auf [-1, +1]
readiness_score = tanh(readiness_raw)
```

### Prescription Mapping (MVP - Konservativ)

| Readiness Score | FTP Scale | Reps Delta | On-Time | Off-Time |
|-----------------|-----------|------------|---------|----------|
| -1.0 bis -0.75  | 95%       | -1         | -10%    | +10%     |
| -0.75 bis -0.25 | 97%       | 0          | -5%     | +5%      |
| -0.25 bis +0.25 | 98-100%   | 0          | 0%      | 0%       |
| +0.25 bis +0.75 | 100-101%  | 0/+1       | +5%     | -5%      |
| +0.75 bis +1.0  | 101%      | +1         | +5%     | -5%      |

### Guardrails (Sicherheit)

1. **Kein HIT bei**:
   - Injury-Flag gesetzt
   - TSB < -25
   - Readiness < -0.75

2. **Tages-TSS Cap**:
   - Max TSS ≤ 1.6 × ATL

3. **Slot-Buffer**:
   - Workout-Dauer ≤ 95% Slot-Maximum (5min Buffer)

4. **Weekly Load Cap**:
   - Nie mehr als festgelegte Wochendauer

---

## TEIL 3: Workout Library

### Kategorien & Anzahl

| Kategorie      | Anzahl | Dauer      | Intensität      |
|----------------|--------|------------|-----------------|
| LIT            | 15     | 60-150min  | 60-75% FTP      |
| TEMPO          | 15     | 55-85min   | 80-92% FTP      |
| FTP            | 15     | 60-85min   | 95-105% FTP     |
| VO2MAX         | 15     | 45-60min   | 110-125% FTP    |
| ANAEROBIC      | 15     | 30-60min   | 140-180% FTP    |
| NEUROMUSCULAR  | 15     | 35-50min   | Max Effort      |
| SKILL          | 30     | 30-100min  | Variable        |
| **TOTAL**      | **120**|            |                 |

### Dateien

- `/workouts/index.json` - Master-Index
- `/workouts/lit.json` - LIT Workouts
- `/workouts/tempo.json` - TEMPO Workouts
- `/workouts/ftp.json` - FTP Workouts
- `/workouts/vo2max.json` - VO2MAX Workouts
- `/workouts/anaerobic.json` - ANAEROBIC Workouts
- `/workouts/neuromuscular.json` - NEUROMUSCULAR Workouts
- `/workouts/skill.json` - SKILL Workouts

### Workout JSON Struktur

```json
{
  "id": "tempo_06_3x20_tempo_85",
  "name": "3x20min Tempo @85%",
  "category": "TEMPO",
  "duration_min": 85,
  "tss_estimate": 95,
  "description": "3 × 20min @ 85% FTP mit 5min Erholung",
  "structure": [
    {
      "type": "warmup",
      "duration_s": 600,
      "intensity_ftp": 0.60,
      "cadence": null
    },
    {
      "type": "interval",
      "reps": 3,
      "on_duration_s": 1200,
      "on_intensity_ftp": 0.85,
      "off_duration_s": 300,
      "off_intensity_ftp": 0.55
    },
    {
      "type": "cooldown",
      "duration_s": 600,
      "intensity_ftp": 0.50
    }
  ]
}
```

---

## TEIL 4: Phasen-System

### Event-basierte Berechnung

```typescript
function calculatePhase(eventDate: Date, today: Date): TrainingPhase {
  const weeksUntil = Math.floor((eventDate - today) / (7 * 24 * 60 * 60 * 1000));
  
  if (weeksUntil >= 16) return "BASE";
  if (weeksUntil >= 9) return "BASE";
  if (weeksUntil >= 3) return "BUILD";
  if (weeksUntil >= 2) return "PEAK";
  if (weeksUntil >= 1) return "TAPER";
  return "RECOVERY";
}
```

### Kategorie-Verteilung nach Phase

| Phase    | LIT  | TEMPO | FTP  | VO2MAX | ANAEROBIC | SKILL |
|----------|------|-------|------|--------|-----------|-------|
| BASE     | 80%  | 10%   | 5%   | 0%     | 0%        | 5%    |
| BUILD    | 50%  | 20%   | 20%  | 5%     | 0%        | 5%    |
| PEAK     | 30%  | 20%   | 25%  | 15%    | 5%        | 5%    |
| TAPER    | 60%  | 20%   | 10%  | 5%     | 0%        | 5%    |
| RECOVERY | 90%  | 0%    | 0%   | 0%     | 0%        | 10%   |

---

## TEIL 5: Dashboard-Spezifikation

### Layout (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  Dashboard                    [Settings] [User] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  HEUTIGES TRAINING                              │   │
│  │  3x20min Tempo @85%                             │   │
│  │  85min · TSS 95 · Build Phase                   │   │
│  │                                                  │   │
│  │  [Start Workout] [Details ansehen]              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  FITNESS-KURVE (4 Wochen)                       │   │
│  │                                                  │   │
│  │  [Graph: CTL/ATL/TSB]                           │   │
│  │                                                  │   │
│  │  CTL: 82  ATL: 75  TSB: +7 (Form gut!)         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  NÄCHSTES ZIEL                                  │   │
│  │  🏁 Gran Fondo Schweiz                          │   │
│  │  📅 In 8 Wochen (21. Dezember 2025)            │   │
│  │  🎯 CTL-Ziel: 95 (aktuell: 82)                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Komponenten

1. **TodayWorkoutCard**
   - Props: `workout`, `onStart`, `onViewDetails`
   - Shows: Name, Duration, TSS, Phase, Start-Button

2. **FitnessCurveChart**
   - Props: `data` (last 28 days), `highlightToday`
   - Shows: CTL (blue), ATL (pink), TSB (gray bars)
   - Interactive hover with tooltips

3. **NextGoalCard**
   - Props: `event`, `currentCTL`, `targetCTL`
   - Shows: Event name, date, countdown, progress

---

## TEIL 6: MVP Success Metrics

### Phase 1 Launch-Kriterien

✅ **Funktional**:
- User kann Setup abschließen (FTP, Slots, Event)
- Wochenplan wird generiert
- Tagesplan wird angezeigt
- ZWO-Download funktioniert
- Strava-Sync importiert Completions
- CTL/ATL/TSB wird berechnet und angezeigt

✅ **Performance**:
- Dashboard lädt in < 2s
- ZWO-Generation < 500ms
- Keine Firestore-Quota-Überschreitungen

✅ **UX**:
- Setup in < 5 Minuten
- Dashboard zeigt relevante Info ohne Überladung
- Mobile-responsive (funktioniert auf Phone)

### Phase 1 User Testing

- **Beta-Tester**: 10 User für 4 Wochen
- **Feedback-Loop**: Wöchentliches Survey
- **Metrics**: Completion-Rate, Workout-Ratings, Retention

---

## TEIL 7: Offene Punkte (für später)

### Phase 2 Planning Needed

1. **Garmin API Integration**
   - OAuth-Flow
   - HRV/Sleep-Daten-Mapping
   - Webhook für Updates

2. **Whoop Integration**
   - API-Access beantragen
   - Recovery-Score zu Readiness-Mapping

3. **Wetter-API**
   - OpenWeatherMap oder Alternative?
   - Geo-Location aus User-Profile

4. **Mobile App**
   - React Native oder Flutter?
   - Push-Notifications-Infrastruktur

---

## Zusammenfassung

**Status**: ✅ Alle 24+ Fragen beantwortet  
**Scope**: MVP klar definiert  
**Nächster Schritt**: Implementation Phase 1  

**Geschätzter Aufwand Phase 1**: 6-8 Wochen  
**Geschätzter Aufwand Phase 2**: 8-12 Wochen  

🚀 **READY TO BUILD!**
