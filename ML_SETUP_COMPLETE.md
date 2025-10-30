# 🎯 ML Integration - Nächste Schritte

## ✅ Was implementiert wurde

1. **Konvertierungs-Script** (`scripts/convert_xgb_to_onnx.py`)
   - Konvertiert dein .bst Modell zu .onnx
   - Validiert das konvertierte Modell
   - Erstellt Metadata JSON

2. **ML Predictor Service** (`src/lib/mlPredictor.ts`)
   - Lädt Modell aus Firebase Storage
   - Feature Engineering für User-Daten
   - TSS Predictions für einzelne Tage
   - Batch Predictions für ganze Wochen

3. **Firebase Storage Setup**
   - Storage Rules (`storage.rules`)
   - ml-models/ Ordner mit Read-Access für Auth-User

4. **Plan Generator Integration** (`src/lib/planGenerator.ts`)
   - Hybrid-Approach: ML + Heuristic Fallback
   - ML-Predictions für tägliche TSS-Werte
   - Automatic graceful degradation

## 📋 Was du jetzt tun musst

### Schritt 1: Modell konvertieren (lokal auf deinem PC)

```bash
# Python Dependencies installieren
pip install xgboost onnxmltools onnxruntime skl2onnx

# Dein .bst Modell konvertieren
cd scripts
python convert_xgb_to_onnx.py --input /path/to/your/model.bst --output tss-predictor-v1.onnx
```

**Output:**
- `tss-predictor-v1.onnx` (Modell)
- `tss-predictor-v1.json` (Metadata)

### Schritt 2: Modell zu Firebase Storage hochladen

**Option A: Firebase Console (einfach)**
1. Gehe zu Firebase Console → Storage
2. Erstelle Ordner: `ml-models/`
3. Upload beide Dateien:
   - `tss-predictor-v1.onnx`
   - `tss-predictor-v1.json`

**Option B: Firebase CLI**
```bash
firebase storage:upload tss-predictor-v1.onnx ml-models/tss-predictor-v1.onnx
firebase storage:upload tss-predictor-v1.json ml-models/tss-predictor-v1.json
```

### Schritt 3: Storage Rules deployen

```bash
firebase deploy --only storage
```

### Schritt 4: Code testen

```typescript
// In Dashboard oder Test-Script
import { TrainingPlanGenerator } from '@/lib/planGenerator';
import { getUserProfile } from '@/lib/firestore';

const generator = new TrainingPlanGenerator();
await generator.initialize(); // Prüft ob ML verfügbar

const plan = await generator.generateWeeklyPlan(
  userId,
  weekStartDate,
  parameters,
  previousMetrics,
  userProfile, // NEU: jetzt erforderlich!
  upcomingGoals,
  activeCamp
);

console.log('Plan with ML:', plan);
```

## 🔍 Wie es funktioniert

### Hybrid Approach

```
┌─────────────────────────────────────┐
│  ML Modell verfügbar?               │
│                                     │
│  ✅ JA  → ML Predictions            │
│  ❌ NEIN → Heuristic Fallback       │
│                                     │
│  ML-Fehler? → Heuristic für Tag    │
└─────────────────────────────────────┘
```

### Feature Extraction

Das System extrahiert automatisch:
- **Recent TSS:** lag1, 3d, 7d, 14d, 28d
- **Fitness Metrics:** CTL, ATL, TSB
- **Time Features:** Day of week, Month (cyclical)
- **Athlete Data:** FTP, LTHR, Weight, Age (from birthdate)

### Prediction Flow

```
User Profile + Metrics
    ↓
Extract Features (19 features)
    ↓
ONNX Model (loaded & cached)
    ↓
TSS Prediction (0-200 TSS)
    ↓
Training Plan Generator
```

## 🧪 Testing

### Test 1: Check ML Availability
```typescript
import { isModelAvailable } from '@/lib/mlPredictor';

const available = await isModelAvailable();
console.log('ML Model:', available ? '✅ Ready' : '❌ Not found');
```

### Test 2: Single Prediction
```typescript
import { predictTSS } from '@/lib/mlPredictor';

const prediction = await predictTSS(
  userProfile,
  dailyMetrics,
  new Date()
);

console.log(`Predicted TSS: ${prediction.predictedTss.toFixed(1)}`);
console.log(`Confidence: ${(prediction.confidence * 100).toFixed(0)}%`);
```

### Test 3: Generate Plan with ML
```typescript
const generator = new TrainingPlanGenerator();
await generator.initialize();

const plan = await generator.generateWeeklyPlan(
  'user123',
  new Date(),
  { weeklyHours: 10, litRatio: 0.9, maxHitDays: 2, ... },
  previousMetrics,
  userProfile,
  [],
  undefined
);

console.log('Total TSS:', plan.totalTss);
console.log('Sessions:', plan.sessions.length);
```

## ⚠️ Troubleshooting

### "Model not found"
→ Modell noch nicht hochgeladen zu Firebase Storage

### "Prediction failed"
→ System fällt zurück auf Heuristic (kein Problem!)

### "Feature extraction error"
→ User-Profile unvollständig (FTP, LTHR fehlen)

### TypeScript Errors
```bash
npm run type-check
```

## 📊 Monitoring

Das System loggt automatisch:
- ✅ ML model available / ⚠️ Not available
- 🤖 Using ML predictions / 📊 Using heuristic
- 🎯 Individual predictions mit Confidence

Check Console Logs während Plan-Generierung!

## 🚀 Next Steps

1. **Jetzt:** Modell konvertieren & hochladen
2. **Test:** Einen Plan generieren
3. **Validate:** TSS-Werte sinnvoll?
4. **Iterate:** Modell verbessern bei Bedarf

## 📝 Breaking Changes

**WICHTIG:** `generateWeeklyPlan()` hat jetzt einen neuen Parameter:

```typescript
// ALT (funktioniert nicht mehr):
generateWeeklyPlan(userId, date, params, metrics, goals, camp)

// NEU (mit UserProfile):
generateWeeklyPlan(userId, date, params, metrics, userProfile, goals, camp)
```

Alle bestehenden Aufrufe müssen aktualisiert werden!

## 💡 Tipps

- **Modell-Updates:** Einfach neue Version hochladen (v2, v3, ...)
- **A/B Testing:** Beide Versionen parallel testen
- **Fallback:** System funktioniert auch ohne ML
- **Cache:** Modell wird 1h gecacht → schnelle Predictions

Viel Erfolg! 🎉
