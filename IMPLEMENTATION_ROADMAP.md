# Cyclona - Implementation Roadmap (Phase 1 MVP)

**Version**: 1.0  
**Datum**: 2025-11-01  
**Status**: ✅ READY TO START  
**Geschätzter Aufwand**: 6-8 Wochen  

---

## Übersicht

Phase 1 MVP umfasst die Kern-Features ohne volle KI-Integration:
- ✅ Weekly Duration & Slots System
- ✅ Workout Library (120 Workouts)
- ✅ Makro-Planung (deterministisch)
- ✅ TSB-basierte Anpassung
- ✅ Workout-Rating
- ✅ ZWO-Export
- ✅ Dashboard
- ✅ Strava-Sync (bereits vorhanden)

---

## Sprint-Plan (6 Sprints × 1-2 Wochen)

### Sprint 0: Setup & Foundation (Woche 1)

**Ziel**: Entwicklungsumgebung + Basis-Infrastruktur

**Tasks**:
1. ✅ Git Repository Setup (bereits vorhanden)
2. ✅ Firebase Project erstellen (bereits vorhanden)
3. ✅ Next.js Projekt initialisieren (bereits vorhanden)
4. ✅ Tailwind CSS + Design System (bereits vorhanden)
5. ✅ TypeScript Interfaces definieren (bereits vorhanden)
6. ✅ Firebase Emulators Setup (bereits vorhanden)
7. ✅ Firestore Rules erstellen (bereits vorhanden)
8. ✅ Strava OAuth (bereits vorhanden)

**Deliverables**:
- ✅ Entwicklungsumgebung läuft
- ✅ Firebase Auth funktioniert
- ✅ Strava Connection funktioniert
- ✅ Basic Layout + Navigation

**Status**: ✅ COMPLETE

---

### Sprint 1: Core Data Models + Workout Library (Woche 2)

**Ziel**: TypeScript Types, Firestore Schema, Workout Library Integration

**Tasks**:

#### 1.1 TypeScript Interfaces finalisieren
- [ ] `src/types/workout.ts` - Workout, WorkoutSegment, WorkoutCategory
- [ ] `src/types/user.ts` - UserProfile, TimeSlot, Event
- [ ] `src/types/plan.ts` - WeeklyPlan, DailyPlan, Completion
- [ ] `src/types/metrics.ts` - DailyMetrics, ReadinessScore

**Aufwand**: 4 Stunden

#### 1.2 Workout Library laden
- [ ] `/public/workouts/` Verzeichnis erstellen (bereits vorhanden)
- [ ] JSON Files kopieren (bereits vorhanden: lit.json, tempo.json, etc.)
- [ ] `src/lib/workoutLibrary.ts` - Loader + Cache-Logik
- [ ] Unit Tests für Library-Loader

**Aufwand**: 6 Stunden

#### 1.3 Firestore Collections Setup
- [ ] Firestore Schema dokumentieren (siehe ARCHITECTURE.md)
- [ ] Collection Groups erstellen (users, profile, availability, etc.)
- [ ] Security Rules testen (Emulator)
- [ ] Index-Konfiguration (firestore.indexes.json)

**Aufwand**: 4 Stunden

#### 1.4 TSS Calculation Library
- [ ] `src/lib/tssCalculator.ts` implementieren
  - Power-based TSS
  - HR-based TSS
  - RPE-based fallback
- [ ] CTL/ATL/TSB Berechnung (EMA mit 42d/7d)
- [ ] Unit Tests mit Beispieldaten

**Aufwand**: 8 Stunden

**Sprint 1 Total**: ~22 Stunden (~3 Tage)

**Deliverables**:
- ✅ Alle TypeScript Types definiert
- ✅ Workout Library ladbar
- ✅ Firestore Schema deployed
- ✅ TSS/CTL/ATL/TSB funktioniert

---

### Sprint 2: Setup Flow + User Profile (Woche 2-3)

**Ziel**: Initial Setup Experience (FTP, Slots, Event)

