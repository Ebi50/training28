# Weekly Duration & Time Slots Concept

## Status: KONZEPT - IN DISKUSSION
**NICHT IMPLEMENTIEREN** - Dieses Dokument dient zur Diskussion und Abstimmung des Konzepts.

---

## Problem
Die App respektiert derzeit nicht die vorgegebenen Zeitslots richtig. Es gibt Probleme mit der Trainingsplanung bezüglich:
- Einhaltung der verfügbaren Zeitfenster
- Verteilung der Gesamttrainingsdauer
- Slot-Constraints (Maximaldauern)

---

## Lösung: Zweistufiges System

### 1. Standardwoche (Template)
- Der User legt eine **Standard-Wochendauer** fest (z.B. 10 Stunden)
- Diese dient als **Maximum** für alle Wochen
- Kann als Vorlage für die Planung genutzt werden

### 2. Zeitslots (unabhängig von der Dauer)
Der User definiert **verfügbare Zeitslots** mit ihren Eigenschaften:

**Beispiel:**
```
Montag:
  - Slot 1 (früh): 06:00-07:00 (max. 60min)
  - Slot 2 (abend): 18:00-19:00 (max. 60min)

Mittwoch:
  - Slot 1: 18:00-19:30 (max. 90min)

Freitag:
  - Slot 1: 06:00-07:00 (max. 60min)

Samstag:
  - Slot 1: 08:00-10:00 (max. 120min)
```

**Eigenschaften:**
- Slots definieren **WANN** Training möglich ist
- Jeder Slot hat eine **Maximaldauer**
- An einem Tag können **mehrere Slots** existieren
- Slots sind unabhängig von der Wochendauer

---

## 3. Intelligente Aufteilung durch die App

### Input für die App:
1. **Wochendauer-Maximum** (z.B. 10h = 600min)
2. **Verfügbare Zeitslots** mit Maximaldauern
3. **Trainingsziele** (Fitness aufbauen, Event vorbereiten, etc.)
4. **Aktuelle Form** (CTL/ATL/TSB)

### Constraint-Regeln (HARTE GRENZEN):

#### Wochendauer:
- ✅ **Kann weniger sein** als festgelegt (z.B. 8h statt 10h)
- ❌ **NICHT mehr** als festgelegt (z.B. nie mehr als 10h)
- 💡 **Grund**: Trainingsphysiologie (Recovery, progressive Belastung)

#### Einzeltraining pro Slot:
- ✅ **Kann kürzer sein** als Slot-Maximum (z.B. 45min in 60min-Slot)
- ❌ **NICHT länger** als Slot-Maximum (z.B. nicht 75min in 60min-Slot)
- ❌ **NICHT länger** als längster Slot an dem Tag
- 💡 **Grund**: Verfügbarkeit des Users, feste Zeitfenster

**Beispiel für Tag mit mehreren Slots:**
```
Montag hat 2 Slots:
  - Früh: max. 60min
  - Abend: max. 60min
  
→ Ein einzelnes Training darf max. 60min sein
→ Es können ZWEI Trainings geplant werden (je max. 60min)
→ Oder EIN Training (max. 60min in einem der Slots)
```

### Trainingslogik:
Die App berücksichtigt bei der Verteilung:
1. **Progressive Belastungssteigerung** (Form aufbauen)
2. **Recovery-Phasen** (nicht jede Woche Maximum ausnutzen)
3. **LIT/HIT-Verhältnis** (80/20 oder wie konfiguriert)
4. **Deload-Wochen** (periodische Entlastung)
5. **Taper vor Events** (Reduktion vor Zielevent)
6. **HIT-Recovery** (mind. 48h zwischen intensiven Einheiten)

### Beispiel-Verteilung:

**Gegeben:**
- Wochendauer-Maximum: 10h (600min)
- Slots: Mo 60min, Mi 90min, Fr 60min, Sa 120min
- Ziel: Form aufbauen für Event in 12 Wochen

