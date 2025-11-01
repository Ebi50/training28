# Phase 2 Features - Test Guide
**Datum**: 2025-11-01  
**Status**: Bereit zum Testen

---

## 📋 Übersicht

Diese Anleitung führt dich **Schritt für Schritt** durch alle Phase 2 Features.  
Wir gehen **nacheinander** vor - ein Feature nach dem anderen!

---

## ✅ Schritt 1: Vorbereitung - App Zustand prüfen

### Was du tun musst:
1. ✅ App läuft auf: http://localhost:3001
2. Melde dich an (falls nicht schon eingeloggt)
3. Du solltest auf dem **Dashboard** sein

### Was ich sehen sollte:
- [ ] Dashboard ist sichtbar
- [ ] Sidebar links mit Menü (Dashboard, Training Plan, Activities, Settings)
- [ ] Training Plan Übersicht in der Mitte

### ✅ Status:
- [ ] Fertig - weiter zu Schritt 2
- [ ] Problem - beschreibe was nicht funktioniert

---

## ✅ Schritt 2: CTL/ATL/TSB Badges finden

### Was sind CTL/ATL/TSB?
- **CTL** (Chronic Training Load): Langfristige Fitness (42-Tage Durchschnitt)
- **ATL** (Acute Training Load): Kurzfristige Ermüdung (7-Tage Durchschnitt)
- **TSB** (Training Stress Balance): Form = CTL - ATL

### Was du tun musst:
1. Schaue auf dem Dashboard nach **Quick Stats** oder **Fitness Metrics** Bereich
2. Suche nach Badges/Karten mit "CTL", "ATL", "TSB"
3. Wenn nicht sichtbar: Scrolle nach oben auf dem Dashboard

### Was ich sehen sollte:
- [ ] CTL Badge mit Zahl (z.B. "CTL: 85")
- [ ] ATL Badge mit Zahl (z.B. "ATL: 75")
- [ ] TSB Badge mit Zahl (z.B. "TSB: +10")

### Fragen:
- [ ] Siehst du diese Badges?
- [ ] Wo befinden sie sich? (ganz oben? in der Mitte?)
- [ ] Mach einen Screenshot wenn möglich

### ✅ Status:
- [ ] Badges gefunden - weiter zu Schritt 3
- [ ] Badges NICHT gefunden - das ist OK, notiere es und weiter zu Schritt 3

---

## ✅ Schritt 3: Tooltips testen (Phase 2.2)

**Nur wenn Badges in Schritt 2 gefunden wurden!**

### Was du tun musst:
1. Bewege die Maus ÜBER das CTL Badge (nicht klicken)
2. Warte 1 Sekunde

### Was ich sehen sollte:
Ein Tooltip erscheint mit:
- Überschrift "Chronic Training Load (CTL)"
- 4 Bullet Points mit Erklärung
- Beispiel: "• Misst deine langfristige Fitness..."

### Test für alle 3:
- [ ] CTL Tooltip funktioniert
- [ ] ATL Tooltip funktioniert  
- [ ] TSB Tooltip funktioniert

### ✅ Status:
- [ ] Tooltips funktionieren - weiter zu Schritt 4
- [ ] Tooltips funktionieren NICHT - notiere es und weiter zu Schritt 4
- [ ] Keine Badges gefunden in Schritt 2 - überspringe, weiter zu Schritt 4

---

## ✅ Schritt 4: Fitness Chart suchen (Phase 2.3)

### Was ist der Fitness Chart?
Ein großer Graph der zeigt:
- 42 Tage Historie deiner CTL/ATL/TSB Werte
- 7 Tage Forecast (gestrichelte Linien)
- Zonen: Fresh (grün), Optimal (blau), Tired (orange), Fatigued (rot)

### Was du tun musst:
1. Auf dem Dashboard zwischen "Quick Stats" und "Training Plan" schauen
2. Scrolle langsam nach unten
3. Suche nach einem großen Chart/Graph

### Was ich sehen sollte:
- [ ] Großer Chart mit 3 farbigen Linien (olive/coral/blau)
- [ ] X-Achse: Datumsangaben
- [ ] Y-Achse: Zahlen (CTL/ATL/TSB Werte)
- [ ] Legende unten: CTL, ATL, TSB

### Warum Chart NICHT sichtbar sein könnte:
Der Chart wird nur angezeigt wenn:
1. ✅ Du Strava verbunden hast UND
2. ✅ Mindestens 1 Activity vorhanden ist