**Tasks**:

#### 2.1 Setup-Flow UI
- [ ] `/app/setup/page.tsx` - Multi-Step-Form
  - Step 1: FTP-Input (mit Schätz-Option)
  - Step 2: Slots definieren (SlotEditor Component)
  - Step 3: Event-Datum + Ziel (optional)
  - Step 4: Wearables verbinden (optional, später)
- [ ] `src/components/SlotEditor.tsx` - Time Slot Editor
  - Add/Remove Slots
  - Day-of-Week Selector
  - Duration Input
  - Priority Selector
- [ ] Form Validation (Zod Schema)
- [ ] Responsive Design (Mobile + Desktop)

**Aufwand**: 12 Stunden

#### 2.2 User Profile Management
- [ ] `src/lib/firestore.ts` - CRUD Operations
  - `createUserProfile()`
  - `updateUserProfile()`
  - `getUserProfile()`
- [ ] `src/lib/firestore.ts` - Slots Management
  - `createTimeSlot()`
  - `updateTimeSlot()`
  - `deleteTimeSlot()`
  - `getTimeSlots()`
- [ ] Error Handling + Loading States

**Aufwand**: 8 Stunden

#### 2.3 Phase Calculation
- [ ] `src/lib/phaseCalculator.ts` implementieren
  - `calculatePhase(eventDate, today)` → BASE/BUILD/PEAK/TAPER
  - `getCategoryDistribution(phase)` → Prozent-Mix
- [ ] Unit Tests mit verschiedenen Event-Distanzen

**Aufwand**: 4 Stunden

**Sprint 2 Total**: ~24 Stunden (~3 Tage)

**Deliverables**:
- ✅ Setup-Flow vollständig
- ✅ User kann FTP, Slots, Event eingeben
- ✅ Daten werden in Firestore gespeichert
- ✅ Phase wird korrekt berechnet

---

### Sprint 3: Plan Generation (Makro) (Woche 3-4)

**Ziel**: Wochenplanung generieren (deterministisch)

**Tasks**:

#### 3.1 Plan Generator Core
- [ ] `src/lib/planGenerator.ts` - Hauptlogik
  - `generateWeeklyPlan(user, slots, phase, weeklyTSS)`
  - TSS-Allocation zu Slots
  - Workout-Matching (Category + Duration Filter)
  - Progression + Variety Logic
- [ ] `selectWorkout()` - Workout-Auswahl-Algorithmus
  - Filter nach Kategorie + Dauer
  - Bevorzuge Variety (nicht zweimal gleiches Workout)
  - Wähle closest TSS Match
- [ ] `scaleWorkout()` - Proportionales Scaling
  - Warmup/Cooldown fix
  - Intervals proportional anpassen
  - TSS neu berechnen

**Aufwand**: 16 Stunden

#### 3.2 Weekly Plan Storage
- [ ] `createWeeklyPlan()` in Firestore
- [ ] `createDailyPlans()` für alle 7 Tage
- [ ] Referenzen zwischen weekly/daily plans

**Aufwand**: 4 Stunden

#### 3.3 Unit Tests + Integration Tests
- [ ] Test: Plan für BASE-Phase (80% LIT)
- [ ] Test: Plan für BUILD-Phase (50% LIT, 20% TEMPO, 20% FTP)
- [ ] Test: Plan mit verschiedenen Slot-Konfigurationen
- [ ] Test: Scaling von Workouts

**Aufwand**: 8 Stunden

**Sprint 3 Total**: ~28 Stunden (~4 Tage)

**Deliverables**:
- ✅ Wochenplan wird generiert
- ✅ Workouts matchen zu Slots
- ✅ TSS bleibt unter Weekly Goal
- ✅ Progression + Variety funktioniert

---

### Sprint 4: Dashboard + Today's Workout (Woche 4-5)

**Ziel**: Dashboard mit Heutigem Training + Fitness-Kurve

**Tasks**:

