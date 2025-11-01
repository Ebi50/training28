# Zwift & MyWhoosh Integration - Technische Dokumentation

## Übersicht

Export von HIT/LIT-Trainingsplänen ins .ZWO-Format für Zwift und MyWhoosh.

## Plattform-Unterschiede

### Zwift
- **Dateiformat**: `.ZWO` (XML-basiert)
- **Import-Mechanismus**: 
  - Desktop: Automatisch aus `Dokumente/Zwift/Workouts/<Zwift-ID>/`
  - iOS/iPad: Manueller Sync via Finder → Gerät → Dateien → Zwift → Workouts
- **API**: Keine öffentliche Upload-API; nur Partner-Integrationen (TrainingPeaks, FinalSurge seit März 2025)
- **Anzeige**: Custom Workouts erscheinen im Spiel-Menü

### MyWhoosh
- **Dateiformat**: `.ZWO` (kompatibel mit Zwift-Format) + andere Formate
- **Import-Mechanismus**:
  - Web-basierter Workout Builder zum Import
  - Community-Upload/Download über Library
  - Partner: TrainingPeaks, TrainerDay
- **API**: Keine öffentlich dokumentierte Upload-API
- **Anzeige**: Custom-Ordner in der App

## .ZWO Dateiformat-Spezifikation

### XML-Struktur
```xml
<workout_file>
    <author>Adaptive Training System</author>
    <name>HIT: VO2max Repeats - 5x5min @ 120% FTP</name>
    <description>VO2max intervals with 2min recovery</description>
    <sportType>bike</sportType>
    <tags>
        <tag name="HIT"/>
        <tag name="VO2max"/>
    </tags>
    <workout>
        <!-- Warmup -->
        <Warmup Duration="600" PowerLow="0.50" PowerHigh="0.75"/>
        
        <!-- Intervals -->
        <IntervalsT repeat="5" OnDuration="300" OffDuration="120" OnPower="1.20" OffPower="0.50"/>
        
        <!-- Cooldown -->
        <Cooldown Duration="600" PowerLow="0.60" PowerHigh="0.40"/>
    </workout>
</workout_file>
```

### Workout-Elemente

#### 1. Warmup
```xml
<Warmup Duration="600" PowerLow="0.50" PowerHigh="0.75"/>
```
- Duration: Sekunden
- PowerLow/High: Prozent FTP (0.50 = 50% FTP)

#### 2. SteadyState (LIT)
```xml
<SteadyState Duration="3600" Power="0.70"/>
```
- Konstante Intensität
- Ideal für LIT (55-75% FTP)

#### 3. IntervalsT (HIT)
```xml
<IntervalsT repeat="5" OnDuration="300" OffDuration="120" OnPower="1.20" OffPower="0.50"/>
```
- repeat: Anzahl Wiederholungen
- OnDuration/OffDuration: Arbeit/Pause in Sekunden
- OnPower/OffPower: Intensität als % FTP

#### 4. Cooldown
```xml
<Cooldown Duration="600" PowerLow="0.60" PowerHigh="0.40"/>
```

#### 5. FreeRide (für Erholung)
```xml
<FreeRide Duration="300" Cadence="85"/>
```

## Trainingsplan-Mapping

### LIT (Low Intensity Training)
- **Intensität**: 55-75% FTP
- **Dauer**: 60-120 Minuten
- **ZWO-Struktur**:
  ```xml
  <Warmup Duration="600" PowerLow="0.50" PowerHigh="0.65"/>
  <SteadyState Duration="5400" Power="0.70"/> <!-- 90min @ 70% -->
  <Cooldown Duration="600" PowerLow="0.65" PowerHigh="0.50"/>
  ```

### HIT - VO2max
- **Intensität**: 115-130% FTP
- **Intervalle**: 3-6 x 3-5min
- **Pause**: 2-4min @ 40-60% FTP
- **ZWO-Struktur**:
  ```xml
  <Warmup Duration="900" PowerLow="0.50" PowerHigh="0.75"/>
  <IntervalsT repeat="5" OnDuration="300" OffDuration="120" OnPower="1.20" OffPower="0.50"/>
  <Cooldown Duration="600" PowerLow="0.60" PowerHigh="0.40"/>
  ```

### HIT - Threshold
- **Intensität**: 95-105% FTP
- **Intervalle**: 2-4 x 8-20min
- **Pause**: 3-5min @ 50-60% FTP
- **ZWO-Struktur**:
  ```xml
  <Warmup Duration="900" PowerLow="0.50" PowerHigh="0.75"/>
  <IntervalsT repeat="3" OnDuration="600" OffDuration="180" OnPower="1.00" OffPower="0.55"/>
  <Cooldown Duration="600" PowerLow="0.60" PowerHigh="0.40"/>
  ```

### HIT - Tempo
- **Intensität**: 88-93% FTP
- **Intervalle**: 2-3 x 15-30min
- **Pause**: 5-10min @ 55-65% FTP
- **ZWO-Struktur**:
  ```xml
  <Warmup Duration="900" PowerLow="0.50" PowerHigh="0.75"/>
  <IntervalsT repeat="2" OnDuration="1200" OffDuration="300" OnPower="0.90" OffPower="0.60"/>
  <Cooldown Duration="600" PowerLow="0.60" PowerHigh="0.40"/>
  ```

### Recovery
- **Intensität**: 40-60% FTP
- **Dauer**: 30-60 Minuten
- **ZWO-Struktur**:
  ```xml
  <SteadyState Duration="3600" Power="0.50"/>
  ```

## Implementierungs-Strategie