### Fragen:
- [ ] Siehst du den Chart?
- [ ] Ist Strava verbunden? (Settings → Strava Connection)
- [ ] Hast du Activities?

### ✅ Status:
- [ ] Chart sichtbar - SUPER! Weiter zu Schritt 5
- [ ] Chart NICHT sichtbar - das ist OK, wir beheben das später
- [ ] Weiter zu Schritt 5

---

## ✅ Schritt 5: Strava verbinden (falls noch nicht geschehen)

**Nur nötig wenn Chart in Schritt 4 NICHT sichtbar war!**

### Was du tun musst:
1. Klicke in der Sidebar auf **"Settings"**
2. Suche nach "Strava Connection" oder "Connect Strava" Button
3. Klicke auf den Button
4. Du wirst zu Strava weitergeleitet → Authorize
5. Zurück zur App → Warte 10-30 Sekunden auf Activity Sync

### Was ich sehen sollte:
- [ ] "Connect Strava" Button in Settings gefunden
- [ ] Strava Authorization erfolgreich
- [ ] Zurück zur App → "Connected" Status
- [ ] Activities werden geladen (Spinner/Loading)

### Nach dem Sync:
1. Gehe zurück zum Dashboard
2. Der Fitness Chart sollte jetzt erscheinen!

### ✅ Status:
- [ ] Strava verbunden - Chart jetzt sichtbar!
- [ ] Strava war schon verbunden - weiter zu Schritt 6
- [ ] Problem beim Verbinden - notiere Fehlermeldung
- [ ] Weiter zu Schritt 6

---

## ✅ Schritt 6: Zur Training Plan Seite navigieren

**WICHTIG**: Die nächsten Features sind NICHT auf dem Dashboard!

### Was du tun musst:
1. Klicke in der Sidebar auf **"Training Plan"**
2. Eine neue Seite öffnet sich

### Was ich sehen sollte:
- [ ] Wochenübersicht: "Woche 1", "Woche 2", usw.
- [ ] Navigation: "Previous Week" ← → "Next Week"
- [ ] Wochenzusammenfassung: TSS, Hours, HIT Sessions, LIT %
- [ ] Liste von Trainings für jeden Tag:
  - Montag: Training
  - Dienstag: Training
  - Mittwoch: Training
  - usw.

### Training Card sollte enthalten:
- Tag + Badge (LIT/HIT)
- "Training" Überschrift
- Beschreibung: "Tempo Ride - 2x20min @ 88-93% FTP..."
- TSS Wert

### ✅ Status:
- [ ] Training Plan Seite geöffnet - weiter zu Schritt 7
- [ ] Seite nicht gefunden - notiere Problem

---

## ✅ Schritt 7: Enhanced Workout Descriptions prüfen (Phase 2.1)

**Auf der Training Plan Seite!**

### Was wurde verbessert?
Trainings zeigen jetzt **detaillierte Intervall-Strukturen** statt generischen Beschreibungen.

### Was du tun musst:
1. Schaue dir die Trainings an (Mo, Di, Mi, Do, Fr, Sa, So)
2. Lies die Beschreibungen

### Was ich sehen sollte:

**LIT Trainings** (blaue Badges):
- "Tempo Ride - 2×20min @ 88-93% FTP (5min rest)"
- "Endurance Ride - 2×20min @ 68-83% FTP (5min rest)"

**HIT Trainings** (rote Badges):
- "VO2max Intervals - 4×4min @ 120% FTP (5min Recovery)"
- "Threshold Repeats - 3×10min @ 100% FTP (5min Recovery)"

### Test:
- [ ] LIT Training hat detaillierte Beschreibung mit FTP%
- [ ] HIT Training hat Intervall-Struktur (z.B. "4×4min")
- [ ] Verschiedene Trainings haben unterschiedliche Strukturen

### Negativ-Test (was NICHT da sein sollte):
- [ ] ❌ Generische Beschreibung: "Ein hartes Training"
- [ ] ❌ Keine FTP-Angaben
- [ ] ❌ Alle Trainings haben gleiche Beschreibung

### ✅ Status:
- [ ] Beschreibungen sind detailliert - SUPER! Weiter zu Schritt 8
- [ ] Beschreibungen sind generisch - BUG, notiere es
- [ ] Weiter zu Schritt 8

---

