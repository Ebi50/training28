# EMA Formel - Exponential Moving Average

## 📐 Die Grundformel

```
EMA_neu = EMA_alt + α × (Wert_heute - EMA_alt)
```

Wobei:
- `EMA_neu` = Neuer exponentieller gleitender Durchschnitt
- `EMA_alt` = Vorheriger EMA-Wert
- `α` (Alpha) = Glättungsfaktor
- `Wert_heute` = Heutiger Messwert (z.B. TSS)

## 🧮 Glättungsfaktor Alpha (α)

```
α = 2 / (N + 1)
```

Wobei `N` = Anzahl der Tage für den Durchschnitt

### Für CTL (42 Tage):
```
α = 2 / (42 + 1) = 2 / 43 ≈ 0.0465
```

### Für ATL (7 Tage):
```
α = 2 / (7 + 1) = 2 / 8 = 0.25
```

## 📊 Visualisierung der Berechnung

### Beispiel 1: CTL Berechnung (42-Tage Fitness)

```
Gegeben:
- CTL gestern: 60.0
- TSS heute: 100
- α = 0.0465

Berechnung:
CTL_neu = 60.0 + 0.0465 × (100 - 60.0)
CTL_neu = 60.0 + 0.0465 × 40
CTL_neu = 60.0 + 1.86
CTL_neu = 61.86

➜ CTL steigt langsam von 60.0 auf 61.86
```

### Beispiel 2: ATL Berechnung (7-Tage Fatigue)

```
Gegeben:
- ATL gestern: 50.0
- TSS heute: 100
- α = 0.25

Berechnung:
ATL_neu = 50.0 + 0.25 × (100 - 50.0)
ATL_neu = 50.0 + 0.25 × 50
ATL_neu = 50.0 + 12.5
ATL_neu = 62.5

➜ ATL steigt schnell von 50.0 auf 62.5
```

## 🎯 Warum EMA statt einfacher Durchschnitt?

### Einfacher Durchschnitt (Simple Moving Average):
```
SMA = (TSS₁ + TSS₂ + ... + TSS₄₂) / 42
```
❌ Problem: Alle Tage gleich gewichtet
❌ Problem: Alte Werte verschwinden abrupt nach N Tagen

### Exponentieller Durchschnitt (EMA):
```
EMA = EMA_alt + α × (TSS_heute - EMA_alt)
```
✅ Vorteil: Neuere Werte höher gewichtet
✅ Vorteil: Sanftes "Vergessen" alter Werte
✅ Vorteil: Reagiert schneller auf Änderungen

## 📈 Gewichtung über Zeit

Je älter ein Wert, desto weniger Einfluss:

```
Tag    Gewicht bei CTL (α=0.0465)    Gewicht bei ATL (α=0.25)
───────────────────────────────────────────────────────────
0      100%                           100%
1      95.35%                         75%
2      90.91%                         56.25%
3      86.68%                         42.19%
7      72.53%                         13.35%
14     52.59%                         1.78%
42     14.06%                         ~0%
```

## 🔄 Schrittweise Berechnung über 1 Woche

