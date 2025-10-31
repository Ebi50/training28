# Fitness Metrics Forecast System

## Überblick

Das System berechnet nicht nur die aktuellen Fitness-Metriken (CTL/ATL/TSB) aus vergangenen Aktivitäten, sondern **projiziert diese Werte in die Zukunft** basierend auf dem geplanten Training.

## Wie es funktioniert

### 1. **Aktuelle Metriken** (aus Strava)
```typescript
// Letzte 90 Tage von Strava laden
const pastActivities = await getStravaActivities(userId, last90Days);

// CTL/ATL/TSB berechnen
const current = calculateFitnessMetrics(pastActivities);
// Ergebnis: { ctl: 65.3, atl: 45.2, tsb: 20.1 }
```

### 2. **Geplante Aktivitäten** (aus Trainingsplan)
```typescript
// Aktiven Trainingsplan laden
const plan = await getActivePlan(userId);

// Zukünftige Sessions mit TSS
const plannedActivities = plan.sessions
  .filter(s => s.date >= today)
  .map(s => ({ date: s.date, tss: s.targetTss }));
```

### 3. **Prognose berechnen**
```typescript
// Tag für Tag in die Zukunft projizieren
const forecast = forecastFitnessMetrics({
  currentCTL: 65.3,
  currentATL: 45.2,
  plannedActivities
});

// Ergebnis: Array mit CTL/ATL/TSB für jeden zukünftigen Tag
// [
//   { date: '2025-11-01', ctl: 66.1, atl: 46.8, tsb: 19.3 },
//   { date: '2025-11-02', ctl: 67.4, atl: 48.2, tsb: 19.2 },
//   ...
// ]
```

## Formeln

### CTL (Chronic Training Load) - Fitness
```
CTL = exponentieller gleitender Durchschnitt über 42 Tage
α = 2 / (42 + 1)
CTL_neu = CTL_alt + α × (TSS_heute - CTL_alt)
```

### ATL (Acute Training Load) - Fatigue
```
ATL = exponentieller gleitender Durchschnitt über 7 Tage
α = 2 / (7 + 1)
ATL_neu = ATL_alt + α × (TSS_heute - ATL_alt)
```

### TSB (Training Stress Balance) - Form
```
TSB = CTL - ATL
```

## API Endpoints

### GET /api/fitness/forecast
Liefert aktuelle + prognostizierte Metriken

**Parameter:**
- `userId` (required): User ID

**Response:**
```json
{
  "success": true,
  "current": {
    "ctl": 65.3,
    "atl": 45.2,
    "tsb": 20.1
  },
  "forecast": [
    {
      "date": "2025-11-01",
      "ctl": 66.1,
      "atl": 46.8,
      "tsb": 19.3
    }
  ],
  "stats": {
    "pastActivities": 87,
    "plannedSessions": 42,
    "forecastDays": 42
  }
}
```

## React Komponente

### FitnessForecast
Visualisiert die Prognose als Chart

```tsx
import FitnessForecast from '@/components/FitnessForecast';

<FitnessForecast userId={user.uid} />
```

**Features:**
- ✅ Zeigt aktuelle CTL/ATL/TSB Werte
- ✅ Chart mit Projektion in die Zukunft
- ✅ Ziel-Werte am Ende des Plans
- ✅ Delta-Anzeige (wie viel Änderung)
- ✅ Dark Mode Support

## Beispiel: Dashboard Integration

```tsx
// Dashboard Page
import FitnessForecast from '@/components/FitnessForecast';

export default function DashboardPage() {
  return (
    <div>
      {/* Current Stats */}
      <QuickStats />
      
      {/* Forecast Chart */}
      {profile?.stravaConnected && trainingPlan && (
        <FitnessForecast userId={user.uid} />
      )}
      
      {/* Weekly Plan */}
      <WeeklyPlan />
    </div>
  );
}
```

## Vorteile

### Für den Athleten:
1. **Visualisierung:** Sieht wie sich die Form entwickelt
2. **Planung:** Kann Peak für Wettkampf besser timen
3. **Motivation:** Sieht den Fortschritt voraus
4. **Warnung:** Erkennt Übertraining frühzeitig

### Für das System:
1. **Dynamische Anpassung:** Plan kann angepasst werden wenn Prognose vom Ziel abweicht
2. **Simulation:** Verschiedene Plan-Szenarien vergleichbar
3. **Validierung:** Prüfen ob Plan zum Ziel führt
4. **ML-Ready:** Daten für zukünftiges Machine Learning

## Zukünftige Erweiterungen

### Phase 2: Plan-Optimierung
```typescript
// Automatisch Plan anpassen wenn TSB zu weit vom Ziel abweicht
if (forecast.endTSB < targetTSB - threshold) {
  adjustPlan({ action: 'reduceVolume' });
}
```

### Phase 3: Multi-Szenarien
```typescript
// Mehrere Plan-Varianten vergleichen
const scenarios = [
  { name: 'Current Plan', forecast: forecastA },
  { name: 'More Recovery', forecast: forecastB },
  { name: 'Higher Volume', forecast: forecastC },
];
```

### Phase 4: ML-basierte Prognose
```typescript
// Berücksichtigt individuelle Anpassungsrate
const forecast = mlForecast({
  currentMetrics,
  plannedActivities,
  historicalAdaptation: userAdaptationPattern
});
```

## Testing

```bash
# 1. User mit Strava-Daten erstellen
# 2. Trainingsplan generieren
# 3. Forecast abrufen
curl http://localhost:3000/api/fitness/forecast?userId=xxx

# 4. Komponente im Dashboard anzeigen
```

## Wichtige Hinweise

⚠️ **Genauigkeit:** Prognose basiert auf geplanten TSS-Werten. Tatsächliche Entwicklung kann abweichen!

⚠️ **Strava Sync:** Aktuelle Metriken erfordern Strava-Verbindung

⚠️ **Plan erforderlich:** Ohne aktiven Plan gibt es keine Prognose

✅ **Echtzeit:** Prognose aktualisiert sich automatisch bei Plan-Änderungen

✅ **Performance:** Cached für schnelle Anzeige