## ✅ Schritt 8: Zwift Export Button finden (Phase 2.4)

**Auf der Training Plan Seite!**

### Was du tun musst:
1. Scrolle zu einem Training (z.B. Montag)
2. Schaue UNTER der Beschreibung
3. Suche nach Export-Buttons

### Was ich sehen sollte:
- [ ] Button mit Text "📥 Zwift" oder "Export to Zwift"
- [ ] Button mit Text "📥 MyWhoosh" oder "Export to MyWhoosh"
- [ ] Buttons sind UNTER der Trainings-Beschreibung

### Fragen:
- [ ] Siehst du die Buttons?
- [ ] Wie viele Buttons pro Training? (sollten 2 sein)
- [ ] Wo genau sind sie? (ganz unten in der Card?)

### ✅ Status:
- [ ] Buttons gefunden - weiter zu Schritt 9
- [ ] Buttons NICHT gefunden - notiere Position, weiter zu Schritt 9

---

## ✅ Schritt 9: Zwift Export testen (Phase 2.4)

**Nur wenn Buttons in Schritt 8 gefunden wurden!**

### Was du tun musst:
1. Klicke auf **"📥 Zwift"** Button bei einem Training
2. Ein Dialog sollte erscheinen

### Was ich sehen sollte im Dialog:
- [ ] Überschrift: "Export to Zwift" oder ähnlich
- [ ] Anleitung mit Schritten:
  1. Download Workout
  2. Öffne Datei-Explorer
  3. Navigiere zu: Dokumente/Zwift/Workouts/[Athlete-ID]/
  4. Kopiere .ZWO Datei dorthin
- [ ] Button: "Download .ZWO"
- [ ] Button: "Abbrechen" oder "Close"

### Test: Download
1. Klicke auf "Download .ZWO"
2. Datei sollte heruntergeladen werden
3. Prüfe Downloads-Ordner

### Was sollte heruntergeladen werden:
- [ ] Dateiname: "2025-11-XX_[TYPE]_[NAME].zwo"
- [ ] Beispiel: "2025-11-04_LIT_Tempo_Ride.zwo"
- [ ] Dateigröße: ca. 1-3 KB (kleine XML Datei)

### Datei-Inhalt prüfen:
1. Öffne .ZWO Datei mit Notepad/Editor
2. Sollte XML sein: `<?xml version="1.0"?><workout_file>...`
3. Sollte `<Warmup>`, `<SteadyState>`, `<Cooldown>` Tags enthalten

### ✅ Status:
- [ ] Dialog erscheint - SUPER!
- [ ] Download funktioniert
- [ ] .ZWO Datei ist gültig (XML)
- [ ] Weiter zu Schritt 10

---

## ✅ Schritt 10: MyWhoosh Export testen (Phase 2.4)

**Gleicher Test wie Schritt 9, nur mit MyWhoosh Button!**

### Was du tun musst:
1. Klicke auf **"📥 MyWhoosh"** Button (bei ANDEREM Training)
2. Dialog erscheint

### Unterschied zu Zwift:
- Anleitung sollte **MyWhoosh-spezifischen Pfad** zeigen
- Sonst gleicher Ablauf

### Test:
- [ ] MyWhoosh Dialog erscheint
- [ ] Download funktioniert
- [ ] .ZWO Datei wird heruntergeladen

### ✅ Status:
- [ ] MyWhoosh Export funktioniert
- [ ] Weiter zu Schritt 11

---

## ✅ Schritt 11: Session Notes Bereich finden (Phase 2.5)

**Auf der Training Plan Seite!**

### Was du tun musst:
1. Scrolle zu einem Training
2. Scrolle INNERHALB der Training Card ganz nach unten
3. Suche nach einem Bereich für Notizen

### Was ich sehen sollte:

**Wenn LEER (noch keine Notizen)**:
- [ ] Text: "Keine Notizen vorhanden" oder "Add notes"
- [ ] Button: "Edit" oder "Bearbeiten"

**Wenn GEFÜLLT (Notizen vorhanden)**:
- [ ] Notizen-Text wird angezeigt
- [ ] RPE Badge mit Zahl und Farbe (z.B. "RPE: 7 ⭐")
- [ ] Button: "Edit"

### Fragen:
- [ ] Siehst du den Notes-Bereich?
- [ ] Wo genau ist er? (ganz unten nach Export-Buttons?)
- [ ] Ist er bei JEDEM Training?

