# 🤖 ML-Modell Integration - ONNX Setup

## 📋 Überblick

Dein XGBoost-Modell (.bst) wird zu ONNX konvertiert und in die App integriert.

**Status:** Vorbereitet, aber noch nicht implementiert
**Trigger-Phrase für Claude:** "ML Modell implementieren" oder "ONNX Integration starten"

---

## 🎯 Was Claude für dich implementieren wird

### Phase 1: Konvertierung (lokal auf deinem PC)
1. Python-Script erstellen: `scripts/convert_xgb_to_onnx.py`
2. Du führst es einmalig aus: `python scripts/convert_xgb_to_onnx.py`
3. Output: `model.onnx` (bereit für Upload)

### Phase 2: TypeScript Integration
1. NPM Package installieren: `onnxruntime-node`
2. ML Service erstellen: `src/lib/mlPredictor.ts`
   - Modell aus Firebase Storage laden
   - Predictions durchführen
   - Feature Engineering für deine Daten

### Phase 3: Firebase Storage Setup
1. Storage Bucket Rules erweitern
2. Upload-Funktion für `model.onnx`
3. Public Read Access für Modell-Datei

### Phase 4: Integration in Training Plan Generator
1. `src/lib/planGenerator.ts` erweitern
2. Heuristik + ML hybrid verwenden
3. TSS-Predictions aus Modell nutzen

---

## 📦 Deine Dateien

**Was du bereitstellen musst:**
- ✅ `model.bst` - Dein trainiertes XGBoost-Modell (hast du bereits)
- ✅ `features.json` - Feature-Namen und Reihenfolge (optional, aber hilfreich)

**Wo sind sie aktuell?**
- Firebase Storage (du erwähntest: bereits hochgeladen)

---

## 🚀 Implementierungs-Schritte

### Wenn du Zeit hast, sage einfach:
```
"ML Modell implementieren"
```

Claude wird dann:
1. **Schritt 1:** Konvertierungs-Script erstellen (~5 min)
2. **Schritt 2:** Dependencies installieren (~3 min)
3. **Schritt 3:** ML Service bauen (~10 min)
4. **Schritt 4:** Storage Setup (~5 min)
5. **Schritt 5:** Plan Generator Integration (~10 min)
6. **Schritt 6:** Testing (~7 min)

**Gesamtzeit:** ~40 Minuten

---

## 🔍 Technische Details

### Architektur
```
Firebase Storage
└── ml-models/
    └── tss-predictor-v1.onnx  ← Globales Modell (einmalig)

Next.js / Cloud Functions
├── src/lib/mlPredictor.ts
│   ├── loadModel() ← Cached in Memory
│   └── predict(userFeatures) ← Pro User unterschiedliche Inputs
│
└── src/lib/planGenerator.ts
    └── generateWeeklyPlan()
        ├── Heuristik (wenn ML nicht verfügbar)
        └── ML Predictions (wenn Modell geladen)
```

### Input Features (Beispiel)
```typescript
{
  tss_lag1: 65,      // Gestern
  tss_7d: 450,       // Letzte 7 Tage
  ctl_42: 80,        // Fitness (42-Tage-Durchschnitt)
  atl_7: 75,         // Fatigue (7-Tage-Durchschnitt)
  tsb: 5,            // Form
  ftp: 250,          // User-spezifisch
  weight: 75,        // User-spezifisch
  age: 35,           // User-spezifisch
  dow_sin: 0.5,      // Day of week (zyklisch)
  dow_cos: 0.866,
  // ... weitere Features aus deinem Modell
}
```

### Output
```typescript
{
  predictedTss: 85.4,
  confidence: 0.92,
  modelVersion: "v1.0"
}
```

---

## ✅ Vorteile dieser Lösung

1. **Stabiles TypeScript** - Keine Python-Functions nötig
2. **Schnelle Cold Starts** - Node.js statt Python (~500ms vs ~3s)
3. **Ein Modell für alle** - Effiziente Storage-Nutzung
4. **Browser-fähig** - Später auch Client-side Predictions möglich
5. **Verlustfrei** - ONNX konvertiert ohne Informationsverlust

---

## 🔧 Wartung

**Modell aktualisieren (später):**
1. Neues `model.bst` trainieren
2. Erneut konvertieren: `python scripts/convert_xgb_to_onnx.py`
3. Als `tss-predictor-v2.onnx` hochladen
4. Version in Code ändern

**Kein Code-Change nötig** - nur neue Datei hochladen! ✅

---

## 📝 Nächste Schritte

**Jetzt:**
- ✅ Settings-Page auf GitHub gesichert
- ✅ Diese Anleitung gespeichert

**Später (wenn Zeit):**
- Sage "ML Modell implementieren"
- Claude führt alle 6 Schritte durch
- Nach ~40 Minuten: Fertig! 🎉

---

## 💡 Wichtig zu wissen

### Das Modell ist GLOBAL
- Einmal hochgeladen, nutzen es alle User
- Pro User nur unterschiedliche Input-Features
- Sehr effizient! (5-50 MB einmalig, nicht pro User)

### Hybrid-Ansatz
- ML Predictions werden **ergänzend** zur Heuristik verwendet
- Falls Modell nicht lädt: Heuristik funktioniert weiter
- "No net hudle" - System bleibt stabil ✅

### Feature Engineering
- Claude wird automatisch die Features aus `features.json` extrahieren
- Falls nicht vorhanden: Standard-Features nutzen
- Du kannst später Features anpassen

---

**Bereit für ML-Integration?** Einfach fragen! 🚀