### Phase 1: ZWO-Generator
1. **Neue Datei**: `src/lib/zwoGenerator.ts`
   - Funktion: `generateZWOFromSession(session: TrainingSession, ftp: number): string`
   - Input: TrainingSession mit subType, duration, targetTss
   - Output: XML-String im .ZWO-Format

2. **Mapping-Logik**:
   - Nutze bestehende `getSessionSubType()` und `generateWorkoutStructure()`
   - Konvertiere strukturierte Intervalle in ZWO-XML
   - Berechne Warmup/Cooldown basierend auf Gesamtdauer

### Phase 2: Export-API Endpoint
1. **Neue Route**: `/api/training/export-zwo`
   - Input: `{ sessionId: string, userId: string, platform: 'zwift' | 'mywoosh' }`
   - Output: .ZWO-Datei zum Download
   - Filename: `YYYY-MM-DD_SessionType_Platform.zwo`

2. **Batch-Export**: Ganze Woche exportieren
   - Route: `/api/training/export-week-zwo`
   - Erzeugt ZIP mit allen Sessions

### Phase 3: UI-Integration

#### Zwift-spezifisch
- **Export-Button** in WeeklyPlanView
- **Download-Dialog** mit Instruktionen:
  1. Download .ZWO-Datei
  2. Desktop: Kopiere nach `Dokumente/Zwift/Workouts/<deine-ID>/`
  3. iOS/iPad: Sync via Finder
  4. Öffne Zwift → Custom Workouts

#### MyWhoosh-spezifisch
- **Export-Button** in WeeklyPlanView
- **Download-Dialog** mit Instruktionen:
  1. Download .ZWO-Datei
  2. Öffne MyWhoosh Workout Builder (Web)
  3. Import → Select File → Wähle .ZWO
  4. Workout erscheint in Custom-Ordner

### Phase 4: Optional - Desktop Helper (Zwift)
- **Electron-App** (separates Tool, nicht in MVP)
- Tray-Icon mit Auto-Sync
- Überwacht Training2026-Exporte
- Kopiert automatisch in Zwift-Ordner
- Notifikation bei neuen Workouts

### Phase 5: Optional - TrainingPeaks Bridge
- API-Integration zu TrainingPeaks
- Auto-Push von dort zu Zwift/MyWhoosh
- Erfordert TrainingPeaks Premium

## Benötigter Input für Implementation

### 1. **Zwift-ID Ermittlung**
- Frage: Sollen User ihre Zwift-ID manuell eingeben?
- Alternativen:
  - Auto-Detection via Desktop Helper
  - Zwift-OAuth (nur über Partner-Status)
  - Manuelle Eingabe in Settings

### 2. **Platform-Präferenz**
- Checkbox in User Settings: "Ich nutze Zwift" / "Ich nutze MyWhoosh" / "Beide"
- Beeinflusst Export-Dialog und Instruktionen

### 3. **Workout-Naming**
- Format: `2025-01-15_HIT_VO2max_Repeats.zwo`
- Oder: `Week3_Tuesday_Threshold.zwo`
- Präferenz?

### 4. **Warmup/Cooldown Strategie**
- **Option A**: Feste Dauer (10min Warmup, 10min Cooldown)
- **Option B**: Proportional zur Gesamtdauer (15% Warmup, 10% Cooldown)
- **Option C**: User-konfigurierbar in Settings

### 5. **Interval-Details**
- Nutzen wir die bereits generierten `generateWorkoutStructure()` Outputs?
- Beispiel: "5x5min @ 120% FTP (2min rest)" → IntervalsT mit exakten Werten
- Oder: Simplified Version mit weniger Präzision?

### 6. **Multi-Session Days**
- Wenn ein Tag 2 Sessions hat (z.B. Morgens LIT, Abends HIT):
  - **Option A**: 2 separate .ZWO-Dateien
  - **Option B**: 1 kombinierte .ZWO mit FreeRide-Pause dazwischen
  - Empfehlung?

## Technische Fragen

### XML-Generierung
```typescript
// Beispiel-Snippet - ist das der richtige Ansatz?
function generateZWO(session: TrainingSession, ftp: number): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
    <author>Adaptive Training System</author>
    <name>${session.description}</name>
    <description>Generated from your training plan</description>
    <sportType>bike</sportType>
    <workout>
        ${generateWorkoutBlocks(session, ftp)}
    </workout>
</workout_file>`;
  return xml;
}
```

### Datei-Speicherung
- Wo speichern wir generierte .ZWO temporär?
  - **Option A**: Firebase Storage (für History/Re-Download)
  - **Option B**: On-the-fly Generation (kein Speichern)
  - **Option C**: Browser-seitiger Download ohne Server-Storage

## Offene Entscheidungen

1. **MVP-Scope**: 
   - Nur .ZWO-Download + Anleitung? (Quickest)
   - Oder Desktop Helper für Zwift auch im MVP?

2. **Batch-Export**:
   - Ganze Woche als ZIP?
   - Oder einzelne Sessions?

3. **Plattform-Priorisierung**:
   - Erst Zwift, dann MyWhoosh?
   - Oder parallel entwickeln?

4. **Testing**:
   - Brauchst du Zwift/MyWhoosh Accounts zum Testen?
   - Oder reicht Schema-Validierung?

## Nächste Schritte

Bitte beantworte:
1. **Zwift-ID Handling**: Manuelle Eingabe oder später mit Helper?
2. **Warmup/Cooldown**: Feste Dauer oder proportional?
3. **MVP-Umfang**: Nur Download oder auch Desktop Helper?
4. **Naming-Konvention**: Datum-basiert oder Wochen-basiert?
5. **Multi-Session**: Separate oder kombiniert?
6. **Plattform-Fokus**: Zwift first oder beide parallel?

Dann kann ich loslegen! 🚀
