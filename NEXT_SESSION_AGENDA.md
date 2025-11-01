# Agenda für nächste Session - TimeSlot Fix & Testing

## 📅 Start: Neuer Chat nach diesem Commit

**Git Status:** 
- ✅ 3 Commits erfolgreich gepusht (e182b08, 63a9e78, f4aa396)
- ✅ Alle funktionierenden Features im main
- ✅ Dokumentation komplett

---

## 🎯 Hauptziele (in Reihenfolge)

### 1. **User's bessere Idee für TimeSlot-Handling** 🚀 (PRIORITÄT 1)

**Aktuelles Problem:**
- Plan zeigt nur Mo-Fr, Wochenende fehlt
- TimeSlot-Logik zu komplex (Multi-Session-Split)
- Default-Slots überschreiben User-Konfiguration

**User sagte:** "ich habe dazu eh noch eine bessere idee"

**TODO:**
1. User nach seiner Idee fragen
2. Gemeinsam neuen Ansatz entwickeln
3. In Feature-Branch implementieren: `git checkout -b feature/timeslot-rework`
4. Kleine Tests zwischen Änderungen!

**Dateien betroffen:**
- `src/lib/planGenerator.ts` (Zeilen 310-435)
- Möglicherweise `src/types/index.ts` (TimeSlot-Interface)

---

### 2. **SessionNotes Speichern debuggen** 🔍 (PRIORITÄT 2)

**Problem:** User berichtet "Das speichern funktioniert nicht"

**Debug-Logs sind bereits drin:**
- 💾 Saving session updates
- ✅ Session saved successfully
- ❌ Error saving notes

**TODO vom User:**
1. Browser Console öffnen (F12 → Console Tab)
2. Notiz hinzufügen oder RPE ändern
3. "Speichern" klicken
4. **Screenshot vom Console-Output machen**
5. Screenshot in Chat posten

**Mögliche Ursachen:**
- trainingPlan.id oder session.id fehlt
- Firestore Rules blockieren
- Auth-Token abgelaufen
- Network-Fehler

→ **Mit Console-Log können wir gezielt debuggen!**

---

### 3. **Testing der Phase 2 Features** ✅ (PRIORITÄT 3)

**Folgende Features testen:**

#### a) Progressive Loading
- Neuen Plan generieren (8 Wochen)
- Prüfen: TSS steigt pro Woche (+8%)
- Prüfen: Woche 4 ist Deload (70% Volumen)

**Erwartung:**
```
Woche 1: ~450 TSS
Woche 2: ~486 TSS (+8%)
Woche 3: ~523 TSS (+8%)
Woche 4: ~350 TSS (Deload -30%)
Woche 5: ~564 TSS (Base +8%)
```

#### b) HIT-Intervall-Varianz
- Mehrere Wochen durchklicken
- HIT-Sessions anschauen
- Prüfen: Intervalle variieren (5min, 4min, 3min, 6min...)

**Erwartung:**
- Woche 1 HIT: 5min Intervalle
- Woche 2 HIT: 4min Intervalle
- Woche 3 HIT: 3min Intervalle
- Woche 4 HIT: 6min Intervalle
- (Dann wieder von vorne)

#### c) Export-Button
- Session auswählen
- "📥 Export to Zwift / MyWhoosh" klicken
- Prüfen: .zwo-Datei wird heruntergeladen
- Optional: In Zwift/MyWhoosh importieren

**Erwartung:**
- Dateiname: `Session_YYYY-MM-DD.zwo`
- Format: XML mit `<workout>` Tags
- Funktioniert in beiden Apps

#### d) RPE-Buttons
- Session öffnen
- RPE-Button klicken (😊 Leicht, 😐 Mittel, 😓 Schwer)
- Speichern klicken
- Plan neu laden
- Prüfen: RPE bleibt gespeichert

---

## 🛠️ Entwicklungs-Workflow für TimeSlot-Fix

**WICHTIG:** Diesmal **Feature-Branch** nutzen!

### Schritt 1: Branch erstellen
```bash
git checkout -b feature/timeslot-rework
```

### Schritt 2: User's Idee implementieren
- Gemeinsam Ansatz besprechen
- Code ändern
- **SOFORT testen** (nicht erst am Ende!)

