# 🧪 Testing Guide: Fitness Forecast System

## Quick Test

```bash
# 1. Unit Tests (TypeScript)
npm run test:forecast

# Erwartet: ✅ All Tests Passed
```

## Test-Hierarchie

```
Unit Tests (TypeScript)
  ↓
API Tests (cURL/PowerShell)
  ↓
Integration Tests (UI)
  ↓
End-to-End Tests (User Flow)
```

## 1️⃣ Unit Tests

### Ausführen
```bash
npm run test:forecast
```

### Was wird getestet?
- ✅ **EMA Berechnung**: Formel korrekt implementiert
- ✅ **TSS Berechnung**: Power & HR-basiert
- ✅ **Fitness Metrics**: CTL/ATL/TSB aus Vergangenheit
- ✅ **Forecast**: Projektion in die Zukunft
- ✅ **Combined**: Vergangenheit + Zukunft kombiniert

### Beispiel-Output
```
📐 TEST 1: EMA Berechnung
  CTL neu = 60 + 0.0465 × (100 - 60) = 61.86
  ✅ Erwartung: 61.86, Ergebnis: 61.86

📊 TEST 2: TSS Berechnung
  1h @ 200W (FTP: 250W) → TSS: 64.0 ✅
  1.5h @ 144 bpm (LTHR: 160) → HRSS: 121.5 ✅

🎉 ALL TESTS PASSED!
```

## 2️⃣ API Tests

### Voraussetzungen
```bash
# Server starten
npm run dev
# Läuft auf http://localhost:3001
```

### A) PowerShell (Windows)
```powershell
# Test mit deiner User-ID
.\test\test-api.ps1 -UserId "YOUR_USER_ID"

# Mit anderem Port
.\test\test-api.ps1 -UserId "YOUR_USER_ID" -BaseUrl "http://localhost:3000"
```

### B) Bash (Linux/Mac)
```bash
# Test mit deiner User-ID
./test/test-api.sh YOUR_USER_ID
```

### C) cURL (Manuell)
```bash
curl "http://localhost:3001/api/fitness/forecast?userId=YOUR_USER_ID" | jq
```

### Erwartete Response
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

## 3️⃣ Integration Tests (UI)

### Setup
1. Server starten: `npm run dev`
2. Browser öffnen: `http://localhost:3001`

### Test-Flow

#### A) Komponenten-Test (Standalone)
```tsx
// Testseite erstellen: src/app/test-forecast/page.tsx
import FitnessForecast from '@/components/FitnessForecast';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1>Forecast Test</h1>
      <FitnessForecast userId="YOUR_USER_ID" />
    </div>
  );
}
```

Aufrufen: `http://localhost:3001/test-forecast`

**Erwartung:**
- ✅ Loading Spinner erscheint
- ✅ Chart wird geladen
- ✅ Aktuelle Metriken angezeigt
- ✅ Prognose-Linie sichtbar
- ✅ Ziel-Werte am Ende

#### B) Dashboard Integration
```tsx
// In src/app/dashboard/page.tsx hinzufügen
import FitnessForecast from '@/components/FitnessForecast';

// Nach den Quick Stats Cards:
{profile?.stravaConnected && trainingPlan && (
  <FitnessForecast userId={user.uid} />
)}
```

**Test-Schritte:**
1. Login
2. Strava verbinden
3. Plan generieren
4. Dashboard öffnen
5. Forecast Chart sollte erscheinen

## 4️⃣ End-to-End Tests (User Flow)

### Vollständiger User-Flow

```
1. User Registration
   ↓
2. Profile Setup (FTP, LTHR eingeben)
   ↓
3. Strava Connect
   ↓
4. Strava Activities Sync (automatisch)
   ↓
5. Plan Generation
   ↓
6. View Forecast
   ↓
7. Morning Check (Plan adapts)
   ↓
8. View Updated Forecast
```

### Detaillierte Test-Schritte

#### 1. User Setup
- [ ] Registrieren
- [ ] FTP setzen (z.B. 250W)
- [ ] LTHR setzen (z.B. 160 bpm)
- [ ] Speichern

#### 2. Strava Integration
- [ ] "Connect Strava" klicken
- [ ] OAuth Flow durchlaufen
- [ ] Redirect zu Dashboard
- [ ] Message: "✓ Strava erfolgreich verbunden!"

#### 3. Activities Check
- [ ] Dashboard → Activities
- [ ] Letzte 10 Aktivitäten sichtbar
- [ ] TSS-Werte berechnet