### ✅ Status:
- [ ] Notes-Bereich gefunden - weiter zu Schritt 12
- [ ] Notes-Bereich NICHT gefunden - notiere es, weiter zu Schritt 12

---

## ✅ Schritt 12: Session Notes bearbeiten (Phase 2.5)

**Nur wenn Notes-Bereich in Schritt 11 gefunden wurde!**

### Was du tun musst:
1. Klicke auf **"Edit"** Button im Notes-Bereich
2. Edit-Modus öffnet sich

### Was ich sehen sollte im Edit-Modus:

**Textarea für Notizen**:
- [ ] Großes Textfeld (mehrere Zeilen)
- [ ] Placeholder: "Wie lief das Training?" oder ähnlich
- [ ] Kann reinschreiben

**RPE Slider**:
- [ ] Slider von 1 bis 10
- [ ] Aktueller Wert wird angezeigt (z.B. "5")
- [ ] Label darunter ändert sich beim Schieben:
  - 1-2: "Sehr leicht" (grün)
  - 3-4: "Leicht" (blau)
  - 5-6: "Moderat" (gelb)
  - 7-8: "Hart" (orange)
  - 9-10: "Sehr hart / Maximal" (rot)

**Buttons**:
- [ ] "Save" oder "Speichern" Button
- [ ] "Cancel" oder "Abbrechen" Button

### ✅ Status:
- [ ] Edit-Modus funktioniert - weiter zu Schritt 13
- [ ] Edit-Modus NICHT sichtbar - notiere Problem

---

## ✅ Schritt 13: Session Notes speichern (Phase 2.5)

### Was du tun musst:
1. Im Edit-Modus (aus Schritt 12):
2. Schreibe eine Notiz: "Test Notiz - gutes Training!"
3. Setze RPE auf **7** (sollte ORANGE sein)
4. Klicke auf **"Save"**

### Was passieren sollte:
- [ ] Edit-Modus schließt sich
- [ ] View-Modus erscheint
- [ ] Notiz wird angezeigt: "Test Notiz - gutes Training!"
- [ ] RPE Badge erscheint: "RPE: 7" in ORANGE

### Test: Persistenz
1. **Reload die Seite** (F5 oder Browser Refresh)
2. Scrolle zum gleichen Training
3. Notiz und RPE sollten NOCH DA SEIN!

### ✅ Status:
- [ ] Speichern funktioniert
- [ ] Notiz bleibt nach Reload
- [ ] RPE ist korrekt farbcodiert
- [ ] Weiter zu Schritt 14

---

## ✅ Schritt 14: RPE Farbcodierung testen (Phase 2.5)

### Was du tun musst:
Teste verschiedene RPE Werte bei VERSCHIEDENEN Trainings:

**Test 1: RPE = 2** (Sehr leicht)
- [ ] Edit → RPE = 2 → Save
- [ ] Farbe sollte **GRÜN** sein
- [ ] Label: "Sehr leicht"

**Test 2: RPE = 4** (Leicht)
- [ ] Edit → RPE = 4 → Save
- [ ] Farbe sollte **BLAU** sein
- [ ] Label: "Leicht"

**Test 3: RPE = 6** (Moderat)
- [ ] Edit → RPE = 6 → Save
- [ ] Farbe sollte **GELB** sein
- [ ] Label: "Moderat"

**Test 4: RPE = 8** (Hart)
- [ ] Edit → RPE = 8 → Save
- [ ] Farbe sollte **ORANGE** sein
- [ ] Label: "Hart"

**Test 5: RPE = 10** (Maximal)
- [ ] Edit → RPE = 10 → Save
- [ ] Farbe sollte **ROT** sein
- [ ] Label: "Sehr hart" oder "Maximal"

### ✅ Status:
- [ ] Alle Farben korrekt - PERFEKT!
- [ ] Farben stimmen NICHT - notiere welche falsch sind
- [ ] Weiter zu Schritt 15

---

## ✅ Schritt 15: Wöchentliche Progression prüfen (BUG CHECK)

### Was ist das Problem?
Du hast gemeldet: "Die Trainings sind jede Woche gleich"

### Was SOLLTE sein:
Der Plan sollte progressive Belastung haben:
- Woche 1: 450 TSS
- Woche 2: 470 TSS (+20)
- Woche 3: 490 TSS (+20)
- Woche 4: 420 TSS (Deload -70)
- Woche 5: 510 TSS
- usw.