```
Start: CTL = 50, ATL = 50

Tag 1: TSS = 80
  CTL = 50 + 0.0465 × (80 - 50) = 51.40
  ATL = 50 + 0.25 × (80 - 50) = 57.50
  TSB = 51.40 - 57.50 = -6.10

Tag 2: TSS = 100
  CTL = 51.40 + 0.0465 × (100 - 51.40) = 53.66
  ATL = 57.50 + 0.25 × (100 - 57.50) = 68.13
  TSB = 53.66 - 68.13 = -14.47

Tag 3: TSS = 120
  CTL = 53.66 + 0.0465 × (120 - 53.66) = 56.74
  ATL = 68.13 + 0.25 × (120 - 68.13) = 81.10
  TSB = 56.74 - 81.10 = -24.36  ⚠️ Ermüdung steigt!

Tag 4: TSS = 0 (Ruhetag)
  CTL = 56.74 + 0.0465 × (0 - 56.74) = 54.10
  ATL = 81.10 + 0.25 × (0 - 81.10) = 60.83
  TSB = 54.10 - 60.83 = -6.73  ✅ Erholung beginnt

Tag 5: TSS = 60
  CTL = 54.10 + 0.0465 × (60 - 54.10) = 54.37
  ATL = 60.83 + 0.25 × (60 - 60.83) = 60.62
  TSB = 54.37 - 60.62 = -6.25

Tag 6: TSS = 0 (Ruhetag)
  CTL = 54.37 + 0.0465 × (0 - 54.37) = 51.84
  ATL = 60.62 + 0.25 × (0 - 60.62) = 45.47
  TSB = 51.84 - 45.47 = 6.37  ✅ Wieder frisch!

Tag 7: TSS = 90
  CTL = 51.84 + 0.0465 × (90 - 51.84) = 53.62
  ATL = 45.47 + 0.25 × (90 - 45.47) = 56.60
  TSB = 53.62 - 56.60 = -2.98
```

## 💻 Code-Implementierung

```typescript
/**
 * Berechne EMA (Exponential Moving Average)
 * @param previousEMA Vorheriger EMA-Wert
 * @param currentValue Aktueller Messwert (z.B. TSS)
 * @param days Zeitkonstante (42 für CTL, 7 für ATL)
 * @returns Neuer EMA-Wert
 */
function calculateEMA(
  previousEMA: number,
  currentValue: number,
  days: number
): number {
  // Glättungsfaktor berechnen
  const alpha = 2 / (days + 1);
  
  // EMA-Formel anwenden
  return previousEMA + alpha * (currentValue - previousEMA);
}

// Beispiel: CTL berechnen
let ctl = 60.0; // Startwert
const todayTSS = 100;

ctl = calculateEMA(ctl, todayTSS, 42);
console.log(`Neue CTL: ${ctl}`); // 61.86

// Beispiel: ATL berechnen
let atl = 50.0; // Startwert

atl = calculateEMA(atl, todayTSS, 7);
console.log(`Neue ATL: ${atl}`); // 62.5
```

## 🎓 Warum diese Werte?

### CTL (42 Tage)
- **Fitness baut sich langsam auf**
- Braucht Wochen konsistenten Trainings
- Spiegelt langfristige Anpassung wider
- α = 0.0465 = langsame Änderung

### ATL (7 Tage)
- **Ermüdung reagiert schnell**
- Spürbar nach wenigen intensiven Tagen
- Erholt sich auch schnell (1-2 Ruhetage)
- α = 0.25 = schnelle Änderung

### TSB (Form)
```
TSB = CTL - ATL
```
- Positiv: Erholt, bereit für Wettkampf
- Negativ: Ermüdet, gutes Training aber braucht Erholung

## 📝 Zusammenfassung

| Metrik | Formel | Tage | Alpha | Bedeutung |
|--------|--------|------|-------|-----------|
| **CTL** | EMA mit N=42 | 42 | 0.0465 | Fitness (langsam) |
| **ATL** | EMA mit N=7 | 7 | 0.25 | Fatigue (schnell) |
| **TSB** | CTL - ATL | - | - | Form (Balance) |

## 🔍 Wo im Code?

Die EMA-Berechnung findest du hier:

```
src/lib/fitnessMetrics.ts
  ↓
  function calculateEMA()       # Zeile ~67
  ↓
  function calculateFitnessMetrics()  # Zeile ~80
  ↓
  function forecastFitnessMetrics()   # Zeile ~165
```

## 🎯 Praktische Anwendung