**App könnte planen:**
```
Woche 1 (Base-Building, 7h statt 10h):
  - Montag: 50min LIT (in 60min-Slot)
  - Mittwoch: 75min LIT (in 90min-Slot)
  - Freitag: 45min LIT (in 60min-Slot)
  - Samstag: 110min LIT (in 120min-Slot)
  → Total: 4h 40min (weniger als Maximum für sanften Einstieg)

Woche 5 (Build Phase, 9h):
  - Montag: 60min HIT (in 60min-Slot)
  - Mittwoch: 90min LIT (in 90min-Slot)
  - Freitag: 50min LIT (in 60min-Slot)
  - Samstag: 120min LIT (in 120min-Slot)
  → Total: 5h 20min (progressiv mehr, aber noch nicht Maximum)

Woche 11 (Taper, 5h):
  - Montag: 40min LIT (in 60min-Slot)
  - Mittwoch: 50min mit kurzen Intensitäten (in 90min-Slot)
  - Samstag: 90min LIT (in 120min-Slot)
  → Total: 3h (deutlich weniger für Taper)
```

---

## 4. Anpassung pro Woche

### Wochenspezifische Änderungen:
Der User kann für **spezifische Wochen** die Gesamtdauer anpassen:

**Beispiel:**
```
Standard: 10h pro Woche
Woche 3: 6h (Urlaub, weniger Zeit)
Woche 7: 12h (Trainingscamp)
Woche 10: 8h (Deload vor Event)
```

Die App verteilt dann die geänderte Dauer neu auf die verfügbaren Slots, mit denselben Constraints.

---

## 5. Zeitslots bleiben stabil

- **Zeitslots ändern sich NICHT** automatisch
- Nur die **Aufteilung der Dauer** ändert sich
- User kann Slots manuell ändern (z.B. im Urlaub andere Zeiten)

---

## Offene Fragen für Diskussion

### A. Slot-Definition
1. Wie definiert der User die Slots?
   - Im Setup-Flow?
   - In den Einstellungen?
   - Per Kalender-Interface?

2. Können Slots wöchentlich variieren?
   - z.B. "Woche 1-4: Mo/Mi/Fr/Sa, Woche 5-8: Di/Do/Sa/So"

### B. Wochendauer-Definition
1. Wo wird die Standard-Wochendauer festgelegt?
   - Im Setup-Flow (einmalig)?
   - In den Einstellungen (änderbar)?

2. Wie passt der User einzelne Wochen an?
   - In der Kalenderansicht?
   - In einem Wochendetail-Dialog?

### C. App-Logik
1. Was passiert, wenn die Slots zu klein sind für das Wochenziel?
   - Beispiel: 10h Ziel, aber nur 4h Slot-Kapazität
   - Warnung anzeigen?
   - Automatisch reduzieren?

2. Wie kommuniziert die App, warum sie weniger plant als Maximum?
   - "Für optimale Recovery plane ich diese Woche nur 8h statt 10h"
   - Soll das sichtbar sein?

### D. UI/UX
1. Wie visualisieren wir die Slot-Auslastung?
   - "Montag 60min-Slot: 50min geplant (83% genutzt)"

2. Wie zeigen wir die Wochendauer vs. geplante Dauer?
   - "Maximum 10h, geplant 8h (80%)"

### E. Edge Cases
1. Was bei Camps/Urlaub?
   - Temporär andere Slots?
   - Andere Wochendauer?

2. Was bei verpassten Trainings?
   - Automatische Neuberechnung für Restwoche?
   - Verschieben auf andere Slots?

---

## Nächste Schritte

1. ✅ Konzept dokumentiert
2. ⏳ Diskussion der offenen Fragen
3. ⏳ Finalisierung des Konzepts
4. ⏳ UI/UX Design
5. ⏳ Implementierungsplan
6. ⏳ Implementation

---

## Notizen

- Dieses Konzept ersetzt NICHT die bestehende Funktionalität, sondern erweitert sie
- Bestehende Pläne müssen möglicherweise migriert werden
- Rückwärtskompatibilität beachten