#### 4. Plan Generation
- [ ] "Generate Plan" klicken
- [ ] Plan erscheint (This Week's Plan)
- [ ] Sessions haben TSS-Werte

#### 5. Forecast anzeigen
- [ ] Forecast Chart erscheint
- [ ] Aktuelle Metriken oben (CTL/ATL/TSB)
- [ ] Chart zeigt 3 Linien (CTL, ATL, TSB)
- [ ] Ziel-Werte unten mit Delta

#### 6. Forecast validieren
- [ ] CTL-Linie steigt über Zeit (Build Phase)
- [ ] ATL reagiert schneller als CTL
- [ ] TSB zeigt Balance
- [ ] Bei Ruhetagen: ATL sinkt, TSB steigt

#### 7. Morning Check Test
- [ ] Morning Check ausfüllen (z.B. schlechter Schlaf)
- [ ] Speichern
- [ ] Dashboard: Forecast neu laden
- [ ] Plan sollte angepasst sein (niedrigere TSS)
- [ ] Forecast zeigt neue Projektion

## 5️⃣ Edge Cases & Error Handling

### Test-Szenarien

#### A) Keine Strava-Verbindung
```
Erwartung: 
- Chart zeigt Message: "Strava verbinden erforderlich"
- Keine Crash
```

#### B) Kein Plan vorhanden
```
Erwartung:
- Chart zeigt Message: "Kein Trainingsplan verfügbar"
- Button: "Plan generieren"
```

#### C) Keine vergangenen Aktivitäten
```
Erwartung:
- Current Metrics: CTL=0, ATL=0, TSB=0
- Forecast startet bei 0
- Keine Fehler
```

#### D) API Error
```
Test:
- Server stoppen während Chart lädt

Erwartung:
- Error Message: "Fehler beim Laden"
- Retry-Button oder Hinweis
```

## 6️⃣ Performance Tests

### Metriken

```bash
# Response Time
curl -w "@curl-format.txt" -o /dev/null -s \
  "http://localhost:3001/api/fitness/forecast?userId=YOUR_USER_ID"
```

**Erwartungen:**
- < 500ms für 90 Tage Past + 42 Tage Forecast
- < 1s bei voller DB-Last

### Load Test
```bash
# Apache Bench
ab -n 100 -c 10 \
  "http://localhost:3001/api/fitness/forecast?userId=YOUR_USER_ID"
```

**Erwartung:**
- 100 Requests erfolgreich
- Keine Timeouts
- Avg Response < 1s

## 7️⃣ Troubleshooting

### Problem: Test schlägt fehl

```bash
# 1. TypeScript compilation checken
npm run type-check

# 2. Dependencies installieren
npm install

# 3. Functions neu builden
cd functions && npm install && npm run build && cd ..

# 4. Test nochmal
npm run test:forecast
```

### Problem: API gibt 404

```
Check:
- Server läuft? (npm run dev)
- Port korrekt? (3001)
- User ID existiert?
- Firestore rules deployed?
```

### Problem: Forecast leer

```
Check:
- Strava verbunden?
- Plan generiert?
- API Response prüfen (Browser DevTools)
- Console Logs prüfen
```

### Problem: Chart zeigt nicht

```
Check:
- chart.js installiert? (npm list chart.js)
- Browser Console Errors?
- React DevTools: Props korrekt?
```

## 8️⃣ Automatisierung

### GitHub Actions (TODO)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:forecast
```

## 9️⃣ Test Checkliste (Quick)

Vor jedem Commit:
- [ ] `npm run type-check` ✅
- [ ] `npm run test:forecast` ✅
- [ ] UI in Browser testen
- [ ] Console Errors prüfen

Vor Deployment:
- [ ] Alle Unit Tests ✅
- [ ] API Test mit echten Daten
- [ ] UI Flow komplett durchlaufen
- [ ] Edge Cases getestet
- [ ] Performance OK

## 🎯 Success Criteria

**System ist bereit wenn:**
1. ✅ Alle Unit Tests bestehen
2. ✅ API liefert valide Daten
3. ✅ Chart zeigt korrekte Werte
4. ✅ Forecast reagiert auf Plan-Änderungen
5. ✅ Morning Check update funktioniert
6. ✅ Keine Console Errors
7. ✅ Performance < 1s Response Time

---

**Zuletzt getestet:** 31. Oktober 2025
**Test Status:** ✅ ALL PASSED