```typescript
// 1. Von Strava: Vergangene Aktivitäten
const pastActivities = [
  { date: '2025-10-24', tss: 80 },
  { date: '2025-10-25', tss: 100 },
  // ...
];

// 2. Aktuelle Metriken berechnen (mit EMA)
const current = calculateFitnessMetrics(pastActivities);
// { ctl: 65.3, atl: 45.2, tsb: 20.1 }

// 3. Von Plan: Geplante Sessions
const plannedActivities = [
  { date: '2025-11-01', tss: 90 },
  { date: '2025-11-02', tss: 120 },
  // ...
];

// 4. Zukunft projizieren (mit EMA)
const forecast = forecastFitnessMetrics({
  currentCTL: 65.3,
  currentATL: 45.2,
  plannedActivities
});
// [
//   { date: '2025-11-01', ctl: 66.1, atl: 46.8, tsb: 19.3 },
//   { date: '2025-11-02', ctl: 67.5, atl: 49.2, tsb: 18.3 },
//   ...
// ]
```

## 🎨 Visuelle Darstellung

```
Training-Woche mit EMA-Berechnung:

TSS: 80  100  120   0   60   0   90    (Tägliche Belastung)
      ↓    ↓    ↓   ↓    ↓   ↓    ↓
CTL: 51.4→53.7→56.7→54.1→54.4→51.8→53.6  (Fitness - langsam)
      ╱    ╱    ╱    ╲    ╱    ╲    ╱
ATL: 57.5→68.1→81.1→60.8→60.6→45.5→56.6  (Fatigue - schnell)
      ↓    ↓    ↓    ↓    ↓    ↓    ↓
TSB: -6.1→-14.5→-24.4→-6.7→-6.2→+6.4→-3.0 (Form)

Interpretation:
- Tag 1-3: Harte Woche → TSB wird negativ (ermüdet)
- Tag 4:   Ruhetag → ATL sinkt schnell, TSB erholt sich
- Tag 5-6: Leicht + Ruhe → TSB wird positiv (frisch!)
- Tag 7:   Moderate Session → Wieder leicht ermüdet
```

## 📈 Grafische Darstellung der Gewichtung

```
Gewicht (%) über Zeit für ATL (7 Tage):

100% ████████████████████████████████  Tag 0 (heute)
 75% ████████████████████              Tag 1
 56% ████████████                      Tag 2
 42% █████████                         Tag 3
 32% ███████                           Tag 4
 24% █████                             Tag 5
 18% ████                              Tag 6
 13% ███                               Tag 7
  0% ▏                                 Tag 14+

→ Heutiger Wert hat größten Einfluss
→ Nach 7 Tagen nur noch 13% Gewicht
→ Alte Werte "vergessen" sanft
```

```
Gewicht (%) über Zeit für CTL (42 Tage):

100% ████████████████████████████████  Tag 0 (heute)
 95% ███████████████████████████████   Tag 1
 91% ██████████████████████████████    Tag 2
 87% ████████████████████████████      Tag 3
 73% ████████████████████              Tag 7
 53% █████████████                     Tag 14
 28% ███████                           Tag 28
 14% ███                               Tag 42
  0% ▏                                 Tag 84+

→ Änderungen brauchen Zeit
→ Nach 42 Tagen noch 14% Gewicht
→ Spiegelt "echte" Fitness wider
```

## 📚 Weiterführende Literatur

- **Training and Racing with a Power Meter** (Allen & Coggan) - Original PMC-Konzept
- **The Cyclist's Training Bible** (Joe Friel) - Anwendung von CTL/ATL/TSB
- **TrainingPeaks** - Implementierung und Visualisierung

---

**💡 Tipp:** Speichere diese Datei als Bookmark! Sie erklärt die komplette Mathematik hinter deinen Fitness-Metriken.

**🔗 Siehe auch:**
- `EMA_QUICK_REF.md` - Schnelle Formel-Referenz
- `FITNESS_FORECAST.md` - Wie die Prognose funktioniert
- `src/lib/fitnessMetrics.ts` - Code-Implementierung