#### 4.1 Dashboard Layout
- [ ] `/app/dashboard/page.tsx` - Haupt-Dashboard
- [ ] `src/components/DashboardLayout.tsx` - Layout Component
- [ ] Navigation + Header
- [ ] Responsive Grid (3 Cards)

**Aufwand**: 6 Stunden

#### 4.2 Today's Workout Card
- [ ] `src/components/TodayWorkoutCard.tsx`
  - Workout Name + Description
  - Duration + TSS
  - Phase Badge
  - "Start Workout" Button
  - "Details ansehen" Link (Modal)
- [ ] Workout Details Modal
  - Full Workout Structure (Warmup, Intervals, Cooldown)
  - Cadence Targets
  - Power Zones
- [ ] Loading States + Empty States

**Aufwand**: 8 Stunden

#### 4.3 Fitness Curve Chart
- [ ] `src/components/FitnessCurveChart.tsx`
  - Recharts/Chart.js Integration
  - CTL (blue line)
  - ATL (pink line)
  - TSB (gray bars)
  - Hover Tooltips mit Werten
  - 28-Tage-Fenster
- [ ] Data Fetching aus `metrics_daily`
- [ ] Responsive (Mobile Stack, Desktop Side-by-Side)

**Aufwand**: 10 Stunden

#### 4.4 Next Goal Card
- [ ] `src/components/NextGoalCard.tsx`
  - Event Name + Icon
  - Countdown (Wochen bis Event)
  - CTL-Fortschritt (aktuell vs. Ziel)
  - Progress Bar
- [ ] Event aus `user/profile` laden

**Aufwand**: 4 Stunden

#### 4.5 Data Fetching Hook
- [ ] `src/hooks/useDashboard.ts`
  - SWR für Dashboard-Daten
  - Fetch: today's plan, metrics (last 28d), next event
  - Error Handling
  - Loading States

**Aufwand**: 4 Stunden

**Sprint 4 Total**: ~32 Stunden (~4 Tage)

**Deliverables**:
- ✅ Dashboard zeigt heutiges Training
- ✅ Fitness-Kurve (CTL/ATL/TSB) visualisiert
- ✅ Nächstes Ziel angezeigt
- ✅ Mobile + Desktop responsive

---

### Sprint 5: ZWO Export + Strava Sync (Woche 5-6)

**Ziel**: ZWO-Download + Strava-Activity-Import

**Tasks**:

#### 5.1 ZWO Generator
- [ ] `src/lib/zwoGenerator.ts` implementieren
  - `generateZWO(workout, ftp)` → XML String
  - Warmup, SteadyState, IntervalsT, Cooldown
  - Power-Zonen berechnen (FTP-basiert)
  - Cadence-Targets (falls vorhanden)
- [ ] Unit Tests mit Beispiel-Workouts
- [ ] Download-Button Handler

**Aufwand**: 8 Stunden

#### 5.2 ZWO Download Flow
- [ ] Button in `TodayWorkoutCard`
- [ ] Generate ZWO on-click
- [ ] Browser-Download (Blob + URL)
- [ ] Filename: `{date}_{workout_name}.zwo`

**Aufwand**: 2 Stunden

#### 5.3 Strava Webhook Handler (Cloud Function)
- [ ] `functions/src/stravaWebhook.ts` - Bereits vorhanden, erweitern
  - Activity-Event erkennen
  - Activity-Details fetchen (Strava API)
  - TSS berechnen (Power, HR, oder RPE-Fallback)
  - Match zu geplantem Workout (Date + Duration ±10%)
  - Store in `completions/{activityId}`
- [ ] Error Handling + Retry-Logik
- [ ] Logging (Structured Logs)

**Aufwand**: 10 Stunden

#### 5.4 Metrics Update nach Completion
- [ ] `updateDailyMetrics()` Funktion
  - Fetch existing metrics
  - Add actual TSS
  - Recalculate CTL/ATL/TSB (mit EMA)
  - Update Firestore
- [ ] Batch-Update für vergangene Tage (falls nötig)

**Aufwand**: 6 Stunden

