# Git Commit Plan - Phase 2 Features

## 📋 Commit-Strategie

**NICHT** alles in einem Commit! Stattdessen **3 getrennte Commits**:

---

## Commit 1: UI/UX Improvements ✅ (SAFE)

### Beschreibung:
```
feat: UI/UX improvements - RPE buttons, export combined, layout polish

- RPE: Slider → 3 buttons (Leicht/Mittel/Schwer) with emoji indicators
- Export: Combined Zwift/MyWhoosh button with gradient styling
- Weekly Overview: Horizontal layout (TSS | Hours | HIT% | LIT%)
- Time Format: Fixed decimal rounding (1:08h instead of 1:7.5h)
- Workout Descriptions: Removed redundant "Total: X" and time strings
- HIT Intervals: Added 4 rotating variants per type (VO2max, Threshold, Tempo)
```

### Dateien:
```bash
git add src/components/SessionNotes.tsx
git add src/app/dashboard/plan/page.tsx
git add src/lib/planGenerator.ts  # Nur HIT-Varianz + Zeit-Format
```

### Command:
```bash
git commit -m "feat: UI/UX improvements - RPE buttons, export combined, layout polish

- RPE: Slider → 3 buttons (Leicht/Mittel/Schwer) with emoji indicators
- Export: Combined Zwift/MyWhoosh button with gradient styling
- Weekly Overview: Horizontal layout (TSS | Hours | HIT% | LIT%)
- Time Format: Fixed decimal rounding (1:08h instead of 1:7.5h)
- Workout Descriptions: Removed redundant 'Total: X' and time strings
- HIT Intervals: Added 4 rotating variants per type (VO2max, Threshold, Tempo)"
```

---

## Commit 2: Progressive Loading & Firestore Index ✅ (SAFE)

### Beschreibung:
```
feat: Add progressive weekly loading and notification index

- Progressive Loading: 8% weekly TSS increase with 4-week deload cycles
- Firestore: Added composite index for notifications (userId + createdAt)
- Enhanced SessionNotes save with validation and debug logs
```

### Dateien:
```bash
git add src/app/api/training/generate-plan/route.ts
git add firestore.indexes.json
git add src/app/dashboard/plan/page.tsx  # SessionNotes debug logs
```

### Command:
```bash
git commit -m "feat: Add progressive weekly loading and notification index

- Progressive Loading: 8% weekly TSS increase with 4-week deload cycles
- Firestore: Added composite index for notifications (userId + createdAt)
- Enhanced SessionNotes save with validation and debug logs"
```

---

## Commit 3: Documentation 📚 (SAFE)

### Beschreibung:
```
docs: Add Phase 2 implementation summary and testing feedback
```

### Dateien:
```bash
git add PHASE2_IMPLEMENTATION_SUMMARY.md
git add TESTING_FEEDBACK.md
git add COMMIT_PLAN.md
git add EMA_FORMEL_ERKLAERUNG.md  # Falls erstellt
```

### Command:
```bash
git commit -m "docs: Add Phase 2 implementation summary and testing feedback

- PHASE2_IMPLEMENTATION_SUMMARY.md: Complete session documentation
- TESTING_FEEDBACK.md: User testing results and open issues
- COMMIT_PLAN.md: Git commit strategy"
```

---

## ⚠️ NICHT Committen (BROKEN CODE)

Diese Änderungen haben Bugs und sollten **NICHT** committed werden:

### src/lib/planGenerator.ts - TimeSlot-Logik
**Zeilen 310-330:** Default-Slot-Logik (verhindert Wochenend-Anzeige)
**Zeilen 390-435:** Multi-Session-Split-Logik (zu komplex, verursacht leeren Plan)

### Lösung:
```bash
# Option 1: Revert nur diese Änderungen
git checkout HEAD -- src/lib/planGenerator.ts
# Dann manuell nur HIT-Varianz + Zeit-Format wieder hinzufügen

# Option 2: Stash für später
git stash push -m "WIP: TimeSlot multi-session logic - needs rework"
```

---

## 🔄 Empfohlene Vorgehensweise

### Schritt 1: Status prüfen
```bash
git status
git diff src/lib/planGenerator.ts  # Prüfe welche Änderungen drin sind
```

### Schritt 2: planGenerator.ts Cleanup
```bash
# Backup der aktuellen Version
cp src/lib/planGenerator.ts src/lib/planGenerator.ts.backup

# Revert zur letzten funktionierenden Version
git checkout HEAD -- src/lib/planGenerator.ts

# Manuell wieder hinzufügen:
# - selectIntervalVariant() Funktion (HIT-Varianz)
# - Math.round(duration) in Zeit-Format
# - Zeitangabe aus Endurance entfernt
# - "Total: X" aus HIT entfernt
```

### Schritt 3: Commits durchführen
```bash
# Commit 1: UI/UX
git add src/components/SessionNotes.tsx
git add src/app/dashboard/plan/page.tsx
git add src/lib/planGenerator.ts
git commit -m "feat: UI/UX improvements - RPE buttons, export combined, layout polish

- RPE: Slider → 3 buttons (Leicht/Mittel/Schwer)
- Export: Combined Zwift/MyWhoosh button
- Weekly Overview: Horizontal layout
- HIT Intervals: Added 4 rotating variants"

# Commit 2: Backend
git add src/app/api/training/generate-plan/route.ts
git add firestore.indexes.json
git commit -m "feat: Add progressive weekly loading and notification index"

# Commit 3: Docs
git add *.md
git commit -m "docs: Add Phase 2 implementation summary"
```

### Schritt 4: Push
```bash
git push origin main
```

---

## 📊 Nach dem Commit

### Neuer Chat mit klarem Fokus:

**Agenda für nächste Session:**

1. **User's bessere Idee für TimeSlot-Handling diskutieren** 🎯
   - Aktuelles Problem analysieren (nur Mo-Fr angezeigt)
   - User-Lösung besprechen
   - Neuen Ansatz planen

2. **SessionNotes Debug mit Console-Log** 🔍
   - User soll speichern mit F12 Console offen
   - Screenshot von Console-Output
   - Gezielt debuggen

3. **Testing der committed Features** ✅
   - Progressive Loading verifizieren
   - HIT-Varianz beobachten
   - Export-Button testen
   - RPE-Buttons prüfen

4. **Backup-Branch für TimeSlot-Experimente** 🔬
   - `git checkout -b feature/timeslot-handling`
   - Experimente OHNE main zu brechen
   - Testing vor Merge

---

## ✨ Sauberer Neustart

Nach Commits:
1. ✅ Nur funktionierende Features im main
2. ✅ Dokumentation komplett
3. ✅ Klare Agenda für nächste Session
4. ✅ Problematische Änderungen isoliert

**Dann:** Neuer Chat, frische Perspektive, User's bessere Idee! 🚀

---

**Erstellt:** 2025-11-01  
**Status:** Ready for execution  
**Geschätzte Zeit:** 10-15 Minuten
