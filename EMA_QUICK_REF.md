# 📐 EMA Formel Quick Reference

## Die Formel

```
EMA_neu = EMA_alt + α × (Wert_heute - EMA_alt)

α = 2 / (N + 1)
```

## Für CTL (Fitness, 42 Tage)
```
α = 2 / 43 ≈ 0.0465

CTL_neu = CTL_alt + 0.0465 × (TSS_heute - CTL_alt)
```

## Für ATL (Fatigue, 7 Tage)
```
α = 2 / 8 = 0.25

ATL_neu = ATL_alt + 0.25 × (TSS_heute - ATL_alt)
```

## Beispiel
```
CTL gestern: 60.0
TSS heute:   100
→ CTL neu = 60.0 + 0.0465 × (100 - 60.0) = 61.86
```

---

📚 **Ausführliche Erklärung:** `EMA_FORMEL_ERKLAERUNG.md`

💻 **Im Code:** `src/lib/fitnessMetrics.ts` (Zeile ~67)