#### 5.5 Testing (Strava Sandbox)
- [ ] Test Activity erstellen in Strava
- [ ] Webhook auslösen
- [ ] Verify Completion in Firestore
- [ ] Verify Metrics Update
- [ ] Verify Dashboard Update

**Aufwand**: 4 Stunden

**Sprint 5 Total**: ~30 Stunden (~4 Tage)

**Deliverables**:
- ✅ ZWO-Download funktioniert
- ✅ Strava-Activities werden importiert
- ✅ TSS wird berechnet
- ✅ CTL/ATL/TSB werden geupdated
- ✅ Dashboard zeigt aktuelle Werte

---

### Sprint 6: TSB-Adjustment + Workout Rating (Woche 6-7)

**Ziel**: TSB-basierte Anpassung + User-Feedback

**Tasks**:

#### 6.1 TSB-Based Adjustment Logic
- [ ] `src/lib/tsbAdjustment.ts` implementieren
  - `adjustWorkout(workout, tsb)` → Adjusted Workout
  - TSB < -25: Reduce intensity (-5% FTP)
  - TSB < -35: Replace HIT with LIT
  - TSB > +15: Increase intensity (+2% FTP)
- [ ] Guardrails implementieren
  - No HIT if TSB < -25
  - Cap daily TSS ≤ 1.6 × ATL
- [ ] Unit Tests mit verschiedenen TSB-Werten

**Aufwand**: 8 Stunden

#### 6.2 Daily Plan Update (Cloud Function)
- [ ] `functions/src/scheduledPlanUpdate.ts` erweitern
  - Check: Plan aktuell?
  - Fetch TSB aus `metrics_daily`
  - Apply TSB-Adjustment
  - Write updated plan zu `plans_daily/{date}`
- [ ] On-Demand Trigger (HTTPS Callable)
- [ ] Cache-Strategie (Plan ist aktuell wenn < 1h alt UND TSB unverändert)

**Aufwand**: 8 Stunden

#### 6.3 Workout Rating UI
- [ ] `src/components/WorkoutRating.tsx`
  - 3 Buttons: "Zu hart" / "Genau richtig" / "Zu leicht"
  - Icon-basiert (Feuer, Daumen hoch, Schneeflocke)
  - Anzeige nach Workout-Completion (via Strava-Sync)
- [ ] Modal/Popup nach Dashboard-Besuch (wenn Workout completed aber nicht rated)
- [ ] Store Rating in `completions/{activityId}.rating`

**Aufwand**: 6 Stunden

#### 6.4 Rating-Based Future Adjustment (Vorbereitung für Phase 2)
- [ ] Logging für Ratings (für späteres ML-Training)
- [ ] Einfache Heuristik:
  - "Zu hart" → nächste ähnliche Kategorie -5% Intensität
  - "Zu leicht" → keine Änderung (Progression wichtig!)
- [ ] Store in `user/profile.rating_history`

**Aufwand**: 4 Stunden

#### 6.5 Dashboard: Adjustment-Anzeige
- [ ] Badge in `TodayWorkoutCard`: "Angepasst wegen TSB"
- [ ] Tooltip mit Erklärung: "Dein TSB ist -28, daher Intensität reduziert"
- [ ] Farb-Coding (Rot = reduziert, Grün = erhöht, Grau = normal)

**Aufwand**: 4 Stunden

**Sprint 6 Total**: ~30 Stunden (~4 Tage)

**Deliverables**:
- ✅ TSB-basierte Anpassung funktioniert
- ✅ Guardrails verhindern Übertraining
- ✅ User kann Workouts bewerten
- ✅ Rating wird gespeichert (für Phase 2 ML)
- ✅ Dashboard zeigt Anpassungs-Grund

---

### Sprint 7: Testing, Bug Fixes, Deployment (Woche 7-8)

**Ziel**: MVP stabilisieren + deployen

**Tasks**:

#### 7.1 Integration Testing
- [ ] End-to-End Test: Setup → Plan Generation → Dashboard
- [ ] Test: Strava-Sync → TSS-Update → Dashboard-Update
- [ ] Test: ZWO-Download → Zwift-Import (manuell)
- [ ] Test: TSB-Adjustment (verschiedene Szenarien)
- [ ] Test: Workout-Rating → Feedback-Loop

**Aufwand**: 12 Stunden

#### 7.2 Performance Testing
- [ ] Lighthouse Audit (Performance, Accessibility, SEO)
- [ ] Firebase Emulator: Load Testing (100 concurrent users)
- [ ] Firestore Query Optimization (Indexes)
- [ ] Client-Side Caching testen (SWR)

**Aufwand**: 6 Stunden

#### 7.3 Bug Fixes
- [ ] Fix Critical Bugs aus Testing
- [ ] Fix UI-Bugs (Responsive, Layout-Shifts)
- [ ] Error Handling verbessern (User-Facing Errors)

**Aufwand**: 10 Stunden

#### 7.4 Documentation
- [ ] USER_GUIDE.md aktualisieren
- [ ] Setup-Instructions (README.md)
- [ ] Deployment-Anleitung (SETUP_GUIDE.md)

**Aufwand**: 4 Stunden

#### 7.5 Deployment Prep
- [ ] Environment Variables setzen (Production)
- [ ] Secrets in Secret Manager (Strava Client Secret)
- [ ] Firebase Hosting Konfiguration
- [ ] Cloud Functions Deployment (Production)
- [ ] Firestore Rules Deployment
- [ ] Firestore Indexes Deployment

**Aufwand**: 4 Stunden

#### 7.6 Deployment
- [ ] Deploy Next.js zu Firebase Hosting
- [ ] Deploy Cloud Functions
- [ ] Test Production-Deployment
- [ ] Strava Webhook zu Production-URL ändern
- [ ] Monitoring Setup (Firebase Console)

**Aufwand**: 4 Stunden

#### 7.7 Beta Testing
- [ ] 10 Beta-Tester einladen
- [ ] Feedback-Formular (Google Forms / Typeform)
- [ ] 2 Wochen Beta-Testing
- [ ] Feedback sammeln + priorisieren

**Aufwand**: 4 Stunden (Setup) + 2 Wochen (Testing)

**Sprint 7 Total**: ~44 Stunden (~5 Tage) + 2 Wochen Beta

**Deliverables**:
- ✅ MVP deployed auf Production
- ✅ Alle Critical Bugs gefixt
- ✅ Performance optimiert
- ✅ Beta-Testing läuft

---

## Gesamt-Aufwand Phase 1

| Sprint | Aufwand (Stunden) | Aufwand (Tage) | Kalenderwochen |
|--------|-------------------|----------------|----------------|
| Sprint 0 | 0 (bereits done) | 0 | - |
| Sprint 1 | 22h | 3 Tage | Woche 2 |
| Sprint 2 | 24h | 3 Tage | Woche 2-3 |
| Sprint 3 | 28h | 4 Tage | Woche 3-4 |
| Sprint 4 | 32h | 4 Tage | Woche 4-5 |
| Sprint 5 | 30h | 4 Tage | Woche 5-6 |
| Sprint 6 | 30h | 4 Tage | Woche 6-7 |
| Sprint 7 | 44h | 5 Tage | Woche 7-8 |
| **TOTAL** | **210h** | **27 Tage** | **6-8 Wochen** |

**Annahmen**:
- 1 Entwickler (Ebi + Mira)
- ~8 Stunden effektive Arbeit/Tag
- 2 Wochen Beta-Testing (parallel zu anderen Tasks)

---

## Risiko-Management

### High-Risk Items

#### 1. Strava API Rate Limits
**Risiko**: Webhook-Events werden throttled (100 requests/15min)  
**Mitigation**:
- Queue implementieren (Firebase Cloud Tasks)
- Batch-Verarbeitung für Multiple Activities
- Monitoring + Alerting bei Rate-Limit-Errors