### Was du tun musst:
1. Auf Training Plan Seite
2. Oben sollte "Woche 1" stehen
3. Notiere den **Wochen-TSS** (z.B. "TSS: 450.0")
4. Klicke auf **"Next Week"** →
5. Jetzt bist du in "Woche 2"
6. Notiere den **Wochen-TSS**
7. Klicke nochmal "Next Week" → "Woche 3"
8. Notiere den **Wochen-TSS**

### Erwartung:
```
Woche 1: TSS = 450
Woche 2: TSS = 470 (mehr als Woche 1)
Woche 3: TSS = 490 (mehr als Woche 2)
```

### Test-Ergebnis:
- Woche 1 TSS: _______
- Woche 2 TSS: _______
- Woche 3 TSS: _______

### Ist der TSS progressiv?
- [ ] Ja - TSS steigt jede Woche → Kein Bug!
- [ ] Nein - TSS ist gleich jede Woche → **BUG BESTÄTIGT**

### ✅ Status:
- [ ] Progression funktioniert - weiter zu Schritt 16
- [ ] Progression funktioniert NICHT - BUG, muss gefixt werden
- [ ] Weiter zu Schritt 16

---

## ✅ Schritt 16: Tapering prüfen (nur bei Season Goals)

### Was ist Tapering?
2-3 Wochen vor einem Event wird das Training reduziert (40-50% weniger TSS).

### Wichtig:
Tapering ist nur aktiv wenn du einen **Season Goal** (Camp/Event) hast!

### Was du tun musst:
1. Gehe zu Settings
2. Suche nach "Season Goals" oder "Training Goals"
3. Prüfe: Ist ein Event/Camp eingetragen?

### Fall A: KEIN Season Goal
- [ ] Kein Event eingetragen
- **→ Tapering wird NICHT angezeigt (das ist normal!)**
- **→ Überspringe Tapering-Test**

### Fall B: Season Goal vorhanden
- [ ] Event ist eingetragen (z.B. "Rennen am 15. Dezember")
- **→ Weiter mit Tapering-Test:**

### Tapering-Test (nur wenn Event vorhanden):
1. Notiere Event-Datum: ____________
2. Rechne: Event-Datum MINUS 14 Tage = Tapering-Start
3. Navigiere im Training Plan zu dieser Woche
4. Prüfe TSS: Sollte ca. 50% niedriger sein

**Beispiel**:
- Event: 15. Dezember
- Normale Woche: 450 TSS
- Tapering-Start: 1. Dezember
- Tapering-Woche TSS: ca. 225 TSS (50% von 450)

### ✅ Status:
- [ ] Kein Season Goal → Test übersprungen
- [ ] Season Goal vorhanden → Tapering funktioniert
- [ ] Season Goal vorhanden → Tapering funktioniert NICHT (Bug)
- [ ] Weiter zu Schritt 17

---

## ✅ Schritt 17: Zusammenfassung & Bug Report

### Features die funktionieren sollten:
1. [ ] **Tooltips** (Schritt 3)
2. [ ] **Fitness Chart** (Schritt 4) - nur mit Strava
3. [ ] **Enhanced Descriptions** (Schritt 7)
4. [ ] **Zwift Export** (Schritt 9)
5. [ ] **MyWhoosh Export** (Schritt 10)
6. [ ] **Session Notes** (Schritt 11-14)
7. [ ] **RPE Farbcodierung** (Schritt 14)

### Bekannte Bugs:
- [ ] **Wöchentliche Progression** (Schritt 15) - muss gefixt werden?
- [ ] **Tapering** (Schritt 16) - nur wenn Season Goal vorhanden

### Deine Entdeckungen:
Welche Features funktionieren bei dir?
- ✅ Funktioniert:
- ⚠️ Teilweise:
- ❌ Funktioniert nicht:

### Nächste Schritte:
Was möchtest du als nächstes tun?
1. [ ] Bugs fixen (Progression, Tapering)
2. [ ] Weitere Tests durchführen
3. [ ] Neue Features implementieren (Phase 3)

---

## 📝 Notizen

Platz für deine Notizen während des Testens:

```
Schritt X: [Problem/Beobachtung]


```

---

**Ende der Test-Anleitung**

Sag mir wenn du mit einem Schritt fertig bist, dann gehen wir zum nächsten! 🚀