### Schritt 3: Testing Loop
```bash
# Nach jeder Änderung:
npm run type-check  # Kompiliert?
# Dev-Server starten, Plan generieren, prüfen

# Funktioniert? → Commit in Feature-Branch
git commit -m "wip: Implement [specific change]"

# Funktioniert nicht? → Revert und anders versuchen
git checkout -- src/lib/planGenerator.ts
```

### Schritt 4: Merge nur wenn alles funktioniert
```bash
# Wenn ALLES funktioniert:
git checkout main
git merge feature/timeslot-rework
git push origin main

# Sonst: Branch behalten, weiter experimentieren
```

---

## 📋 Bekannte Offene Punkte

### Aus TESTING_FEEDBACK.md:

1. ❌ **TimeSlot-System zeigt nur Mo-Fr**
   - Wochenende fehlt komplett
   - Vermutung: Default-Slot-Logik überschreibt

2. ⏳ **SessionNotes Speichern**
   - Code sieht korrekt aus
   - Warte auf Console-Log vom User

3. ⚠️ **Multi-Session-Split zu komplex**
   - Sollte vereinfacht werden
   - User's Idee könnte Lösung sein

---

## 💡 Vorbereitete Fragen an User

1. **"Was ist deine bessere Idee für TimeSlot-Handling?"**
   - Wie soll System mit mehreren Slots pro Tag umgehen?
   - Soll es automatisch splitten oder User entscheidet?
   - Wie sollen Wochenenden behandelt werden?

2. **"Kannst du SessionNotes mit Console-Log testen?"**
   - F12 öffnen → Console Tab
   - Notiz speichern
   - Screenshot von Logs

3. **"Funktioniert Progressive Loading wie erwartet?"**
   - TSS steigt pro Woche?
   - Deload-Woche erkennbar?

4. **"Wie gefallen dir die HIT-Intervall-Variationen?"**
   - Abwechslung gut?
   - Varianten sinnvoll?

---

## 🎯 Erfolgs-Kriterien

**Session ist erfolgreich wenn:**

1. ✅ TimeSlot-Problem verstanden und Lösung implementiert
2. ✅ Plan zeigt alle 7 Tage (inkl. Wochenende)
3. ✅ SessionNotes Speichern funktioniert
4. ✅ Alle Phase 2 Features getestet und validiert
5. ✅ Code kompiliert ohne Fehler
6. ✅ Alles committed und gepusht

**Nicht notwendig:**
- Alle Features perfekt (iterative Entwicklung OK)
- 100% Test-Coverage (manuelles Testing reicht)
- ML-Integration (ist für später)

---

## 📁 Wichtige Dateien (Quick Reference)

### Zum Bearbeiten wahrscheinlich:
- `src/lib/planGenerator.ts` - Plan-Generierung & TimeSlots
- `src/types/index.ts` - TypeScript Interfaces
- `src/app/dashboard/plan/page.tsx` - UI & SessionNotes

### Zur Referenz:
- `PHASE2_IMPLEMENTATION_SUMMARY.md` - Was wurde gemacht
- `TESTING_FEEDBACK.md` - Was User berichtet hat
- `COMMIT_PLAN.md` - Wie wurde committed

### Zum Testen:
- Localhost: `http://localhost:3001`
- Dev Server: `npm run dev`
- TypeCheck: `npm run type-check`

---

## 🚀 Los geht's!

**Erster Satz im neuen Chat:**

"Hi! Lass uns systematisch vorgehen. 

**Erstens:** Was ist deine bessere Idee für das TimeSlot-Handling? Aktuell zeigt der Plan nur Mo-Fr, aber das Wochenende fehlt.

**Zweitens:** Kannst du bitte SessionNotes-Speichern testen mit F12 Console offen und mir einen Screenshot der Logs schicken?

**Drittens:** Wenn das geklärt ist, testen wir die Phase 2 Features (Progressive Loading, HIT-Varianz, Export).

Wir arbeiten diesmal in einem Feature-Branch, damit main stabil bleibt! 🎯"

---

**Erstellt:** 2025-11-01  
**Status:** Ready for new session  
**Git Commit:** f4aa396