#### 2. TSS-Berechnung Ungenauigkeit
**Risiko**: TSS ohne Power-Meter zu ungenau  
**Mitigation**:
- HR-based TSS als Fallback
- User kann TSS manuell korrigieren
- Phase 2: ML-Modell für bessere Schätzung

#### 3. Firestore Kosten-Explosion
**Risiko**: Zu viele Reads durch schlechtes Caching  
**Mitigation**:
- Aggressive Client-Side Caching (SWR)
- Firestore Query-Optimization (Indexes)
- Monitoring + Budget Alerts

#### 4. User-Confusion bei Setup
**Risiko**: Setup zu komplex, User brechen ab  
**Mitigation**:
- Onboarding-Tooltips
- Video-Tutorial (YouTube)
- "Quick Start" mit Defaults

---

## Success Metrics (MVP Launch)

### Funktionale Kriterien
- ✅ 95% der User können Setup abschließen
- ✅ 90% der Workouts werden korrekt von Strava importiert
- ✅ 100% der ZWO-Downloads funktionieren
- ✅ CTL/ATL/TSB-Berechnungen stimmen mit manueller Berechnung überein

### Performance Kriterien
- ✅ Dashboard lädt in < 2s (LCP)
- ✅ Setup-Flow in < 5 Minuten abgeschlossen
- ✅ ZWO-Generation in < 500ms
- ✅ Kein Firestore Quota-Overflow

### User Experience Kriterien
- ✅ Mobile-Responsive (funktioniert auf Phone)
- ✅ 80+ Lighthouse Score (Performance, Accessibility)
- ✅ Keine Critical Bugs nach 2 Wochen Beta

### Business Kriterien
- ✅ 10 Beta-Tester über 4 Wochen aktiv
- ✅ Durchschnittlich 3+ Workouts/Woche completed
- ✅ 80%+ User-Satisfaction (Feedback-Survey)

---

## Phase 2 Preview (Nach MVP)

**Sprint 8-12** (8-12 Wochen):
1. **Garmin Connect Integration** (HRV/Sleep)
2. **Readiness-Score-Berechnung** (mit adaptiver Gewichtung)
3. **Volle KI-Mikroanpassung** (FTP Scale, Reps Delta)
4. **Wetter-Integration** (Indoor/Verschieben-Vorschlag)
5. **Advanced Analytics** (Fitness-Forecast, Performance-Trends)
6. **Mobile App** (React Native oder PWA)

---

## Tools & Resources

### Development
- **IDE**: VS Code + Extensions (ESLint, Prettier, Tailwind IntelliSense)
- **Version Control**: Git + GitHub
- **Project Management**: GitHub Projects / Jira / Linear
- **Design**: Figma (für UI Mockups)

### Testing
- **Unit Tests**: Vitest
- **E2E Tests**: Playwright / Cypress
- **Load Testing**: Artillery / k6
- **Manual Testing**: Postman (API), Zwift (ZWO)

### Deployment
- **CI/CD**: GitHub Actions
- **Hosting**: Firebase Hosting
- **Functions**: Firebase Cloud Functions
- **Database**: Cloud Firestore
- **Monitoring**: Firebase Console + Google Cloud Monitoring

### Communication
- **Slack/Discord**: Team Communication
- **Zoom/Meet**: Weekly Sync
- **Notion/Confluence**: Documentation

---

## Next Steps (Jetzt starten!)

### Week 1 (Sprint 1)
1. [ ] TypeScript Interfaces finalisieren
2. [ ] Workout Library Loader implementieren
3. [ ] TSS Calculator fertigstellen
4. [ ] Unit Tests schreiben

### Week 2 (Sprint 2)
1. [ ] Setup-Flow UI bauen
2. [ ] SlotEditor Component
3. [ ] User Profile Management
4. [ ] Phase Calculation

### Week 3 (Sprint 3)
1. [ ] Plan Generator Core
2. [ ] Workout Selection Logic
3. [ ] Integration Tests

🚀 **LET'S BUILD!**
